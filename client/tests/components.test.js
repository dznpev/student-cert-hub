import { readFileSync } from 'node:fs'
import * as React from 'react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PortalChip from '../src/components/PortalChip.jsx'
import PortalTable from '../src/components/PortalTable.jsx'

// Vitest's SSR transform compiles the imported .jsx modules with the classic
// JSX runtime, so their render functions look React up on the global scope.
globalThis.React = React

const read = (name) => readFileSync(new URL(`../src/components/${name}`, import.meta.url), 'utf-8')
const row = createElement('tbody', null, createElement('tr', null, createElement('td', null, 'Ô')))

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

  it('PortalChip rơi về tone mute khi tone không hợp lệ hoặc thiếu', () => {
    const unknownTone = renderToStaticMarkup(createElement(PortalChip, { tone: 'khong-co', label: 'Thử' }))
    expect(unknownTone).toContain('portal-chip portal-chip--mute')

    const noTone = renderToStaticMarkup(createElement(PortalChip, { label: 'Thử' }))
    expect(noTone).toContain('portal-chip portal-chip--mute')
  })

  it('PortalTable đặt aria-label và role cho vùng cuộn', () => {
    const html = renderToStaticMarkup(createElement(PortalTable, { label: 'Danh sách sinh viên' }, row))
    expect(html).toContain('role="region"')
    expect(html).toContain('aria-label="Danh sách sinh viên"')
    expect(html).toContain('tabindex="0"')
  })

  it('PortalTable chỉ thêm minWidth và sticky khi được yêu cầu', () => {
    const plain = renderToStaticMarkup(createElement(PortalTable, { label: 'Bảng thường' }, row))
    expect(plain).not.toContain('style=')
    expect(plain).not.toContain('portal-table--sticky-actions')

    const wide = renderToStaticMarkup(
      createElement(PortalTable, { label: 'Bảng rộng', minWidth: '85rem', stickyActions: true }, row),
    )
    expect(wide).toContain('min-width:85rem')
    expect(wide).toContain('portal-table portal-table--sticky-actions')
  })
})
