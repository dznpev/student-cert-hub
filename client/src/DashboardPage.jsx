import PortalIcon from './PortalIcon.jsx'
import PortalChip from './components/PortalChip.jsx'
import PortalMetricCard from './components/PortalMetricCard.jsx'
import PortalPanel from './components/PortalPanel.jsx'
import PortalTable from './components/PortalTable.jsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArcElement, BarController, BarElement, CategoryScale, Chart,
  DoughnutController, LinearScale, Tooltip,
} from 'chart.js'
import { certificateStatuses } from './certificateStatuses.js'
import { summarizeDashboard } from './summarizeDashboard.js'
import { createDashboardReport } from './exportDashboardReport.js'

Chart.register(
  ArcElement, BarController, BarElement, CategoryScale,
  DoughnutController, LinearScale, Tooltip,
)
Chart.defaults.font.family = "'Be Vietnam Pro', system-ui, -apple-system, sans-serif"

const metricAppearance = [
  ['students'], ['activities'], ['participations'], ['profile'],
  ['certificates', 'success'], ['revoked'], ['error', 'danger'],
]

// Chart inputs are stable module constants, not inline literals: the drawing
// effect compares them by identity, so a parent render must not rebuild them.
const BRAND_TONES = ['brand']
const CERTIFICATE_LABELS = certificateStatuses.map(({ label }) => label)
const CERTIFICATE_TONES = certificateStatuses.map(({ tone }) => tone)

// The dashboard list is a preview; the Chứng nhận page is the full list.
const RECENT_CERTIFICATES_LIMIT = 10

// Chart colours are read from the live custom properties, so both charts follow
// the theme instead of hard-coding a palette (spec §8.3). A tone whose base hue
// would fall below 3:1 on the dark panel uses its brightened text variant.
const SERIES_TOKENS = {
  brand: ['--ws-hutech', '--ws-hutech-text'],
  success: ['--ws-success', '--ws-success-text'],
  info: ['--ws-hutech', '--ws-hutech-text'],
  danger: ['--ws-accent', '--ws-accent-text'],
  mute: ['--ws-muted', '--ws-muted'],
}

// Reads a design token at render time; the fallback only applies where there is
// no document to compute against (server rendering and tests).
function readToken(name, fallback = '') {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function isDarkTheme() {
  return typeof document !== 'undefined' && document.documentElement.dataset.bsTheme === 'dark'
}

function seriesColor(tone) {
  const [lightToken, darkToken] = SERIES_TOKENS[tone] ?? SERIES_TOKENS.mute
  return readToken(isDarkTheme() ? darkToken : lightToken)
}

const numberFormat = new Intl.NumberFormat('vi-VN')
const percentFormat = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 })
const todayFormat = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh',
})
const emptyFilters = { selectedCohort: '', selectedActivity: '', fromDate: '', toDate: '', selectedCertificateStatus: '' }
const formatDate = (value) => value.split('-').reverse().join('/')
// issuedAt is a plain yyyy-mm-dd day; a certificate still generating or failed
// has no issue date, and "recent" does not apply to it (ruling F2).
const formatIssuedDate = (value) => value ? formatDate(String(value).slice(0, 10)) : '—'

function compareRecentCertificates(left, right) {
  const leftDate = left.issuedAt ?? ''
  const rightDate = right.issuedAt ?? ''
  if (leftDate !== rightDate) {
    if (leftDate === '') return 1
    if (rightDate === '') return -1
    return leftDate < rightDate ? 1 : -1
  }
  return Number(right.certificateId ?? 0) - Number(left.certificateId ?? 0)
}

function formatChartValue(value, percentages) {
  return percentages ? percentFormat.format(value / 100) : numberFormat.format(value)
}

