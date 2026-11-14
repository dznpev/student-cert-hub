import { readFileSync } from 'node:fs'
import * as React from 'react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PortalChip from '../src/components/PortalChip.jsx'
import PortalMetricCard from '../src/components/PortalMetricCard.jsx'
import PortalTable from '../src/components/PortalTable.jsx'
import DashboardPage from '../src/DashboardPage.jsx'
import { auditOutcomes } from '../src/auditOutcomes.js'
import { importRowStatuses } from '../src/importRowStatuses.js'
import { activityStatuses } from '../src/activityStatuses.js'
import { approvalStatuses } from '../src/approvalStatuses.js'
import { certificateStatuses } from '../src/certificateStatuses.js'
import { studentAccountStatuses } from '../src/studentAccountStatuses.js'
import { ThemeContext } from '../src/themeContext.js'
import { sampleActivities } from '../src/sampleActivities.js'
import { sampleCertificates } from '../src/sampleCertificates.js'
import { sampleCohorts } from '../src/sampleCohorts.js'
import { sampleParticipations } from '../src/sampleParticipations.js'
import { sampleStudents } from '../src/sampleStudents.js'

// Vitest's SSR transform compiles the imported .jsx modules with the classic
// JSX runtime, so their render functions look React up on the global scope.
globalThis.React = React

const read = (name) => readFileSync(new URL(`../src/components/${name}`, import.meta.url), 'utf-8')
const row = createElement('tbody', null, createElement('tr', null, createElement('td', null, 'Ô')))

// The `order` a selector declares in components.css, or 0 when it declares
// none: a tile's parts appear in DOM order unless CSS reorders them.
function cssOrder(css, name) {
  const withOrder = new RegExp(`(?:^|\\n)[^{}]*\\.${name}[^{]*\\{[^}]*order:\\s*(-?\\d+)`).exec(css)
  return withOrder ? Number(withOrder[1]) : 0
}

// The tone each entry of a status map carries, keyed like the map itself.
const tones = (entries) => Object.fromEntries(entries.map(([key, entry]) => [key, entry.tone]))

