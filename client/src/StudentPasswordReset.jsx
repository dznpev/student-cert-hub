import { useState } from 'react'
import ThemeToggleButton from './components/ThemeToggleButton.jsx'

export default function StudentPasswordReset({ onRequestReset, onResetPassword, onBack }) {
  const [studentCode, setStudentCode] = useState('')
  const [resetRequest, setResetRequest] = useState(null)
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)

  function requestReset(event) {
    event.preventDefault()
    const result = onRequestReset(studentCode.trim())
    setError(result.error)
    if (result.error) return
    setResetRequest(result)
    setResetCode('')
    setNewPassword('')
    setConfirmation('')
  }

  function resetPassword(event) {
    event.preventDefault()
    if (newPassword !== confirmation) {
      setError('Mật khẩu nhập lại chưa khớp.')
      return
    }
    const message = onResetPassword(studentCode.trim(), resetCode.trim(), newPassword)
    setError(message)
    if (message) return
    setCompleted(true)
    setResetRequest(null)
    setResetCode('')
    setNewPassword('')
    setConfirmation('')
  }

  if (completed) {
    return (
      <>
        <ThemeToggleButton />
        <p className="alert alert-success" role="status">Đã đặt lại mật khẩu mẫu. Bạn có thể đăng nhập bằng mật khẩu mới trong phiên này.</p>
        <button type="button" className="btn btn-primary w-100" onClick={onBack}>Về đăng nhập</button>
      </>
    )
  }

  return (
    <>
      {/* §6.10: this view owns the screen's toggle; StudentLogin hides its own
          while the reset form is open. */}
      <ThemeToggleButton />
      <p className="small text-body-secondary">Luồng thử trên trình duyệt. Mã xác nhận hiển thị bên dưới để kiểm tra, email cần kết nối API.</p>
      {!resetRequest ? (
        <form onSubmit={requestReset}>
          <label className="form-label" htmlFor="reset-student-code">MSSV</label>
          <input id="reset-student-code" className="form-control mb-3" required autoFocus inputMode="numeric"
            value={studentCode} onChange={(event) => { setStudentCode(event.target.value); setError('') }} />
          {error && <p className="alert alert-danger" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary w-100">Yêu cầu đặt lại mật khẩu</button>
        </form>
      ) : (
        <form onSubmit={resetPassword} noValidate>
          <p>MSSV <strong>{studentCode.trim()}</strong></p>
          <p className="small text-break bg-body-tertiary p-2 rounded">
            Mã thử <code>{resetRequest.code}</code> · Có hiệu lực 15 phút, dùng một lần.
          </p>
          <p className="small"><a href={'#dat-lai-mat-khau?' + new URLSearchParams({ mssv: studentCode.trim(), ma: resetRequest.code })}>Mở liên kết đặt lại mật khẩu thử</a><br />Chỉ dùng trong cùng tab; chưa gửi email.</p>
          {[
            ['reset-code', 'Mã xác nhận', 'text', resetCode, setResetCode],
            ['reset-password', 'Mật khẩu mới', 'password', newPassword, setNewPassword],
            ['reset-confirmation', 'Nhập lại mật khẩu mới', 'password', confirmation, setConfirmation],
          ].map(([id, label, type, value, setValue]) => (
            <div className="mb-3" key={id}>
              <label htmlFor={id} className="form-label">{label}</label>
              <input id={id} className="form-control" type={type} required maxLength={128}
                autoComplete={type === 'password' ? 'new-password' : 'one-time-code'}
                value={value} onChange={(event) => { setValue(event.target.value); setError('') }} />
            </div>
          ))}
          <p className="form-text">Mật khẩu thử từ 8 đến 128 ký tự.</p>
          {error && <p className="alert alert-danger" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary w-100">Đặt lại mật khẩu</button>
          <button type="button" className="btn btn-link px-0 mt-2" onClick={() => { setResetRequest(null); setResetCode(''); setNewPassword(''); setConfirmation(''); setError('') }}>
            Yêu cầu mã mới
          </button>
        </form>
      )}
      <button type="button" className="btn btn-link px-0 mt-2" onClick={onBack}>Về đăng nhập</button>
    </>
  )
}
