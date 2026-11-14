import { useState } from 'react'
import { auditOutcomes } from './auditOutcomes.js'
import PortalChip from './components/PortalChip.jsx'
import PortalPageHeader from './components/PortalPageHeader.jsx'
import PortalPanel from './components/PortalPanel.jsx'
import PortalTable from './components/PortalTable.jsx'
import { normalizeSearch } from './normalizeSearch.js'

const entityLabels = {
  Students: 'Sinh viên',
  Accounts: 'Tài khoản',
  ImportBatches: 'Đợt nhập',
  Certificates: 'Chứng nhận',
  CertificateTemplates: 'Mẫu chứng nhận',
  ActivityParticipations: 'Lượt tham gia',
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

export default function AuditLogsPage({ auditLogs, search = '', onSearchChange = () => {} }) {
  const [selectedOutcome, setSelectedOutcome] = useState('')
  const query = normalizeSearch(search.trim().replace(/\s+/g, ' '))
  const visibleAuditRows = auditLogs.map(toAuditRow).filter(({ actorLabel, action, entityLabel, outcome, reason }) => {
    const matchesSearch = [actorLabel, action, entityLabel, reason ?? ''].some((field) => normalizeSearch(field).includes(query))
    const matchesOutcome = selectedOutcome === '' || outcome === selectedOutcome
    return matchesSearch && matchesOutcome
  }).sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp) || right.auditLogId - left.auditLogId)

  return (
    <>
      <PortalPageHeader title="Nhật ký hệ thống" description="Nhật ký mô phỏng trong phiên hiện tại. Giữ khi đổi menu, tải lại trang sẽ khôi phục dữ liệu mẫu." />

      <PortalPanel className="portal-panel--stacked portal-panel--padded">
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-5 col-xl-3">
              <label className="form-label" htmlFor="audit-outcome">Kết quả</label>
              <select
                id="audit-outcome"
                className="fld w-100"
                value={selectedOutcome}
                onChange={(event) => setSelectedOutcome(event.target.value)}
              >
                <option value="">Tất cả kết quả</option>
                {Object.entries(auditOutcomes).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span className="small text-body-secondary" role="status">Hiển thị {visibleAuditRows.length}/{auditLogs.length} nhật ký</span>
            {(search || selectedOutcome) && (
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { onSearchChange(''); setSelectedOutcome('') }}>Xóa bộ lọc</button>
            )}
          </div>
      </PortalPanel>
      <PortalPanel>
          <PortalTable label="Danh sách nhật ký hệ thống" minWidth="56rem">
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
                  const outcome = auditOutcomes[entry.outcome]
                  return (
                    <tr key={entry.auditLogId}>
                      <td className="text-nowrap">
                        <time dateTime={entry.timestamp}>{timestampFormatter.format(new Date(entry.timestamp))}</time>
                      </td>
                      <td>{entry.actorLabel}</td>
                      <th scope="row">{entry.action}</th>
                      <td>{entry.entityLabel}</td>
                      <td><PortalChip tone={outcome.tone} label={outcome.label} /></td>
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
          </PortalTable>
      </PortalPanel>
    </>
  )
}
