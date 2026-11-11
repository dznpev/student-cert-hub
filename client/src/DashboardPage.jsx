import { useContext, useEffect, useRef, useState } from 'react'
import { ThemeContext } from './themeContext.js'
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

const numberFormat = new Intl.NumberFormat('vi-VN')
const percentFormat = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 })
const emptyFilters = { selectedCohort: '', selectedActivity: '', fromDate: '', toDate: '', selectedCertificateStatus: '' }
const formatDate = (value) => value.split('-').reverse().join('/')

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
    ctx.font = '600 14px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    bars.forEach((bar, index) => {
      ctx.fillText(formatChartValue(values[index], true), bar.x, bar.y - 6)
    })
    ctx.restore()
  },
}

function DashboardChart({ title, type, labels, values, colors, percentages = false }) {
  const canvasRef = useRef(null)
  const { theme } = useContext(ThemeContext)

  useEffect(() => {
    const textColor = theme === 'dark' ? '#e5e9f0' : '#475569'
    const gridColor = theme === 'dark' ? '#3b4350' : '#e3e7ef'
    const chart = new Chart(canvasRef.current, {
      type,
      data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
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
  }, [type, labels, values, colors, percentages, theme])

  const summary = labels.map((label, index) => {
    return label + ' ' + formatChartValue(values[index], percentages)
  }).join(', ')

  return (
    <section className="card dashboard-card h-100">
      <div className="card-body p-3 p-md-4">
        <h2 className="h5 mb-3">{title}</h2>
        <div className={type === 'doughnut' ? 'dashboard-chart-with-legend' : undefined}>
          <div className="dashboard-chart">
            <canvas ref={canvasRef} role="img" aria-label={title + '. ' + summary} />
          </div>
          {type === 'doughnut' && (
            <ul className="dashboard-chart-legend list-unstyled mb-0">
              {labels.map((label, index) => (
                <li className="dashboard-chart-legend-item" key={label}>
                  <span className="dashboard-chart-swatch" style={{ backgroundColor: colors[index] }} aria-hidden="true" />
                  <span>{label}</span>
                  <strong>{numberFormat.format(values[index])}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
        {type === 'doughnut' && values.every((value) => value === 0) && <p className="small text-body-secondary mt-3 mb-0">Chưa có chứng nhận trong phạm vi đã chọn.</p>}
      </div>
    </section>
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
  const { studentCount, activityCount, participationCount, uniqueStudents, certificateCounts, cohortParticipation } = summarizeDashboard({
    cohorts, students, activities, participations, certificates, ...filters,
  })

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
      <h1 className="page-title mb-2">Tổng quan</h1>
      <p className="text-body-secondary mb-3">
        Dữ liệu frontend trong phiên hiện tại · {dateSummary} · {activity ? `${activity.code} · ${activity.name}` : 'Tất cả hoạt động'} · {cohort ? cohort.cohortCode : 'Tất cả khóa'} · {statusLabel}
      </p>

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

      <div className="row g-3 mb-4">
        {metrics.map(([label, value, note], index) => (
          <div className={index < 4 ? 'col-12 col-sm-6 col-xl-3' : 'col-12 col-sm-6 col-xl-4'} key={label}>
            <dl className="card dashboard-card h-100 mb-0 p-3">
              <dt className="fw-medium">{label}</dt>
              <dd className="fs-3 fw-bold mb-0">{numberFormat.format(value)}</dd>
              {note && <dd className="small text-body-secondary mb-0">{note}</dd>}
            </dl>
          </div>
        ))}
      </div>

      {cohortParticipation.length === 0 ? (
        <p className="text-body-secondary mb-0">Khóa này chưa có dữ liệu biểu đồ.</p>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-xl-7">
            <DashboardChart
              title="Tỷ lệ tham gia của sinh viên đang hoạt động theo khóa"
              type="bar"
              labels={cohortParticipation.map(({ cohortId }) => cohorts.find((item) => item.cohortId === cohortId)?.cohortCode ?? String(cohortId))}
              values={cohortParticipation.map((cohort) => cohort.studentCount === 0 ? 0 : cohort.uniqueStudents / cohort.studentCount * 100)}
              colors="#2f5fc4"
              percentages
            />
          </div>
          <div className="col-12 col-xl-5">
            <DashboardChart
              title="Chứng nhận theo trạng thái"
              type="doughnut"
              labels={certificateStatuses.map(({ label }) => label)}
              values={certificateStatuses.map(({ status }) => certificateCounts[status])}
              colors={certificateStatuses.map(({ color }) => color)}
            />
          </div>
        </div>
      )}
    </>
  )
}
