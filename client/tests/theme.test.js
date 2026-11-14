import { readFileSync } from 'node:fs'
import * as React from 'react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '../src/ThemeProvider.jsx'
import { ThemeContext, useTheme } from '../src/themeContext.js'

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf-8')

// The imported .jsx modules are compiled with the classic JSX runtime by
// Vitest's SSR transform, so they look React up on the global scope.
globalThis.React = React

// Comments are stripped before parsing so prose in the stylesheet can never
// satisfy a rule assertion (§8.2 tokens are declared, not mentioned).
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

// Returns the declaration body of the block that opens at `index` (the index of
// its '{'), honouring nested braces such as the ones inside @media blocks.
function blockBody(css, index) {
  let depth = 0
  for (let i = index; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(index + 1, i)
    }
  }
  return ''
}

describe('chế độ tối', () => {
  it('ThemeProvider đọc localStorage và đặt data-bs-theme', () => {
    const src = read('ThemeProvider.jsx')
    expect(src).toContain("localStorage.getItem('student-cert-theme')")
    expect(src).toContain('dataset.bsTheme')
  })

  it('mặc định là sáng, không theo prefers-color-scheme', () => {
    expect(read('ThemeProvider.jsx')).not.toContain('prefers-color-scheme')
  })

  it('nền trang chế độ tối dùng navy #0c1524 qua token', () => {
    expect(read('tokens/index.css')).toContain('--bs-body-bg: #0c1524')
  })

  it('focus ring ở chế độ tối dùng màu chữ xanh sáng', () => {
    const css = stripComments(read('tokens/components.css'))
    // Anchored to the catch-all rule itself: `/focus-visible[\s\S]*--ws-hutech-text/`
    // matched any later occurrence of the token anywhere in the file, so an
    // unrelated rule could keep it green after the ring was removed.
    expect(css).toMatch(
      /\[data-bs-theme="dark"\]\s*:focus-visible:not\(\.template-field-overlay\)\s*\{\s*outline-color:\s*var\(--ws-hutech-text\)/,
    )
  })

  it('tôn trọng prefers-reduced-motion', () => {
    expect(read('tokens/components.css')).toContain('prefers-reduced-motion')
  })
})

describe('chế độ tối — quy tắc bắt buộc', () => {
  it('có quy tắc focus-visible chung trong khối tối dùng --ws-hutech-text', () => {
    const css = stripComments(read('tokens/components.css'))
    const rule = css.match(/\[data-bs-theme="dark"\]\s*:focus-visible([^{]*)\{([^}]*)\}/)
    expect(rule, 'thiếu quy tắc [data-bs-theme="dark"] :focus-visible').not.toBeNull()
    expect(rule[1]).toMatch(/:not\(\.template-field-overlay\)/)
    expect(rule[2]).toMatch(/outline-color:\s*var\(--ws-hutech-text\)/)
  })

  it('quy tắc chung bỏ qua overlay editor để giữ viền cam kết của §6.11', () => {
    const css = stripComments(read('tokens/components.css'))
    expect(css).toMatch(/\[data-bs-theme="dark"\]\s*:focus-visible:not\(\.template-field-overlay\)/)
  })

  it('quy tắc chung đứng trước các focus ring riêng của chế độ tối', () => {
    const css = stripComments(read('tokens/components.css'))
    const catchAll = css.indexOf('[data-bs-theme="dark"] :focus-visible:not(.template-field-overlay)')
    expect(catchAll).toBeGreaterThan(-1)
    // Every explicit dark ring must follow the catch-all so it wins the tie.
    const explicitRings = [...css.matchAll(/\[data-bs-theme="dark"\][^{]*:focus-visible[^{]*\{/g)]
      .map((match) => match.index)
      .filter((index) => !css.startsWith('[data-bs-theme="dark"] :focus-visible:not(', index))
    expect(explicitRings.length).toBeGreaterThan(0)
    for (const index of explicitRings) expect(index).toBeGreaterThan(catchAll)
  })

  it('nút outline tối khai báo hover slots trên quy tắc gốc để focus bàn phím đọc được', () => {
    const css = stripComments(read('tokens/components.css'))
    // `.btn:focus-visible` is painted from the hover slots: they must not live
    // under `:hover` alone or the keyboard focus label falls back to the light
    // rule's dark-blue-on-navy pair (1.37:1).
    const rule = css.match(/\[data-bs-theme="dark"\]\s*\.btn-outline-primary\s*\{([^}]*)\}/)
    expect(rule, 'thiếu quy tắc gốc [data-bs-theme="dark"] .btn-outline-primary').not.toBeNull()
    expect(rule[1]).toMatch(/--bs-btn-hover-color:\s*var\(--ws-on-scrim\)/)
    expect(rule[1]).toMatch(/--bs-btn-hover-bg:\s*var\(--ws-hutech\)/)
    expect(rule[1]).toMatch(/--bs-btn-hover-border-color:\s*var\(--ws-hutech\)/)
  })

  it('prefers-reduced-motion áp cho mọi phần tử, không liệt kê selector', () => {
    const css = stripComments(read('tokens/components.css'))
    const at = css.search(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/)
    expect(at, 'thiếu khối @media (prefers-reduced-motion: reduce)').toBeGreaterThan(-1)

    const body = blockBody(css, css.indexOf('{', at))
    const selectors = body
      .slice(0, body.indexOf('{'))
      .split(',')
      .map((selector) => selector.trim())
      .filter(Boolean)

    expect(selectors.sort()).toEqual(['*', '*::after', '*::before'])
    expect(body).toMatch(/transition-duration:\s*0\.01ms\s*!important/)
    expect(body).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
  })

  it('themeContext.js xuất hook useTheme trả { theme, toggleTheme }', () => {
    const html = renderToStaticMarkup(
      createElement(ThemeProvider, null, createElement(ThemeProbe)),
    )
    expect(html).toBe('<span>theme,toggleTheme|light|function</span>')
  })

  it('useTheme trả đúng giá trị của ThemeContext', () => {
    const value = { theme: 'dark', toggleTheme: () => {} }
    const html = renderToStaticMarkup(
      createElement(ThemeContext.Provider, { value }, createElement(ThemeProbe)),
    )
    expect(html).toBe('<span>theme,toggleTheme|dark|function</span>')
  })
})

// The contrast script grades the token VALUES; these assertions grade the
// WIRING. A token can measure 8:1 and reach nothing if the rule that consumes
// it is renamed, reordered or dropped, and no colour measurement notices.
describe('bắc cầu Bootstrap ngữ nghĩa (§8.0)', () => {
  const components = () => stripComments(read('tokens/components.css'))
  const body = (css, selector) => {
    const rule = css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`))
    expect(rule, `thiếu quy tắc ${selector}`).not.toBeNull()
    return rule[1]
  }

  it('tiện ích chữ đọc từ token chữ, không từ bảng màu Bootstrap', () => {
    const css = components()
    expect(body(css, '\\.text-danger')).toMatch(/color:\s*var\(--ws-danger-text\)\s*!important/)
    expect(body(css, '\\[data-bs-theme="dark"\\]\\s*\\.text-primary'))
      .toMatch(/color:\s*var\(--ws-hutech-text\)\s*!important/)
  })

  it('bốn alert lấy nền từ token bề mặt và chữ từ token trạng thái', () => {
    const css = components()
    const themes = [
      ['success', '--ws-success', '--ws-success-text', '--ws-alert-success-bg'],
      ['warning', '--ws-warn', '--ws-warn-text', '--ws-alert-warn-bg'],
      ['danger', '--ws-accent', '--ws-accent-text', '--ws-alert-danger-bg'],
      ['info', '--ws-hutech', '--ws-hutech-text', '--ws-alert-info-bg'],
    ]
    for (const [name, lightText, darkText, surface] of themes) {
      const light = body(css, `\\.alert-${name}`)
      expect(light, `.alert-${name}`).toMatch(new RegExp(`--bs-alert-color:\\s*var\\(${lightText}\\)`))
      expect(light, `.alert-${name}`).toMatch(new RegExp(`--bs-alert-bg:\\s*var\\(${surface}\\)`))
      expect(body(css, `\\[data-bs-theme="dark"\\]\\s*\\.alert-${name}`), `alert-${name} tối`)
        .toMatch(new RegExp(`--bs-alert-color:\\s*var\\(${darkText}\\)`))
    }
  })

  it('ô đã chọn tô bằng thương hiệu, chế độ tối đổi sang biến thể chữ', () => {
    const css = components()
    expect(body(css, '\\.form-check-input:checked'))
      .toMatch(/background-color:\s*var\(--ws-hutech\)/)
    expect(body(css, '\\[data-bs-theme="dark"\\]\\s*\\.form-check-input:checked'))
      .toMatch(/background-color:\s*var\(--ws-hutech-text\)/)
    // The mark is a token so it can invert with the fill.
    expect(body(css, '\\.form-check-input:checked\\[type="checkbox"\\]'))
      .toMatch(/--bs-form-check-bg-image:\s*var\(--ws-check-mark\)/)
    expect(body(css, '\\.form-check-input:checked\\[type="radio"\\]'))
      .toMatch(/--bs-form-check-bg-image:\s*var\(--ws-radio-mark\)/)
  })

  // W6: a border painted with the alert's own fill leaves no edge, so the box
  // stops reading as a box. Each alert names its border token.
  it('viền alert đọc từ token riêng, không đồng nhất với nền', () => {
    const css = components()
    const borders = {
      success: '--ws-alert-success-border',
      warning: '--ws-alert-warn-border',
      danger: '--ws-alert-danger-border',
      info: '--ws-alert-info-border',
    }
    for (const [name, token] of Object.entries(borders)) {
      expect(body(css, `\\.alert-${name}`), `.alert-${name}`)
        .toMatch(new RegExp(`--bs-alert-border-color:\\s*var\\(${token}\\)`))
    }
  })

  // W1/W3: the checked switch knob, the focus knob and the focused field are
  // the last controls Bootstrap paints from hardcoded colours.
  it('công tắc và ô nhập đang focus đọc từ token, không từ màu Bootstrap', () => {
    const css = components()
    expect(body(css, '\\.form-switch \\.form-check-input:checked'))
      .toMatch(/--bs-form-switch-bg:\s*var\(--ws-switch-knob\)/)
    expect(body(css, '\\.form-switch \\.form-check-input:focus:not\\(:checked\\),?'))
      .toMatch(/--bs-form-switch-bg:\s*var\(--ws-switch-knob-focus\)/)

    const focus = css.match(/\.form-control:focus,[\s\S]*?\.form-check-input:focus\s*\{([^}]*)\}/)
    expect(focus?.[1], '.form-control:focus').toBeDefined()
    expect(focus[1]).toMatch(/border-color:\s*var\(--ws-hutech\)/)
    expect(focus[1]).toMatch(/box-shadow:\s*0 0 0 \.25rem var\(--bs-focus-ring-color\)/)

    const darkFocus = css.match(/\[data-bs-theme="dark"\] \.form-control:focus,[\s\S]*?\.form-check-input:focus\s*\{([^}]*)\}/)
    expect(darkFocus?.[1], 'focus tối').toBeDefined()
    expect(darkFocus[1]).toMatch(/border-color:\s*var\(--ws-hutech-text\)/)
  })
})

// Renders the hook's return value as `keys|theme|typeof toggleTheme` so a hook
// returning undefined, null or {} cannot satisfy the assertions above.
function ThemeProbe() {
  const value = useTheme()
  if (!value) return createElement('span', null, 'no-context')
  return createElement(
    'span',
    null,
    `${Object.keys(value).sort().join(',')}|${value.theme}|${typeof value.toggleTheme}`,
  )
}
