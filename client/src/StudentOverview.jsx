import PortalIcon from './PortalIcon.jsx'
import PortalMetricCard from './components/PortalMetricCard.jsx'

export default function StudentOverview({ student, participations, certificates }) {
  const metrics = [
    ['Lượt tham gia', participations.length, 'participations'],
    ['Lượt chờ duyệt', participations.filter(({ approvalStatus }) => approvalStatus === 'Pending').length, 'pending', 'warn'],
    ['Chứng nhận còn hiệu lực', certificates.filter(({ status }) => status === 'Issued').length, 'certificates', 'success'],
  ]

  return (
    <section aria-labelledby="student-overview-title">
      <h1 id="student-overview-title" className="page-title mb-2">Tổng quan cá nhân</h1>
      <p className="text-body-secondary mb-3">{student.fullName} · {student.studentCode} · Dữ liệu xem thử</p>
      <div className="row g-3">
        {metrics.map(([label, value, icon, tone]) => (
          <div className="col-12 col-md-4" key={label}>
            <PortalMetricCard label={label} value={value} icon={<PortalIcon name={icon} />} tone={tone} />
          </div>
        ))}
      </div>
    </section>
  )
}
