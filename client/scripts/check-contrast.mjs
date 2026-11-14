#!/usr/bin/env node
/*
 * WCAG 2.2 contrast check for the HUTECH token file.
 *
 * Reads src/tokens/index.css itself (no dependencies), pulls the custom
 * properties out of the :root and [data-bs-theme="dark"] blocks, and computes
 * the contrast ratio of every text/background pair from the design spec §9.1.
 *
 * Prints one "name: ratio: PASS/FAIL" line per pair and exits 1 if any pair is
 * below its threshold: 4.5:1 for normal text, 3:1 for large text.
 *
 * Run: node scripts/check-contrast.mjs
 */

import { readFileSync } from 'node:fs'

const CSS_PATH = new URL('../src/tokens/index.css', import.meta.url)
const css = readFileSync(CSS_PATH, 'utf-8')

const DARK_SELECTOR = '[data-bs-theme="dark"]'
const ROOT_SELECTOR = ':root'

function extractBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css)
  if (!match) throw new Error(`Không tìm thấy khối "${selector}" trong src/tokens/index.css`)
  return match[1]
}

function parseDeclarations(block) {
  const vars = new Map()
  const withoutComments = block.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const declaration of withoutComments.split(';')) {
    const colon = declaration.indexOf(':')
    if (colon === -1) continue
    const name = declaration.slice(0, colon).trim()
    if (!name.startsWith('--')) continue
    vars.set(name, declaration.slice(colon + 1).trim())
  }
  return vars
}

function resolveValue(value, vars, seen = new Set()) {
  return value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (_, name, fallback) => {
    if (seen.has(name)) throw new Error(`Vòng lặp var() tại "${name}"`)
    if (vars.has(name)) return resolveValue(vars.get(name), vars, new Set([...seen, name]))
    if (fallback !== undefined) return fallback
    throw new Error(`Không tìm thấy biến "${name}"`)
  })
}

function parseColor(value) {
  // Control marks and switch knobs are SVG data URIs (they must travel as an
  // image), so the fill's hex is the colour the control actually paints. The
  // first `%23xxxxxx` in the URI is read as the token's colour, which lets the
  // knob/track pair be measured instead of asserted.
  const svg = /^url\("data:image\/svg\+xml,[^"]*?%23([0-9a-f]{6})/i.exec(value.trim())
  if (svg) {
    return {
      r: Number.parseInt(svg[1].slice(0, 2), 16),
      g: Number.parseInt(svg[1].slice(2, 4), 16),
      b: Number.parseInt(svg[1].slice(4, 6), 16),
      a: 1,
    }
  }
  const hex = /^#([0-9a-f]{3,8})$/i.exec(value.trim())
  if (!hex) throw new Error(`Không đọc được màu "${value}"`)
  const digits = hex[1]
  const expand = digits.length <= 4
    ? digits.split('').map((digit) => digit + digit).join('')
    : digits
  const hasAlpha = expand.length === 8
  if (expand.length !== 6 && !hasAlpha) throw new Error(`Không đọc được màu "${value}"`)
  return {
    r: Number.parseInt(expand.slice(0, 2), 16),
    g: Number.parseInt(expand.slice(2, 4), 16),
    b: Number.parseInt(expand.slice(4, 6), 16),
    a: hasAlpha ? Number.parseInt(expand.slice(6, 8), 16) / 255 : 1,
  }
}

function composite(foreground, background) {
  const a = foreground.a + background.a * (1 - foreground.a)
  const blend = (fg, bg) => (fg * foreground.a + bg * background.a * (1 - foreground.a)) / a
  return {
    r: blend(foreground.r, background.r),
    g: blend(foreground.g, background.g),
    b: blend(foreground.b, background.b),
    a,
  }
}

