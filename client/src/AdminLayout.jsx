import PortalTopbar from './PortalTopbar.jsx'
import PortalFooter from './PortalFooter.jsx'
import { useState } from 'react'
import AccountMenu from './AccountMenu.jsx'
import PortalSidebar from './PortalSidebar.jsx'
import PasswordChangeForm from './PasswordChangeForm.jsx'

const accountSections = [
  { id: 'profile', title: 'Hồ sơ' },
  { id: 'account', title: 'Tài khoản' },
  { id: 'password', title: 'Đổi mật khẩu' },
]

export default function AdminLayout({
  sections,
  activeSectionId,
  onSelectSection,
  roleLabel,
  accountIdentifier,
  onDemoSignOut,
  onGoHome,
  onChangePassword,
  children,
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountPage, setAccountPage] = useState('')

  function selectSection(sectionId) {
    onSelectSection?.(sectionId)
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
      <PortalSidebar navigationId="admin-navigation" navigationLabel="Điều hướng quản trị"
        sections={accountPage ? accountSections : sections} activeSectionId={accountPage || activeSectionId}
        onSelectSection={accountPage ? showAccountPage : selectSection}
        onHome={() => { setAccountPage(''); setAccountMenuOpen(false); onGoHome(); document.getElementById('main-content').focus() }} />

      <PortalTopbar title="Quản lý chứng nhận sinh viên"
        context={(accountPage ? accountSections : sections).find(({ id }) => id === (accountPage || activeSectionId))?.title}>
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
      </PortalTopbar>

      <main id="main-content" tabIndex={-1} className="p-3 p-md-4 p-xl-5"
        onClick={() => accountMenuOpen && setAccountMenuOpen(false)}>
        <div hidden={Boolean(accountPage)}>{children}</div>
        {accountPage && (
          <section className="card content-card rounded-4">
            <div className="card-body p-3 p-md-4">
              <h1 className="page-title mb-3">{accountSections.find(({ id }) => id === accountPage)?.title}</h1>
              {accountPage === 'password' ? (
                onChangePassword ? <PasswordChangeForm onChangePassword={onChangePassword} />
                  : <p>Đăng nhập bằng tài khoản quản trị mẫu để đổi mật khẩu.</p>
              ) : (
              <dl>
                <dt>Tên đăng nhập</dt><dd>{accountIdentifier}</dd>
                <dt>Vai trò</dt><dd>{roleLabel}</dd>
              </dl>
              )}
              {accountPage === 'account' && <p className="text-body-secondary">Tài khoản mẫu của Student Cert Hub.</p>}
            </div>
          </section>
        )}
      </main>
      <PortalFooter />
    </div>
  )
}
