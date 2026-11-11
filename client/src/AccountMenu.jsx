export default function AccountMenu({ identifier, open, onToggle, onProfile, onAccount, onSignOut }) {
  return (
    <div className="position-relative">
      <button type="button" className="btn btn-outline-primary d-flex align-items-center gap-2"
        onClick={onToggle} aria-expanded={open} aria-controls="portal-account-menu"
        aria-label={'Menu tài khoản ' + identifier}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm0 2a10 10 0 0 1 8 16 9 9 0 0 0-16 0A10 10 0 0 1 12 2Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
        </svg>
        {identifier}<span className="dropdown-toggle" aria-hidden="true" />
      </button>
      <div id="portal-account-menu" className={'dropdown-menu end-0 shadow-sm' + (open ? ' show' : '')}
        inert={!open} aria-hidden={!open}>
        <button type="button" className="dropdown-item" onClick={onProfile}>Hồ sơ</button>
        <button type="button" className="dropdown-item" onClick={onAccount}>Tài khoản</button>
        <hr className="dropdown-divider" />
        <button type="button" className="dropdown-item" onClick={onSignOut}>Đăng xuất</button>
      </div>
    </div>
  )
}
