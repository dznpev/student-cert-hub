import { useState } from 'react'
import AccountMenu from './AccountMenu.jsx'
import NotificationsPage from './NotificationsPage.jsx'
import StudentRecords from './StudentRecords.jsx'
import StudentLogin from './StudentLogin.jsx'
import hutechLogo from './assets/hutech-logo.png'

const studentPages = [
  ['profile', 'Hồ sơ'],
  ['participations', 'Lượt tham gia'],
  ['certificates', 'Chứng nhận'],
]

export default function StudentPortal({ students, cohorts, activities, participations, certificates, notifications,
  onReadNotification, onManagementSignIn, onActivateDemoStudent, adminPreviewAvailable }) {
  const [studentId, setStudentId] = useState('')
  const [showPreviewPicker, setShowPreviewPicker] = useState(false)
  const [panel, setPanel] = useState('')
  const [page, setPage] = useState('profile')
  const student = students.find((item) => String(item.studentId) === studentId)
  const cohort = cohorts.find((item) => item.cohortId === student?.cohortId)
  const inbox = notifications.filter((item) => item.studentId === student?.studentId)
  const unread = inbox.filter((item) => !item.isRead).length

  function selectStudent(id) {
    setStudentId(id)
    setPanel('')
    setPage('profile')
  }

  function showPage(nextPage) {
    setPage(nextPage)
    setPanel('')
  }

  function signOut() {
    selectStudent('')
    setShowPreviewPicker(false)
  }

  if (!student && !showPreviewPicker) {
    return <StudentLogin students={students} onSignIn={selectStudent} onManagementSignIn={onManagementSignIn}
      onActivateDemoStudent={onActivateDemoStudent} adminPreviewAvailable={adminPreviewAvailable}
      onPreview={() => setShowPreviewPicker(true)} />
  }

  return (
    <div className="student-portal min-vh-100 bg-body-tertiary">
      <header className="border-bottom bg-white">
        <div className="container position-relative d-flex flex-wrap align-items-center justify-content-between gap-2 py-3"
          onKeyDown={(event) => {
            if (event.key !== 'Escape' || !panel) return
            const trigger = event.currentTarget.querySelector('button[aria-expanded="true"]')
            setPanel('')
            trigger?.focus()
          }}>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <img src={hutechLogo} alt="HUTECH" className="student-portal-logo" />
            <span className="fw-semibold">Cổng sinh viên</span>
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
                onProfile={() => showPage('profile')} onAccount={() => showPage('account')}
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
      <main className="container py-4" onClick={() => panel && setPanel('')}>
        <div className="d-flex flex-wrap align-items-end gap-3 mb-4">
          {!student && showPreviewPicker && <div>
            <label className="form-label" htmlFor="notification-student">Hồ sơ xem thử</label>
            <select className="form-select" id="notification-student" value={studentId}
              onChange={(event) => selectStudent(event.target.value)}>
              <option value="">Chọn sinh viên</option>
              {students.map((item) => (
                <option key={item.studentId} value={item.studentId}>{item.studentCode} · {item.fullName}</option>
              ))}
            </select>
          </div>}
          {!student && (
            <button type="button" className="btn btn-outline-primary"
              onClick={() => setShowPreviewPicker(false)}>
              Về đăng nhập
            </button>
          )}
          {adminPreviewAvailable && <a href="#admin" className="btn btn-outline-secondary">Quay lại quản trị</a>}
        </div>
        {student && (
          <nav className="d-flex flex-wrap gap-2 mb-3" aria-label="Khu vực cá nhân">
            {studentPages.map(([id, label]) => (
              <button key={id} type="button" className={'btn ' + (page === id ? 'btn-primary' : 'btn-outline-primary')}
                aria-current={page === id ? 'page' : undefined} onClick={() => showPage(id)}>
                {label}
              </button>
            ))}
          </nav>
        )}
        {student && (page === 'participations' || page === 'certificates') && (
          <StudentRecords page={page} studentId={student.studentId} activities={activities}
            participations={participations} certificates={certificates} />
        )}
        {student && (page === 'profile' || page === 'account') && (
          <section className="card rounded-4">
            <div className="card-body p-4">
              <h1 className="page-title mb-3">{page === 'profile' ? 'Hồ sơ' : 'Tài khoản'}</h1>
              <dl className="mb-0">
                <dt>MSSV</dt><dd>{student.studentCode}</dd>
                {page === 'profile' ? (
                  <><dt>Họ và tên</dt><dd>{student.fullName}</dd><dt>Khóa</dt><dd>{cohort?.cohortCode ?? '—'}</dd></>
                ) : (
                  <><dt>Email</dt><dd>{student.email || 'Chưa có'}</dd><dt>Phiên</dt><dd>Xem thử</dd></>
                )}
              </dl>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
