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
// Every pair is normal text and is held to 4.5:1 (AC-01, spec §9.2). A pair may
// only use the 3:1 large-text threshold if it is explicitly marked `large: true`;
// none of the brief's pairs qualify (all of the tokens are used at 9.5–15px).
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
  // page background, because both carry error text.
  { mode: 'light', fg: '--ws-hutech', bg: '--bs-body-bg', name: 'text-primary on page' },
  { mode: 'dark', fg: '--ws-hutech-text', bg: '--bs-body-bg', name: 'text-primary on page' },
  { mode: 'light', fg: '--ws-danger-text', bg: '--ws-panel', name: 'text-danger on panel' },
  { mode: 'light', fg: '--ws-danger-text', bg: '--bs-body-bg', name: 'text-danger on page' },
  { mode: 'dark', fg: '--ws-danger-text', bg: '--ws-panel', name: 'text-danger on panel' },
  { mode: 'dark', fg: '--ws-danger-text', bg: '--bs-body-bg', name: 'text-danger on page' },
  // Alert surfaces (§8.0): the status hue on the alert fill, in both themes.
  { mode: 'light', fg: '--ws-success', bg: '--ws-alert-success-bg', name: 'alert-success' },
  { mode: 'light', fg: '--ws-warn', bg: '--ws-alert-warn-bg', name: 'alert-warning' },
  { mode: 'light', fg: '--ws-accent', bg: '--ws-alert-danger-bg', name: 'alert-danger' },
  { mode: 'light', fg: '--ws-hutech', bg: '--ws-alert-info-bg', name: 'alert-info' },
  { mode: 'dark', fg: '--ws-success-text', bg: '--ws-alert-success-bg', name: 'alert-success' },
  { mode: 'dark', fg: '--ws-warn-text', bg: '--ws-alert-warn-bg', name: 'alert-warning' },
  { mode: 'dark', fg: '--ws-accent-text', bg: '--ws-alert-danger-bg', name: 'alert-danger' },
  { mode: 'dark', fg: '--ws-hutech-text', bg: '--ws-alert-info-bg', name: 'alert-info' },
]

const ANCHOR = '--bs-body-bg'
const NORMAL_TEXT_MIN = 4.5
const LARGE_TEXT_MIN = 3
let failed = false

function toReference(value) {
  return value.startsWith('#') ? value : `var(${value})`
}

for (const { mode, fg, bg, large = false, name } of PAIRS) {
  const vars = PALETTES[mode]
  const anchor = parseColor(resolveValue(`var(${ANCHOR})`, vars))
  const background = composite(parseColor(resolveValue(toReference(bg), vars)), anchor)
  const foreground = composite(parseColor(resolveValue(toReference(fg), vars)), background)
  const ratio = contrastRatio(foreground, background)
  const min = large ? LARGE_TEXT_MIN : NORMAL_TEXT_MIN
  const pass = ratio >= min
  if (!pass) failed = true
  const label = name ? `${name}: ${fg} on ${bg}` : `${fg} on ${bg}`
  console.log(`${mode} ${label}: ${ratio.toFixed(2)}: ${pass ? 'PASS' : 'FAIL'}`)
}

if (failed) process.exit(1)
