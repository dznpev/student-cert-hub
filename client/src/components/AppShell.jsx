import { useState } from 'react'
import AccountMenu from './AccountMenu.jsx'
import AppSidebar from './AppSidebar.jsx'
import AppTopbar from './AppTopbar.jsx'
import PortalFooter from './PortalFooter.jsx'
import PortalPanel from './PortalPanel.jsx'
import PortalIcon from '../PortalIcon.jsx'
import PasswordChangeForm from '../PasswordChangeForm.jsx'

const BACK_TO_SECTIONS = 'back-to-sections'
const ACCOUNT_PAGE_IDS = ['profile', 'account', 'password']
const ACCOUNT_TITLES = { profile: 'Hồ sơ', account: 'Tài khoản', password: 'Đổi mật khẩu' }

// §6.9.1: the account sub-navigation lives in its own sidebar group instead of
// replacing the whole navigation, so the user keeps a way back to every section.
function createAccountGroup() {
  return {
    group: 'Tài khoản',
    items: [
      { id: 'profile', title: 'Hồ sơ', icon: <PortalIcon name="profile" /> },
      { id: 'account', title: 'Tài khoản', icon: <PortalIcon name="account" /> },
      { id: 'password', title: 'Đổi mật khẩu', icon: <PortalIcon name="password" /> },
      { id: BACK_TO_SECTIONS, title: 'Quay lại', icon: <PortalIcon name="back-to-super-admin" /> },
    ],
  }
}

function focusMain() {
  document.getElementById('portal-main')?.focus()
}

export default function AppShell({
  sections,
  activeSectionId,
  onSelectSection,
  roleLabel,
  accountIdentifier,
  onSignOut,
  onHome,
  search = null,
  onSearchChange,
  searchPlaceholder,
  onChangePassword,
  context,
  children,
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountPage, setAccountPage] = useState('')

  const showAccountPage = (page) => {
    setAccountPage(page)
    setAccountMenuOpen(false)
    focusMain()
  }

  const selectSection = (sectionId) => {
    setAccountMenuOpen(false)
    if (accountPage && ACCOUNT_PAGE_IDS.includes(sectionId)) {
      showAccountPage(sectionId)
      return
    }
    if (sectionId === BACK_TO_SECTIONS) {
      showAccountPage('')
      return
    }
    setAccountPage('')
    onSelectSection?.(sectionId)
    focusMain()
  }

  return (
    <div className="portal-shell">
      <AppSidebar
        navigationId="portal-navigation"
        navigationLabel="Điều hướng chính"
        sections={accountPage ? [...sections, createAccountGroup()] : sections}
        activeSectionId={accountPage || activeSectionId}
        onSelectSection={selectSection}
        onHome={() => {
          setAccountPage('')
          setAccountMenuOpen(false)
          focusMain()
          onHome?.()
        }}
      />

      <AppTopbar
        title="Quản lý chứng nhận sinh viên"
        context={accountPage ? ACCOUNT_TITLES[accountPage] : (context || roleLabel)}
        search={accountPage ? null : search}
        onSearchChange={accountPage ? null : onSearchChange}
        searchPlaceholder={accountPage ? null : searchPlaceholder}
      >
        <span className="portal-topbar__role">{roleLabel}</span>
        <AccountMenu
          identifier={accountIdentifier}
          open={accountMenuOpen}
          onToggle={() => setAccountMenuOpen((open) => !open)}
          onProfile={() => showAccountPage('profile')}
          onAccount={() => showAccountPage('account')}
          onSignOut={onSignOut}
        />
      </AppTopbar>

      <main id="portal-main" tabIndex={-1} className="portal-main">
        <div hidden={Boolean(accountPage)}>{children}</div>
        {accountPage && (
          <PortalPanel title={ACCOUNT_TITLES[accountPage]}>
            <div className="portal-account-page">
              {accountPage === 'password' ? (
                onChangePassword
                  ? <PasswordChangeForm onChangePassword={onChangePassword} />
                  : <p className="portal-account-page__note">Đăng nhập bằng tài khoản quản trị mẫu để đổi mật khẩu.</p>
              ) : (
                <>
                  <dl className="portal-account-page__list">
                    <dt>Tên đăng nhập</dt><dd>{accountIdentifier}</dd>
                    <dt>Vai trò</dt><dd>{roleLabel}</dd>
                  </dl>
                  {accountPage === 'account' && (
                    <p className="portal-account-page__note">Tài khoản mẫu của Student Cert Hub.</p>
                  )}
                </>
              )}
            </div>
          </PortalPanel>
        )}
      </main>
      <PortalFooter />
    </div>
  )
}
