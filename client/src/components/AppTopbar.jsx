export default function AppTopbar({ title, context, search, onSearchChange, searchPlaceholder, children }) {
  const hasSearch = search !== null && search !== undefined

  return (
    <header className="portal-topbar">
      <div className="portal-topbar__heading">
        <span className="portal-topbar__title">{title}</span>
        {context && <span className="portal-topbar__context">{context}</span>}
      </div>
      {hasSearch && (
        <div className="portal-topbar__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
            strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input id="portal-search" type="search" className="portal-search__input" aria-label={searchPlaceholder}
            placeholder={searchPlaceholder} value={search}
            onChange={(event) => onSearchChange?.(event.target.value)} />
        </div>
      )}
      <div className="portal-topbar__actions">{children}</div>
    </header>
  )
}
