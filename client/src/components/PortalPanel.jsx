export default function PortalPanel({ title, titleId, icon, actions, children, className }) {
  const hasHeader = Boolean(title || actions)
  return (
    <section className={'portal-panel' + (className ? ' ' + className : '')}>
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
