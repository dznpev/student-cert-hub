import { useState } from 'react'
import { sampleActivities } from './sampleActivities.js'
import { sampleStudents } from './sampleStudents.js'

const importTypes = {
  Students: 'Hồ sơ sinh viên',
  Participations: 'Danh sách lượt tham gia',
}

const sampleBatch = {
  fileName: 'luot-tham-gia-mau.xlsx',
  importType: 'Participations',
  activityId: 1,
}

const sampleRows = [
  { rowNumber: 2, studentCode: sampleStudents[1].studentCode, processingStatus: 'Valid', errorMessage: null },
  { rowNumber: 3, studentCode: sampleStudents[0].studentCode, processingStatus: 'Skipped', errorMessage: 'MSSV này đã có lượt tham gia trong hoạt động.' },
  { rowNumber: 4, studentCode: '02900001', processingStatus: 'Error', errorMessage: 'Không tìm thấy MSSV.' },
]

const sampleHistory = [
  { batchId: 2, fileName: 'sinh-vien-k24-mau.xlsx', importType: 'Students', importedAt: '2026-11-10', totalRows: 24, successRows: 22, duplicateRows: 0, skippedRows: 1, errorRows: 1, batchStatus: 'Completed' },
  { batchId: 3, fileName: 'tinh-nguyen-mau.xlsx', importType: 'Participations', importedAt: '2026-10-25', totalRows: 16, successRows: 14, duplicateRows: 2, skippedRows: 0, errorRows: 0, batchStatus: 'Completed' },
]

const rowStatuses = {
  Valid: { label: 'Hợp lệ', badge: 'text-bg-success' },
  Skipped: { label: 'Bỏ qua', badge: 'text-bg-warning' },
  Error: { label: 'Lỗi', badge: 'text-bg-danger' },
}

const batchStatuses = {
  Completed: 'Hoàn tất',
}

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

export default function ImportsPage() {
  const [importType, setImportType] = useState('Participations')
  const previewActivity = sampleActivities.find(({ activityId }) => activityId === sampleBatch.activityId)

  return (
    <>
      <h1 className="page-title mb-4">Nhập dữ liệu Excel</h1>

      <section className="card rounded-4 mb-4" aria-labelledby="import-settings">
        <div className="card-body p-3 p-md-4">
          <h2 id="import-settings" className="h5 mb-3">Thông tin tệp nhập</h2>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6 col-xl-4">
              <label className="form-label" htmlFor="import-type">Loại dữ liệu</label>
              <select id="import-type" className="form-select" value={importType} onChange={(event) => setImportType(event.target.value)}>
                {Object.entries(importTypes).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {importType === 'Participations' && (
              <div className="col-12 col-md-6 col-xl-4">
                <label className="form-label" htmlFor="import-activity">Hoạt động</label>
                <select id="import-activity" className="form-select" defaultValue="">
                  <option value="" disabled>Chọn hoạt động</option>
                  {sampleActivities.map(({ activityId, code, name }) => (
                    <option key={activityId} value={activityId}>{code} · {name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-12 col-md-6 col-xl-4">
              <label className="form-label" htmlFor="import-file">Tệp dữ liệu</label>
              <input id="import-file" className="form-control" type="file" accept=".xlsx,.csv" aria-describedby="import-file-help" />
              <div id="import-file-help" className="form-text">Định dạng .xlsx hoặc .csv. Chưa xử lý tệp trong bản giao diện này.</div>
            </div>
          </div>
          <button type="button" className="btn btn-primary admin-primary-button" disabled>Xem trước tệp</button>
        </div>
      </section>

      <section className="card rounded-4 mb-4" aria-labelledby="import-preview">
        <div className="card-body p-3 p-md-4">
          <h2 id="import-preview" className="h5 mb-2">Xem trước dữ liệu mẫu</h2>
          <p className="text-body-secondary mb-3">{sampleBatch.fileName} · {importTypes[sampleBatch.importType]} · {previewActivity.name}</p>
          <div className="admin-table-scroll" role="region" aria-label="Các dòng xem trước" tabIndex={0}>
            <table className="table align-middle mb-0 admin-data-table import-preview-table">
              <thead>
                <tr>
                  <th scope="col">Dòng Excel</th>
                  <th scope="col">MSSV</th>
                  <th scope="col">Kết quả</th>
                  <th scope="col">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map(({ rowNumber, studentCode, processingStatus, errorMessage }) => {
                  const status = rowStatuses[processingStatus]
                  return (
                    <tr key={rowNumber}>
                      <th scope="row">{rowNumber}</th>
                      <td>{studentCode}</td>
                      <td><span className={'badge ' + status.badge}>{status.label}</span></td>
                      <td>{errorMessage ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-primary admin-primary-button mt-3" disabled>Xác nhận nhập</button>
        </div>
      </section>

      <section className="card rounded-4" aria-labelledby="import-history">
        <div className="card-body p-3 p-md-4">
          <h2 id="import-history" className="h5 mb-3">Lịch sử nhập mẫu</h2>
          <div className="admin-table-scroll" role="region" aria-label="Lịch sử các đợt nhập" tabIndex={0}>
            <table className="table align-middle mb-0 admin-data-table import-history-table">
              <thead>
                <tr>
                  <th scope="col">Tên tệp</th>
                  <th scope="col">Loại dữ liệu</th>
                  <th scope="col">Ngày nhập</th>
                  <th scope="col" className="text-end">Tổng dòng</th>
                  <th scope="col" className="text-end">Thành công</th>
                  <th scope="col" className="text-end">Trùng</th>
                  <th scope="col" className="text-end">Bỏ qua</th>
                  <th scope="col" className="text-end">Lỗi</th>
                  <th scope="col">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {sampleHistory.map((batch) => (
                  <tr key={batch.batchId}>
                    <th scope="row">{batch.fileName}</th>
                    <td>{importTypes[batch.importType]}</td>
                    <td>{dateFormatter.format(new Date(batch.importedAt))}</td>
                    <td className="text-end">{batch.totalRows}</td>
                    <td className="text-end">{batch.successRows}</td>
                    <td className="text-end">{batch.duplicateRows}</td>
                    <td className="text-end">{batch.skippedRows}</td>
                    <td className="text-end">{batch.errorRows}</td>
                    <td><span className="badge text-bg-success">{batchStatuses[batch.batchStatus]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}
