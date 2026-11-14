import { readFileSync } from 'node:fs'
import * as React from 'react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PortalChip from '../src/components/PortalChip.jsx'
import PortalMetricCard from '../src/components/PortalMetricCard.jsx'
import PortalPanel from '../src/components/PortalPanel.jsx'
import PortalTable from '../src/components/PortalTable.jsx'
import ThemeToggleButton from '../src/components/ThemeToggleButton.jsx'
import AppShell, { AccountPanel } from '../src/components/AppShell.jsx'
import AppSidebar from '../src/components/AppSidebar.jsx'
import { studentAccountSections, studentPages, studentSections } from '../src/studentNavigation.js'
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

  it('PortalTable dùng cho mọi bảng và bảng rộng có cột thao tác dính', () => {
    const src = readFileSync(new URL('../src/CertificatesPage.jsx', import.meta.url), 'utf-8')
    expect(src).toContain('PortalTable')
    expect(src).toContain('stickyActions')
  })

  it('style cột thao tác dính có position sticky', () => {
    const css = readFileSync(new URL('../src/tokens/components.css', import.meta.url), 'utf-8')
    expect(css).toMatch(/portal-table--sticky-actions[\s\S]*position:\s*sticky/)
  })

  // R86: the brief's single-page assertion above cannot notice a page that
  // reverts to the raw wrapper or a wide table that loses (or gains) the pin.
  it('cả tám trang còn lại dùng PortalTable và chỉ bảng có cột thao tác mới dính', () => {
    const pageSrc = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf-8')
    for (const file of [
      'ParticipationsPage.jsx', 'StudentsPage.jsx', 'ImportsPage.jsx', 'AuditLogsPage.jsx',
      'ActivitiesPage.jsx', 'CertificateTemplatesPage.jsx', 'CohortsPage.jsx', 'SuperAdminAccounts.jsx',
    ]) {
      const src = pageSrc(file)
      expect(src, file).toContain('PortalTable')
      // A revert keeps the (now unused) import, so the rendered legacy wrapper
      // itself must be absent.
      expect(src, file).not.toContain('admin-table-scroll')
      expect(src, file).not.toContain('<table')
    }

    for (const file of ['CertificatesPage.jsx', 'ParticipationsPage.jsx', 'StudentsPage.jsx', 'ImportsPage.jsx']) {
      expect(pageSrc(file), file).toContain('stickyActions')
    }
    // Nhật ký hệ thống is 56rem but has no action column, so it must stay unpinned.
    expect(pageSrc('AuditLogsPage.jsx')).not.toContain('stickyActions')
  })

  // R86/R87: assert the rules themselves instead of one regex spanning the file.
  it('cột dính dùng nền đục, bỏ ô colSpan và hover phủ cả th lẫn td', () => {
    const css = readFileSync(new URL('../src/tokens/components.css', import.meta.url), 'utf-8')
    const sticky = /(\.portal-table--sticky-actions[^{]*:is\(th, td\):last-child[^{]*)\{([^}]*)\}/.exec(css)
    expect(sticky, 'thiếu quy tắc cột thao tác dính').not.toBeNull()
    expect(sticky[1]).toContain(':not([colspan])')
    expect(sticky[2]).toMatch(/position:\s*sticky/)
    expect(sticky[2]).toMatch(/background-color:\s*var\(--ws-panel-solid\)/)

    const hover = /(\.portal-table--sticky-actions tbody tr:hover[^{]*)\{([^}]*)\}/.exec(css)
    expect(hover, 'thiếu quy tắc hover cột thao tác dính').not.toBeNull()
    expect(hover[1]).toContain(':is(th, td):last-child')
    expect(hover[2]).toMatch(/background-color:\s*var\(--ws-chip-bg\)/)
  })

  it('--ws-panel-solid có mặt ở cả hai chế độ với nền đục', () => {
    const css = readFileSync(new URL('../src/tokens/index.css', import.meta.url), 'utf-8')
    const light = /:root\s*\{([^}]*)\}/.exec(css)
    const dark = /\[data-bs-theme="dark"\]\s*\{([^}]*)\}/.exec(css)
    expect(light, 'thiếu khối :root').not.toBeNull()
    expect(dark, 'thiếu khối tối').not.toBeNull()
    // #fffffff5 is white at 96% alpha; its opaque composite is plain white, not cream.
    // The hex boundary rejects an 8-digit value (an alpha byte), so a translucent
    // #fffffff5 cannot satisfy the opaque-token requirement.
    expect(light[1]).toMatch(/--ws-panel-solid:\s*#ffffff(?![\da-fA-F])/)
    expect(dark[1]).toMatch(/--ws-panel-solid:\s*#141f31/)
  })

  it('mười hai vùng cuộn bảng có aria-label riêng biệt', () => {
    const labels = [
      'CertificatesPage.jsx', 'ParticipationsPage.jsx', 'StudentsPage.jsx', 'ImportsPage.jsx',
      'AuditLogsPage.jsx', 'ActivitiesPage.jsx', 'CertificateTemplatesPage.jsx', 'CohortsPage.jsx',
      'SuperAdminAccounts.jsx',
    ].flatMap((file) => {
      const src = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf-8')
      return [...src.matchAll(/<PortalTable label="([^"]+)"/g)].map((match) => match[1])
    })

    expect(labels).toHaveLength(12)
    expect(new Set(labels).size).toBe(12)
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

describe('trang Chứng nhận', () => {
  const certificatesSrc = () => readFileSync(new URL('../src/CertificatesPage.jsx', import.meta.url), 'utf-8')
  const componentsCss = () => readFileSync(new URL('../src/tokens/components.css', import.meta.url), 'utf-8')

  it('CertificatesPage dùng PortalPanel và không còn card rounded-4', () => {
    const src = certificatesSrc()
    expect(src).toContain('PortalPanel')
    expect(src).not.toContain('rounded-4')
  })

  it('bảng chứng nhận có cột thao tác dính', () => {
    const src = certificatesSrc()
    expect(src).toMatch(/PortalTable[\s\S]*stickyActions/)
  })

  // R92: §6.8 keeps the Hero for the two overview pages; every other page uses
  // the surface-less PageHeader with the data-mock description.
  it('đầu trang dùng PortalPageHeader với mô tả dữ liệu mẫu', () => {
    const src = certificatesSrc()
    expect(src).toContain('<PortalPageHeader')
    expect(src).toContain('title="Chứng nhận"')
    expect(src).toContain('Dữ liệu mẫu · Thay đổi chỉ lưu trong phiên hiện tại, tải lại trang sẽ khôi phục dữ liệu mẫu.')
  })

  // R94: the description takes over the header paragraph, so the sentence that
  // explains what approving a participation does must survive in the content.
  it('đoạn giải thích luồng duyệt vẫn còn trong nội dung trang', () => {
    expect(certificatesSrc()).toContain('Duyệt lượt tham gia sẽ tự thêm yêu cầu chứng nhận.')
  })

  // R95: both auxiliary panels become portal-panel surfaces — and the root
  // class must be there, or the panel loses its background, radius and clip.
  it('panel tải và bản mẫu dùng portal-panel, không còn rounded-4', () => {
    for (const file of ['CertificateDownloadPanel.jsx', 'CertificateSnapshotPreview.jsx']) {
      const src = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf-8')
      expect(src, file).toMatch(/<section className="portal-panel[ "]/)
      expect(src, file).toContain('portal-panel__header')
      expect(src, file).toContain('portal-panel__body')
      expect(src, file).not.toContain('rounded-4')
    }
  })

  // R93/R100: a select keeps the browser's own arrow, so it reserves that room
  // from the spacing scale; the revocation textarea shares the field look but
  // not the fixed 32px height.
  it('select chừa chỗ cho mũi tên và textarea cao tự động', () => {
    // Selector lists are flattened first. In the grouped `.fld,\n.fld-multiline {`
    // rule the second line begins exactly like a standalone rule, so an
    // unflattened single-class regex binds to the shared body instead — the
    // guard then names one rule while watching another.
    const css = componentsCss().replace(/,\s*\n\s*/g, ', ')
    const select = /(?:^|\n)select\.fld\s*\{([^}]*)\}/.exec(css)
    expect(select, 'thiếu quy tắc select.fld').not.toBeNull()
    // --ws-s9 (26px) is the step that clears the arrow; a smaller one (2px at
    // --ws-s1) would clip it while still counting as "a token".
    expect(select[1]).toMatch(/padding-right:\s*var\(--ws-s9\)/)

    // One grouped rule carries the field look for both shapes…
    const shared = /(?:^|\n)\.fld,\s*\.fld-multiline\s*\{([^}]*)\}/.exec(css)
    expect(shared, 'thiếu quy tắc nhóm .fld, .fld-multiline').not.toBeNull()
    expect(shared[1]).toMatch(/border-radius:\s*var\(--ws-r-sm\)/)
    // R106: a height on the shared body would collapse the textarea just as a
    // height on the standalone rule would, so the grouped body is guarded too.
    expect(shared[1]).not.toMatch(/(?:^|;)\s*height:/)

    // …and only the single-line shape keeps the fixed height.
    const single = /(?:^|\n)\.fld\s*\{([^}]*)\}/.exec(css)
    expect(single, 'thiếu quy tắc .fld').not.toBeNull()
    expect(single[1]).toMatch(/height:\s*32px/)

    // The standalone textarea rule, not the shared one: `display: block` only
    // exists here, so a match on the grouped body cannot pass this guard.
    const area = /(?:^|\n)\.fld-multiline\s*\{([^}]*)\}/.exec(css)
    expect(area, 'thiếu quy tắc .fld-multiline').not.toBeNull()
    expect(area[1]).toMatch(/display:\s*block/)
    expect(area[1]).toMatch(/resize:\s*vertical/)
    expect(area[1]).not.toMatch(/(?:^|;)\s*height:/)

    // Anchored to the revocation field itself: an unanchored match would pass
    // even if this textarea lost the class and another one kept it.
    const textarea = /<textarea\b[\s\S]*?id="certificate-revocation-reason"[\s\S]*?\/>/.exec(certificatesSrc())
    expect(textarea, 'không tìm thấy textarea lý do thu hồi').not.toBeNull()
    expect(textarea[0]).toContain('fld-multiline')
    expect(textarea[0]).not.toContain('form-control')
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

describe('các trang quản trị còn lại', () => {
  const pages = ['StudentsPage', 'ActivitiesPage', 'ParticipationsPage', 'CohortsPage', 'ImportsPage', 'AuditLogsPage', 'CertificateTemplatesPage', 'SuperAdminAccounts']
  const pageSrc = (page) => readFileSync(new URL(`../src/${page}.jsx`, import.meta.url), 'utf-8')

  it('mọi trang quản trị dùng PortalPageHeader và không còn rounded-4', () => {
    for (const page of pages) {
      const src = pageSrc(page)
      expect(src, page).not.toContain('rounded-4')
      expect(src, page).toContain('PortalPageHeader')
    }
  })

  // R119/R121: a conversion must not turn a named region into a plain container.
  // `PortalPanel` points its <section> at the title it renders, so a `titleId`
  // is consumed, not merely declared — and every `titleId` a page hands over is
  // fed back through the component here to prove the reference exists.
  it('mỗi tiêu đề panel đều đặt tên cho vùng của nó', () => {
    const named = renderToStaticMarkup(createElement(PortalPanel, { title: 'Vùng có tên', titleId: 'vung-co-ten' }))
    expect(named).toMatch(/<section[^>]*aria-labelledby="vung-co-ten"[^>]*>/)
    expect(named).toMatch(/<h2[^>]*id="vung-co-ten"[^>]*>/)
    expect(named).toContain('portal-panel__title">Vùng có tên</h2>')

    const untitled = renderToStaticMarkup(createElement(PortalPanel, null, createElement('p', null, 'Nội dung')))
    expect(untitled).not.toContain('aria-labelledby')

    for (const page of pages) {
      const src = pageSrc(page)
      for (const [tag] of src.matchAll(/<PortalPanel\b[^>]*>/g)) {
        if (!/\stitle=/.test(tag)) continue
        const titleId = /\stitleId="([^"]+)"/.exec(tag)?.[1]
        expect(titleId, `${page}: panel có title phải có titleId → ${tag}`).toBeTruthy()
        const consumed = renderToStaticMarkup(createElement(PortalPanel, { title: 'Vùng', titleId }))
        expect(consumed, `${page} → ${titleId}`).toContain(`aria-labelledby="${titleId}"`)
      }
    }

    // The ids that named regions before the conversion must still name them.
    const survived = {
      StudentsPage: ['student-profile-title'],
      ParticipationsPage: ['participation-results-title'],
      ImportsPage: ['import-settings', 'student-import-preview', 'participation-import-preview', 'import-history'],
      SuperAdminAccounts: ['accounts-list-title'],
    }
    for (const [page, ids] of Object.entries(survived)) {
      const src = pageSrc(page)
      for (const id of ids) expect(src, `${page} → ${id}`).toContain(`titleId="${id}"`)
    }
  })

  // Every id an `aria-labelledby` / `aria-describedby` names must exist in the
  // same file — either as a literal `id` or as a `titleId` the render check
  // above turns into one.
  it('vùng được đặt tên vẫn trỏ tới một phần tử có thật', () => {
    for (const page of pages) {
      const src = pageSrc(page)
      const ids = new Set([...src.matchAll(/\b(?:titleId|id)="([^"]+)"/g)].map((match) => match[1]))
      for (const [, refs] of src.matchAll(/\baria-(?:labelledby|describedby)="([^"]+)"/g)) {
        for (const id of refs.split(/\s+/)) {
          expect(ids.has(id), `${page} → ${id}`).toBe(true)
        }
      }
    }
  })
})

