import { useState } from 'react'
import hutechLogo from './assets/hutech-logo.png'
import { demoManagementAccounts } from './demoManagementAccounts.js'
import { demoStudentActivation } from './demoStudentActivation.js'
import StudentPasswordReset from './StudentPasswordReset.jsx'

import { demoPassword } from './demoPassword.js'
const accountTypes = [
  { id: 'student', label: 'Sinh viên' },
  { id: 'management', label: 'Quản trị' },
]

export default function StudentLogin({ students, studentPasswords, managementPasswords, onSignIn, onManagementSignIn, onActivateDemoStudent, onVerifyDemoActivation, onRequestReset, onResetPassword, onPreview, adminPreviewAvailable }) {
  const [accountType, setAccountType] = useState('')
  const [managementRole, setManagementRole] = useState('')
  const [showCredentials, setShowCredentials] = useState(false)
  const [studentCode, setStudentCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showActivation, setShowActivation] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [activationCode, setActivationCode] = useState('')
  const [activationVerified, setActivationVerified] = useState(false)
  const [initialPassword, setInitialPassword] = useState('')
  const [initialPasswordConfirmation, setInitialPasswordConfirmation] = useState('')
  const [notice, setNotice] = useState('')
  const demoStudents = students.filter((student) => student.userId?.startsWith('demo-'))
  const isManagement = accountType === 'management'
  const managementAccount = demoManagementAccounts[managementRole]
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
    setNotice('')
    setShowCredentials(false)
  }

  function toggleActivation(open) {
    setShowActivation(open)
    setActivationCode('')
    setActivationVerified(false)
    setInitialPassword('')
    setInitialPasswordConfirmation('')
    setPassword('')
    setError('')
    setNotice('')
  }

  function submitActivation(event) {
    event.preventDefault()
    const code = studentCode.trim()
    if (!code || !activationCode.trim()) {
      setError('Nhập MSSV và mã kích hoạt.')
      return
    }
    if (!activationVerified) {
      const result = onVerifyDemoActivation(code, activationCode.trim())
      setError(result.error)
      if (!result.error) setActivationVerified(true)
      return
    }
    if (initialPassword !== initialPasswordConfirmation) {
      setError('Mật khẩu nhập lại chưa khớp.')
      return
    }
    const result = onActivateDemoStudent(code, activationCode.trim(), initialPassword)
    if (result.error) {
      setError(result.error)
      return
    }
    toggleActivation(false)
    setNotice('Đã kích hoạt tài khoản mẫu. Đăng nhập bằng mật khẩu bạn vừa đặt. Tải lại trang sẽ khôi phục dữ liệu mẫu.')
  }

  const pageTitle = showPasswordReset ? 'Quên mật khẩu'
    : showActivation ? (activationVerified ? 'Đặt mật khẩu lần đầu' : 'Kích hoạt tài khoản mẫu')
    : showCredentials ? 'Đăng nhập ' + (isManagement ? managementAccount.label : 'sinh viên') : 'Chọn loại tài khoản'

  function submit(event) {
    event.preventDefault()
    const code = studentCode.trim()
    if (!code || !password) {
      setError(isManagement ? 'Nhập tên đăng nhập và mật khẩu.' : 'Nhập MSSV và mật khẩu.')
      return
    }
    if (isManagement) {
      if (code !== managementAccount?.username || password !== (managementPasswords[managementRole] ?? demoPassword)) {
        setError('Tên đăng nhập hoặc mật khẩu mẫu không đúng.')
        return
      }
      if (!onManagementSignIn(managementRole)) setError('Tài khoản Admin mẫu đang bị khóa.')
      return
    }
    const student = demoStudents.find((item) => item.studentCode === code)
    if (!student || password !== (studentPasswords[student.studentId] ?? demoPassword)) {
      setError('MSSV hoặc mật khẩu mẫu không đúng.')
      return
    }
    if (student.accountDisabled) {
      setError('Tài khoản sinh viên mẫu đang bị vô hiệu hóa.')
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
            <h1 id="student-login-title" className="h3 fw-bold mb-2">{pageTitle}</h1>
            <p className="small text-body-secondary mb-0">
              {showPasswordReset ? 'Đặt lại mật khẩu tài khoản sinh viên mẫu.'
                : showActivation ? (activationVerified ? 'Đặt mật khẩu cho tài khoản mẫu trong phiên này.' : 'Dùng mã mẫu để kích hoạt hồ sơ trong phiên này.')
                : showCredentials ? 'Dùng tài khoản mẫu bên dưới.' : 'Chọn loại tài khoản để tiếp tục đăng nhập mẫu.'}
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
                  {Object.entries(demoManagementAccounts).map(([id, account]) => (
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
          {showActivation && (
            <form onSubmit={submitActivation} noValidate>
              {!activationVerified ? (
                <>
                  <div className="mb-3">
                    <label htmlFor="activation-student" className="form-label">MSSV</label>
                    <input id="activation-student" className="form-control" inputMode="numeric" autoFocus required
                      value={studentCode} onChange={(event) => { setStudentCode(event.target.value); setError('') }} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="activation-code" className="form-label">Mã kích hoạt</label>
                    <input id="activation-code" className="form-control" autoComplete="off" required
                      value={activationCode} onChange={(event) => { setActivationCode(event.target.value); setError('') }} />
                  </div>
                </>
              ) : (
                <>
                  <p>MSSV <strong>{studentCode.trim()}</strong></p>
                  <p id="activation-password-help" className="small text-body-secondary">Dùng mật khẩu thử từ 8 đến 128 ký tự.</p>
                  <div className="mb-3">
                    <label htmlFor="activation-password" className="form-label">Mật khẩu mới</label>
                    <input id="activation-password" type="password" className="form-control" required autoFocus
                      minLength={8} maxLength={128} autoComplete="new-password" aria-describedby="activation-password-help"
                      value={initialPassword} onChange={(event) => { setInitialPassword(event.target.value); setError('') }} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="activation-password-confirmation" className="form-label">Nhập lại mật khẩu mới</label>
                    <input id="activation-password-confirmation" type="password" className="form-control" required maxLength={128}
                      autoComplete="new-password" value={initialPasswordConfirmation}
                      onChange={(event) => { setInitialPasswordConfirmation(event.target.value); setError('') }} />
                  </div>
                </>
              )}
              {error && <p className="alert alert-danger py-2" role="alert">{error}</p>}
              <button className="btn btn-primary w-100" type="submit">{activationVerified ? 'Hoàn tất kích hoạt' : 'Xác minh mã'}</button>
              {!activationVerified && <p className="small text-body-secondary mt-3 mb-2">
                MSSV mẫu <code>{demoStudentActivation.studentCode}</code> · Mã <code>{demoStudentActivation.activationCode}</code>
                <span className="d-block mt-1">Nếu quản trị đã cấp lại mã, dùng mã mới được cấp.</span>
              </p>}
              <button type="button" className="btn btn-sm btn-link px-0" onClick={() => toggleActivation(false)}>Về đăng nhập</button>
            </form>
          )}
          {showPasswordReset && (
            <StudentPasswordReset onRequestReset={onRequestReset} onResetPassword={onResetPassword}
              onBack={() => { setShowPasswordReset(false); setPassword(''); setError(''); setNotice('') }} />
          )}
          {showCredentials && !showActivation && !showPasswordReset && <>
            {notice && <p className="alert alert-success py-2" role="status">{notice}</p>}
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
              <div>Mật khẩu mẫu ban đầu: <code>{demoPassword}</code>. Nếu đã tự đặt hoặc đổi trong phiên, dùng mật khẩu của bạn.</div>
            </div>
            <button type="button" className="btn btn-sm btn-link px-0 mt-3" onClick={goBack}>Quay lại chọn loại tài khoản</button>
            {!isManagement && <div><button type="button" className="btn btn-sm btn-link px-0" onClick={() => toggleActivation(true)}>Kích hoạt tài khoản mẫu</button></div>}
            {!isManagement && <div><button type="button" className="btn btn-sm btn-link px-0" onClick={() => { setShowPasswordReset(true); setError(''); setPassword('') }}>Quên mật khẩu?</button></div>}
          </>}
          <div className="d-flex flex-column align-items-center gap-2 mt-3">
            <a href="#tra-cuu" className="small">Tra cứu chứng nhận</a>
            <button type="button" className="btn btn-sm btn-link" onClick={onPreview}>Chọn hồ sơ xem thử</button>
            {adminPreviewAvailable && <a href="#admin" className="small">Quay lại quản trị</a>}
          </div>
        </div>
      </section>
    </main>
  )
}
