export default function PortalPanel({ title, titleId, icon, actions, children, className }) {
  const hasHeader = Boolean(title || actions)
  // R119: a titled panel is a named region. The id lives on the <h2> and the
  // section points at it, so the panel keeps the same name an
  // `aria-labelledby` region had before the conversion. Without a title there
  // is nothing to point at, so the section stays unnamed.
  const labelledBy = title && titleId ? titleId : undefined
  return (
    <section className={'portal-panel' + (className ? ' ' + className : '')}
      aria-labelledby={labelledBy}>
      {hasHeader && (
        <header className="portal-panel__header">
          {icon && <span className="portal-panel__icon" aria-hidden="true">{icon}</span>}
          {title && <h2 id={titleId} className="portal-panel__title">{title}</h2>}
          {actions && <div className="portal-panel__actions">{actions}</div>}
        </header>
      )}
      <div className="portal-panel__body">{children}</div>
    </section>
  )
}
