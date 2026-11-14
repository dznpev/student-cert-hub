import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/tokens/index.css', import.meta.url), 'utf-8')

// Comments are stripped so prose about a token can never be mistaken for its
// declaration.
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')

// Returns the full text of the block that starts at `selector {`.
function tokenBlock(source, selector) {
  const start = source.indexOf(`${selector} {`)
  if (start === -1) return ''
  return source.slice(start, source.indexOf('}', start) + 1)
}

const REQUIRED_TOKENS = [
  '--ws-hutech', '--ws-hutech-d', '--ws-hutech-l', '--ws-hutech-text', '--ws-hutech-border',
  '--ws-accent', '--ws-accent-l', '--ws-warn', '--ws-warn-l',
  '--ws-success', '--ws-success-l', '--ws-fav',
  '--ws-panel', '--ws-fg', '--ws-fg-2', '--ws-muted', '--ws-line',
  '--ws-control', '--ws-control-idle', '--ws-chip-bg',
  '--ws-scrim', '--ws-scrim-edge', '--ws-on-scrim', '--ws-on-scrim-muted',
  '--ws-r-pill', '--ws-r-dialog', '--ws-r', '--ws-r-bar', '--ws-r-card', '--ws-r-sm', '--ws-r-tick',
  '--ws-s1', '--ws-s2', '--ws-s3', '--ws-s4', '--ws-s5', '--ws-s6', '--ws-s7', '--ws-s8', '--ws-s9', '--ws-s10',
  '--ws-t-badge', '--ws-t-rail', '--ws-t-chip', '--ws-t-sub', '--ws-t-card', '--ws-t-base', '--ws-t-lead',
  '--ws-font-head', '--ws-font-body',
  '--ws-dur-instant', '--ws-dur-fast', '--ws-dur-normal', '--ws-dur-slow',
]

describe('index.css', () => {
  it('index.css không còn token cũ', () => {
    const legacy = readFileSync(new URL('../src/index.css', import.meta.url), 'utf-8')
    for (const token of ['--admin-ink', '--admin-accent', '--admin-border', '--admin-workspace', '--admin-surface', '--admin-hover']) {
      expect(legacy, token).not.toContain(token)
    }
  })

  it('index.css không còn class .admin-primary-button', () => {
    expect(readFileSync(new URL('../src/index.css', import.meta.url), 'utf-8')).not.toContain('admin-primary-button')
  })

  // R153: the two imports plus main.jsx's import order are the whole cascade
  // contract. Absence assertions alone would stay green if it were deleted.
  it('index.css nạp hai lớp token và giữ dưới 30 dòng', () => {
    const lines = readFileSync(new URL('../src/index.css', import.meta.url), 'utf-8').trimEnd().split(/\r?\n/)
    expect(lines.slice(0, 2)).toEqual([
      "@import './tokens/index.css';",
      "@import './tokens/components.css';",
    ])
    expect(lines.length).toBeLessThan(30)
  })

  it('main.jsx nạp index.css ngay sau Bootstrap và không nạp lại lớp token', () => {
    const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf-8')
    const bootstrap = main.indexOf("'bootstrap/dist/css/bootstrap.min.css'")
    // `-1` must fail the order assertion too, so check presence first.
    expect(bootstrap, 'bootstrap.min.css').toBeGreaterThan(-1)
    expect(main.indexOf("'./index.css'"), './index.css').toBeGreaterThan(bootstrap)
    expect(main).not.toContain('./tokens/index.css')
    expect(main).not.toContain('./tokens/components.css')
  })
})

describe('tokens/index.css', () => {
  it.each(REQUIRED_TOKENS)('khai báo %s', (token) => {
    expect(css).toContain(`${token}:`)
  })

  it('không chứa hex thô ngoài khối token', () => {
    const outsideTokenBlocks = css.replace(/:root\s*\{[^}]*\}/g, '').replace(/\[data-bs-theme="dark"\]\s*\{[^}]*\}/g, '')
    expect(outsideTokenBlocks).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('không dùng prefers-color-scheme', () => {
    expect(css).not.toContain('prefers-color-scheme')
  })

  it('ánh xạ --bs-primary sang --ws-hutech', () => {
    expect(css).toMatch(/--bs-primary:\s*var\(--ws-hutech\)/)
  })

  it('khối tối khai báo --ws-hutech-text', () => {
    const dark = tokenBlock(stripped, '[data-bs-theme="dark"]')
    expect(dark, 'thiếu khối [data-bs-theme="dark"]').not.toBe('')
    expect(dark).toContain('--ws-hutech-text:')
  })

  it(':root không khai báo --ws-hutech-text (chữ xanh chỉ dùng ở chế độ tối)', () => {
    const root = tokenBlock(stripped, ':root')
    expect(root, 'thiếu khối :root').not.toBe('')
    expect(root).not.toContain('--ws-hutech-text')
  })
})
