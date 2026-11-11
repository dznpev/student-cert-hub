import { useEffect, useRef } from 'react'
import {
  ArcElement, BarController, BarElement, CategoryScale, Chart,
  DoughnutController, LinearScale, Tooltip,
} from 'chart.js'

Chart.register(
  ArcElement, BarController, BarElement, CategoryScale,
  DoughnutController, LinearScale, Tooltip,
)

const sampleDashboard = {
  activeStudents: 600,
  activities: 12,
  participations: 520,
  uniqueStudents: 310,
  certificateCounts: { Issued: 180, Generating: 12, Failed: 6, Revoked: 4 },
  cohortParticipation: [
    { cohortCode: 'K22', activeStudents: 180, uniqueStudents: 81 },
    { cohortCode: 'K23', activeStudents: 200, uniqueStudents: 110 },
    { cohortCode: 'K24', activeStudents: 220, uniqueStudents: 119 },
  ],
}

const certificateStatuses = [
  { status: 'Issued', label: 'Đang hiệu lực', color: '#2f5fc4' },
  { status: 'Generating', label: 'Đang tạo', color: '#946700' },
  { status: 'Failed', label: 'Tạo lỗi', color: '#b54149' },
  { status: 'Revoked', label: 'Đã thu hồi', color: '#68768a' },
]

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

export default function DashboardPage() {
  const { activeStudents, activities, participations, uniqueStudents, certificateCounts, cohortParticipation } = sampleDashboard
  const metrics = [
    ['Sinh viên đang hoạt động', activeStudents],
    ['Hoạt động', activities],
    ['Lượt tham gia', participations],
    ['Sinh viên đã tham gia', uniqueStudents, 'Mỗi sinh viên chỉ tính một lần'],
    ['Chứng nhận hiệu lực', certificateCounts.Issued],
    ['Chứng nhận bị thu hồi', certificateCounts.Revoked],
    ['Lỗi tạo PDF', certificateCounts.Failed],
  ]

  return (
    <>
      <h1 className="page-title mb-2">Tổng quan</h1>
      <p className="text-body-secondary mb-4">Dữ liệu mẫu từ 01/09/2026 đến 30/11/2026 · Tất cả hoạt động và khóa</p>

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

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <DashboardChart
            title="Tỷ lệ tham gia theo khóa"
            type="bar"
            labels={cohortParticipation.map(({ cohortCode }) => cohortCode)}
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
    </>
  )
}
