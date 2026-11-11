import { useState } from 'react'
import hutechLogo from './assets/hutech-logo.png'

export default function PortalSidebar({ navigationId, navigationLabel, sections, activeSectionId, onSelectSection, onHome, children }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-top px-3 py-3">
        {onHome ? (
          <button type="button" className="border-0 bg-transparent p-0" aria-label="HUTECH — Về trang chủ"
            onClick={() => { setMenuOpen(false); onHome() }}>
            <img className="brand-logo" src={hutechLogo} alt="HUTECH" width="927" height="234" />
          </button>
        ) : <img className="brand-logo" src={hutechLogo} alt="HUTECH" width="927" height="234" />}
        <button type="button" className="btn btn-sm btn-outline-primary admin-menu-toggle d-lg-none"
          aria-controls={navigationId} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          Menu
        </button>
      </div>
      <nav id={navigationId} aria-label={navigationLabel}
        className={`admin-navigation px-3 pb-3 d-lg-block ${menuOpen ? 'd-block' : 'd-none'}`}>
        <ul className="nav nav-pills flex-column gap-1">
          {sections.map(({ id, title }) => (
            <li className="nav-item" key={id}>
              <button type="button" className={`nav-link w-100 text-start ${id === activeSectionId ? 'active' : ''}`}
                aria-current={id === activeSectionId ? 'page' : undefined}
                onClick={() => { setMenuOpen(false); onSelectSection(id) }}>
                {title}
              </button>
            </li>
          ))}
        </ul>
        {children}
      </nav>
    </div>
  )
}
