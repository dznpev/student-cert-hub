import PortalIcon from './PortalIcon.jsx'
import PortalMetricCard from './components/PortalMetricCard.jsx'
import PortalPageHeader from './components/PortalPageHeader.jsx'

export default function StudentOverview({ student, participations, certificates }) {
  const metrics = [
    ['Lượt tham gia', participations.length, 'participations'],
    ['Lượt chờ duyệt', participations.filter(({ approvalStatus }) => approvalStatus === 'Pending').length, 'pending', 'warn'],
    ['Chứng nhận còn hiệu lực', certificates.filter(({ status }) => status === 'Issued').length, 'certificates', 'success'],
  ]

  return (
    <>
      <PortalPageHeader title="Tổng quan cá nhân"
        description={`${student.fullName} · ${student.studentCode} · Dữ liệu xem thử`} />
      <div className="portal-metric-grid portal-metric-grid--three">
        {metrics.map(([label, value, icon, tone]) => (
          <PortalMetricCard key={label} label={label} value={value} icon={<PortalIcon name={icon} />} tone={tone} />
        ))}
      </div>
    </>
  )
}