describe('cổng sinh viên và màn hình độc lập', () => {
  const pageSrc = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf-8')
  const componentsCss = () => readFileSync(new URL('../src/tokens/components.css', import.meta.url), 'utf-8')
  const standalonePages = [
    'StudentLogin.jsx', 'StudentAccountLink.jsx', 'StudentPasswordReset.jsx', 'CertificateVerification.jsx',
  ]
  // StudentPasswordReset is the reset *view* of the login card, so it renders
  // its toggle into that card instead of owning a surface of its own.
  const authScreens = ['StudentLogin.jsx', 'StudentAccountLink.jsx', 'CertificateVerification.jsx']
  const studentFiles = ['StudentPortal.jsx', 'StudentOverview.jsx', 'StudentRecords.jsx', ...standalonePages]

  it('4 màn hình độc lập có nút đổi chế độ sáng tối', () => {
    for (const page of standalonePages) {
      expect(pageSrc(page), page).toContain('ThemeToggleButton')
    }
  })

  it('màn hình độc lập không còn gradient cũ', () => {
    expect(componentsCss()).not.toContain('#eef8ff')
  })

  // R127: the four screens share one page-token background, one token card and
  // the white logo chip the brand blue needs (§8.3).
  it('màn hình độc lập dùng nền trang, card token và hộp logo trắng', () => {
    for (const page of authScreens) {
      const src = pageSrc(page)
      expect(src, page).toContain('portal-auth-screen')
      expect(src, page).toContain('portal-auth-card')
      expect(src, page).toContain('portal-logo-chip')
      // The legacy surface classes are gone; element ids such as
      // `student-login-code` are field wiring and stay.
      for (const legacy of ['student-login-screen', 'student-login-card', 'student-login-logo']) {
        expect(src, page).not.toContain(legacy)
      }
      expect(src, page).not.toContain('rounded-4')
    }

    const css = componentsCss()
    expect(css).toMatch(/\.portal-auth-screen\s*\{[^}]*background:\s*var\(--ws-page-bg\)/)
    const card = /\.portal-auth-card\s*\{([^}]*)\}/.exec(css)
    expect(card, 'thiếu .portal-auth-card').not.toBeNull()
    expect(card[1]).toMatch(/max-width:\s*27rem/)
    expect(card[1]).toMatch(/background-color:\s*var\(--ws-panel\)/)
    expect(card[1]).toMatch(/border-radius:\s*var\(--ws-r\)/)
    expect(card[1]).toMatch(/box-shadow:\s*var\(--ws-shadow-panel\)/)
  })

  // R128: one toggle component, driven by Task 3's useTheme() hook.
  it('ThemeToggleButton lấy theme từ useTheme và đổi nhãn theo chế độ', () => {
    const src = read('ThemeToggleButton.jsx')
    expect(src).toContain('useTheme')
    expect(src).not.toContain('ThemeContext')

    const render = (theme) => renderToStaticMarkup(createElement(ThemeContext.Provider,
      { value: { theme, toggleTheme() {} } }, createElement(ThemeToggleButton)))
    const light = render('light')
    expect(light).toContain('class="portal-theme-toggle')
    expect(light).toContain('aria-label="Chuyển sang chế độ tối"')
    expect(light).toContain('🌙')
    const dark = render('dark')
    expect(dark).toContain('aria-label="Chuyển sang chế độ sáng"')
    expect(dark).toContain('☀️')
  })

  // R124: the student portal is the last consumer of the legacy shell.
  it('cổng sinh viên dùng AppShell và bốn tệp shell cũ đã bị xoá', () => {
    const portal = pageSrc('StudentPortal.jsx')
    expect(portal).toContain("from './components/AppShell.jsx'")
    for (const file of ['PortalSidebar.jsx', 'PortalTopbar.jsx', 'AccountMenu.jsx', 'PortalFooter.jsx']) {
      expect(() => pageSrc(file), file).toThrow()
    }
  })

  // R129: the preview-only password page used to tell the visitor to sign in
  // with their MSSV; AppShell's shared note says "quản trị", so the student
  // portal supplies its own wording.
  it('lời nhắc đổi mật khẩu của sinh viên xem thử giữ nguyên câu cũ', () => {
    expect(pageSrc('StudentPortal.jsx')).toContain('changePasswordNote="Đăng nhập bằng MSSV để đổi mật khẩu mẫu."')
    expect(read('AppShell.jsx')).toContain('{changePasswordNote}')
  })

  // R125: a nav id that reuses an account id would open the account panel
  // instead of the section and mark two items aria-current="page".
  it('mục điều hướng của sinh viên không trùng id nhóm tài khoản', () => {
    const ids = studentSections.flatMap(({ items }) => items.map(({ id }) => id))
    expect(ids).toEqual(['overview', 'student-profile', 'participations', 'certificates'])
    for (const accountId of ['profile', 'account', 'password']) expect(ids).not.toContain(accountId)
    // The account group keeps its own ids (AppShell, R34).
    expect(read('AppShell.jsx')).toContain("const ACCOUNT_PAGE_IDS = ['profile', 'account', 'password']")
  })

  // R126: the bell keeps its unread count on a HUTECH token, not text-bg-danger.
  it('chuông thông báo giữ số chưa đọc với badge token', () => {
    const portal = pageSrc('StudentPortal.jsx')
    expect(portal).toContain('topbarActions')
    expect(portal).toContain('portal-bell')
    expect(portal).toContain("aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}")

    const badge = /\.portal-bell__badge\s*\{([^}]*)\}/.exec(componentsCss())
    expect(badge, 'thiếu .portal-bell__badge').not.toBeNull()
    expect(badge[1]).toMatch(/background-color:\s*var\(--ws-accent\)/)
    expect(badge[1]).toMatch(/color:\s*var\(--ws-on-brand\)/)
  })

  // R130: no Bootstrap card / rounded-4 / status badge surface survives.
  it('tệp của cổng sinh viên không còn card, rounded-4, text-bg-* hay page-title', () => {
    for (const file of studentFiles) {
      const src = pageSrc(file)
      expect(src, file).not.toContain('rounded-4')
      expect(src, file).not.toContain('text-bg-')
      expect(src, file).not.toMatch(/\bcard-body\b/)
      expect(src, file).not.toMatch(/(?:^|[\s"'])card(?:[\s"']|$)/)
      expect(src, file).not.toMatch(/\bpage-title\b/)
    }
  })

  it('tổng quan và hồ sơ sinh viên dùng PageHeader, Panel và thẻ chỉ số chung', () => {
    const overview = pageSrc('StudentOverview.jsx')
    expect(overview).toContain('PortalPageHeader')
    expect(overview).toContain('PortalMetricCard')
    // The shared component lives in components/ — the legacy local one is gone.
    expect(overview).not.toContain("from './PortalMetricCard.jsx'")

    const records = pageSrc('StudentRecords.jsx')
    expect(records).toContain('PortalPageHeader')
    expect(records).toContain('PortalPanel')
    expect(records).toContain('PortalChip')

    expect(pageSrc('StudentPortal.jsx')).toContain('PortalPanel')
  })

  // Fix round 1 (R131–R136) --------------------------------------------------

  const renderPanel = (page, accountDetails) => renderToStaticMarkup(
    createElement(ThemeContext.Provider, { value: { theme: 'light', toggleTheme() {} } },
      createElement(AccountPanel, {
        page,
        accountIdentifier: 'SV001',
        roleLabel: 'Sinh viên',
        accountDetails,
        changePasswordNote: 'Đăng nhập bằng MSSV để đổi mật khẩu mẫu.',
        onChangePassword: null,
      })))

  const renderShell = (overrides = {}, children = null) => renderToStaticMarkup(
    createElement(ThemeContext.Provider, { value: { theme: 'light', toggleTheme() {} } },
      createElement(AppShell, {
        sections: [{ group: null, items: [{ id: 'overview', title: 'Tổng quan' }] }],
        activeSectionId: 'overview',
        onSelectSection: () => {},
        onHome: () => {},
        roleLabel: 'Sinh viên',
        accountIdentifier: 'SV001',
        onSignOut: () => {},
        context: 'Tổng quan',
        ...overrides,
      }, children)))

  // R131: the preview-session row is the only in-product signal that the data
  // is a sample; it must survive inside the shell's account panel.
  it('trang tài khoản của sinh viên render Email và Phiên', () => {
    const details = createElement(React.Fragment, null,
      createElement('dt', null, 'Email'), createElement('dd', null, 'sv001@hutech.edu.vn'),
      createElement('dt', null, 'Phiên'), createElement('dd', null, 'Xem thử'))
    const html = renderPanel('account', details)
    expect(html).toContain('<dt>Email</dt><dd>sv001@hutech.edu.vn</dd>')
    expect(html).toContain('<dt>Phiên</dt><dd>Xem thử</dd>')

    // ...and the student portal is the side that supplies the legacy lines.
    const portal = pageSrc('StudentPortal.jsx')
    expect(portal).toContain('accountDetails={student && (')
    expect(portal).toContain('<dt>Phiên</dt><dd>Xem thử</dd>')
  })

  // R132: with "Hồ sơ" already in the student navigation, the account group
  // publishes only the pages that have no section of their own.
  it('sidebar sinh viên không trùng nhãn và nhóm tài khoản chỉ có Tài khoản, Đổi mật khẩu', () => {
    expect(studentAccountSections.map(({ title }) => title)).toEqual(['Tài khoản', 'Đổi mật khẩu'])
    // The admin shell keeps the full group (R132 defaults).
    expect(read('AppShell.jsx')).toContain('function createAccountGroup(items = DEFAULT_ACCOUNT_ITEMS())')

    const accountGroup = {
      group: 'Tài khoản',
      items: [...studentAccountSections, { id: 'back-to-sections', title: 'Quay lại' }],
    }
    const html = renderToStaticMarkup(createElement(AppSidebar, {
      navigationId: 'student-navigation',
      navigationLabel: 'Điều hướng chính',
      sections: [...studentSections, accountGroup],
      activeSectionId: 'overview',
      onSelectSection: () => {},
      onHome: () => {},
    }))
    const labels = [...html.matchAll(/portal-nav__label">([^<]+)</g)].map(([, label]) => label)
    expect(labels).toEqual(['Tổng quan', 'Hồ sơ', 'Lượt tham gia', 'Chứng nhận',
      'Tài khoản', 'Đổi mật khẩu', 'Quay lại'])
    expect(labels.filter((label) => label === 'Hồ sơ')).toHaveLength(1)
    expect(new Set(labels).size).toBe(labels.length)
  })

  // R134: every "Hồ sơ" in the student UI opens the detailed profile section,
  // not the shell's generic account panel.
  it('menu Hồ sơ và sidebar Hồ sơ của sinh viên mở cùng một trang', () => {
    const profileNavId = studentPages.find(({ title }) => title === 'Hồ sơ')?.id
    expect(profileNavId).toBe('student-profile')
    expect(pageSrc('StudentPortal.jsx')).toContain(`onProfile={() => showPage('${profileNavId}')}`)
    expect(read('AppShell.jsx')).toContain('onProfile={openProfile}')
  })

  // R135: the shell carries the admin title by default and the legacy student
  // titles when the student portal supplies them.
  it('topbar dùng tiêu đề shell: mặc định của quản trị, của sinh viên khi có sinh viên', () => {
    expect(renderShell()).toContain('portal-topbar__title">Quản lý chứng nhận sinh viên')
    expect(renderShell({ title: 'Cổng sinh viên' })).toContain('portal-topbar__title">Cổng sinh viên')
    expect(pageSrc('StudentPortal.jsx')).toContain("title={student ? 'Cổng sinh viên' : 'Student Cert Hub'}")
  })

  // R136: the preview picker is the legacy screen: picker, "Về đăng nhập" and
  // nothing else — no empty sidebar, no account chrome, no invented labels.
  it('chế độ xem thử không có sidebar, menu tài khoản hay chữ Khách', () => {
    const picker = createElement('div', null,
      createElement('label', { htmlFor: 'notification-student' }, 'Hồ sơ xem thử'),
      createElement('select', { id: 'notification-student' },
        createElement('option', { value: '' }, 'Chọn sinh viên')),
      createElement('button', { type: 'button' }, 'Về đăng nhập'))
    const html = renderShell({
      title: 'Student Cert Hub',
      sections: [],
      accountIdentifier: undefined,
      roleLabel: undefined,
      context: 'Chọn hồ sơ xem thử',
    }, picker)

    expect(html).toContain('portal-shell--no-sidebar')
    expect(html).not.toMatch(/class="portal-sidebar/)
    expect(html).not.toContain('portal-account-menu')
    expect(html).not.toContain('Khách')
    expect(html).toContain('portal-topbar__title">Student Cert Hub')
    expect(html).toContain('Chọn hồ sơ xem thử')
    expect(html).toContain('Về đăng nhập')

    // The portal itself drops the preview-only identifier and sections.
    const portal = pageSrc('StudentPortal.jsx')
    expect(portal).toContain('sections={student ? studentSections.map(')
    expect(portal).toContain('accountIdentifier={student?.studentCode}')
  })
})
