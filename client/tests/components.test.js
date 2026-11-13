import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (name) => readFileSync(new URL(`../src/components/${name}`, import.meta.url), 'utf-8')

describe('component dùng chung', () => {
  it('PortalPanel có header với tiêu đề', () => {
    expect(read('PortalPanel.jsx')).toContain('portal-panel__header')
    expect(read('PortalPanel.jsx')).toContain('portal-panel__title')
  })

  it('PortalPageHeader có ô hành động', () => {
    expect(read('PortalPageHeader.jsx')).toContain('portal-page-header__actions')
  })

  it('PortalChip hỗ trợ đúng 5 tone', () => {
    const src = read('PortalChip.jsx')
    for (const tone of ['success', 'warn', 'danger', 'info', 'mute']) {
      expect(src).toContain(`'${tone}'`)
    }
  })

  it('PortalTable có vùng cuộn ngang và cột thao tác dính', () => {
    const src = read('PortalTable.jsx')
    expect(src).toContain('admin-table-scroll')
    expect(src).toContain('portal-table--sticky-actions')
  })

  it('components.css không chứa hex thô', () => {
    const css = readFileSync(new URL('../src/tokens/components.css', import.meta.url), 'utf-8')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('components.css không dùng rounded-4', () => {
    const css = readFileSync(new URL('../src/tokens/components.css', import.meta.url), 'utf-8')
    expect(css).not.toContain('rounded-4')
  })
})
