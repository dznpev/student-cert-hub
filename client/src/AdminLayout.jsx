import { useState } from 'react'
import AccountMenu from './AccountMenu.jsx'
import hutechLogo from './assets/hutech-logo.png'

export default function AdminLayout({
  sections,
  activeSectionId,
  onSelectSection,
  roleLabel,
  accountIdentifier,
  onDemoSignOut,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountPage, setAccountPage] = useState('')

  function selectSection(sectionId) {
    onSelectSection?.(sectionId)
    setMenuOpen(false)
    setAccountMenuOpen(false)
    setAccountPage('')
    document.getElementById('main-content').focus()
  }

  function showAccountPage(page) {
    setAccountPage(page)
    setAccountMenuOpen(false)
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
        <div className="d-flex align-items-center flex-wrap gap-2"
          onKeyDown={(event) => {
            if (event.key !== 'Escape' || !accountMenuOpen) return
            const trigger = event.currentTarget.querySelector('button[aria-expanded="true"]')
            setAccountMenuOpen(false)
            trigger?.focus()
          }}>
          <span className="brand-role">{roleLabel}</span>
          <AccountMenu identifier={accountIdentifier} open={accountMenuOpen}
            onToggle={() => setAccountMenuOpen((open) => !open)}
            onProfile={() => showAccountPage('profile')} onAccount={() => showAccountPage('account')}
            onSignOut={onDemoSignOut} />
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="p-3 p-md-4 p-xl-5"
        onClick={() => accountMenuOpen && setAccountMenuOpen(false)}>
        <div hidden={Boolean(accountPage)}>{children}</div>
        {accountPage && (
          <section className="card content-card rounded-4">
            <div className="card-body p-3 p-md-4">
              <h1 className="page-title mb-3">{accountPage === 'profile' ? 'Hồ sơ' : 'Tài khoản'}</h1>
              <dl>
                <dt>Tên đăng nhập</dt><dd>{accountIdentifier}</dd>
                <dt>Vai trò</dt><dd>{roleLabel}</dd>
              </dl>
              {accountPage === 'account' && <p className="text-body-secondary">Tài khoản mẫu của Student Cert Hub.</p>}
              <button type="button" className="btn btn-outline-secondary" onClick={() => showAccountPage('')}>Quay lại</button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