function renderDashboard() {
  return renderToStaticMarkup(createElement(
    ThemeContext.Provider,
    { value: { theme: 'light', toggleTheme() {} } },
    createElement(DashboardPage, {
      cohorts: sampleCohorts,
      students: sampleStudents,
      activities: sampleActivities,
      participations: sampleParticipations,
      certificates: sampleCertificates,
    }),
  ))
}

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

  it('ô chỉ số tự reset margin của <dl> và hai <dd> do Bootstrap reboot đặt vào', () => {
    const css = readFileSync(new URL('../src/tokens/components.css', import.meta.url), 'utf-8')
    // Bootstrap's reboot gives dl a 1rem bottom margin and dd .5rem; the rules
    // are scoped to the tile's own classes so other pages' <dl>s keep theirs.
    for (const name of ['portal-metric', 'portal-metric__value', 'portal-metric__note']) {
      expect(css, name).toMatch(new RegExp(`(?:^|\\n)\\s*\\.${name}\\s*\\{[^}]*margin:\\s*0`))
    }
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

  it('PortalMetricCard không dùng ô icon pastel', () => {
    const src = read('PortalMetricCard.jsx')
    expect(src).toContain('portal-metric__icon')
    expect(src).not.toContain('bg-subtle')
  })

  it('không còn text-bg-* trong các trang dùng badge', () => {
    for (const file of [
      'SuperAdminAccounts.jsx', 'CertificatesPage.jsx', 'ParticipationsPage.jsx', 'ImportsPage.jsx',
      'AuditLogsPage.jsx', 'ActivitiesPage.jsx', 'CertificateTemplatesPage.jsx', 'StudentsPage.jsx',
    ]) {
      expect(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf-8'), file).not.toContain('text-bg-')
    }
  })

  it('PortalMetricCard giữ cấu trúc <dl> và áp tone lên phần tử gốc', () => {
    const html = renderToStaticMarkup(createElement(PortalMetricCard, {
      label: 'Chờ duyệt', value: '3', note: 'Ghi chú', icon: createElement('span', null, 'i'), tone: 'warn',
    }))
    expect(html).toContain('class="portal-metric portal-metric--warn"')
    expect(html).toContain('portal-metric__icon')
    // DOM order stays label -> value -> note so <dt>/<dd> remain associated;
    // the number is lifted above the label by the CSS `order` instead (R68).
    expect(html).toMatch(/<dt class="portal-metric__label">Chờ duyệt<\/dt><dd class="portal-metric__value">3<\/dd><dd class="portal-metric__note">Ghi chú<\/dd>/)

    // Without a tone the card falls back to the default variant and drops the
    // optional note and icon.
    const plain = renderToStaticMarkup(createElement(PortalMetricCard, { label: 'Tổng', value: 7 }))
    expect(plain).toContain('class="portal-metric portal-metric--default"')
    expect(plain).not.toContain('portal-metric__note')
    expect(plain).not.toContain('portal-metric__icon')
  })
})

describe('trang Tổng quan', () => {
  const dashboardSrc = () => readFileSync(new URL('../src/DashboardPage.jsx', import.meta.url), 'utf-8')
  const componentsCss = () => readFileSync(new URL('../src/tokens/components.css', import.meta.url), 'utf-8')

  it('DashboardPage dùng lưới 4 KPI mỗi hàng', () => {
    const css = componentsCss()
    expect(css).toMatch(/portal-metric-grid[\s\S]*repeat\(4, minmax\(0, 1fr\)\)/)
  })

  it('DashboardPage không còn dùng rounded-4', () => {
    const src = dashboardSrc()
    expect(src).not.toContain('rounded-4')
  })

  it('DashboardPage dùng Hero, PortalPanel và ô chỉ số nội tuyến', () => {
    const src = dashboardSrc()
    expect(src).toContain('portal-hero')
    expect(src).toContain('portal-metric-grid')
    expect(src).toContain('PortalPanel')
    // The legacy card is replaced inline for now; Task 8 imports the shared
    // component from ./components/ instead, which this assertion still allows.
    expect(src).not.toContain("from './PortalMetricCard.jsx'")
  })

  it('giữ đủ bảy chỉ số của trang Tổng quan', () => {
    const src = dashboardSrc()
    for (const label of [
      'Sinh viên đang hoạt động',
      'Hoạt động',
      'Lượt tham gia',
      'Sinh viên có lượt tham gia',
      'Chứng nhận hiệu lực',
      'Chứng nhận bị thu hồi',
      'Lỗi tạo PDF',
    ]) expect(src).toContain(label)
  })

  it('components.css mô tả hero, ô chỉ số và ba biến thể tone', () => {
    const css = componentsCss()
    for (const selector of [
      '.portal-hero', '.portal-hero__date', '.portal-hero__title',
      '.portal-hero__description', '.portal-hero__note',
      '.portal-metric__icon', '.portal-metric__text', '.portal-metric__label',
      '.portal-metric__value', '.portal-metric__note',
      '.portal-metric--success', '.portal-metric--warn', '.portal-metric--danger',
    ]) expect(css).toContain(selector)

    for (const [tone, token] of [
      ['success', '--ws-success-text'], ['warn', '--ws-warn-text'], ['danger', '--ws-accent-text'],
    ]) {
      expect(css).toMatch(new RegExp(`\\[data-bs-theme="dark"\\] \\.portal-metric--${tone}[^{]*\\{[^}]*${token}`))
    }
  })

  it('DashboardPage render ra Hero, bảy ô chỉ số và hai panel biểu đồ', () => {
    const html = renderDashboard()

    // The Hero replaced the page's <h1 className="page-title"> + paragraph.
    expect(html).not.toContain('class="page-title')
    expect(html).toContain('class="portal-hero"')
    expect(html).toContain('portal-hero__title">Tổng quan</h1>')
    // The date line is populated during the render, not left empty for an
    // effect to fill in later (R63).
    expect(html).toMatch(/<p class="portal-hero__date">[^<]+<\/p>/)

    // Seven tiles, counted by the class the shared card Task 8 introduces also
    // renders — not by the inline markup's structure.
    expect((html.match(/class="portal-metric(?:--[\w-]+)?(?: |")/g) ?? [])).toHaveLength(7)

    // §6.4 order: the number sits above the label. Task 8's shared card may
    // keep label-before-value in the DOM for the <dl> association and reorder
    // visually with CSS `order`, so assert the resulting visual order rather
    // than one particular mechanism.
    const valueFirst = html.indexOf('portal-metric__value') < html.indexOf('portal-metric__label')
    const css = componentsCss()
    const valueOrder = cssOrder(css, 'portal-metric__value')
    const labelOrder = cssOrder(css, 'portal-metric__label')
    const visuallyFirst = valueFirst ? valueOrder <= labelOrder : valueOrder < labelOrder
    expect(visuallyFirst).toBe(true)

    // Both charts render as panels carrying their titles.
    expect((html.match(/class="portal-panel__title"/g) ?? [])).toHaveLength(2)
    expect(html).toContain('Tỷ lệ tham gia của sinh viên đang hoạt động theo khóa')
    expect(html).toContain('Chứng nhận theo trạng thái')

    // The legacy metric card is no longer part of the dashboard.
    expect(html).not.toContain('portal-metric-card')
  })
})

describe('bảng tone trạng thái', () => {
  // R81: §6.6.1 fixes every status → tone pair, so the mapping is pinned here
  // instead of resting on a careful reading of six maps.
  it('mỗi trạng thái mang đúng tone của spec §6.6.1', () => {
    const vocabularies = [
      ['chứng nhận', certificateStatuses.map(({ status, tone }) => [status, { tone }]), {
        Issued: 'success', Generating: 'info', Failed: 'danger', Revoked: 'mute',
      }],
      ['duyệt tham gia', Object.entries(approvalStatuses), {
        Pending: 'warn', Approved: 'success', Rejected: 'danger',
      }],
      ['hoạt động', Object.entries(activityStatuses), {
        Draft: 'mute', Open: 'success', Closed: 'mute', Archived: 'mute',
      }],
      ['tài khoản sinh viên', Object.entries(studentAccountStatuses), {
        active: 'success', pending: 'warn', disabled: 'danger', unlinked: 'mute',
      }],
      ['dòng nhập', Object.entries(importRowStatuses), {
        Valid: 'info', Imported: 'success', Skipped: 'mute', Duplicate: 'warn', Error: 'danger',
      }],
      ['kết quả kiểm toán', Object.entries(auditOutcomes), {
        Success: 'success', Failure: 'danger', Partial: 'warn',
      }],
    ]

    for (const [name, entries, expected] of vocabularies) {
      expect(tones(entries), name).toEqual(expected)
    }
  })
})
