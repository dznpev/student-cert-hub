export default function PortalTopbar({ title, context, children }) {
  return (
    <header className="admin-header portal-topbar px-3 px-md-4 px-xl-5 py-3">
      <div className="portal-topbar-heading">
        <div className="brand-title">{title}</div>
        {context && <div className="small text-body-secondary">{context}</div>}
      </div>
      {children}
    </header>
  )
}
