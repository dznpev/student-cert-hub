import { useEffect, useRef, useState } from 'react'
import {
  ArcElement, BarController, BarElement, CategoryScale, Chart,
  DoughnutController, LinearScale, Tooltip,
} from 'chart.js'
import { certificateStatuses } from './certificateStatuses.js'

Chart.register(
  ArcElement, BarController, BarElement, CategoryScale,
  DoughnutController, LinearScale, Tooltip,
)

const sampleDashboard = {
  activities: 12,
  cohortParticipation: [
    { cohortId: 23, activeStudents: 200, activities: 9, participations: 185, uniqueStudents: 110, certificateCounts: { Issued: 62, Generating: 4, Failed: 2, Revoked: 1 } },
    { cohortId: 24, activeStudents: 220, activities: 10, participations: 195, uniqueStudents: 119, certificateCounts: { Issued: 73, Generating: 5, Failed: 3, Revoked: 2 } },
    { cohortId: 25, activeStudents: 180, activities: 7, participations: 140, uniqueStudents: 81, certificateCounts: { Issued: 45, Generating: 3, Failed: 1, Revoked: 1 } },
  ],
}

const numberFormat = new Intl.NumberFormat('vi-VN')
const percentFormat = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 })

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
    ctx.fillStyle = '#172235'
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

  useEffect(() => {
    const chart = new Chart(canvasRef.current, {
      type,
      data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
      plugins: percentages ? [percentageLabels] : [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: percentages ? { padding: { top: 24 } } : undefined,
        plugins: {
          tooltip: {
            callbacks: {
              label: ({ label, raw }) => label + ': ' + formatChartValue(raw, percentages),
            },
          },
        },
        scales: percentages ? {
          x: { ticks: { color: '#475569', font: { size: 14 } } },
          y: {
            min: 0,
            max: 100,
            ticks: { stepSize: 25, color: '#475569', font: { size: 14 }, callback: (value) => value + '%' },
          },
        } : undefined,
      },
    })

    return () => chart.destroy()
  }, [type, labels, values, colors, percentages])

  const summary = labels.map((label, index) => {
    return label + ' ' + formatChartValue(values[index], percentages)
  }).join(', ')

  return (
    <section className="card dashboard-card h-100">
      <div className="card-body p-3 p-md-4">
        <h2 className="h5 mb-3">{title}</h2>
        <div className={type === 'doughnut' ? 'dashboard-chart-with-legend' : undefined}>
          <div className="dashboard-chart">
            <canvas ref={canvasRef} role="img" aria-label={type === 'doughnut' ? title : title + '. ' + summary} />
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
      </div>
    </section>
  )
}

export default function DashboardPage({ cohorts }) {
  const [selectedCohort, setSelectedCohort] = useState('')
  const cohort = cohorts.find(({ cohortId }) => String(cohortId) === selectedCohort)
  const cohortParticipation = sampleDashboard.cohortParticipation.filter(({ cohortId }) => !cohort || cohortId === cohort.cohortId)
  const sum = (field) => cohortParticipation.reduce((total, entry) => total + entry[field], 0)
  const certificateCounts = Object.fromEntries(certificateStatuses.map(({ status }) => [
    status,
    cohortParticipation.reduce((total, entry) => total + entry.certificateCounts[status], 0),
  ]))
  // Một hoạt động có thể có sinh viên từ nhiều khóa.
  const activities = cohort ? (cohortParticipation[0]?.activities ?? 0) : sampleDashboard.activities
  const metrics = [
    ['Sinh viên đang hoạt động', sum('activeStudents')],
    ['Hoạt động', activities],
    ['Lượt tham gia', sum('participations')],
    ['Sinh viên đã tham gia', sum('uniqueStudents'), 'Mỗi sinh viên chỉ tính một lần'],
    ['Chứng nhận hiệu lực', certificateCounts.Issued],
    ['Chứng nhận bị thu hồi', certificateCounts.Revoked],
    ['Lỗi tạo PDF', certificateCounts.Failed],
  ]

  return (
    <>
      <h1 className="page-title mb-2">Tổng quan</h1>
      <p className="text-body-secondary mb-3">
        Dữ liệu mẫu từ 01/09/2026 đến 30/11/2026 · Tất cả hoạt động · {cohort ? cohort.cohortCode : 'Tất cả khóa'}
      </p>

      <div className="row mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <label className="form-label" htmlFor="dashboard-cohort">Khóa tuyển sinh</label>
          <select
            id="dashboard-cohort"
            className="form-select"
            value={selectedCohort}
            onChange={(event) => setSelectedCohort(event.target.value)}
          >
            <option value="">Tất cả khóa</option>
            {cohorts.map(({ cohortId, cohortCode }) => (
              <option key={cohortId} value={cohortId}>{cohortCode}</option>
            ))}
          </select>
        </div>
      </div>

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
              title="Tỷ lệ tham gia theo khóa"
              type="bar"
              labels={cohortParticipation.map(({ cohortId }) => cohorts.find((item) => item.cohortId === cohortId)?.cohortCode ?? String(cohortId))}
              values={cohortParticipation.map((cohort) => cohort.uniqueStudents / cohort.activeStudents * 100)}
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
