import { useState } from 'react'
import hutechLogo from './assets/hutech-logo.png'

const demoPassword = 'Demo123!'
const accountTypes = [
  { id: 'student', label: 'Sinh viên' },
  { id: 'management', label: 'Quản trị' },
]
const managementAccounts = {
  admin: { label: 'Admin', username: 'admin' },
  superAdmin: { label: 'Super Admin', username: 'superadmin' },
}

export default function StudentLogin({ students, onSignIn, onManagementSignIn, onPreview }) {
  const [accountType, setAccountType] = useState('')
  const [managementRole, setManagementRole] = useState('')
  const [showCredentials, setShowCredentials] = useState(false)
  const [studentCode, setStudentCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const demoStudents = students.filter((student) => student.userId?.startsWith('demo-'))
  const isManagement = accountType === 'management'
  const managementAccount = managementAccounts[managementRole]
  const canContinue = accountType === 'student' || Boolean(isManagement && managementAccount)
  const identifierLabel = isManagement ? 'Tên đăng nhập' : 'MSSV'

  function continueToLogin(event) {
    event.preventDefault()
    if (canContinue) setShowCredentials(true)
  }

  function goBack() {
    setStudentCode('')
    setPassword('')
    setError('')
    setShowCredentials(false)
  }

  function submit(event) {
    event.preventDefault()
    const code = studentCode.trim()
    if (!code || !password) {
      setError(isManagement ? 'Nhập tên đăng nhập và mật khẩu.' : 'Nhập MSSV và mật khẩu.')
      return
    }
    if (isManagement) {
      if (code !== managementAccount?.username || password !== demoPassword) {
        setError('Tên đăng nhập hoặc mật khẩu mẫu không đúng.')
        return
      }
      onManagementSignIn(managementRole)
      return
    }
    const student = demoStudents.find((item) => item.studentCode === code)
    if (!student || password !== demoPassword) {
      setError('MSSV hoặc mật khẩu mẫu không đúng.')
      return
    }
    onSignIn(String(student.studentId))
  }

  return (
    <main className="student-login-screen">
      <section className="student-login-card card border-0 rounded-4 shadow" aria-labelledby="student-login-title">
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <img src={hutechLogo} className="student-login-logo mb-3" alt="HUTECH" width="927" height="234" />
            <p className="small fw-semibold text-primary mb-1">Student Cert Hub · Bản xem thử</p>
            <h1 id="student-login-title" className="h3 fw-bold mb-2">{showCredentials ? 'Đăng nhập ' + (isManagement ? managementAccount.label : 'sinh viên') : 'Chọn loại tài khoản'}</h1>
            <p className="small text-body-secondary mb-0">
              {showCredentials ? 'Dùng tài khoản mẫu bên dưới.' : 'Chọn loại tài khoản để tiếp tục đăng nhập mẫu.'}
            </p>
          </div>
          {!showCredentials && (
            <form onSubmit={continueToLogin}>
              <fieldset className="mb-3">
                <legend className="fs-6 fw-semibold">Loại tài khoản</legend>
                {accountTypes.map((type) => (
                  <label key={type.id} className="d-flex align-items-center gap-2 border rounded-3 p-2 mb-2">
                    <input type="radio" name="account-type" value={type.id} className="form-check-input m-0"
                      checked={accountType === type.id}
                      onChange={() => { setAccountType(type.id); setManagementRole('') }} />
                    <span>{type.label}</span>
                  </label>
                ))}
              </fieldset>
              {isManagement && (
                <fieldset className="mb-3">
                  <legend className="fs-6 fw-semibold">Vai trò quản trị</legend>
                  {Object.entries(managementAccounts).map(([id, account]) => (
                    <label key={id} className="d-flex align-items-center gap-2 border rounded-3 p-2 mb-2">
                      <input type="radio" name="management-role" value={id} className="form-check-input m-0"
                        checked={managementRole === id} onChange={() => setManagementRole(id)} />
                      <span>{account.label}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              <button type="submit" className="btn btn-primary w-100" disabled={!canContinue}>Đăng nhập</button>
            </form>
          )}
          {showCredentials && <>
            <form onSubmit={submit} noValidate>
              <div className="mb-3">
                <label className="form-label" htmlFor="student-login-code">{identifierLabel}</label>
                <input id="student-login-code" className="form-control" type="text" inputMode={isManagement ? 'text' : 'numeric'}
                  autoComplete="off" required autoFocus value={studentCode}
                  onChange={(event) => { setStudentCode(event.target.value); setError('') }} />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="student-login-password">Mật khẩu</label>
                <input id="student-login-password" className="form-control" type="password"
                  autoComplete="off" required value={password}
                  onChange={(event) => { setPassword(event.target.value); setError('') }} />
              </div>
              {error && <p className="alert alert-danger py-2" role="alert">{error}</p>}
              <button className="btn btn-primary w-100" type="submit">Đăng nhập</button>
            </form>
            <div className="small text-body-secondary mt-3 p-3 rounded-3 bg-body-tertiary">
              <div>{identifierLabel} mẫu: {isManagement ? managementAccount.username : demoStudents.map((student) => student.studentCode).join(' hoặc ')}</div>
              <div>Mật khẩu mẫu: <code>{demoPassword}</code></div>
            </div>
            <button type="button" className="btn btn-sm btn-link px-0 mt-3" onClick={goBack}>Quay lại chọn loại tài khoản</button>
          </>}
          <div className="d-flex flex-column align-items-center gap-2 mt-3">
            <button type="button" className="btn btn-sm btn-link" onClick={onPreview}>Chọn hồ sơ xem thử</button>
            <a href="#admin" className="small">Quay lại quản trị</a>
          </div>
        </div>
      </section>
    </main>
  )
}
