import { useState } from 'react'
import hutechLogo from './assets/hutech-logo.png'
import ThemeToggleButton from './components/ThemeToggleButton.jsx'

export default function StudentAccountLink({ type, studentCode, code, onVerifyActivation, onActivate, onVerifyReset, onReset }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const activation = type === 'activation'
  const verificationError = !studentCode || !code ? 'Liên kết thiếu MSSV hoặc mã xác nhận.'
    : activation ? onVerifyActivation(studentCode, code).error : onVerifyReset(studentCode, code)

  function submit(event) {
    event.preventDefault()
    if (password.length < 8 || password.length > 128) { setError('Mật khẩu cần từ 8 đến 128 ký tự.'); return }
    if (password !== confirmation) { setError('Mật khẩu nhập lại chưa khớp.'); return }
    const message = activation ? onActivate(studentCode, code, password).error : onReset(studentCode, code, password)
    setError(message)
    if (!message) { setCompleted(true); setPassword(''); setConfirmation('') }
  }

  return (
    <main className="portal-auth-screen">
      <ThemeToggleButton />
      <section className="portal-auth-card" aria-labelledby="account-link-title">
        <div className="portal-auth-header">
          <span className="portal-logo-chip portal-auth-logo">
            <img src={hutechLogo} className="portal-auth-logo__img" alt="HUTECH" width="927" height="234" />
          </span>
          <p className="portal-auth-eyebrow">Student Cert Hub · Liên kết thử</p>
          <h1 id="account-link-title" className="portal-auth-title">{activation ? 'Kích hoạt tài khoản' : 'Đặt lại mật khẩu'}</h1>
        </div>
        <p className="small text-body-secondary">Liên kết chỉ dùng trong cùng tab đã cấp mã thử. Chưa gửi email hoặc xác minh qua API; mở tab khác hay tải lại sẽ mất mã đã cấp trong phiên.</p>
        {completed ? <p className="alert alert-success" role="status">{activation ? 'Đã kích hoạt tài khoản mẫu.' : 'Đã đặt lại mật khẩu mẫu.'} Đăng nhập bằng MSSV và mật khẩu vừa đặt.</p>
          : verificationError ? <p className="alert alert-danger" role="alert">{verificationError} Về đăng nhập để yêu cầu mã mới hoặc liên hệ quản trị viên.</p>
            : <form onSubmit={submit} noValidate aria-label={activation ? 'Đặt mật khẩu kích hoạt' : 'Đặt lại mật khẩu bằng liên kết'}>
              <p>MSSV <strong>{studentCode}</strong></p>
              <p id="account-link-password-help" className="small text-body-secondary">Mật khẩu thử từ 8 đến 128 ký tự.</p>
              {[
                ['link-password', 'Mật khẩu mới', password, setPassword],
                ['link-confirmation', 'Nhập lại mật khẩu mới', confirmation, setConfirmation],
              ].map(([id, label, value, update]) => <div className="mb-3" key={id}>
                <label htmlFor={id} className="form-label">{label}</label>
                <input id={id} type="password" className="form-control" value={value} required minLength={8} maxLength={128}
                  autoComplete="new-password" autoFocus={id === 'link-password'} aria-describedby="account-link-password-help"
                  onChange={(event) => { update(event.target.value); setError('') }} />
              </div>)}
              {error && <p className="alert alert-danger" role="alert">{error}</p>}
              <button type="submit" className="btn btn-primary w-100">{activation ? 'Hoàn tất kích hoạt' : 'Đặt lại mật khẩu'}</button>
            </form>}
        <a href="#sinh-vien" className="btn btn-outline-secondary w-100 mt-3">Về đăng nhập</a>
      </section>
    </main>
  )
}