function luminance({ r, g, b }) {
  const channel = (value) => {
    const srgb = value / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(foreground, background) {
  const lightest = Math.max(luminance(foreground), luminance(background))
  const darkest = Math.min(luminance(foreground), luminance(background))
  return (lightest + 0.05) / (darkest + 0.05)
}

// The surfaces a background token actually paints. A solid token yields one
// surface; a gradient yields one per declared colour stop. `transparent` is a
// layer hole, not a surface, so it is skipped. Grading a gradient pair now
// DERIVES its worst stop from --ws-page-bg itself instead of trusting a
// hand-maintained mirror token (W9).
function backgroundColors(value, vars) {
  const resolved = resolveValue(value, vars)
  if (!/gradient\(/i.test(resolved)) return [parseColor(resolved)]
  const stops = resolved.match(/#[0-9a-f]{6}\b/gi)
  if (!stops) throw new Error(`Gradient không có màu dừng: "${resolved}"`)
  return stops.map((stop) => parseColor(stop))
}

const PALETTES = {
  light: parseDeclarations(extractBlock(ROOT_SELECTOR)),
  dark: new Map([
    ...parseDeclarations(extractBlock(ROOT_SELECTOR)),
    ...parseDeclarations(extractBlock(DARK_SELECTOR)),
  ]),
}

// "name: ratio: PASS/FAIL" for the spec §9.1 pair table plus the composed
// surfaces the components build on top of it (R149).
// Light/dark chip pairs use the -text variants on dark chips, because the base
// success/warn/accent hues are too dark on #12301f / #2c2413 / #2e1a12.
// Text pairs are held to 4.5:1 (AC-01, spec §9.2). A pair may use the 3:1
// large-text threshold only when marked `large: true`, and the 3:1 non-text
// threshold (WCAG 1.4.11) only when marked `nonText: true` — used by the switch
// knob and the invalid field border. A pair may set an explicit `min` (the
// alert borders, which are neither text nor a control state). None of the
// brief's text pairs qualify for either exception: all of those tokens are used
// at 9.5–15px. A gradient background is graded at its worst colour stop (W9).
const PAIRS = [
  { mode: 'dark', fg: '--ws-fg-2', bg: '--ws-panel' },
  { mode: 'dark', fg: '--ws-hutech-text', bg: '--ws-panel' },
  { mode: 'dark', fg: '--ws-control-idle', bg: '--ws-panel', name: 'table header on panel' },
  { mode: 'dark', fg: '--ws-success-text', bg: '--ws-success-l' },
  { mode: 'dark', fg: '--ws-warn-text', bg: '--ws-warn-l' },
  { mode: 'dark', fg: '--ws-accent-text', bg: '--ws-accent-l' },
  { mode: 'dark', fg: '--ws-muted', bg: '--ws-chip-bg' },
  { mode: 'dark', fg: '--ws-on-brand', bg: '--ws-hutech' },
  { mode: 'light', fg: '--ws-fg-2', bg: '--ws-panel' },
  { mode: 'light', fg: '--ws-hutech', bg: '--ws-panel' },
  { mode: 'light', fg: '--ws-control-idle', bg: '--ws-panel', name: 'table header on panel' },
  { mode: 'light', fg: '--ws-success', bg: '--ws-success-l' },
  { mode: 'light', fg: '--ws-warn', bg: '--ws-warn-l' },
  { mode: 'light', fg: '--ws-accent', bg: '--ws-accent-l' },
  { mode: 'light', fg: '--ws-muted', bg: '--ws-chip-bg' },
  { mode: 'light', fg: '--ws-on-brand', bg: '--ws-hutech' },
  // Composed surfaces the components build on top of the token pairs above
  // (R149): the KPI tile's resting and hover states in both themes, and the
  // info chip. On hover the tile turns --ws-hutech-l and its label/note colour
  // is --ws-muted (the --ws-control-idle pair measures only 4.34:1 there).
  { mode: 'light', fg: '--ws-muted', bg: '--ws-tile', name: 'metric tile label (resting)' },
  { mode: 'light', fg: '--ws-fg', bg: '--ws-tile', name: 'metric tile value (resting)' },
  { mode: 'light', fg: '--ws-control-idle', bg: '--ws-tile', name: 'metric tile note (resting)' },
  { mode: 'dark', fg: '--ws-muted', bg: '--ws-tile', name: 'metric tile label (resting)' },
  { mode: 'dark', fg: '--ws-fg', bg: '--ws-tile', name: 'metric tile value (resting)' },
  { mode: 'dark', fg: '--ws-control-idle', bg: '--ws-tile', name: 'metric tile note (resting)' },
  { mode: 'light', fg: '--ws-muted', bg: '--ws-hutech-l', name: 'metric tile label/note (hover)' },
  { mode: 'light', fg: '--ws-fg', bg: '--ws-hutech-l', name: 'metric tile value (hover)' },
  { mode: 'dark', fg: '--ws-muted', bg: '--ws-hutech-l', name: 'metric tile label/note (hover)' },
  { mode: 'dark', fg: '--ws-fg', bg: '--ws-hutech-l', name: 'metric tile value (hover)' },
  { mode: 'light', fg: '--ws-hutech', bg: '--ws-hutech-l', name: 'info chip' },
  { mode: 'dark', fg: '--ws-hutech-text', bg: '--ws-hutech-l', name: 'info chip' },
  // Semantic utilities (§8.0 bridge). `.text-primary` is the brand blue in
  // light and its text variant in dark; `.text-danger` reads from
  // --ws-danger-text in both themes. Each is graded on the panel and on the
  // page, because both carry error text. Page pairs use --ws-page-bg itself:
  // the gate derives the gradient's worst stop per foreground (W9), so no
  // hand-kept "#e9eef5 / #16406b" mirror can drift from what ships.
  { mode: 'light', fg: '--ws-hutech', bg: '--ws-page-bg', name: 'text-primary on page' },
  { mode: 'dark', fg: '--ws-hutech-text', bg: '--ws-page-bg', name: 'text-primary on page' },
  { mode: 'light', fg: '--ws-danger-text', bg: '--ws-panel', name: 'text-danger on panel' },
  { mode: 'light', fg: '--ws-danger-text', bg: '--ws-page-bg', name: 'text-danger on page' },
  { mode: 'dark', fg: '--ws-danger-text', bg: '--ws-panel', name: 'text-danger on panel' },
  { mode: 'dark', fg: '--ws-danger-text', bg: '--ws-page-bg', name: 'text-danger on page' },
  // `.invalid-feedback` paints from --bs-form-invalid-color (W2), and it sits
  // beside a field on a panel and directly on the page.
  { mode: 'light', fg: '--bs-form-invalid-color', bg: '--ws-panel', name: 'invalid-feedback on panel' },
  { mode: 'light', fg: '--bs-form-invalid-color', bg: '--ws-page-bg', name: 'invalid-feedback on page' },
  { mode: 'dark', fg: '--bs-form-invalid-color', bg: '--ws-panel', name: 'invalid-feedback on panel' },
  { mode: 'dark', fg: '--bs-form-invalid-color', bg: '--ws-page-bg', name: 'invalid-feedback on page' },
  // The invalid field's border (W10) is the 3:1 focus/validity indicator
  // (WCAG 1.4.11); its field fill is --bs-body-bg, which is the surface it is
  // drawn against. The 25%-alpha halo Bootstrap pairs with it is decorative.
  { mode: 'light', fg: '--bs-form-invalid-border-color', bg: '--bs-body-bg', nonText: true, name: 'invalid field border on field' },
  { mode: 'dark', fg: '--bs-form-invalid-border-color', bg: '--bs-body-bg', nonText: true, name: 'invalid field border on field' },
  // Error text also lands inside a warning alert (a rejected batch), so the
  // same token is graded on that surface (W5).
  { mode: 'light', fg: '--ws-danger-text', bg: '--ws-alert-warn-bg', name: 'text-danger on warning alert' },
  { mode: 'dark', fg: '--ws-danger-text', bg: '--ws-alert-warn-bg', name: 'text-danger on warning alert' },
  // Alert surfaces (§8.0): the status hue on the alert fill, in both themes.
  { mode: 'light', fg: '--ws-success', bg: '--ws-alert-success-bg', name: 'alert-success' },
  { mode: 'light', fg: '--ws-warn', bg: '--ws-alert-warn-bg', name: 'alert-warning' },
  { mode: 'light', fg: '--ws-accent', bg: '--ws-alert-danger-bg', name: 'alert-danger' },
  { mode: 'light', fg: '--ws-hutech', bg: '--ws-alert-info-bg', name: 'alert-info' },
  { mode: 'dark', fg: '--ws-success-text', bg: '--ws-alert-success-bg', name: 'alert-success' },
  { mode: 'dark', fg: '--ws-warn-text', bg: '--ws-alert-warn-bg', name: 'alert-warning' },
  { mode: 'dark', fg: '--ws-accent-text', bg: '--ws-alert-danger-bg', name: 'alert-danger' },
  { mode: 'dark', fg: '--ws-hutech-text', bg: '--ws-alert-info-bg', name: 'alert-info' },
  // Alert borders (W6). A border is not text and WCAG sets no ratio for a
  // decorative edge; 1.5:1 against the fill is the smallest step that still
  // reads in 8-bit sRGB and is above the 1.39–1.46:1 the surface lift already
  // settled for "visible box".
  { mode: 'light', fg: '--ws-alert-success-border', bg: '--ws-alert-success-bg', min: 1.5, name: 'alert-success border on fill' },
  { mode: 'light', fg: '--ws-alert-warn-border', bg: '--ws-alert-warn-bg', min: 1.5, name: 'alert-warning border on fill' },
  { mode: 'light', fg: '--ws-alert-danger-border', bg: '--ws-alert-danger-bg', min: 1.5, name: 'alert-danger border on fill' },
  { mode: 'light', fg: '--ws-alert-info-border', bg: '--ws-alert-info-bg', min: 1.5, name: 'alert-info border on fill' },
  { mode: 'dark', fg: '--ws-alert-success-border', bg: '--ws-alert-success-bg', min: 1.5, name: 'alert-success border on fill' },
  { mode: 'dark', fg: '--ws-alert-warn-border', bg: '--ws-alert-warn-bg', min: 1.5, name: 'alert-warning border on fill' },
  { mode: 'dark', fg: '--ws-alert-danger-border', bg: '--ws-alert-danger-bg', min: 1.5, name: 'alert-danger border on fill' },
  { mode: 'dark', fg: '--ws-alert-info-border', bg: '--ws-alert-info-bg', min: 1.5, name: 'alert-info border on fill' },
  // The switch knob (W1) is a non-text control, so it is held to 3:1 against
  // the track it sits on. The checked track is --ws-hutech in light and
  // --ws-hutech-text in dark; the focus knob only shows while the switch is
  // off, where the track is the unchecked field surface (--bs-body-bg).
  { mode: 'light', fg: '--ws-switch-knob', bg: '--ws-hutech', nonText: true, name: 'switch knob on checked track' },
  { mode: 'dark', fg: '--ws-switch-knob', bg: '--ws-hutech-text', nonText: true, name: 'switch knob on checked track' },
  { mode: 'light', fg: '--ws-switch-knob-focus', bg: '--bs-body-bg', nonText: true, name: 'switch focus knob on unchecked track' },
  { mode: 'dark', fg: '--ws-switch-knob-focus', bg: '--bs-body-bg', nonText: true, name: 'switch focus knob on unchecked track' },
]

const ANCHOR = '--bs-body-bg'
const NORMAL_TEXT_MIN = 4.5
const LARGE_TEXT_MIN = 3
// WCAG 1.4.11's non-text minimum, used by control pairs (a knob against its
// track); a pair may also set an explicit `min` (the alert borders do).
const NON_TEXT_MIN = 3
let failed = false

function toReference(value) {
  return value.startsWith('#') ? value : `var(${value})`
}

for (const { mode, fg, bg, large = false, nonText = false, min: explicitMin, name } of PAIRS) {
  const vars = PALETTES[mode]
  const anchor = parseColor(resolveValue(`var(${ANCHOR})`, vars))
  const foreground = parseColor(resolveValue(toReference(fg), vars))
  // Grade against every surface the background paints and keep the worst: a
  // gradient yields one ratio per colour stop, so the derived worst stop wins
  // with no hand-maintained mirror (W9).
  const ratio = Math.min(...backgroundColors(toReference(bg), vars).map((stop) => {
    const background = composite(stop, anchor)
    return contrastRatio(composite(foreground, background), background)
  }))
  const min = explicitMin ?? (large ? LARGE_TEXT_MIN : nonText ? NON_TEXT_MIN : NORMAL_TEXT_MIN)
  const pass = ratio >= min
  if (!pass) failed = true
  const label = name ? `${name}: ${fg} on ${bg}` : `${fg} on ${bg}`
  console.log(`${mode} ${label}: ${ratio.toFixed(2)}: ${pass ? 'PASS' : 'FAIL'}`)
}

if (failed) process.exit(1)
