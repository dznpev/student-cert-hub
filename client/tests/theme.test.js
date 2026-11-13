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
    const css = read('tokens/components.css')
    expect(css).toMatch(/focus-visible[\s\S]*--ws-hutech-text/)
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
