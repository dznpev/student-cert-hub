import { useState } from 'react'
import { normalizeSearch } from './normalizeSearch.js'

const entityLabels = {
  Accounts: 'Tài khoản',
  ImportBatches: 'Đợt nhập',
  Certificates: 'Chứng nhận',
  CertificateTemplates: 'Mẫu chứng nhận',
  ActivityParticipations: 'Lượt tham gia',
}

const outcomes = {
  Success: { label: 'Thành công', badge: 'text-bg-success' },
  Failure: { label: 'Thất bại', badge: 'text-bg-danger' },
  Partial: { label: 'Một phần', badge: 'text-bg-warning' },
}

const timestampFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
})

function toAuditRow(entry) {
  const entity = entityLabels[entry.entityType] ?? entry.entityType
  return {
    ...entry,
    actorLabel: entry.actorLabel ?? (entry.actorUserId === null ? 'Hệ thống' : 'Admin mẫu'),
    entityLabel: entry.entityId ? entity + ' · ' + entry.entityId : entity,
  }
}

export default function AuditLogsPage({ auditLogs }) {
  const [search, setSearch] = useState('')
  const [selectedOutcome, setSelectedOutcome] = useState('')
  const query = normalizeSearch(search.trim().replace(/\s+/g, ' '))
  const visibleAuditRows = auditLogs.map(toAuditRow).filter(({ actorLabel, action, entityLabel, outcome, reason }) => {
    const matchesSearch = [actorLabel, action, entityLabel, reason ?? ''].some((field) => normalizeSearch(field).includes(query))
    const matchesOutcome = selectedOutcome === '' || outcome === selectedOutcome
    return matchesSearch && matchesOutcome
  }).sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp) || right.auditLogId - left.auditLogId)

  return (
    <>
      <h1 className="page-title mb-2">Nhật ký hệ thống</h1>
      <p className="text-body-secondary mb-4">Nhật ký mô phỏng trong phiên hiện tại. Giữ khi đổi menu, tải lại trang sẽ khôi phục dữ liệu mẫu.</p>

      <div className="card rounded-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-7 col-xl-5">
              <label className="form-label" htmlFor="audit-search">Tìm kiếm</label>
              <input
                id="audit-search"
                type="search"
                className="form-control"
                placeholder="Nhập MSSV, họ tên, hành động hoặc nội dung nhật ký"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="col-12 col-sm-5 col-xl-3">
              <label className="form-label" htmlFor="audit-outcome">Kết quả</label>
              <select
                id="audit-outcome"
                className="form-select"
                value={selectedOutcome}
                onChange={(event) => setSelectedOutcome(event.target.value)}
              >
                <option value="">Tất cả kết quả</option>
                {Object.entries(outcomes).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span className="small text-body-secondary" role="status">Hiển thị {visibleAuditRows.length}/{auditLogs.length} nhật ký</span>
            {(search || selectedOutcome) && (
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setSearch(''); setSelectedOutcome('') }}>Xóa bộ lọc</button>
            )}
          </div>
          <div className="admin-table-scroll" role="region" aria-label="Danh sách nhật ký hệ thống" tabIndex={0}>
            <table className="table align-middle mb-0 admin-data-table audit-logs-table">
              <caption className="visually-hidden">Danh sách nhật ký hệ thống mẫu</caption>
              <thead>
                <tr>
                  <th scope="col">Thời điểm</th>
                  <th scope="col">Người thực hiện</th>
                  <th scope="col">Hành động</th>
                  <th scope="col">Đối tượng</th>
                  <th scope="col">Kết quả</th>
                  <th scope="col">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {visibleAuditRows.map((entry) => {
                  const outcome = outcomes[entry.outcome]
                  return (
                    <tr key={entry.auditLogId}>
                      <td className="text-nowrap">
                        <time dateTime={entry.timestamp}>{timestampFormatter.format(new Date(entry.timestamp))}</time>
                      </td>
                      <td>{entry.actorLabel}</td>
                      <th scope="row">{entry.action}</th>
                      <td>{entry.entityLabel}</td>
                      <td><span className={'badge text-wrap ' + outcome.badge}>{outcome.label}</span></td>
                      <td>{entry.reason ?? '—'}</td>
                    </tr>
                  )
                })}
                {visibleAuditRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-body-secondary">Không tìm thấy nhật ký phù hợp.</td>
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
