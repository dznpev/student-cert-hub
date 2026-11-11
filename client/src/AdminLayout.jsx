import { useState } from 'react'
import hutechLogo from './assets/hutech-logo.png'

export default function AdminLayout({
  sections,
  activeSectionId,
  onSelectSection,
  roleLabel,
  onDemoSignOut,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  function selectSection(sectionId) {
    onSelectSection(sectionId)
    setMenuOpen(false)
    document.getElementById('main-content').focus()
  }

  return (
    <div className="admin-shell">
      <div className="admin-sidebar">
        <div className="admin-sidebar-top px-3 py-3">
          <img className="brand-logo" src={hutechLogo} alt="HUTECH" width="927" height="234" />
          <button
            type="button"
            className="btn btn-sm btn-outline-primary admin-menu-toggle d-lg-none"
            aria-controls="admin-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
          >
            Menu
          </button>
        </div>
        <nav
          id="admin-navigation"
          className={`admin-navigation px-3 pb-3 d-lg-block ${menuOpen ? 'd-block' : 'd-none'}`}
          aria-label="Điều hướng quản trị"
        >
          <ul className="nav nav-pills flex-column gap-1">
            {sections.map(({ id, title }) => (
              <li className="nav-item" key={id}>
                <button
                  type="button"
                  className={`nav-link w-100 text-start ${id === activeSectionId ? 'active' : ''}`}
                  aria-current={id === activeSectionId ? 'page' : undefined}
                  onClick={() => selectSection(id)}
                >
                  {title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <header className="admin-header px-3 px-md-4 px-xl-5 py-3">
        <div className="brand-title">Quản lý chứng nhận sinh viên</div>
        <div className="d-flex align-items-center flex-wrap gap-2">
          <span className="brand-role">{roleLabel}</span>
          {onDemoSignOut && <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onDemoSignOut}>Đăng xuất</button>}
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="p-3 p-md-4 p-xl-5">
        {children}
      </main>
    </div>
  )
}