const percentageLabels = {
  id: 'percentage-labels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    const bars = chart.getDatasetMeta(0).data
    const values = chart.data.datasets[0].data

    ctx.save()
    ctx.fillStyle = chart.options.color
    ctx.font = '600 14px "Be Vietnam Pro", system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    bars.forEach((bar, index) => {
      ctx.fillText(formatChartValue(values[index], true), bar.x, bar.y - 6)
    })
    ctx.restore()
  },
}

function DashboardChart({ title, icon, type, labels, values, tones, percentages = false }) {
  const canvasRef = useRef(null)
  const [themeTick, setThemeTick] = useState(0)
  // Rendered swatches must follow the theme too, not only the canvas.
  const legendColors = tones.map(seriesColor)

  // The theme lives on <html data-bs-theme>; a mutation is the only signal that
  // the custom properties changed, so bumping the tick redraws the chart.
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeTick((tick) => tick + 1))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const textColor = readToken('--ws-fg-2')
    const gridColor = readToken('--ws-line')
    const chartColors = tones.map(seriesColor)
    const chart = new Chart(canvasRef.current, {
      type,
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: chartColors.length === 1 ? chartColors[0] : chartColors,
        }],
      },
      plugins: percentages ? [percentageLabels] : [],
      options: {
        color: textColor,
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: percentages ? { padding: { top: 24 } } : undefined,
        plugins: {
          tooltip: {
            callbacks: {
              label: ({ label, raw }) => label + ': ' + formatChartValue(raw, percentages),
            },
          },
        },
        scales: percentages ? {
          x: { ticks: { color: textColor, font: { size: 14 } }, grid: { color: gridColor } },
          y: {
            min: 0,
            max: 100,
            ticks: { stepSize: 25, color: textColor, font: { size: 14 }, callback: (value) => value + '%' },
            grid: { color: gridColor },
          },
        } : undefined,
      },
    })

    return () => chart.destroy()
  }, [type, labels, values, tones, percentages, themeTick])

  const summary = labels.map((label, index) => {
    return label + ' ' + formatChartValue(values[index], percentages)
  }).join(', ')

  return (
    <PortalPanel title={title} icon={<PortalIcon name={icon} />} className="h-100">
      <div className="dashboard-panel__body">
        <div className={type === 'doughnut' ? 'dashboard-chart-with-legend' : undefined}>
          <div className="dashboard-chart">
            <canvas ref={canvasRef} role="img" aria-label={title + '. ' + summary} />
          </div>
          {type === 'doughnut' && (
            <ul className="dashboard-chart-legend list-unstyled mb-0">
              {labels.map((label, index) => (
                <li className="dashboard-chart-legend-item" key={label}>
                  <span className="dashboard-chart-swatch" style={{ backgroundColor: legendColors[index] }} aria-hidden="true" />
                  <span>{label}</span>
                  <strong>{numberFormat.format(values[index])}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
        {type === 'doughnut' && values.every((value) => value === 0) && <p className="small text-body-secondary mt-3 mb-0">Chưa có chứng nhận trong phạm vi đã chọn.</p>}
      </div>
    </PortalPanel>
  )
}

export default function DashboardPage({ cohorts, students, activities, participations, certificates }) {
  const [filters, setFilters] = useState(emptyFilters)
  const [draftFilters, setDraftFilters] = useState(emptyFilters)
  const [filterError, setFilterError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportNotice, setExportNotice] = useState('')
  const [exportError, setExportError] = useState('')
  const hasDraftChanges = Object.keys(emptyFilters).some((field) => filters[field] !== draftFilters[field])
  const { selectedCohort, selectedActivity, fromDate, toDate, selectedCertificateStatus } = filters
  const cohort = cohorts.find(({ cohortId }) => String(cohortId) === selectedCohort)
  const activity = activities.find(({ activityId }) => String(activityId) === selectedActivity)
  const statusLabel = certificateStatuses.find(({ status }) => status === selectedCertificateStatus)?.label ?? 'Tất cả trạng thái chứng nhận'
  const dateSummary = fromDate && toDate ? `${formatDate(fromDate)} – ${formatDate(toDate)}`
    : fromDate ? `Từ ${formatDate(fromDate)}` : toDate ? `Đến ${formatDate(toDate)}` : 'Toàn bộ thời gian'
  // Rendered, not captured at module load: a dashboard left open across
  // midnight must show the current day when the component mounts again.
  // The lazy state initialiser keeps the impure Date() call out of render.
  const [todayLabel] = useState(() => todayFormat.format(new Date()))
  // Memoised so a keystroke elsewhere on the page does not hand the charts new
  // arrays and make them destroy and recreate their canvases (R154).
  const { studentCount, activityCount, participationCount, uniqueStudents, certificateCounts, scopedCertificates, cohortParticipation } = useMemo(
    () => summarizeDashboard({
      cohorts, students, activities, participations, certificates,
      selectedCohort, selectedActivity, fromDate, toDate, selectedCertificateStatus,
    }),
    [cohorts, students, activities, participations, certificates,
      selectedCohort, selectedActivity, fromDate, toDate, selectedCertificateStatus],
  )

  // Ruling F1: the rows are the certificates the tiles counted, read straight
  // off the memoised summary. Sorting and the 10-row cap are presentation only.
  const recentCertificates = useMemo(() => {
    const participationById = new Map(participations.map((item) => [item.participationId, item]))
    const studentById = new Map(students.map((item) => [item.studentId, item]))
    return [...scopedCertificates]
      .sort(compareRecentCertificates)
      .slice(0, RECENT_CERTIFICATES_LIMIT)
      .map((certificate) => {
        const participation = participationById.get(certificate.participationId)
        return {
          certificate,
          student: studentById.get(participation?.studentId),
          statusInfo: certificateStatuses.find(({ status }) => status === certificate.status),
        }
      })
  }, [scopedCertificates, participations, students])

  const participationChart = useMemo(() => ({
    labels: cohortParticipation.map(({ cohortId }) => cohorts.find((item) => item.cohortId === cohortId)?.cohortCode ?? String(cohortId)),
    values: cohortParticipation.map((cohort) => cohort.studentCount === 0 ? 0 : cohort.uniqueStudents / cohort.studentCount * 100),
    tones: BRAND_TONES,
  }), [cohortParticipation, cohorts])

  const certificateChart = useMemo(() => ({
    labels: CERTIFICATE_LABELS,
    values: certificateStatuses.map(({ status }) => certificateCounts[status]),
    tones: CERTIFICATE_TONES,
  }), [certificateCounts])

  function updateFilter(field, value) {
    setDraftFilters((current) => ({ ...current, [field]: value }))
    setFilterError('')
    setExportNotice('')
    setExportError('')
  }

  function applyFilters(event) {
    event.preventDefault()
    if (draftFilters.fromDate && draftFilters.toDate && draftFilters.fromDate > draftFilters.toDate) {
      setFilterError('Ngày đến phải bằng hoặc sau ngày từ. Số liệu vẫn giữ theo bộ lọc đã áp dụng.')
      return
    }
    setFilters({ ...draftFilters })
    setFilterError('')
    setExportNotice('')
    setExportError('')
  }
  const metrics = [
    ['Sinh viên đang hoạt động', studentCount, 'Tính theo khóa tuyển sinh'],
    ['Hoạt động', activityCount, cohort || selectedCertificateStatus ? 'Hoạt động có lượt tham gia khớp bộ lọc' : 'Hoạt động trong phạm vi lọc'],
    ['Lượt tham gia', participationCount, selectedCertificateStatus ? 'Có chứng nhận khớp trạng thái đã chọn' : 'Gồm Chờ duyệt, Đã duyệt và Từ chối'],
    ['Sinh viên có lượt tham gia', uniqueStudents, 'Mỗi sinh viên chỉ tính một lần'],
    ['Chứng nhận hiệu lực', certificateCounts.Issued],
    ['Chứng nhận bị thu hồi', certificateCounts.Revoked],
    ['Lỗi tạo PDF', certificateCounts.Failed],
  ]

  async function exportReport() {
    if (exporting || hasDraftChanges || filterError) return
    setExporting(true)
    setExportNotice('')
    setExportError('')
    try {
      const { buffer, fileName } = await createDashboardReport({ cohorts, students, activities, participations, certificates, filters, metrics })
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      try { link.click() } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
      setExportNotice('Đã tạo báo cáo ' + fileName + ' theo bộ lọc đã áp dụng.')
    } catch {
      setExportError('Không xuất được báo cáo Excel. Bạn hãy thử lại.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <header className="portal-hero">
        <p className="portal-hero__date">{todayLabel}</p>
        <h1 className="portal-hero__title">Tổng quan</h1>
        <p className="portal-hero__description">
          {dateSummary} · {activity ? `${activity.code} · ${activity.name}` : 'Tất cả hoạt động'} · {cohort ? cohort.cohortCode : 'Tất cả khóa'} · {statusLabel}
        </p>
        <p className="portal-hero__note">Dữ liệu frontend trong phiên hiện tại</p>
      </header>

      <form className="mb-4" onSubmit={applyFilters} aria-label="Bộ lọc tổng quan">
      <fieldset disabled={exporting}>
      <div className="row g-3 align-items-end">
        <div className="col-12 col-sm-6 col-xl-2">
          <label className="form-label" htmlFor="dashboard-cohort">Khóa tuyển sinh</label>
          <select
            id="dashboard-cohort"
            className="form-select"
            value={draftFilters.selectedCohort}
            onChange={(event) => updateFilter('selectedCohort', event.target.value)}
          >
            <option value="">Tất cả khóa</option>
            {cohorts.map(({ cohortId, cohortCode }) => (
              <option key={cohortId} value={cohortId}>{cohortCode}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <label className="form-label" htmlFor="dashboard-activity">Hoạt động</label>
          <select id="dashboard-activity" className="form-select" value={draftFilters.selectedActivity} onChange={(event) => updateFilter('selectedActivity', event.target.value)}>
            <option value="">Tất cả hoạt động</option>
            {activities.map(({ activityId, code, name }) => <option key={activityId} value={activityId}>{code} · {name}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <label className="form-label" htmlFor="dashboard-certificate-status">Trạng thái chứng nhận</label>
          <select id="dashboard-certificate-status" className="form-select" value={draftFilters.selectedCertificateStatus} onChange={(event) => updateFilter('selectedCertificateStatus', event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {certificateStatuses.map(({ status, label }) => <option key={status} value={status}>{label}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <label className="form-label" htmlFor="dashboard-from">Từ ngày</label>
          <input id="dashboard-from" type="date" className="form-control" value={draftFilters.fromDate} onChange={(event) => updateFilter('fromDate', event.target.value)} aria-describedby="dashboard-filter-help dashboard-filter-error" />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <label className="form-label" htmlFor="dashboard-to">Đến ngày</label>
          <input id="dashboard-to" type="date" className={'form-control' + (filterError ? ' is-invalid' : '')} value={draftFilters.toDate} onChange={(event) => updateFilter('toDate', event.target.value)} aria-invalid={Boolean(filterError)} aria-describedby="dashboard-filter-help dashboard-filter-error" />
        </div>
      </div>
      <p id="dashboard-filter-help" className="form-text">Lọc theo ngày tổ chức: tính các hoạt động có thời gian giao với khoảng chọn, kể cả ngày đầu và ngày cuối. Có thể để trống một hoặc cả hai ngày.</p>
      <div id="dashboard-filter-error">{filterError && <p className="text-danger" role="alert">{filterError}</p>}</div>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <button type="submit" className="btn btn-primary">Áp dụng bộ lọc</button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => { setFilters(emptyFilters); setDraftFilters(emptyFilters); setFilterError(''); setExportNotice(''); setExportError('') }}>Xóa bộ lọc</button>
        <button type="button" className="btn btn-outline-success" disabled={exporting || hasDraftChanges || Boolean(filterError)} onClick={exportReport}>{exporting ? 'Đang xuất Excel…' : 'Xuất Excel'}</button>
        {hasDraftChanges && <span className="small text-body-secondary" role="status">Có thay đổi bộ lọc chưa áp dụng. Hãy áp dụng hoặc xóa bộ lọc trước khi xuất.</span>}
      </div>
      </fieldset>
      </form>
      {exportNotice && <p className="alert alert-success" role="status">{exportNotice}</p>}
      {exportError && <p className="alert alert-danger" role="alert">{exportError}</p>}

      <p className="small text-body-secondary mb-4">Tỷ lệ theo khóa = số sinh viên đang hoạt động có lượt khớp bộ lọc / tổng số sinh viên đang hoạt động của khóa. Tải lại trang sẽ khôi phục dữ liệu mẫu.</p>
      <p className="small text-body-secondary mb-4">Tổng sinh viên đang hoạt động chỉ lọc theo khóa. Số lượt tham gia và chứng nhận vẫn tính cả lịch sử. Khi chọn trạng thái chứng nhận, chỉ tính lượt có chứng nhận đang ở trạng thái đó.</p>
      {activityCount === 0 && <p className="alert alert-info" role="status">Không có hoạt động phù hợp trong phạm vi đã áp dụng.</p>}

      <div className="portal-metric-grid">
        {metrics.map(([label, value, note], index) => {
          const [icon, tone] = metricAppearance[index]
          return (
            <PortalMetricCard
              key={label}
              label={label}
              value={numberFormat.format(value)}
              note={note}
              icon={<PortalIcon name={icon} />}
              tone={tone}
            />
          )
        })}
      </div>

      {cohortParticipation.length === 0 ? (
        <p className="text-body-secondary mb-0">Khóa này chưa có dữ liệu biểu đồ.</p>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-xl-7">
            <DashboardChart
              title="Tỷ lệ tham gia của sinh viên đang hoạt động theo khóa"
              icon="participations"
              type="bar"
              labels={participationChart.labels}
              values={participationChart.values}
              tones={participationChart.tones}
              percentages
            />
          </div>
          <div className="col-12 col-xl-5">
            <DashboardChart
              title="Chứng nhận theo trạng thái"
              icon="certificates"
              type="doughnut"
              labels={certificateChart.labels}
              values={certificateChart.values}
              tones={certificateChart.tones}
            />
          </div>
        </div>
      )}

      <PortalPanel className="portal-panel--stacked dashboard-recent-certificates">
        <PortalTable label="Danh sách chứng nhận gần đây" minWidth="56rem">
          <caption className="visually-hidden">Danh sách chứng nhận gần đây</caption>
          <thead>
            <tr>
              <th scope="col">Mã chứng nhận</th>
              <th scope="col">Sinh viên</th>
              <th scope="col">Ngày cấp</th>
              <th scope="col">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {recentCertificates.map(({ certificate, student, statusInfo }) => (
              <tr key={certificate.certificateId}>
                <th scope="row" className="portal-table__cell-strong">{certificate.certificateCode}</th>
                <td>{student ? student.studentCode + ' · ' + student.fullName : '—'}</td>
                <td>{formatIssuedDate(certificate.issuedAt)}</td>
                <td><PortalChip tone={statusInfo.tone} label={statusInfo.label} /></td>
              </tr>
            ))}
            {recentCertificates.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-body-secondary">Không tìm thấy chứng nhận phù hợp.</td>
              </tr>
            )}
          </tbody>
        </PortalTable>
      </PortalPanel>
    </>
  )
}
