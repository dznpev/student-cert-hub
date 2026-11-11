import { useRef, useState } from 'react'
import AccountMenu from './AccountMenu.jsx'
import NotificationsPage from './NotificationsPage.jsx'
import PortalSidebar from './PortalSidebar.jsx'
import StudentOverview from './StudentOverview.jsx'
import StudentRecords from './StudentRecords.jsx'
import StudentLogin from './StudentLogin.jsx'
import StudentProfileForm from './StudentProfileForm.jsx'
import PasswordChangeForm from './PasswordChangeForm.jsx'
import hutechLogo from './assets/hutech-logo.png'

const studentPages = [
  { id: 'overview', title: 'Tổng quan' },
  { id: 'profile', title: 'Hồ sơ' },
  { id: 'participations', title: 'Lượt tham gia' },
  { id: 'certificates', title: 'Chứng nhận' },
]
const studentAccountPages = [
  { id: 'profile', title: 'Hồ sơ' },
  { id: 'account', title: 'Tài khoản' },
  { id: 'password', title: 'Đổi mật khẩu' },
]

export default function StudentPortal({ students, cohorts, activities, participations, certificates, notifications,
  studentPasswords, onChangePassword, onUpdateEmail, onReadNotification, onManagementSignIn, onActivateDemoStudent, onVerifyDemoActivation, onRequestReset, onResetPassword, adminPreviewAvailable }) {
  const [editingProfile, setEditingProfile] = useState(false)
  const [notice, setNotice] = useState('')
  const [studentId, setStudentId] = useState('')
  const [showPreviewPicker, setShowPreviewPicker] = useState(false)
  const [panel, setPanel] = useState('')
  const [page, setPage] = useState('overview')
  const [signedIn, setSignedIn] = useState(false)
  const [accountSectionOpen, setAccountSectionOpen] = useState(false)
  const mainRef = useRef(null)
  const student = students.find((item) => String(item.studentId) === studentId && !item.accountDisabled)
  const cohort = cohorts.find((item) => item.cohortId === student?.cohortId)
  const inbox = notifications.filter((item) => item.studentId === student?.studentId)
  const unread = inbox.filter((item) => !item.isRead).length
  const studentParticipations = student ? participations.filter((item) => item.studentId === student.studentId) : []
  const participationIds = new Set(studentParticipations.map(({ participationId }) => participationId))
  const studentCertificates = certificates.filter(({ participationId }) => participationIds.has(participationId))

  function selectStudent(id) {
    setEditingProfile(false)
    setNotice('')
    setStudentId(id)
    setPanel('')
    setPage('overview')
    setAccountSectionOpen(false)
  }

  function showPage(nextPage) {
    setEditingProfile(false)
    setNotice('')
    setPage(nextPage)
    setPanel('')
    mainRef.current?.focus()
  }

  function signOut() {
    setSignedIn(false)
    selectStudent('')
    setShowPreviewPicker(false)
  }

  function openAccountPage(nextPage) {
    setAccountSectionOpen(true)
    showPage(nextPage)
  }

  function goHome() {
    setEditingProfile(false)
    setNotice('')
    setAccountSectionOpen(false)
    showPage('overview')
  }

  if (!student && !showPreviewPicker) {
    return <StudentLogin students={students} studentPasswords={studentPasswords}
      onSignIn={(id) => { setSignedIn(true); selectStudent(id) }} onManagementSignIn={onManagementSignIn}
      onActivateDemoStudent={onActivateDemoStudent} onVerifyDemoActivation={onVerifyDemoActivation} adminPreviewAvailable={adminPreviewAvailable}
      onRequestReset={onRequestReset} onResetPassword={onResetPassword}
      onPreview={() => setShowPreviewPicker(true)} />
  }

  return (
    <div className={`student-portal ${student ? 'admin-shell' : 'min-vh-100 bg-body-tertiary'}`}>
      {student && (
        <PortalSidebar navigationId="student-navigation" navigationLabel="Khu vực cá nhân"
          sections={accountSectionOpen ? studentAccountPages : studentPages}
          activeSectionId={page} onSelectSection={showPage} onHome={goHome}>
          {adminPreviewAvailable && <a href="#admin" className="btn btn-sm btn-outline-secondary mt-3 w-100">Quay lại quản trị</a>}
        </PortalSidebar>
      )}
      <header className={student ? 'admin-header position-relative px-3 px-md-4 px-xl-5 py-3' : 'border-bottom bg-body'}>
        <div className={`d-flex flex-wrap align-items-center justify-content-between gap-2 ${student ? 'w-100' : 'container position-relative py-3'}`}
          onKeyDown={(event) => {
            if (event.key !== 'Escape' || !panel) return
            const trigger = event.currentTarget.querySelector('button[aria-expanded="true"]')
            setPanel('')
            trigger?.focus()
          }}>
          <div className="d-flex flex-wrap align-items-center gap-3">
            {!student && <img src={hutechLogo} alt="HUTECH" className="student-portal-logo" />}
            <span className="brand-title">Cổng sinh viên</span>
          </div>
          {student && (
            <div className="d-flex align-items-center gap-2 ms-auto">
              <button type="button" className="btn btn-outline-primary position-relative rounded-circle student-bell"
                aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
                aria-expanded={panel === 'notifications'} aria-controls="student-notifications"
                onClick={() => setPanel(panel === 'notifications' ? '' : 'notifications')}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <path d="M18 8a6 6 0 0 0-12 0v4c0 2-1 3-2 4h16c-1-1-2-2-2-4V8ZM10 20h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {unread > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-danger" aria-hidden="true">{unread}</span>}
              </button>
              <AccountMenu identifier={student.studentCode} open={panel === 'account'}
                onToggle={() => setPanel(panel === 'account' ? '' : 'account')}
                onProfile={() => openAccountPage('profile')} onAccount={() => openAccountPage('account')}
                onSignOut={signOut} />
            </div>
          )}
          <section id="student-notifications" className="student-notifications card shadow"
            inert={panel !== 'notifications'} aria-hidden={panel !== 'notifications'}
            aria-labelledby="student-notification-heading">
            <NotificationsPage notifications={inbox} onReadNotification={onReadNotification} />
          </section>
        </div>
      </header>
      <main ref={mainRef} id={student ? 'student-main-content' : undefined} tabIndex={student ? -1 : undefined}
        className={student ? 'p-3 p-md-4 p-xl-5' : 'container py-4'} onClick={() => panel && setPanel('')}>
        {!student && (
          <div className="d-flex flex-wrap align-items-end gap-3 mb-4">
            <div>
              <label className="form-label" htmlFor="notification-student">Hồ sơ xem thử</label>
              <select className="form-select" id="notification-student" value={studentId}
                onChange={(event) => selectStudent(event.target.value)}>
                <option value="">Chọn sinh viên</option>
                {students.filter(({ accountDisabled }) => !accountDisabled).map((item) => (
                  <option key={item.studentId} value={item.studentId}>{item.studentCode} · {item.fullName}</option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-outline-primary" onClick={() => setShowPreviewPicker(false)}>
              Về đăng nhập
            </button>
            {adminPreviewAvailable && <a href="#admin" className="btn btn-outline-secondary">Quay lại quản trị</a>}
          </div>
        )}
        {student && page === 'overview' && (
          <StudentOverview student={student} participations={studentParticipations} certificates={studentCertificates} />
        )}
        {student && (page === 'participations' || page === 'certificates') && (
          <StudentRecords page={page} activities={activities}
            participations={studentParticipations} certificates={studentCertificates} />
        )}
        {student && (page === 'profile' || page === 'account') && (
          <section className="card rounded-4">
            <div className="card-body p-4">
              <h1 className="page-title mb-3">{page === 'profile' ? 'Hồ sơ' : 'Tài khoản'}</h1>
              {notice && <p className="alert alert-success" role="status">{notice}</p>}
              {editingProfile && signedIn && page === 'profile' ? (
                <StudentProfileForm key={student.studentId} student={student} cohorts={cohorts} emailOnly
                  onCancel={() => setEditingProfile(false)} onSave={(values) => {
                    const errors = onUpdateEmail(student.studentId, values.email)
                    if (!Object.keys(errors).length) { setEditingProfile(false); setNotice('Đã lưu email hồ sơ trong phiên mẫu.') }
                    return errors
                  }} />
              ) : <>
              <dl className="mb-0">
                <dt>MSSV</dt><dd>{student.studentCode}</dd>
                {page === 'profile' ? (
                  <><dt>Họ và tên</dt><dd>{student.fullName}</dd><dt>Khóa</dt><dd>{cohort?.cohortCode ?? '—'}</dd><dt>Lớp</dt><dd>{student.className || 'Chưa có'}</dd><dt>Email</dt><dd className="text-break">{student.email || 'Chưa có'}</dd></>
                ) : (
                  <><dt>Email</dt><dd>{student.email || 'Chưa có'}</dd><dt>Phiên</dt><dd>Xem thử</dd></>
                )}
              </dl>
              {page === 'profile' && (signedIn ? <button type="button" className="btn btn-primary mt-3"
                onClick={() => { setNotice(''); setEditingProfile(true) }}>Sửa email</button>
                : <p className="small text-body-secondary mt-3 mb-0">Đăng nhập bằng MSSV để sửa email của bạn.</p>)}
              </>}
            </div>
          </section>
        )}
        {student && page === 'password' && (
          <section className="card rounded-4">
            <div className="card-body p-3 p-md-4">
              <h1 className="page-title mb-3">Đổi mật khẩu</h1>
              {signedIn ? (
                <PasswordChangeForm key={student.studentId}
                  onChangePassword={(currentPassword, newPassword) => onChangePassword(student.studentId, currentPassword, newPassword)} />
              ) : <p className="text-body-secondary mb-0">Đăng nhập bằng MSSV để đổi mật khẩu mẫu.</p>}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
