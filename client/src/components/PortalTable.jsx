export default function PortalTable({ label, minWidth, stickyActions = false, children }) {
  return (
    <div className="admin-table-scroll" role="region" aria-label={label} tabIndex={0}>
      <table
        className={'portal-table' + (stickyActions ? ' portal-table--sticky-actions' : '')}
        style={minWidth ? { minWidth } : undefined}
      >
        {children}
      </table>
    </div>
  )
}
