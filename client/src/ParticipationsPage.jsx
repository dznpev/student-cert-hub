import { useState } from 'react'
import { createParticipationComparator } from './sortRecords.js'

import PortalChip from './components/PortalChip.jsx'
import { approvalStatuses } from './approvalStatuses.js'

export default function ParticipationsPage({ cohorts, activities, students, participations, onReviewParticipation, onReviewParticipations }) {
  const [selectedActivity, setSelectedActivity] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [review, setReview] = useState(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [batchResults, setBatchResults] = useState([])
  const reviewParticipation = participations.find((item) => item.participationId === review?.participationId)
  const reviewStudent = students.find((item) => item.studentId === reviewParticipation?.studentId)
  const reviewActivity = activities.find((item) => item.activityId === reviewParticipation?.activityId)

  function openReview(participationId, approvalStatus) {
    setReview({ participationId, approvalStatus })
    setReason('')
    setError('')
    setNotice('')
    setBatchResults([])
  }

  function openBatchReview(approvalStatus) {
    setReview({ participationIds: selectedIds, approvalStatus })
    setReason('')
    setError('')
    setNotice('')
    setBatchResults([])
  }

  function submitReview(event) {
    event.preventDefault()
    if (review.approvalStatus === 'Rejected' && (!reason.trim() || reason.trim().length > 500)) {
      setError('Nhập lý do từ chối từ 1 đến 500 ký tự.')
      return
    }
    if (review.participationIds) {
      const results = onReviewParticipations(review.participationIds, review.approvalStatus, reason)
      setBatchResults(results.map((result) => {
        const participation = participations.find((item) => item.participationId === result.participationId)
        const student = students.find((item) => item.studentId === participation?.studentId)
        const activity = activities.find((item) => item.activityId === participation?.activityId)
        return { ...result, studentCode: student?.studentCode ?? '—', fullName: student?.fullName ?? 'Chưa xác định', activityName: activity?.name ?? 'Chưa xác định' }
      }))
      setSelectedIds([])
      setReview(null)
      return
    }
    const result = onReviewParticipation(review.participationId, review.approvalStatus, reason)
    if (!result.success) {
      setError(result.message)
      return
    }
    setNotice(`${review.approvalStatus === 'Approved' ? 'Đã duyệt' : 'Đã từ chối'} lượt tham gia của ${reviewStudent?.fullName ?? 'sinh viên'} (${reviewStudent?.studentCode ?? '—'}) trong hoạt động ${reviewActivity?.name ?? 'chưa xác định'}.${review.approvalStatus === 'Approved' ? ' Yêu cầu chứng nhận đã được ghi nhận; xem trạng thái PDF tại trang Chứng nhận.' : ''}`)
    setReview(null)
    setSelectedIds((current) => current.filter((id) => id !== review.participationId))
  }
  const visibleParticipations = participations.filter(({ activityId, approvalStatus }) => {
    const matchesActivity = selectedActivity === '' || String(activityId) === selectedActivity
    const matchesStatus = selectedStatus === '' || approvalStatus === selectedStatus
    return matchesActivity && matchesStatus
  }).sort(createParticipationComparator(cohorts, activities, students))
  const selectableIds = visibleParticipations.filter((item) => item.approvalStatus === 'Pending').map((item) => item.participationId)
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id))
  const successCount = batchResults.filter((item) => item.success).length

  return (
    <>
      <h1 className="page-title mb-2">Lượt tham gia</h1>
      <p className="text-body-secondary mb-4">Dữ liệu mẫu · Thay đổi chỉ lưu trong phiên hiện tại, tải lại trang sẽ khôi phục dữ liệu mẫu.</p>

      {review && (
        <form className="card rounded-4 mb-4" aria-labelledby="participation-review-title" onSubmit={submitReview} noValidate>
          <div className="card-body p-3 p-md-4">
            <h2 id="participation-review-title" className="h5">{review.approvalStatus === 'Approved' ? 'Duyệt lượt tham gia' : 'Từ chối lượt tham gia'}</h2>
            {review.participationIds ? (
              <>
                <p><strong>Đã chọn {review.participationIds.length} lượt tham gia.</strong></p>
                <ul className="mb-3">
                  {review.participationIds.map((id) => {
                    const participation = participations.find((item) => item.participationId === id)
                    const student = students.find((item) => item.studentId === participation?.studentId)
                    const activity = activities.find((item) => item.activityId === participation?.activityId)
                    return <li key={id}>{student?.studentCode ?? '—'} · {student?.fullName ?? 'Chưa xác định'} · {activity?.name ?? 'Chưa xác định'}</li>
                  })}
                </ul>
                {review.approvalStatus === 'Rejected' && <p>Lý do bên dưới áp dụng cho tất cả lượt đã chọn.</p>}
              </>
            ) : (
              <>
                <p className="mb-2"><strong>{reviewStudent?.studentCode ?? '—'} · {reviewStudent?.fullName ?? 'Chưa xác định'}</strong></p>
                <p>{reviewActivity?.code} · {reviewActivity?.name ?? 'Chưa xác định'}</p>
              </>
            )}
            {review.approvalStatus === 'Rejected' ? (
              <div className="mb-3">
                <label className="form-label" htmlFor="participation-reason">Lý do từ chối (bắt buộc)</label>
                <textarea
                  id="participation-reason"
                  className={'form-control' + (error ? ' is-invalid' : '')}
                  rows={3}
                  maxLength={500}
                  required
                  autoFocus
                  value={reason}
                  onChange={(event) => { setReason(event.target.value); setError('') }}
                  aria-invalid={Boolean(error)}
                  aria-describedby="participation-reason-help participation-review-error"
                />
                <div id="participation-reason-help" className="form-text">Tối đa 500 ký tự. Lý do sẽ được lưu cùng lượt tham gia.</div>
              </div>
            ) : (
              <p className="text-body-secondary">Lượt tham gia sẽ chuyển sang Đã duyệt và tự thêm yêu cầu chứng nhận tại trang Chứng nhận. Đây là hàng đợi mô phỏng, chưa tạo tệp PDF thật.</p>
            )}
            <div id="participation-review-error" role={error ? 'alert' : undefined}>
              {error && <p className="text-danger">{error}</p>}
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button type="submit" className={'btn ' + (review.approvalStatus === 'Approved' ? 'btn-primary' : 'btn-danger')}>
                {review.approvalStatus === 'Approved' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setReview(null)} autoFocus={review.approvalStatus === 'Approved'}>Hủy</button>
            </div>
          </div>
        </form>
      )}
      {notice && <p className="alert alert-success" role="status">{notice}</p>}
      {batchResults.length > 0 && (
        <section className="card rounded-4 mb-4" aria-labelledby="participation-results-title">
          <div className="card-body p-3 p-md-4">
            <h2 id="participation-results-title" className="h5">Kết quả xử lý từng lượt</h2>
            <p className={'alert ' + (successCount === batchResults.length ? 'alert-success' : 'alert-warning')} role="status">
              Thành công: {successCount}/{batchResults.length} lượt. Không thành công: {batchResults.length - successCount} lượt.
            </p>
            <ul className="mb-0">
              {batchResults.map((item) => (
                <li key={item.participationId}>
                  {item.studentCode} · {item.fullName} · {item.activityName}: <strong>{item.success ? 'Thành công' : 'Không thành công'}</strong>
                  {item.message && ` — ${item.message}`}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="card rounded-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-7 col-xl-5">
              <label className="form-label" htmlFor="participation-activity">Hoạt động</label>
              <select
                id="participation-activity"
                className="form-select"
                value={selectedActivity}
                disabled={Boolean(review)}
                onChange={(event) => { setSelectedActivity(event.target.value); setSelectedIds([]) }}
              >
                <option value="">Tất cả hoạt động</option>
                {activities.map(({ activityId, code, name }) => (
                  <option key={activityId} value={activityId}>{code} · {name}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-5 col-xl-3">
              <label className="form-label" htmlFor="participation-status">Trạng thái duyệt</label>
              <select
                id="participation-status"
                className="form-select"
                value={selectedStatus}
                disabled={Boolean(review)}
                onChange={(event) => { setSelectedStatus(event.target.value); setSelectedIds([]) }}
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(approvalStatuses).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span className="me-2">Đã chọn {selectedIds.length} lượt Chờ duyệt</span>
            <button type="button" className="btn btn-primary btn-sm" disabled={Boolean(review) || selectedIds.length === 0} onClick={() => openBatchReview('Approved')}>Duyệt đã chọn</button>
            <button type="button" className="btn btn-outline-danger btn-sm" disabled={Boolean(review) || selectedIds.length === 0} onClick={() => openBatchReview('Rejected')}>Từ chối đã chọn</button>
            <button type="button" className="btn btn-outline-secondary btn-sm" disabled={Boolean(review) || selectedIds.length === 0} onClick={() => setSelectedIds([])}>Bỏ chọn</button>
          </div>
          <p className="small text-body-secondary">Chỉ chọn các lượt Chờ duyệt trong kết quả đang hiển thị. Đổi bộ lọc sẽ bỏ lựa chọn hiện tại.</p>
          <div className="admin-table-scroll" role="region" aria-label="Danh sách lượt tham gia" tabIndex={0}>
            <table className="table align-middle mb-0 admin-data-table participations-table">
              <caption className="visually-hidden">Danh sách lượt tham gia mẫu</caption>
              <thead>
                <tr>
                  <th scope="col" className="participation-select-col">
                    <input type="checkbox" className="form-check-input" aria-label="Chọn tất cả lượt Chờ duyệt đang hiển thị" checked={allSelected}
                      ref={(node) => { if (node) node.indeterminate = selectedIds.length > 0 && !allSelected }}
                      disabled={Boolean(review) || selectableIds.length === 0}
                      onChange={(event) => setSelectedIds(event.target.checked ? selectableIds : [])} />
                  </th>
                  <th scope="col">MSSV</th>
                  <th scope="col">Họ và tên</th>
                  <th scope="col">Hoạt động</th>
                  <th scope="col">Trạng thái duyệt</th>
                  <th scope="col">Lý do từ chối</th>
                  <th scope="col" className="text-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleParticipations.map(({ participationId, activityId, studentId, approvalStatus, rejectedReason, approvedByLabel, approvedAt }) => {
                  const student = students.find((item) => item.studentId === studentId)
                  const activity = activities.find((item) => item.activityId === activityId)
                  const status = approvalStatuses[approvalStatus]

                  return (
                    <tr key={participationId}>
                      <td>
                        {approvalStatus === 'Pending' && (
                          <input type="checkbox" className="form-check-input" aria-label={'Chọn lượt tham gia của ' + student?.studentCode + ' trong ' + activity?.name}
                            checked={selectedIds.includes(participationId)} disabled={Boolean(review)}
                            onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, participationId] : current.filter((id) => id !== participationId))} />
                        )}
                      </td>
                      <th scope="row">{student?.studentCode ?? '—'}</th>
                      <td>{student?.fullName ?? 'Chưa xác định'}</td>
                      <td>{activity?.name ?? 'Chưa xác định'}</td>
                      <td><PortalChip tone={status.tone} label={status.label} />
                        {approvalStatus === 'Approved' && <div className="small text-body-secondary mt-2">
                          <div>Người duyệt: {approvedByLabel || 'Chưa có thông tin'}</div>
                          {approvedAt && <div>{new Date(approvedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</div>}
                        </div>}
                      </td>
                      <td className="participation-reason">{rejectedReason || '—'}</td>
                      <td>
                        {approvalStatus === 'Pending' ? (
                          <div className="d-flex flex-wrap gap-1">
                            <button type="button" className="btn btn-sm btn-outline-primary" disabled={Boolean(review)} onClick={() => openReview(participationId, 'Approved')} aria-label={'Duyệt lượt tham gia của ' + student?.studentCode}>Duyệt</button>
                            <button type="button" className="btn btn-sm btn-outline-danger" disabled={Boolean(review)} onClick={() => openReview(participationId, 'Rejected')} aria-label={'Từ chối lượt tham gia của ' + student?.studentCode}>Từ chối</button>
                          </div>
                        ) : <span className="text-body-secondary">Đã xử lý</span>}
                      </td>
                    </tr>
                  )
                })}
                {visibleParticipations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-body-secondary">Không tìm thấy lượt tham gia phù hợp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
