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
  searchPlaceholderFor,
} from '../src/navigationSections.js'
import PortalIcon from '../src/PortalIcon.jsx'
import PortalFooter from '../src/components/PortalFooter.jsx'
import { studentAccountSections, studentPages } from '../src/studentNavigation.js'
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

  it('footer chỉ hiện copyright và version, không còn link tra cứu chứng nhận', () => {
    const html = renderToStaticMarkup(createElement(PortalFooter))
    expect(html).toContain('© 2012–2026 HUTECH University. All rights reserved')
    // Anchored to the span so a future "1.0.1" cannot satisfy a "1.0" check.
    expect(html).toContain('portal-footer__muted">| Version 1.0</span>')
    // The public lookup link belongs to the signed-out student screens, not to
    // the shell footer.
    expect(html).not.toContain('Tra cứu chứng nhận')
    expect(html).not.toContain('tra-cuu')
    // The rule for the removed link must not linger as dead CSS.
    expect(read('tokens/components.css')).not.toContain('portal-footer__link')
    // The footer is chrome: it sits on the page canvas, not on the panel
    // surface. Painting it --ws-panel made it a second white band.
    expect(read('tokens/components.css')).toMatch(
      /\.portal-footer\s*\{[^}]*background-color:\s*transparent/,
    )
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

    // The student portal's names are data (iconName), not icon nodes, and they
    // were unguarded: a typo there renders the overview glyph with every gate
    // green because PortalIcon falls back to it.
    for (const { id, iconName } of [...studentPages, ...studentAccountSections]) {
      expect(PortalIcon.names, id).toContain(iconName)
    }
  })
})

describe('App — tìm kiếm dùng chung ở topbar', () => {
  it('App.jsx giữ state tìm kiếm dùng chung', () => {
    const src = read('App.jsx')
    expect(src).toMatch(/const \[pageSearch, setPageSearch\] = useState\(''\)/)
  })

  it('cả 7 trang nhận search qua props, không tự khai báo state tìm kiếm', () => {
    const pages = [
      'CertificatesPage.jsx',
      'StudentsPage.jsx',
      'ActivitiesPage.jsx',
      'AuditLogsPage.jsx',
      'SuperAdminAccounts.jsx',
      'CertificateTemplatesPage.jsx',
      'ImportsPage.jsx',
    ]
    for (const file of pages) {
      const src = read(file)
      expect(src, file).toMatch(/search = ''/)
      expect(src, file).not.toMatch(/templateSearch|historySearch/)
      expect(src, file).not.toMatch(/const \[search, setSearch\] = useState\(''\)/)
    }
  })

  it('4 trang chỉ đọc search không khai báo onSearchChange', () => {
    for (const file of ['CertificatesPage.jsx', 'StudentsPage.jsx', 'ImportsPage.jsx', 'SuperAdminAccounts.jsx']) {
      expect(read(file), file).not.toContain('onSearchChange')
    }
  })

  it('startManagementPreview xóa tìm kiếm vô điều kiện trước khi vào shell', () => {
    expect(read('App.jsx')).toMatch(
      /function startManagementPreview[\s\S]*?setPageSearch\(''\)[\s\S]*?window\.location\.hash = 'quan-tri-mau'/,
    )
  })
})

describe('navigationSections — placeholder tìm kiếm (R57)', () => {
  it('trả placeholder chính xác cho 7 mục có ô tìm kiếm', () => {
    expect(searchPlaceholderFor('certificates')).toBe('Tìm sinh viên, mã chứng nhận…')
    expect(searchPlaceholderFor('students')).toBe('Tìm sinh viên, mã chứng nhận…')
    expect(searchPlaceholderFor('activities')).toBe('Tìm mã hoặc tên hoạt động…')
    expect(searchPlaceholderFor('audit')).toBe('Tìm trong nhật ký hệ thống…')
    expect(searchPlaceholderFor('templates')).toBe('Tìm tên mẫu chứng nhận…')
    expect(searchPlaceholderFor('accounts')).toBe('Tìm tài khoản quản trị…')
    expect(searchPlaceholderFor('imports')).toBe('Tìm tên tệp đã nhập…')
  })

  it('trả null cho các mục không có ô tìm kiếm', () => {
    for (const sectionId of ['overview', 'cohorts', 'participations', 'workspace', 'back-to-super-admin', 'missing']) {
      expect(searchPlaceholderFor(sectionId), sectionId).toBeNull()
    }
  })
})

describe('AppShell — topbar context', () => {
  const renderShell = (overrides = {}) => renderToStaticMarkup(
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
        ...overrides,
      })),
  )

  it('hiển thị tiêu đề mục hiện tại và nhãn vai trò ở topbar', () => {
    const html = renderShell()
    expect(html).toContain('portal-topbar__context">Tổng quan')
    expect(html).toContain('portal-topbar__actions"><span class="portal-topbar__role">Admin cấp chứng nhận</span>')
    // The role label is not used as the context when a section title is supplied.
    expect(html).not.toContain('portal-topbar__context">Admin cấp chứng nhận')
  })

  it('không render ô tìm kiếm khi search là null', () => {
    const html = renderShell({ search: null, onSearchChange: null, searchPlaceholder: null })
    expect(html).not.toContain('portal-search__input')
  })

  it('render đúng một ô tìm kiếm khi có search', () => {
    const html = renderShell({
      search: 'Nguyễn',
      onSearchChange: () => {},
      searchPlaceholder: 'Tìm sinh viên, mã chứng nhận…',
    })
    expect((html.match(/portal-search__input/g) || []).length).toBe(1)
    expect(html).toContain('value="Nguyễn"')
    expect(html).toContain('placeholder="Tìm sinh viên, mã chứng nhận…"')
  })

  it('ẩn ô tìm kiếm khi đang mở trang tài khoản', () => {
    expect(read('components/AppShell.jsx')).toContain('search={accountPage ? null : search}')
  })
})
