import { useState } from 'react'
import CertificateDownloadPanel from './CertificateDownloadPanel.jsx'
import CertificateSnapshotPreview from './CertificateSnapshotPreview.jsx'
import { certificateStatuses } from './certificateStatuses.js'
import { createParticipationComparator } from './sortRecords.js'
import { normalizeSearch } from './normalizeSearch.js'

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

export default function CertificatesPage({ cohorts, activities, students, participations, certificates, onProcessCertificate }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [snapshotCertificateId, setSnapshotCertificateId] = useState(null)
  const snapshotCertificate = certificates.find((item) => item.certificateId === snapshotCertificateId)
  const [downloadRequest, setDownloadRequest] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedActivity, setSelectedActivity] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [issuedFrom, setIssuedFrom] = useState('')
  const [issuedTo, setIssuedTo] = useState('')
  const [processing, setProcessing] = useState(null)
  const [outcome, setOutcome] = useState('success')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const processingCertificate = certificates.find((item) => item.certificateId === processing?.certificateId)
  const compareParticipations = createParticipationComparator(cohorts, activities, students)
  const studentsById = new Map(students.map((student) => [student.studentId, student]))
  const participationsById = new Map(participations.map((item) => [item.participationId, item]))
  const query = normalizeSearch(search.trim().replace(/\s+/g, ' '))
  const hasIssuedDateFilter = Boolean(issuedFrom || issuedTo)
  const invalidIssuedRange = Boolean(issuedFrom && issuedTo && issuedFrom > issuedTo)

  function changeFilter(setFilter, value) {
    setFilter(value)
    setSelectedIds([])
    setDownloadRequest(null)
    setSnapshotCertificateId(null)
  }

  function openProcessing(certificateId, action) {
    setDownloadRequest(null)
    setSelectedIds([])
    setProcessing({ certificateId, action })
    setOutcome('success')
    setReason('')
    setError('')
    setNotice('')
  }

  function submitProcessing(event) {
    event.preventDefault()
    if (processing.action === 'revoke' && (!reason.trim() || reason.trim().length > 500)) {
      setError('Nhập lý do thu hồi từ 1 đến 500 ký tự.')
      return
    }
    const action = processing.action === 'generate' ? outcome : processing.action
    const result = onProcessCertificate(processing.certificateId, action, reason)
    if (!result.success) {
      setError(result.message)
      return
    }
    setNotice(processingCertificate.certificateCode + ': ' + result.message)
    setProcessing(null)
  }
  const visibleCertificates = certificates
    .map((certificate) => {
      const participation = participationsById.get(certificate.participationId)
      return { certificate, participation, student: studentsById.get(participation?.studentId) }
    })
    .filter(({ certificate, participation, student }) => {
      const matchesActivity = selectedActivity === '' || String(participation?.activityId) === selectedActivity
      const matchesStatus = selectedStatus === '' || certificate.status === selectedStatus
      const matchesSearch = query === '' || [certificate.certificateCode, student?.studentCode, student?.fullName]
        .some((value) => normalizeSearch(String(value ?? '').replace(/\s+/g, ' ')).includes(query))
      if (invalidIssuedRange || !matchesActivity || !matchesStatus || !matchesSearch) return false
      if (!hasIssuedDateFilter) return true
      if (!certificate.issuedAt) return false

      // Compare the same UTC calendar day shown in the table.
      const issuedDay = new Date(certificate.issuedAt).toISOString().slice(0, 10)
      return (!issuedFrom || issuedDay >= issuedFrom) && (!issuedTo || issuedDay <= issuedTo)
    })
    .sort((left, right) => compareParticipations(left.participation, right.participation))

  const selectableIds = visibleCertificates.filter(({ certificate }) => certificate.status === 'Issued').map(({ certificate }) => certificate.certificateId)
  const selectedVisibleIds = selectableIds.filter((id) => selectedIds.includes(id))
  const allSelected = selectableIds.length > 0 && selectedVisibleIds.length === selectableIds.length

  return (
    <>
      <h1 className="page-title mb-2">Chứng nhận</h1>
      <p className="text-body-secondary mb-2">Dữ liệu mẫu · Thay đổi chỉ lưu trong phiên hiện tại, tải lại trang sẽ khôi phục dữ liệu mẫu.</p>
      <p className="text-body-secondary mb-4">Duyệt lượt tham gia sẽ tự thêm yêu cầu chứng nhận. Các nút xử lý bên dưới mô phỏng kết quả tạo PDF; chưa có tệp PDF thật để tải.</p>

      {processing && (
        <form className="card rounded-4 mb-4" onSubmit={submitProcessing} aria-labelledby="certificate-process-title" noValidate>
          <div className="card-body p-3 p-md-4">
            <h2 id="certificate-process-title" className="h5">{processing.action === 'revoke' ? 'Thu hồi chứng nhận' : processing.action === 'retry' ? 'Thử lại chứng nhận' : 'Xử lý chứng nhận mô phỏng'}</h2>
            <p className="text-break">{processingCertificate?.certificateCode}</p>
            {processing.action === 'revoke' ? (
              <div className="mb-3">
                <p>Chứng nhận sẽ chuyển sang Đã thu hồi. Mã, ngày phát hành, liên kết và lịch sử vẫn được giữ. Thao tác đang áp dụng trên dữ liệu frontend mô phỏng.</p>
                <label className="form-label" htmlFor="certificate-revocation-reason">Lý do thu hồi (bắt buộc)</label>
                <textarea id="certificate-revocation-reason" className={'form-control' + (error ? ' is-invalid' : '')}
                  rows={3} maxLength={500} required autoFocus value={reason}
                  onChange={(event) => { setReason(event.target.value); setError('') }}
                  aria-invalid={Boolean(error)} aria-describedby="certificate-reason-help certificate-process-error" />
                <div id="certificate-reason-help" className="form-text">Tối đa 500 ký tự. Lý do và thời điểm thu hồi sẽ được lưu trong phiên hiện tại.</div>
              </div>
            ) : processing.action === 'retry' ? (
              <p>Chứng nhận sẽ trở về Đang tạo, giữ nguyên mã và lượt tham gia. Lịch sử lỗi vẫn được giữ. Bạn có thể xử lý mô phỏng lại sau đó.</p>
            ) : (
              <div className="mb-3">
                <label className="form-label" htmlFor="certificate-outcome">Kết quả mô phỏng</label>
                <select id="certificate-outcome" className="form-select" value={outcome} onChange={(event) => setOutcome(event.target.value)} autoFocus>
                  <option value="success">Tạo thành công</option>
                  <option value="failure">Lỗi tạo hoặc ghi tệp PDF</option>
                </select>
                <p className="form-text">Thành công sẽ cập nhật ngày phát hành mẫu; thao tác này không tạo tệp PDF thật.</p>
              </div>
            )}
            {error && <p id="certificate-process-error" className="alert alert-danger" role="alert">{error}</p>}
            <div className="d-flex flex-wrap gap-2">
              <button type="submit" className={'btn ' + (processing.action === 'revoke' ? 'btn-danger' : 'btn-primary')}>{processing.action === 'revoke' ? 'Xác nhận thu hồi' : processing.action === 'retry' ? 'Xác nhận thử lại' : 'Xác nhận xử lý mô phỏng'}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setProcessing(null)} autoFocus={processing.action === 'retry'}>Hủy</button>
            </div>
          </div>
        </form>
      )}
      {notice && <p className="alert alert-info text-break" role="status">{notice}</p>}
      {snapshotCertificate && <CertificateSnapshotPreview key={snapshotCertificate.certificateId}
        certificate={snapshotCertificate} onClose={() => setSnapshotCertificateId(null)} />}

      <div className="card rounded-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 mb-3">
            <div className="col-12 col-xl-4">
              <label className="form-label" htmlFor="certificate-search">Tìm kiếm</label>
              <input id="certificate-search" type="search" className="form-control"
                placeholder="Nhập mã chứng nhận, MSSV hoặc họ tên"
                value={search} disabled={Boolean(processing)} onChange={(event) => changeFilter(setSearch, event.target.value)} />
            </div>
            <div className="col-12 col-sm-7 col-xl-5">
              <label className="form-label" htmlFor="certificate-activity">Hoạt động</label>
              <select
                id="certificate-activity"
                className="form-select"
                value={selectedActivity}
                disabled={Boolean(processing)}
                onChange={(event) => changeFilter(setSelectedActivity, event.target.value)}
              >
                <option value="">Tất cả hoạt động</option>
                {activities.map(({ activityId, code, name }) => (
                  <option key={activityId} value={activityId}>{code} · {name}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-5 col-xl-3">
              <label className="form-label" htmlFor="certificate-status">Trạng thái chứng nhận</label>
              <select
                id="certificate-status"
                className="form-select"
                value={selectedStatus}
                disabled={Boolean(processing)}
                onChange={(event) => changeFilter(setSelectedStatus, event.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {certificateStatuses.map(({ status, label }) => (
                  <option key={status} value={status}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <fieldset className="mb-3" disabled={Boolean(processing)}>
            <legend className="form-label">Ngày phát hành</legend>
            <div className="row g-3">
              <div className="col-12 col-sm-6 col-xl-3">
                <label className="form-label" htmlFor="certificate-issued-from">Từ ngày</label>
                <input id="certificate-issued-from" type="date" className="form-control"
                  value={issuedFrom} onChange={(event) => changeFilter(setIssuedFrom, event.target.value)} />
              </div>
              <div className="col-12 col-sm-6 col-xl-3">
                <label className="form-label" htmlFor="certificate-issued-to">Đến ngày</label>
                <input id="certificate-issued-to" type="date"
                  className={'form-control' + (invalidIssuedRange ? ' is-invalid' : '')}
                  aria-invalid={invalidIssuedRange}
                  aria-describedby={invalidIssuedRange ? 'certificate-issued-range-error' : undefined}
                  value={issuedTo} onChange={(event) => changeFilter(setIssuedTo, event.target.value)} />
                {invalidIssuedRange && (
                  <div id="certificate-issued-range-error" className="invalid-feedback" role="alert">
                    Đến ngày phải bằng hoặc sau Từ ngày.
                  </div>
                )}
              </div>
            </div>
          </fieldset>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span className="small" role="status">Đã chọn {selectedVisibleIds.length} chứng nhận hiệu lực trong danh sách đang lọc.</span>
            <button type="button" className="btn btn-outline-primary" disabled={Boolean(processing) || selectedVisibleIds.length === 0}
              onClick={() => setDownloadRequest({ format: 'zip', certificateIds: selectedVisibleIds })}>Tải ZIP đã chọn</button>
            <button type="button" className="btn btn-outline-secondary" disabled={Boolean(processing) || selectedIds.length === 0}
              onClick={() => { setSelectedIds([]); setDownloadRequest(null) }}>Bỏ chọn</button>
          </div>
          <p className="small text-body-secondary">Chỉ chọn chứng nhận đang hiệu lực. Đổi bộ lọc sẽ bỏ chọn. Tải PDF/ZIP hiện là giao diện thử, chưa có tệp và quyền tải từ API.</p>
          {downloadRequest && <CertificateDownloadPanel key={downloadRequest.format + ':' + downloadRequest.certificateIds.join(',')}
            request={downloadRequest} certificates={certificates} onClose={() => setDownloadRequest(null)} />}
          <div className="admin-table-scroll" role="region" aria-label="Danh sách chứng nhận" tabIndex={0}>
            <table className="table align-middle mb-0 admin-data-table certificates-table">
              <caption className="visually-hidden">Danh sách chứng nhận mẫu</caption>
              <thead>
                <tr>
                  <th scope="col"><input type="checkbox" className="form-check-input" aria-label="Chọn tất cả chứng nhận hiệu lực đang hiển thị"
                    checked={allSelected} disabled={Boolean(processing) || selectableIds.length === 0}
                    ref={(element) => { if (element) element.indeterminate = selectedVisibleIds.length > 0 && !allSelected }}
                    onChange={(event) => { setSelectedIds(event.target.checked ? selectableIds : []); setDownloadRequest(null) }} /></th>
                  <th scope="col">Mã chứng nhận</th>
                  <th scope="col">MSSV</th>
                  <th scope="col">Họ và tên</th>
                  <th scope="col">Hoạt động</th>
                  <th scope="col">Ngày phát hành</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Mẫu chứng nhận</th>
                  <th scope="col">Chi tiết PDF</th>
                  <th scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleCertificates.map(({ certificate, participation, student }) => {
                  const { certificateId, certificateCode, issuedAt, status, templateName, templateVersion, lastError, processingHistory = [], revokedAt, revocationReason, revokedByLabel } = certificate
                  const activity = activities.find((item) => item.activityId === participation?.activityId)
                  const statusInfo = certificateStatuses.find((item) => item.status === status)

                  return (
                    <tr key={certificateCode}>
                      <td><input type="checkbox" className="form-check-input" aria-label={'Chọn chứng nhận ' + certificateCode}
                        checked={selectedVisibleIds.includes(certificateId)} disabled={Boolean(processing) || status !== 'Issued'}
                        onChange={(event) => {
                          setSelectedIds((current) => event.target.checked ? [...current, certificateId] : current.filter((id) => id !== certificateId))
                          setDownloadRequest(null)
                        }} /></td>
                      <th scope="row">{certificateCode}</th>
                      <td>{student?.studentCode ?? '—'}</td>
                      <td>{student?.fullName ?? 'Chưa xác định'}</td>
                      <td>{activity?.name ?? 'Chưa xác định'}</td>
                      <td>{issuedAt ? dateFormatter.format(new Date(issuedAt)) : '—'}</td>
                      <td><span className={'badge text-wrap ' + statusInfo.badge}>{statusInfo.label}</span></td>
                      <td>{templateName ? `${templateName} · v${templateVersion}` : 'Chưa có thông tin mẫu'}
                        <button type="button" className="btn btn-sm btn-outline-secondary d-block mt-2" disabled={Boolean(processing)}
                          aria-label={'Xem bản mẫu ' + certificateCode} onClick={() => setSnapshotCertificateId(certificateId)}>Xem bản mẫu</button>
                      </td>
                      <td>{status === 'Generating'
                        ? 'Đã ghi nhận yêu cầu, chờ xử lý mô phỏng.'
                        : status === 'Failed' ? lastError || 'Dữ liệu lỗi mẫu, chưa có chi tiết lỗi.' : 'Dữ liệu chứng nhận mẫu, chưa có tệp PDF thật.'}
                        {status === 'Revoked' && (
                          <div className="mt-2" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                            <div><strong>Người thu hồi:</strong> {revokedByLabel || 'Chưa có thông tin'}</div>
                            <div><strong>Lý do thu hồi:</strong> {revocationReason || 'Chưa có thông tin trong dữ liệu mẫu.'}</div>
                            <div><strong>Thời điểm:</strong> {revokedAt ? new Date(revokedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'}</div>
                          </div>
                        )}
                        {processingHistory.length > 0 && (
                          <details className="mt-2">
                            <summary>Lịch sử xử lý ({processingHistory.length})</summary>
                            <ol className="ps-3 mb-0 small">
                              {processingHistory.map((entry, index) => (
                                <li key={index}>
                                  {new Date(entry.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} · {entry.action === 'Revoked' ? 'Thu hồi' : entry.action === 'Retry' ? 'Thử lại' : 'Xử lý'} · {entry.message}
                                  {entry.actorLabel && <div>Người xử lý: {entry.actorLabel}</div>}
                                  {entry.previousError && <div>Lỗi trước đó: {entry.previousError}</div>}
                                </li>
                              ))}
                            </ol>
                          </details>
                        )}
                      </td>
                      <td>
                        <button type="button" className="btn btn-sm btn-outline-primary mb-2" disabled={Boolean(processing) || status !== 'Issued'}
                          aria-label={'Tải PDF ' + certificateCode} onClick={() => setDownloadRequest({ format: 'pdf', certificateIds: [certificateId] })}>Tải PDF</button>
                        <div>
                        {status === 'Generating' ? (
                          <button type="button" className="btn btn-sm btn-outline-primary" disabled={Boolean(processing)} onClick={() => openProcessing(certificateId, 'generate')}>Xử lý mô phỏng</button>
                        ) : status === 'Failed' ? (
                          <button type="button" className="btn btn-sm btn-outline-primary" disabled={Boolean(processing)} onClick={() => openProcessing(certificateId, 'retry')}>Thử lại</button>
                        ) : status === 'Issued' ? (
                          <button type="button" className="btn btn-sm btn-outline-danger" disabled={Boolean(processing)} onClick={() => openProcessing(certificateId, 'revoke')}>Thu hồi</button>
                        ) : <span className="text-body-secondary">—</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {visibleCertificates.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center text-body-secondary">
                      {invalidIssuedRange ? 'Hãy sửa khoảng ngày phát hành để xem kết quả.' : 'Không tìm thấy chứng nhận phù hợp.'}
                    </td>
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
