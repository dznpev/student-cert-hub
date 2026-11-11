import { useState } from 'react'

export default function ManagementAccountForm({ account, isCurrentAccount, onSave, onCancel }) {
  const [values, setValues] = useState({ username: account?.username ?? '', fullName: account?.fullName ?? '', role: account?.role ?? 'admin', password: '', confirmation: '' })
  const [errors, setErrors] = useState({})
  function change(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
    setErrors({})
  }
  function submit(event) {
    event.preventDefault()
    if (!account && values.password !== values.confirmation) {
      setErrors({ confirmation: 'Mật khẩu nhập lại chưa khớp.' })
      return
    }
    const result = onSave(account?.accountId, values)
    setErrors(result)
  }
  return (
    <section className="card rounded-4 mb-4" aria-labelledby="management-form-title">
      <div className="card-body p-3 p-md-4">
        <h2 id="management-form-title" className="h5">{account ? 'Sửa tài khoản quản trị' : 'Thêm tài khoản quản trị'}</h2>
        <p className="small text-body-secondary">Tài khoản và mật khẩu thử chỉ giữ trong phiên này. Tải lại trang sẽ khôi phục dữ liệu mẫu.</p>
        <form onSubmit={submit} noValidate>
          <div className="row g-3">
            {[
              ['username', 'Tên đăng nhập', 'text', 50],
              ['fullName', 'Tên hiển thị', 'text', 150],
              ...(!account ? [['password', 'Mật khẩu ban đầu', 'password', 128], ['confirmation', 'Nhập lại mật khẩu', 'password', 128]] : []),
            ].map(([name, label, type, maxLength]) => (
              <div className="col-12 col-md-6" key={name}>
                <label htmlFor={'management-' + name} className="form-label">{label}</label>
                <input id={'management-' + name} name={name} type={type} maxLength={maxLength} required
                  autoComplete={type === 'password' ? 'new-password' : 'off'}
                  className={'form-control' + (errors[name] ? ' is-invalid' : '')} value={values[name]} onChange={change}
                  aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? 'management-error-' + name : undefined} />
                {errors[name] && <div id={'management-error-' + name} className="invalid-feedback">{errors[name]}</div>}
              </div>
            ))}
            <div className="col-12 col-md-6">
              <label htmlFor="management-role" className="form-label">Vai trò</label>
              <select id="management-role" name="role" className="form-select" value={values.role} onChange={change} disabled={isCurrentAccount}>
                <option value="admin">Admin</option><option value="superAdmin">Super Admin</option>
              </select>
              {isCurrentAccount && <p className="small text-body-secondary mt-2 mb-0">Giữ vai trò của tài khoản đang đăng nhập.</p>}
            </div>
          </div>
          {!account && <p className="small text-body-secondary mt-3">Tên đăng nhập: 3–50 ký tự chữ Latin, số, dấu chấm, gạch dưới hoặc gạch ngang; bắt đầu bằng chữ. Mật khẩu thử: 8–128 ký tự.</p>}
          {errors.form && <p className="alert alert-danger mt-3" role="alert">{errors.form}</p>}
          <div className="d-flex flex-wrap gap-2 mt-3">
            <button type="submit" className="btn btn-primary">{account ? 'Lưu thay đổi' : 'Tạo tài khoản'}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Hủy</button>
          </div>
        </form>
      </div>
    </section>
  )
}
