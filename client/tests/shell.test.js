import { readFileSync } from 'node:fs'
import * as React from 'react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AccountMenu from '../src/components/AccountMenu.jsx'
import AppShell from '../src/components/AppShell.jsx'
import AppSidebar from '../src/components/AppSidebar.jsx'
import {
  createAdminSections,
  createSuperAdminSections,
  createSuperAdminWorkspaceSections,
} from '../src/navigationSections.js'
import PortalIcon from '../src/PortalIcon.jsx'
import { ThemeContext } from '../src/themeContext.js'

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf-8')

// Vitest's SSR transform compiles the imported .jsx modules with the classic
// JSX runtime, so their render functions look React up on the global scope.
globalThis.React = React

const renderAccountMenu = (theme) => renderToStaticMarkup(
  createElement(ThemeContext.Provider, { value: { theme, toggleTheme: () => {} } },
    createElement(AccountMenu, {
      identifier: 'admin',
      open: false,
      onToggle: () => {},
      onProfile: () => {},
      onAccount: () => {},
      onSignOut: () => {},
    })),
)

const renderSidebar = () => renderToStaticMarkup(
  createElement(AppSidebar, {
    navigationId: 'portal-navigation',
    navigationLabel: 'Điều hướng chính',
    sections: [
      {
        group: 'Nghiệp vụ',
        items: [
          { id: 'overview', title: 'Tổng quan' },
          { id: 'participations', title: 'Lượt tham gia', badge: 2 },
          { id: 'certificates', title: 'Chứng nhận', badge: 0 },
        ],
      },
    ],
    activeSectionId: 'overview',
    onSelectSection: () => {},
    onHome: () => {},
  }),
)

describe('shell mới', () => {
  it('sidebar hỗ trợ nhóm mục', () => {
    const src = read('components/AppSidebar.jsx')
    expect(src).toContain('group')
    expect(src).toContain('items')
  })

  it('sidebar có gạch trái cho mục đang chọn', () => {
    expect(read('tokens/components.css')).toMatch(/portal-nav__item--active[\s\S]*::before/)
  })

  it('topbar chỉ hiện ô tìm kiếm khi có search', () => {
    const src = read('components/AppTopbar.jsx')
    expect(src).toContain('search !== null')
    expect(src).toContain('searchPlaceholder')
  })

  it('shell có 3 hàng: topbar, nội dung, footer', () => {
    expect(read('tokens/components.css')).toMatch(/grid-template-rows:\s*auto 1fr auto/)
  })

  it('sidebar rộng 238px', () => {
    expect(read('tokens/components.css')).toContain('238px')
  })
})

describe('shell mới — hành vi render', () => {
  it('AccountMenu có mục tài khoản và nhãn đổi chế độ theo theme', () => {
    const light = renderAccountMenu('light')
    for (const label of ['Hồ sơ', 'Tài khoản', 'Đăng xuất']) expect(light).toContain(label)
    expect(light).toContain('aria-label="Chuyển sang chế độ tối"')

    const dark = renderAccountMenu('dark')
    expect(dark).toContain('aria-label="Chuyển sang chế độ sáng"')
    expect(dark).not.toContain('aria-label="Chuyển sang chế độ tối"')
  })

  it('AppSidebar render nhãn nhóm, aria-current và badge theo số lượng', () => {
    const html = renderSidebar()
    expect(html).toContain('portal-nav__group-label">Nghiệp vụ')
    expect(html).toMatch(/portal-nav__item portal-nav__item--active" aria-current="page"/)
    expect(html).toContain('portal-nav__badge">2')
    // The zero-count badge must not render at all.
    expect((html.match(/portal-nav__badge/g) || []).length).toBe(1)
  })
})

describe('navigationSections — nhóm điều hướng', () => {
  const itemsOf = (sections) => sections.flatMap(({ items }) => items)

  it('mỗi shell có đúng một mục Nhật ký hệ thống và đúng bộ nhóm', () => {
    const shells = [
      ['admin', createAdminSections(0), ['Nghiệp vụ', 'Hệ thống']],
      ['super admin', createSuperAdminSections(0), ['Quản trị', 'Nghiệp vụ', 'Hệ thống']],
      ['super admin workspace', createSuperAdminWorkspaceSections(0), [null, 'Nghiệp vụ', 'Hệ thống']],
    ]

    for (const [label, sections, expectedGroups] of shells) {
      expect(sections.map(({ group }) => group), label).toEqual(expectedGroups)
      expect(itemsOf(sections).filter(({ id }) => id === 'audit'), label).toHaveLength(1)
    }
  })

  it('mọi mục điều hướng đều có icon đã đăng ký trong PortalIcon', () => {
    const shells = [
      createAdminSections(0),
      createSuperAdminSections(0),
      createSuperAdminWorkspaceSections(0),
    ]

    for (const sections of shells) {
      const items = itemsOf(sections)
      expect(items.length).toBeGreaterThan(0)
      for (const item of items) {
        expect(item.icon, item.id).toBeTruthy()
        expect(PortalIcon.names, item.id).toContain(item.icon.props.name)
        expect(item.icon.props.name, item.id).toBe(item.id)
      }
    }
  })
})

describe('AppShell — topbar context', () => {
  const renderShell = () => renderToStaticMarkup(
    createElement(ThemeContext.Provider, { value: { theme: 'light', toggleTheme: () => {} } },
      createElement(AppShell, {
        sections: [
          { group: 'Nghiệp vụ', items: [{ id: 'overview', title: 'Tổng quan' }] },
          { group: 'Hệ thống', items: [{ id: 'audit', title: 'Nhật ký hệ thống' }] },
        ],
        activeSectionId: 'overview',
        onSelectSection: () => {},
        roleLabel: 'Admin cấp chứng nhận',
        accountIdentifier: 'admin',
        onSignOut: () => {},
        onHome: () => {},
        context: 'Tổng quan',
      })),
  )

  it('hiển thị tiêu đề mục hiện tại và nhãn vai trò ở topbar', () => {
    const html = renderShell()
    expect(html).toContain('portal-topbar__context">Tổng quan')
    expect(html).toContain('portal-topbar__actions"><span class="portal-topbar__role">Admin cấp chứng nhận</span>')
    // The role label is not used as the context when a section title is supplied.
    expect(html).not.toContain('portal-topbar__context">Admin cấp chứng nhận')
  })
})
