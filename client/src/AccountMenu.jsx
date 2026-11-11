import { useContext } from 'react'
import { ThemeContext } from './themeContext.js'

export default function AccountMenu({ identifier, open, onToggle, onProfile, onAccount, onSignOut }) {
  const { theme, toggleTheme } = useContext(ThemeContext)
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
        <button type="button" className="dropdown-item d-flex align-items-center gap-2"
          onClick={toggleTheme} aria-label={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}>
          <span className="theme-icon" aria-hidden="true">
            <svg className={'theme-icon-sun' + (theme === 'light' ? ' is-visible' : '')}
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" strokeLinecap="round" />
            </svg>
            <svg className={'theme-icon-moon' + (theme === 'dark' ? ' is-visible' : '')}
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" strokeLinejoin="round" />
            </svg>
          </span>
          {theme === 'light' ? 'Chế độ sáng' : 'Chế độ tối'}
        </button>
        <hr className="dropdown-divider" />
        <button type="button" className="dropdown-item" onClick={onSignOut}>Đăng xuất</button>
      </div>
    </div>
  )
}
