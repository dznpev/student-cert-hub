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

// Parses a block's custom properties into name → declared value. Reading the
// VALUE out of the declaration (on the comment-stripped source) is what makes
// the assertion falsifiable: prose in a comment can mention a triple and never
// satisfy it. A name-only check is how `--bs-primary-rgb: 0, 95, 156` — the
// original I1(a) defect — would ship green.
function tokenValues(source, selector) {
  const block = tokenBlock(source, selector)
  if (!block) return new Map()
  const body = block.slice(block.indexOf('{') + 1, block.lastIndexOf('}'))
  const values = new Map()
  for (const declaration of body.split(';')) {
    const colon = declaration.indexOf(':')
    if (colon === -1) continue
    const name = declaration.slice(0, colon).trim()
    if (name.startsWith('--')) values.set(name, declaration.slice(colon + 1).trim())
  }
  return values
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
  // W4: the brand byte triple. A wrong RGB triple silently repaints
  // `.text-primary` / `.bg-primary` / `.text-bg-primary` with a second blue
  // (the original G1 defect), so the triple is a required token.
  '--bs-primary-rgb',
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

  // R149/G6: the contrast gate used to be a manual command, so nothing ran it.
  // `pretest` makes npm run it before the suite; deleting the hook fails here.
  it('npm test chạy cổng tương phản trước bộ test', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))
    expect(pkg.scripts.pretest).toBe('node scripts/check-contrast.mjs')
    expect(pkg.scripts.test).toBe('vitest run')
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

  // Every token the §8.0 bridge added must exist in BOTH theme blocks: a token
  // declared in one block only silently inherits the other theme's value when
  // `data-bs-theme` flips, which is the bug the wave exists to close.
  it('token ngữ nghĩa mới khai báo ở cả khối sáng và khối tối', () => {
    const root = tokenBlock(stripped, ':root')
    const dark = tokenBlock(stripped, '[data-bs-theme="dark"]')
    expect(root, 'thiếu khối :root').not.toBe('')
    expect(dark, 'thiếu khối [data-bs-theme="dark"]').not.toBe('')
    const semantic = [
      '--ws-danger-text',
      '--ws-alert-success-bg', '--ws-alert-warn-bg', '--ws-alert-danger-bg', '--ws-alert-info-bg',
      '--ws-alert-success-border', '--ws-alert-warn-border', '--ws-alert-danger-border', '--ws-alert-info-border',
      '--ws-check-mark', '--ws-radio-mark',
      '--ws-switch-knob', '--ws-switch-knob-focus',
      '--ws-focus-ring',
    ]
    for (const token of semantic) {
      expect(root, `${token} ở khối sáng`).toContain(`${token}:`)
      expect(dark, `${token} ở khối tối`).toContain(`${token}:`)
    }
  })

  // W10: the Bootstrap bridge now also publishes the rgb triples whose
  // consumers (.form-control.is-invalid:focus, .was-validated :valid:focus)
  // paint Bootstrap's own red/green. Each is declared in both blocks; an
  // unbridged triple would silently repaint a HUTECH control with a second
  // palette when the theme flips.
  it('--bs-form-invalid-color, --bs-form-invalid-border-color và các rgb triple khai báo ở cả hai khối', () => {
    const root = tokenBlock(stripped, ':root')
    const dark = tokenBlock(stripped, '[data-bs-theme="dark"]')
    const bridged = [
      '--bs-form-invalid-color', '--bs-form-invalid-border-color', '--bs-focus-ring-color',
      '--bs-primary-rgb', '--bs-link-color-rgb', '--bs-danger-rgb', '--bs-success-rgb',
    ]
    for (const token of bridged) {
      expect(root, `${token} ở khối sáng`).toContain(`${token}:`)
      expect(dark, `${token} ở khối tối`).toContain(`${token}:`)
    }
    expect(root).toMatch(/--bs-form-invalid-color:\s*var\(--ws-danger-text\)/)
    expect(dark).toMatch(/--bs-form-invalid-color:\s*var\(--ws-danger-text\)/)
    expect(root).toMatch(/--bs-form-invalid-border-color:\s*var\(--ws-danger-text\)/)
    expect(dark).toMatch(/--bs-form-invalid-border-color:\s*var\(--ws-danger-text\)/)
    expect(dark).toMatch(/--bs-focus-ring-color:\s*var\(--ws-focus-ring\)/)
  })

  // W8: the VALUE of every bridged byte triple, read from the parsed
  // declaration. The light link triple is the brand; the dark one is the byte
  // triple of --ws-hutech-text, because dark links are #6dbded (§8.0) and a
  // brand triple there would violate §11's "two coexisting blues".
  it('rgb triple của Bootstrap đúng byte ở cả hai khối', () => {
    const expected = {
      ':root': {
        '--bs-primary-rgb': '0, 82, 156',
        '--bs-link-color-rgb': '0, 82, 156',
        '--bs-danger-rgb': '181, 60, 11',
        '--bs-success-rgb': '21, 128, 61',
      },
      '[data-bs-theme="dark"]': {
        '--bs-primary-rgb': '0, 82, 156',
        '--bs-link-color-rgb': '109, 189, 237',
        '--bs-danger-rgb': '252, 165, 138',
        '--bs-success-rgb': '110, 231, 168',
      },
    }
    for (const [selector, tokens] of Object.entries(expected)) {
      const values = tokenValues(stripped, selector)
      for (const [token, value] of Object.entries(tokens)) {
        expect(values.get(token), `${token} ở ${selector}`).toBe(value)
      }
    }
    // The exact triple that started I1: it must never come back, in any block.
    expect(stripped).not.toContain('0, 95, 156')
  })
})
