import { useState } from 'react'
import { normalizeSearch } from './normalizeSearch.js'

const sampleAuditLogs = [
  { auditLogId: 1, timestamp: '2026-11-10T02:30:00Z', actorUserId: 'admin-demo', action: 'Nhập hồ sơ sinh viên', entityType: 'ImportBatches', entityId: '2', outcome: 'Partial', reason: '22 dòng thành công, 1 dòng bỏ qua, 1 dòng lỗi.' },
  { auditLogId: 2, timestamp: '2026-11-09T07:15:00Z', actorUserId: null, action: 'Tạo PDF chứng nhận', entityType: 'Certificates', entityId: 'CN-MAU-004', outcome: 'Failure', reason: 'Tạo tệp PDF thất bại.' },
  { auditLogId: 3, timestamp: '2026-10-26T03:00:00Z', actorUserId: 'admin-demo', action: 'Phát hành chứng nhận', entityType: 'Certificates', entityId: 'CN-MAU-001', outcome: 'Success', reason: null },
]

const entityLabels = {
  ImportBatches: 'Đợt nhập',
  Certificates: 'Chứng nhận',
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

const auditRows = sampleAuditLogs.map((entry) => {
  const entity = entityLabels[entry.entityType] ?? entry.entityType
  return {
    ...entry,
    actorLabel: entry.actorUserId === null ? 'Hệ thống' : 'Admin mẫu',
    entityLabel: entry.entityId ? entity + ' · ' + entry.entityId : entity,
  }
})

export default function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [selectedOutcome, setSelectedOutcome] = useState('')
  const query = normalizeSearch(search.trim().replace(/\s+/g, ' '))
  const visibleAuditRows = auditRows.filter(({ actorLabel, action, entityLabel, outcome }) => {
    const matchesSearch = [actorLabel, action, entityLabel].some((field) => normalizeSearch(field).includes(query))
    const matchesOutcome = selectedOutcome === '' || outcome === selectedOutcome
    return matchesSearch && matchesOutcome
  })

  return (
    <>
      <h1 className="page-title mb-2">Nhật ký hệ thống</h1>
      <p className="text-body-secondary mb-4">Dữ liệu mẫu</p>

      <div className="card rounded-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-7 col-xl-5">
              <label className="form-label" htmlFor="audit-search">Tìm kiếm</label>
              <input
                id="audit-search"
                type="search"
                className="form-control"
                placeholder="Nhập người thực hiện, hành động hoặc đối tượng"
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
