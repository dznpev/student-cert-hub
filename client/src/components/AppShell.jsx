import { useState } from 'react'
import AccountMenu from './AccountMenu.jsx'
import AppSidebar from './AppSidebar.jsx'
import AppTopbar from './AppTopbar.jsx'
import PortalFooter from './PortalFooter.jsx'
import PasswordChangeForm from '../PasswordChangeForm.jsx'

const BACK_TO_SECTIONS = 'back-to-sections'

// §6.9.1: the account sub-navigation lives in its own sidebar group instead of
// replacing the whole navigation, so the user keeps a way back to every section.
const accountGroup = {
  group: 'Tài khoản',
  items: [{ id: BACK_TO_SECTIONS, title: 'Quay lại' }],
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
  children,
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountPage, setAccountPage] = useState('')

  const showAccountPage = (page) => {
    setAccountPage(page)
    setAccountMenuOpen(false)
  }

  const selectSection = (sectionId) => {
    setAccountPage('')
    setAccountMenuOpen(false)
    if (sectionId === BACK_TO_SECTIONS) return
    onSelectSection?.(sectionId)
  }

  const sidebarSections = accountPage === 'profile' || accountPage === 'account'
    ? [...sections, accountGroup]
    : sections

  return (
    <div className="portal-shell">
      <AppSidebar
        navigationId="portal-navigation"
        navigationLabel="Điều hướng chính"
        sections={sidebarSections}
        activeSectionId={activeSectionId}
        onSelectSection={selectSection}
        onHome={() => {
          setAccountPage('')
          setAccountMenuOpen(false)
          onHome?.()
        }}
      />

      <AppTopbar
        title="Quản lý chứng nhận sinh viên"
        context={roleLabel}
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
      >
        {accountPage === 'password' ? (
          onChangePassword
            ? <PasswordChangeForm onChangePassword={onChangePassword} />
            : <p className="portal-topbar__note">Đăng nhập bằng tài khoản quản trị mẫu để đổi mật khẩu.</p>
        ) : (
          <AccountMenu
            identifier={accountIdentifier}
            open={accountMenuOpen}
            onToggle={() => setAccountMenuOpen((open) => !open)}
            onProfile={() => showAccountPage('profile')}
            onAccount={() => showAccountPage('account')}
            onSignOut={onSignOut}
          />
        )}
      </AppTopbar>

      <main id="portal-main" tabIndex={-1} className="portal-main">{children}</main>
      <PortalFooter />
    </div>
  )
}
