import { useState } from 'react'
import { activityStatuses } from './activityStatuses.js'

export default function ActivityForm({ activities, templates, initialActivity = null, onSave, onCancel }) {
  const [values, setValues] = useState(() => ({
    code: initialActivity?.code ?? '',
    status: initialActivity?.status ?? 'Draft',
    name: initialActivity?.name ?? '',
    description: initialActivity?.description ?? '',
    startDate: initialActivity?.startDate ?? '',
    endDate: initialActivity?.endDate ?? '',
    templateId: initialActivity?.templateId == null ? '' : String(initialActivity.templateId),
  }))
  const [errors, setErrors] = useState({})

  function updateField(field, value) {
    setValues({ ...values, [field]: value })
    setErrors({})
  }

  function submit(event) {
    event.preventDefault()
    const code = values.code.trim().toUpperCase()
    const name = values.name.trim()
    const nextErrors = {}
    if (!code) nextErrors.code = 'Nhập mã hoạt động.'
    else if (code.length > 30) nextErrors.code = 'Mã hoạt động tối đa 30 ký tự.'
    else if (activities.some((item) => item.activityId !== initialActivity?.activityId && item.code.toUpperCase() === code)) nextErrors.code = 'Mã hoạt động này đã tồn tại.'
    if (!name) nextErrors.name = 'Nhập tên hoạt động.'
    else if (name.length > 200) nextErrors.name = 'Tên hoạt động tối đa 200 ký tự.'
    if (!values.startDate) nextErrors.startDate = 'Chọn ngày bắt đầu.'
    if (!values.endDate) nextErrors.endDate = 'Chọn ngày kết thúc.'
    else if (values.startDate && values.endDate < values.startDate) nextErrors.endDate = 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.'
    if (values.templateId && values.templateId !== String(initialActivity?.templateId) && !templates.some((template) => template.isActive && String(template.templateId) === values.templateId)) {
      nextErrors.templateId = 'Chọn một mẫu chứng nhận đang sử dụng.'
    }
    if (!Object.hasOwn(activityStatuses, values.status)) nextErrors.status = 'Chọn trạng thái hoạt động hợp lệ.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSave({ ...values, code, name, description: values.description.trim() || null, status: values.status, templateId: values.templateId ? Number(values.templateId) : null })
  }

  const fields = [
    { field: 'code', label: 'Mã hoạt động', maxLength: 30, placeholder: 'Ví dụ HD004' },
    { field: 'name', label: 'Tên hoạt động', maxLength: 200 },
    { field: 'startDate', label: 'Ngày bắt đầu', type: 'date' },
    { field: 'endDate', label: 'Ngày kết thúc', type: 'date' },
  ]

  return (
    <form className="card activities-card mb-4" aria-labelledby="activity-form-title" onSubmit={submit} noValidate>
      <div className="card-body p-3 p-md-4">
        <h2 id="activity-form-title" className="h5 mb-3">{initialActivity ? 'Sửa hoạt động' : 'Thêm hoạt động'}</h2>
        <div className="row g-3 mb-3">
          {fields.map(({ field, label, type = 'text', maxLength, placeholder }) => (
            <div className="col-12 col-md-6" key={field}>
              <label className="form-label" htmlFor={'new-activity-' + field}>{label}</label>
              <input
                id={'new-activity-' + field}
                className={errors[field] ? 'form-control is-invalid' : 'form-control'}
                type={type}
                value={values[field]}
                onChange={(event) => updateField(field, event.target.value)}
                maxLength={maxLength}
                placeholder={placeholder}
                min={field === 'endDate' ? values.startDate : undefined}
                required
                autoFocus={field === 'code'}
                aria-invalid={Boolean(errors[field])}
                aria-describedby={errors[field] ? 'activity-error-' + field : undefined}
              />
              {errors[field] && <div id={'activity-error-' + field} className="invalid-feedback" role="alert">{errors[field]}</div>}
            </div>
          ))}
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="new-activity-template">Mẫu chứng nhận</label>
            <select
              id="new-activity-template"
              className={errors.templateId ? 'form-select is-invalid' : 'form-select'}
              value={values.templateId}
              onChange={(event) => updateField('templateId', event.target.value)}
              aria-invalid={Boolean(errors.templateId)}
              aria-describedby="activity-template-help activity-template-error"
            >
              <option value="">Dùng mẫu mặc định</option>
              {initialActivity?.templateId != null && !templates.some((template) => template.isActive && template.templateId === initialActivity.templateId) && (
                <option value={initialActivity.templateId} disabled>Mẫu hiện tại (đã ngừng sử dụng)</option>
              )}
              {templates.filter(({ isActive }) => isActive).map(({ templateId, templateName, version }) => (
                <option key={templateId} value={templateId}>{templateName} · Phiên bản {version}</option>
              ))}
            </select>
            <div id="activity-template-help" className="form-text">
              Nếu dùng mặc định, hệ thống chọn mẫu hiện tại khi tạo yêu cầu chứng nhận.
            </div>
            <div id="activity-template-error" className="invalid-feedback" role={errors.templateId ? 'alert' : undefined}>{errors.templateId}</div>
          </div>
          {initialActivity && (
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="activity-edit-status">Trạng thái hoạt động</label>
              <select
                id="activity-edit-status"
                className={errors.status ? 'form-select is-invalid' : 'form-select'}
                value={values.status}
                onChange={(event) => updateField('status', event.target.value)}
                aria-invalid={Boolean(errors.status)}
                aria-describedby={errors.status ? 'activity-status-error' : undefined}
              >
                {Object.entries(activityStatuses).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.status && <div id="activity-status-error" className="invalid-feedback" role="alert">{errors.status}</div>}
            </div>
          )}
          <div className="col-12">
            <label className="form-label" htmlFor="new-activity-description">Mô tả (không bắt buộc)</label>
            <textarea id="new-activity-description" className="form-control" rows={3} value={values.description} onChange={(event) => updateField('description', event.target.value)} />
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary">{initialActivity ? 'Lưu thay đổi' : 'Lưu bản nháp'}</button>
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Hủy</button>
        </div>
      </div>
    </form>
  )
}

