import { useState } from 'react'

export default function StudentProfileForm({ student, cohorts, onSave, onCancel, emailOnly = false }) {
  const [values, setValues] = useState({
    fullName: student.fullName,
    email: student.email ?? '',
    className: student.className ?? '',
    cohortId: String(student.cohortId),
  })
  const [errors, setErrors] = useState({})

  function updateField(key, value) {
    setValues({ ...values, [key]: value })
    setErrors({})
  }

  return (
    <form aria-labelledby="student-profile-edit-title" onSubmit={(event) => {
      event.preventDefault()
      setErrors(onSave(values))
    }} noValidate>
      <h2 id="student-profile-edit-title" className="h5">{emailOnly ? 'Sửa email' : 'Sửa hồ sơ'} · {student.studentCode}</h2>
      <div className="row g-3 mb-3">
        {[
          ['fullName', 'Họ và tên', 'text', 150],
          ['email', 'Email', 'email', 256],
          ['className', 'Lớp', 'text', 50],
        ].filter(([key]) => !emailOnly || key === 'email').map(([key, label, type, maxLength]) => (
          <div className="col-12 col-md-6" key={key}>
            <label htmlFor={`student-edit-${key}`} className="form-label">{label}</label>
            <input id={`student-edit-${key}`} type={type} maxLength={maxLength} required={key === 'fullName'}
              className={'form-control' + (errors[key] ? ' is-invalid' : '')} value={values[key]} autoFocus={emailOnly ? key === 'email' : key === 'fullName'}
              aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `student-edit-${key}-error` : undefined}
              onChange={(event) => updateField(key, event.target.value)} />
            {errors[key] && <div id={`student-edit-${key}-error`} className="invalid-feedback" role="alert">{errors[key]}</div>}
          </div>
        ))}
        {!emailOnly && <div className="col-12 col-md-6">
          <label htmlFor="student-edit-cohort" className="form-label">Khóa tuyển sinh</label>
          <select id="student-edit-cohort" className={'form-select' + (errors.cohortId ? ' is-invalid' : '')}
            value={values.cohortId} aria-invalid={Boolean(errors.cohortId)}
            aria-describedby={errors.cohortId ? 'student-edit-cohort-error' : undefined}
            onChange={(event) => updateField('cohortId', event.target.value)}>
            {!cohorts.some(({ cohortId }) => cohortId === student.cohortId) && <option value={student.cohortId} disabled>Khóa hiện tại chưa xác định</option>}
            {cohorts.map(({ cohortId, cohortCode, isActive }) => (
              <option key={cohortId} value={cohortId} disabled={!isActive && cohortId !== student.cohortId}>
                {cohortCode}{!isActive ? ' · Ngừng sử dụng' : ''}
              </option>
            ))}
          </select>
          {errors.cohortId && <div id="student-edit-cohort-error" className="invalid-feedback" role="alert">{errors.cohortId}</div>}
        </div>}
      </div>
      {emailOnly && <p className="small text-body-secondary">Bạn chỉ được sửa email. Có thể để trống nếu chưa có email; tối đa 256 ký tự. Thay đổi chỉ giữ trong phiên mẫu, chưa xác minh địa chỉ email.</p>}
      {errors.form && <p className="alert alert-danger" role="alert">{errors.form}</p>}
      <div className="d-flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary">Lưu hồ sơ</button>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Hủy</button>
      </div>
    </form>
  )
}
