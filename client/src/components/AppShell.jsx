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
const DEFAULT_ACCOUNT_ITEMS = () => [
  { id: 'profile', title: 'Hồ sơ', icon: <PortalIcon name="profile" /> },
  { id: 'account', title: 'Tài khoản', icon: <PortalIcon name="account" /> },
  { id: 'password', title: 'Đổi mật khẩu', icon: <PortalIcon name="password" /> },
]

// §6.9.1: the account sub-navigation lives in its own sidebar group instead of
// replacing the whole navigation, so the user keeps a way back to every section.
// R132: a portal whose own navigation already has "Hồ sơ" can drop the account
// group's copy of it, so two visible items never share a label.
function createAccountGroup(items = DEFAULT_ACCOUNT_ITEMS()) {
  return {
    group: 'Tài khoản',
    items: [
      ...items,
      { id: BACK_TO_SECTIONS, title: 'Quay lại', icon: <PortalIcon name="back-to-super-admin" /> },
    ],
  }
}

// R131: the account panel is exported so its markup can be rendered on its own
// in tests; the shell still decides when it appears (only once the account menu
// opens it). `accountDetails` lets a portal add its own <dt>/<dd> lines (the
// student's Email and preview-session row) without inventing them in the shell.
export function AccountPanel({ page, accountIdentifier, roleLabel, accountDetails, changePasswordNote, onChangePassword }) {
  return (
    <PortalPanel title={ACCOUNT_TITLES[page]}>
      <div className="portal-account-page">
        {page === 'password' ? (
          onChangePassword
            ? <PasswordChangeForm onChangePassword={onChangePassword} />
            : <p className="portal-account-page__note">{changePasswordNote}</p>
        ) : (
          <>
            <dl className="portal-account-page__list">
              <dt>Tên đăng nhập</dt><dd>{accountIdentifier}</dd>
              <dt>Vai trò</dt><dd>{roleLabel}</dd>
              {accountDetails}
            </dl>
            {page === 'account' && (
              <p className="portal-account-page__note">Tài khoản mẫu của Student Cert Hub.</p>
            )}
          </>
        )}
      </div>
    </PortalPanel>
  )
}

function focusMain() {
  document.getElementById('portal-main')?.focus()
}

export default function AppShell({
  title = 'Quản lý chứng nhận sinh viên',
  sections,
  accountSections,
  accountDetails,
  onProfile,
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
  changePasswordNote = 'Đăng nhập bằng tài khoản quản trị mẫu để đổi mật khẩu.',
  context,
  topbarActions,
  children,
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountPage, setAccountPage] = useState('')

  const showAccountPage = (page) => {
    setAccountPage(page)
    setAccountMenuOpen(false)
    focusMain()
  }

  // R134: a portal can point the account menu's "Hồ sơ" at its own profile
  // page. In that case there is no account panel to show, so the shell clears
  // it and hands the navigation back to the portal.
  const openProfile = onProfile
    ? () => {
      setAccountPage('')
      setAccountMenuOpen(false)
      focusMain()
      onProfile()
    }
    : () => showAccountPage('profile')

  const hasSidebar = sections.length > 0

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
    <div className={'portal-shell' + (hasSidebar ? '' : ' portal-shell--no-sidebar')}>
      {hasSidebar && (
        <AppSidebar
          navigationId="portal-navigation"
          navigationLabel="Điều hướng chính"
          sections={accountPage ? [...sections, createAccountGroup(accountSections)] : sections}
          activeSectionId={accountPage || activeSectionId}
          onSelectSection={selectSection}
          onHome={() => {
            setAccountPage('')
            setAccountMenuOpen(false)
            focusMain()
            onHome?.()
          }}
        />
      )}

      <AppTopbar
        title={title}
        context={accountPage ? ACCOUNT_TITLES[accountPage] : (context || roleLabel)}
        search={accountPage ? null : search}
        onSearchChange={accountPage ? null : onSearchChange}
        searchPlaceholder={accountPage ? null : searchPlaceholder}
      >
        {accountIdentifier && <span className="portal-topbar__role">{roleLabel}</span>}
        {topbarActions}
        {accountIdentifier && (
          <AccountMenu
            identifier={accountIdentifier}
            open={accountMenuOpen}
            onToggle={() => setAccountMenuOpen((open) => !open)}
            onProfile={openProfile}
            onAccount={() => showAccountPage('account')}
            onSignOut={onSignOut}
          />
        )}
      </AppTopbar>

      <main id="portal-main" tabIndex={-1} className="portal-main">
        <div hidden={Boolean(accountPage)}>{children}</div>
        {accountPage && (
          <AccountPanel page={accountPage} accountIdentifier={accountIdentifier} roleLabel={roleLabel}
            accountDetails={accountDetails} changePasswordNote={changePasswordNote}
            onChangePassword={onChangePassword} />
        )}
      </main>
      <PortalFooter />
    </div>
  )
}
