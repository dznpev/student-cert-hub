import { useState } from 'react'
import PortalTable from './components/PortalTable.jsx'

export default function CohortsPage({ cohorts, onAddCohort, onUpdateCohort }) {
  const [status, setStatus] = useState('all')
  const [draft, setDraft] = useState(null)
  const [pendingCohort, setPendingCohort] = useState(null)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const visibleCohorts = cohorts.filter(({ isActive }) => {
    return status === 'all' || isActive === (status === 'active')
  })

  const isEditing = draft?.cohortId != null
  const isBusy = Boolean(draft || pendingCohort)

  function openForm(cohort = null) {
    setDraft(cohort
      ? { cohortId: cohort.cohortId, cohortCode: cohort.cohortCode, cohortName: cohort.cohortName }
      : { cohortCode: '', cohortName: '' })
    setErrors({})
    setNotice('')
  }

  function updateDraft(field, value) {
    setDraft({ ...draft, [field]: value })
    setErrors({ ...errors, [field]: '' })
  }

  function submitCohort(event) {
    event.preventDefault()
    const cohortCode = draft.cohortCode.trim().toUpperCase()
    const cohortName = draft.cohortName.trim()
    const nextErrors = {}

    if (!cohortCode) {
      nextErrors.cohortCode = 'Nhập mã khóa.'
    } else if (cohortCode.length > 10) {
      nextErrors.cohortCode = 'Mã khóa tối đa 10 ký tự.'
    } else if (cohorts.some((cohort) => cohort.cohortId !== draft.cohortId && cohort.cohortCode.toUpperCase() === cohortCode)) {
      nextErrors.cohortCode = 'Mã khóa này đã tồn tại.'
    }

    if (!cohortName) {
      nextErrors.cohortName = 'Nhập tên khóa.'
    } else if (cohortName.length > 100) {
      nextErrors.cohortName = 'Tên khóa tối đa 100 ký tự.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    if (isEditing) {
      onUpdateCohort(draft.cohortId, { cohortCode, cohortName })
      setNotice('Đã cập nhật khóa ' + cohortCode + '.')
    } else {
      onAddCohort({ cohortCode, cohortName })
      setStatus('all')
      setNotice('Đã thêm khóa ' + cohortCode + ' vào danh sách mẫu.')
    }
    setDraft(null)
  }

  function requestDeactivation(cohort) {
    setNotice('')
    setPendingCohort(cohort)
  }

  function confirmDeactivation(event) {
    event.preventDefault()
    onUpdateCohort(pendingCohort.cohortId, { isActive: false })
    setNotice('Đã ngừng sử dụng khóa ' + pendingCohort.cohortCode + '.')
    setPendingCohort(null)
  }

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h1 className="page-title mb-0">Khóa tuyển sinh</h1>
        {!isBusy && (
          <button type="button" className="btn btn-primary admin-primary-button ms-auto" onClick={() => openForm()}>
            Thêm khóa tuyển sinh
          </button>
        )}
      </div>

      {draft && (
        <form className="card cohorts-card mb-4" aria-labelledby="cohort-form-title" onSubmit={submitCohort} noValidate>
          <div className="card-body p-3 p-md-4">
            <h2 id="cohort-form-title" className="h5 mb-3">{isEditing ? 'Sửa khóa tuyển sinh' : 'Thêm khóa tuyển sinh'}</h2>
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-4 col-xl-3">
                <label className="form-label" htmlFor="cohort-code">Mã khóa</label>
                <input
                  id="cohort-code"
                  className={errors.cohortCode ? 'form-control is-invalid' : 'form-control'}
                  value={draft.cohortCode}
                  onChange={(event) => updateDraft('cohortCode', event.target.value)}
                  maxLength={10}
                  placeholder="Ví dụ K26"
                  required
                  autoFocus
                  aria-invalid={Boolean(errors.cohortCode)}
                  aria-describedby={errors.cohortCode ? 'cohort-code-error' : undefined}
                />
                {errors.cohortCode && <div id="cohort-code-error" className="invalid-feedback" role="alert">{errors.cohortCode}</div>}
              </div>
              <div className="col-12 col-sm-8 col-xl-6">
                <label className="form-label" htmlFor="cohort-name">Tên khóa</label>
                <input
                  id="cohort-name"
                  className={errors.cohortName ? 'form-control is-invalid' : 'form-control'}
                  value={draft.cohortName}
                  onChange={(event) => updateDraft('cohortName', event.target.value)}
                  maxLength={100}
                  placeholder="Ví dụ Khóa tuyển sinh 2026"
                  required
                  aria-invalid={Boolean(errors.cohortName)}
                  aria-describedby={errors.cohortName ? 'cohort-name-error' : undefined}
                />
                {errors.cohortName && <div id="cohort-name-error" className="invalid-feedback" role="alert">{errors.cohortName}</div>}
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary admin-primary-button">Lưu khóa</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setDraft(null)}>Hủy</button>
            </div>
          </div>
        </form>
      )}

      {pendingCohort && (
        <form className="alert alert-warning mb-4" aria-labelledby="deactivate-cohort-title" onSubmit={confirmDeactivation}>
          <h2 id="deactivate-cohort-title" className="h5">Ngừng sử dụng khóa {pendingCohort.cohortCode}?</h2>
          <p className="mb-3">Khóa sẽ chuyển sang Ngừng sử dụng. Hồ sơ sinh viên và lịch sử của khóa vẫn được giữ.</p>
          <div className="d-flex flex-wrap gap-2">
            <button type="submit" className="btn btn-danger">Xác nhận ngừng sử dụng</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setPendingCohort(null)} autoFocus>Hủy</button>
          </div>
        </form>
      )}

      {notice && <p className="alert alert-success" role="status">{notice}</p>}
      <div className="card cohorts-card">
        <div className="card-body p-3 p-md-4">
          <div className="cohort-status-filter mb-3">
            <label className="form-label" htmlFor="cohort-status">Trạng thái</label>
            <select
              id="cohort-status"
              className="form-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang sử dụng</option>
              <option value="inactive">Ngừng sử dụng</option>
            </select>
          </div>
          <PortalTable label="Danh sách khóa tuyển sinh">
            <caption className="visually-hidden">Danh sách khóa tuyển sinh mẫu</caption>
            <thead>
              <tr>
                <th scope="col" className="cohort-code-col text-start">Mã khóa</th>
                <th scope="col">Tên khóa</th>
                <th scope="col" className="cohort-status-col">Trạng thái</th>
                <th scope="col" className="cohort-actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visibleCohorts.map(({ cohortId, cohortCode, cohortName, isActive }) => (
                <tr key={cohortId}>
                  <th scope="row" className="text-start">{cohortCode}</th>
                  <td>{cohortName}</td>
                  <td>
                    <span className={isActive ? 'badge text-wrap text-bg-success' : 'badge text-wrap text-bg-secondary'}>
                      {isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap justify-content-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        aria-label={'Sửa khóa ' + cohortCode}
                        onClick={() => openForm({ cohortId, cohortCode, cohortName })}
                        disabled={isBusy}
                      >
                        Sửa
                      </button>
                      {isActive && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          aria-label={'Ngừng sử dụng khóa ' + cohortCode}
                          onClick={() => requestDeactivation({ cohortId, cohortCode })}
                          disabled={isBusy}
                        >
                          <span className="d-none d-xl-inline">Ngừng sử dụng</span>
                          <span className="d-xl-none">Ngừng</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visibleCohorts.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-body-secondary">Không có khóa tuyển sinh phù hợp.</td>
                </tr>
              )}
            </tbody>
          </PortalTable>
        </div>
      </div>
    </>
  )
}
