import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/tokens/index.css', import.meta.url), 'utf-8')

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
})
