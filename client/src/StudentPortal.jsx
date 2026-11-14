import { useEffect, useRef, useState } from 'react'
import AppShell from './components/AppShell.jsx'
import NotificationsPage from './NotificationsPage.jsx'
import PortalIcon from './PortalIcon.jsx'
import PortalPageHeader from './components/PortalPageHeader.jsx'
import PortalPanel from './components/PortalPanel.jsx'
import StudentLogin from './StudentLogin.jsx'
import StudentOverview from './StudentOverview.jsx'
import StudentProfileForm from './StudentProfileForm.jsx'
import StudentRecords from './StudentRecords.jsx'

// §6.9.1: the student shell has one ungrouped list of four sections. The ids
// must not reuse AppShell's account ids ('profile', 'account', 'password'):
// selecting one of those opens the account panel instead of the section and
// marks two nav items aria-current="page" (R125).
const studentPages = [
  { id: 'overview', title: 'Tổng quan', icon: <PortalIcon name="overview" /> },
  { id: 'student-profile', title: 'Hồ sơ', icon: <PortalIcon name="profile" /> },
  { id: 'participations', title: 'Lượt tham gia', icon: <PortalIcon name="participations" /> },
  { id: 'certificates', title: 'Chứng nhận', icon: <PortalIcon name="certificates" /> },
]
const studentSections = [{ group: null, items: studentPages }]

export default function StudentPortal({ students, cohorts, activities, participations, certificates, notifications,
  studentPasswords, onChangePassword, onUpdateEmail, onReadNotification, onManagementSignIn, onActivateDemoStudent, onVerifyDemoActivation, onRequestReset, onResetPassword, adminPreviewAvailable }) {
  const [editingProfile, setEditingProfile] = useState(false)
  const [notice, setNotice] = useState('')
  const [studentId, setStudentId] = useState('')
  const [showPreviewPicker, setShowPreviewPicker] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [page, setPage] = useState('overview')
  const [signedIn, setSignedIn] = useState(false)
  const bellRef = useRef(null)
  const student = students.find((item) => String(item.studentId) === studentId && !item.accountDisabled)
  const cohort = cohorts.find((item) => item.cohortId === student?.cohortId)
  const inbox = notifications.filter((item) => item.studentId === student?.studentId)
  const unread = inbox.filter((item) => !item.isRead).length
  const studentParticipations = student ? participations.filter((item) => item.studentId === student.studentId) : []
  const participationIds = new Set(studentParticipations.map(({ participationId }) => participationId))
  const studentCertificates = certificates.filter(({ participationId }) => participationIds.has(participationId))
  const activePage = studentPages.find(({ id }) => id === page)

  // The legacy student topbar kept one panel open at a time; a pointer outside
  // the bell now closes the notification list the same way AccountMenu closes.
  useEffect(() => {
    if (!notificationsOpen) return undefined
    const closeOnOutsidePointer = (event) => {
      if (bellRef.current?.contains(event.target)) return
      setNotificationsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [notificationsOpen])

  function selectStudent(id) {
    setEditingProfile(false)
    setNotice('')
    setStudentId(id)
    setNotificationsOpen(false)
    setPage('overview')
  }

  function showPage(nextPage) {
    setEditingProfile(false)
    setNotice('')
    setPage(nextPage)
    setNotificationsOpen(false)
  }

  function signOut() {
    setSignedIn(false)
    selectStudent('')
    setShowPreviewPicker(false)
  }

  function goHome() {
    setEditingProfile(false)
    setNotice('')
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
    <AppShell
      sections={student ? studentSections : []}
      activeSectionId={student ? page : undefined}
      onSelectSection={showPage}
      onHome={goHome}
      roleLabel={student ? 'Sinh viên' : 'Khách xem thử'}
      context={student ? activePage?.title : 'Chọn hồ sơ xem thử'}
      accountIdentifier={student?.studentCode ?? 'Khách'}
      onSignOut={signOut}
      onChangePassword={student && signedIn
        ? (currentPassword, newPassword) => onChangePassword(student.studentId, currentPassword, newPassword)
        : null}
      changePasswordNote="Đăng nhập bằng MSSV để đổi mật khẩu mẫu."
      topbarActions={student && (
        <div className="d-flex align-items-center gap-2"
          onKeyDown={(event) => {
            if (event.key !== 'Escape' || !notificationsOpen) return
            setNotificationsOpen(false)
            bellRef.current?.querySelector('button')?.focus()
          }}>
          {adminPreviewAvailable && (
            <a href="#admin" className="btn btn-sm btn-outline-secondary">Quay lại quản trị</a>
          )}
          <div className="portal-bell__wrap" ref={bellRef}>
            <button type="button" className="portal-bell"
              aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
              aria-expanded={notificationsOpen} aria-controls="student-notifications"
              onClick={() => setNotificationsOpen((open) => !open)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0v4c0 2-1 3-2 4h16c-1-1-2-2-2-4V8ZM10 20h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {unread > 0 && <span className="portal-bell__badge" aria-hidden="true">{unread}</span>}
            </button>
            <section id="student-notifications" className="portal-notifications"
              inert={!notificationsOpen} aria-hidden={!notificationsOpen}
              aria-labelledby="student-notification-heading">
              <NotificationsPage notifications={inbox} onReadNotification={onReadNotification} />
            </section>
          </div>
        </div>
      )}
    >
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
      {student && page === 'student-profile' && (
        <>
          <PortalPageHeader title="Hồ sơ" />
          <PortalPanel className="portal-panel--padded">
            {notice && <p className="alert alert-success" role="status">{notice}</p>}
            {editingProfile && signedIn ? (
              <StudentProfileForm key={student.studentId} student={student} cohorts={cohorts} emailOnly
                onCancel={() => setEditingProfile(false)} onSave={(values) => {
                  const errors = onUpdateEmail(student.studentId, values.email)
                  if (!Object.keys(errors).length) { setEditingProfile(false); setNotice('Đã lưu email hồ sơ trong phiên mẫu.') }
                  return errors
                }} />
            ) : <>
              <dl className="mb-0">
                <dt>MSSV</dt><dd>{student.studentCode}</dd>
                <dt>Họ và tên</dt><dd>{student.fullName}</dd>
                <dt>Khóa</dt><dd>{cohort?.cohortCode ?? '—'}</dd>
                <dt>Lớp</dt><dd>{student.className || 'Chưa có'}</dd>
                <dt>Email</dt><dd className="text-break">{student.email || 'Chưa có'}</dd>
              </dl>
              {signedIn ? <button type="button" className="btn btn-primary mt-3"
                onClick={() => { setNotice(''); setEditingProfile(true) }}>Sửa email</button>
                : <p className="small text-body-secondary mt-3 mb-0">Đăng nhập bằng MSSV để sửa email của bạn.</p>}
            </>}
          </PortalPanel>
        </>
      )}
    </AppShell>
  )
}
