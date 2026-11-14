import { useEffect, useRef } from 'react'
import { useTheme } from '../themeContext.js'

export default function AccountMenu({ identifier, open, onToggle, onProfile, onAccount, onSignOut }) {
  const { theme, toggleTheme } = useTheme()
  const wrapRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const closeOnOutsidePointer = (event) => {
      if (wrapRef.current?.contains(event.target)) return
      onToggle()
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open, onToggle])

  const handleKeyDown = (event) => {
    if (event.key !== 'Escape' || !open) return
    onToggle()
    triggerRef.current?.focus()
  }

  return (
    <div ref={wrapRef} className="portal-account-menu__wrap" onKeyDown={handleKeyDown}>
      <button ref={triggerRef} type="button" className="portal-account-menu__trigger"
        onClick={onToggle} aria-expanded={open} aria-controls="portal-account-menu"
        aria-label={'Menu tài khoản ' + identifier}>
        <span className="portal-account-menu__avatar" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm0 2a10 10 0 0 1 8 16 9 9 0 0 0-16 0A10 10 0 0 1 12 2Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
          </svg>
        </span>
        <span className="portal-account-menu__name">{identifier}</span>
        <span className="portal-account-menu__caret" aria-hidden="true" />
      </button>
      <div id="portal-account-menu" className="portal-account-menu" inert={!open} aria-hidden={!open}>
        <button type="button" className="portal-account-menu__item" onClick={onProfile}>Hồ sơ</button>
        <button type="button" className="portal-account-menu__item" onClick={onAccount}>Tài khoản</button>
        <button type="button" className="portal-account-menu__item portal-account-menu__item--theme"
          onClick={toggleTheme} aria-label={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}>
          <span className="portal-account-menu__theme-icon" aria-hidden="true">
            <svg className={'portal-account-menu__sun' + (theme === 'light' ? ' is-visible' : '')}
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" strokeLinecap="round" />
            </svg>
            <svg className={'portal-account-menu__moon' + (theme === 'dark' ? ' is-visible' : '')}
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" strokeLinejoin="round" />
            </svg>
          </span>
          {theme === 'light' ? 'Chế độ sáng' : 'Chế độ tối'}
        </button>
        <hr className="portal-account-menu__divider" />
        <button type="button" className="portal-account-menu__item" onClick={onSignOut}>Đăng xuất</button>
      </div>
    </div>
  )
}
