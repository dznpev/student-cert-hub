// The <dl> keeps the label -> value association for assistive technology, so
// the DOM runs label, value, note; the tile's visual order (number, label,
// note) comes from the `order` rule on .portal-metric__value in components.css.
export default function PortalMetricCard({ label, value, note, icon, tone = 'default' }) {
  return (
    <dl className={`portal-metric portal-metric--${tone}`}>
      {icon && <span className="portal-metric__icon">{icon}</span>}
      <div className="portal-metric__text">
        <dt className="portal-metric__label">{label}</dt>
        <dd className="portal-metric__value">{value}</dd>
        {note && <dd className="portal-metric__note">{note}</dd>}
      </div>
    </dl>
  )
}
