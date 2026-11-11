import { useState } from 'react'

export default function PasswordChangeForm({ onChangePassword }) {
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function submit(event) {
    event.preventDefault()
    setNotice('')
    if (values.newPassword !== values.confirmPassword) {
      setError('Mật khẩu nhập lại chưa khớp.')
      return
    }
    const message = onChangePassword(values.currentPassword, values.newPassword)
    setError(message)
    if (message) return
    setValues({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setNotice('Đã đổi mật khẩu mẫu trong phiên này. Lần đăng nhập tiếp theo dùng mật khẩu mới.')
  }

  return (
    <form onSubmit={submit} aria-label="Đổi mật khẩu">
      <p className="small text-body-secondary" id="student-password-help">Dùng mật khẩu thử từ 8 đến 128 ký tự. Tải lại trang sẽ khôi phục mật khẩu mẫu ban đầu.</p>
      <div className="row g-3 mb-3">
        {[
          ['currentPassword', 'Mật khẩu hiện tại', 'current-password'],
          ['newPassword', 'Mật khẩu mới', 'new-password'],
          ['confirmPassword', 'Nhập lại mật khẩu mới', 'new-password'],
        ].map(([key, label, autoComplete]) => (
          <div className="col-12 col-lg-4" key={key}>
            <label htmlFor={`student-${key}`} className="form-label">{label}</label>
            <input id={`student-${key}`} className="form-control" type="password" required maxLength={128}
              autoComplete={autoComplete} value={values[key]} aria-describedby="student-password-help"
              onChange={(event) => { setValues({ ...values, [key]: event.target.value }); setError(''); setNotice('') }} />
          </div>
        ))}
      </div>
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {notice && <p className="alert alert-success" role="status">{notice}</p>}
      <button type="submit" className="btn btn-primary">Đổi mật khẩu</button>
    </form>
  )
}
