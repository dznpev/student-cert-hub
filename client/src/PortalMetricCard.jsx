import PortalIcon from './PortalIcon.jsx'

export default function PortalMetricCard({ label, value, note, icon, tone = 'default' }) {
  return (
    <dl className="card portal-metric-card rounded-4 h-100 mb-0">
      <dt className="portal-metric-label">
        <span className={'portal-metric-icon portal-metric-icon-' + tone}><PortalIcon name={icon} /></span>
        <span>{label}</span>
      </dt>
      <dd className="portal-metric-value">{value}</dd>
      {note && <dd className="small text-body-secondary mb-0">{note}</dd>}
    </dl>
  )
}
