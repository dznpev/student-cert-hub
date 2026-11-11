import { useState } from 'react'
import { previewStudentFile } from './previewStudentFile.js'
import { previewParticipationFile } from './previewParticipationFile.js'
import { summarizeImportRows } from './summarizeImportRows.js'

const importTypes = {
  Students: 'Hồ sơ sinh viên',
  Participations: 'Danh sách lượt tham gia',
}

const rowStatuses = {
  Valid: { label: 'Hợp lệ', badge: 'text-bg-success' },
  Imported: { label: 'Đã nhập', badge: 'text-bg-success' },
  Skipped: { label: 'Bỏ qua', badge: 'text-bg-warning' },
  Duplicate: { label: 'Trùng', badge: 'text-bg-warning' },
  Error: { label: 'Lỗi', badge: 'text-bg-danger' },
}

const batchStatuses = {
  Completed: 'Hoàn tất',
}

function ImportRowStatus({ row }) {
  const status = rowStatuses[row.isDuplicate && row.processingStatus === 'Skipped' ? 'Duplicate' : row.processingStatus]
  return <span className={'badge ' + status.badge}>{status.label}</span>
}

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

export default function ImportsPage({ activities, cohorts, students, participations, importHistory, onImportStudents, onImportParticipations }) {
  const [importType, setImportType] = useState('Participations')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fileError, setFileError] = useState('')
  const [reading, setReading] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState('')
  const [exportingErrorReport, setExportingErrorReport] = useState(false)
  const [errorReportError, setErrorReportError] = useState('')
  const errorRows = preview?.rows.filter(({ processingStatus }) => processingStatus === 'Error') ?? []
  const counts = preview ? summarizeImportRows(preview.rows) : null
  const countDetails = counts && `${counts.duplicateRows} trùng · ${counts.skippedRows} bỏ qua · ${counts.errorRows} lỗi`
  const busy = reading || exportingErrorReport

  function resetPreview() {
    setPreview(null)
    setFileError('')
    setErrorReportError('')
  }

  async function exportErrorReport() {
    if (!errorRows.length || busy) return
    setExportingErrorReport(true)
    setErrorReportError('')
    try {
      const { default: ExcelJS } = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Dòng lỗi')
      sheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }]
      sheet.properties.defaultRowHeight = 22
      sheet.columns = [
        { header: 'Dòng gốc', key: 'rowNumber', width: 15, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'MSSV', key: 'studentCode', width: 25, style: { numFmt: '@', alignment: { vertical: 'middle', wrapText: true } } },
        { header: 'Chi tiết lỗi', key: 'errorMessage', width: 72, style: { alignment: { vertical: 'middle', wrapText: true } } },
      ]
      const header = sheet.getRow(1)
      header.height = 30
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5FC4' } }
      const rows = sheet.addRows(errorRows.map(({ rowNumber, studentCode, errorMessage }) => ({
        rowNumber,
        studentCode: String(studentCode ?? ''),
        errorMessage,
      })))
      rows.forEach((row, index) => {
        if (index % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FC' } }
      })
      const buffer = await workbook.xlsx.writeBuffer()
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `bao-cao-loi-${preview.fileName.replace(/\.(xlsx|csv)$/i, '')}.xlsx`
      document.body.appendChild(link)
      try {
        link.click()
      } finally {
        link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch {
      setErrorReportError('Không tạo được báo cáo lỗi. Bạn hãy thử lại.')
    } finally {
      setExportingErrorReport(false)
    }
  }

  async function readFile() {
    if (!file) {
      setFileError('Chọn tệp dữ liệu trước khi xem.')
      return
    }
    if (importType === 'Participations' && !activities.some(({ activityId }) => String(activityId) === selectedActivity)) {
      setFileError('Chọn hoạt động trước khi xem trước lượt tham gia.')
      return
    }
    resetPreview()
    setReading(true)
    try {
      const rows = importType === 'Students'
        ? await previewStudentFile(file, cohorts, students)
        : await previewParticipationFile(file, Number(selectedActivity), students, participations)
      setPreview({ fileName: file.name, activityId: Number(selectedActivity), rows })
    } catch (error) {
      setFileError(error.message || 'Không đọc được tệp. Hãy kiểm tra và thử lại.')
    } finally {
      setReading(false)
    }
  }

  const [historySearch, setHistorySearch] = useState('')
  const [historyType, setHistoryType] = useState('')
  const fileQuery = historySearch.trim().toLocaleLowerCase('vi-VN')
  const visibleHistory = importHistory.filter(({ fileName, importType }) => {
    const matchesFile = fileName.toLocaleLowerCase('vi-VN').includes(fileQuery)
    const matchesType = historyType === '' || importType === historyType
    return matchesFile && matchesType
  })
  const previewActivity = activities.find(({ activityId }) => String(activityId) === selectedActivity)
  const errorReportButton = errorRows.length > 0 && (
    <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={exportErrorReport}>
      {exportingErrorReport ? 'Đang tạo báo cáo lỗi…' : 'Tải báo cáo lỗi (.xlsx)'}
    </button>
  )

  return (
    <>
      <h1 className="page-title mb-4">Nhập dữ liệu Excel</h1>

      <section className="card rounded-4 mb-4" aria-labelledby="import-settings">
        <div className="card-body p-3 p-md-4">
          <h2 id="import-settings" className="h5 mb-3">Thông tin tệp nhập</h2>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6 col-xl-4">
              <label className="form-label" htmlFor="import-type">Loại dữ liệu</label>
              <select id="import-type" className="form-select" value={importType} disabled={busy} onChange={(event) => { setImportType(event.target.value); resetPreview() }}>
                {Object.entries(importTypes).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {importType === 'Participations' && (
              <div className="col-12 col-md-6 col-xl-4">
                <label className="form-label" htmlFor="import-activity">Hoạt động</label>
                <select id="import-activity" className="form-select" value={selectedActivity} disabled={busy} onChange={(event) => { setSelectedActivity(event.target.value); resetPreview() }}>
                  <option value="" disabled>Chọn hoạt động</option>
                  {activities.map(({ activityId, code, name }) => (
                    <option key={activityId} value={activityId}>{code} · {name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-12 col-md-6 col-xl-4">
              <label className="form-label" htmlFor="import-file">Tệp dữ liệu</label>
              <input id="import-file" className="form-control" type="file" accept=".xlsx,.csv" disabled={busy} onChange={(event) => { setFile(event.target.files[0] ?? null); resetPreview() }} aria-describedby="import-file-help" />
              <div id="import-file-help" className="form-text">.xlsx (sheet đầu tiên) hoặc CSV UTF-8. Bản thử tối đa 5 MB, 1.000 dòng. Giữ MSSV dạng văn bản để bảo toàn số 0 đầu.</div>
            </div>
          </div>
          {importType === 'Students' && (
            <p className="small text-body-secondary">Cột bắt buộc: MSSV, Họ và tên, Mã khóa tuyển sinh. Cột tùy chọn: Email, Lớp.</p>
          )}
          {importType === 'Participations' && (
            <p className="small text-body-secondary">Cột bắt buộc: MSSV. Họ tên sẽ được đối chiếu từ danh sách Sinh viên theo MSSV.</p>
          )}
          {fileError && <p className="alert alert-danger" role="alert">{fileError}</p>}
          <button type="button" className="btn btn-primary admin-primary-button" disabled={busy} onClick={readFile}>
            {reading ? 'Đang đọc tệp…' : 'Xem trước tệp'}
          </button>
        </div>
      </section>

      {importType === 'Students' && (
        <section className="card rounded-4 mb-4" aria-labelledby="student-import-preview">
          <div className="card-body p-3 p-md-4">
            <h2 id="student-import-preview" className="h5 mb-3">Xem trước hồ sơ sinh viên</h2>
            {preview ? (
              <>
                {preview.confirmed && (
                  <p className={preview.batch.errorRows ? 'alert alert-warning' : 'alert alert-success'} role="status">
                    Đã nhập {counts.successRows} hồ sơ trong phiên thử · {countDetails}.
                  </p>
                )}
                <p className="text-body-secondary">
                  {preview.fileName} · {counts.totalRows} dòng{!preview.confirmed && ` · ${counts.validRows} hợp lệ · ${countDetails}`}
                </p>
                <div className="admin-table-scroll" role="region" aria-label="Xem trước hồ sơ sinh viên" tabIndex={0}>
                  <table className="table align-middle mb-0 admin-data-table import-history-table">
                    <thead>
                      <tr>
                        {['STT', 'MSSV', 'Họ và tên', 'Khóa', 'Email', 'Lớp', 'Kết quả', 'Chi tiết'].map((label) => <th scope="col" key={label}>{label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, index) => (
                        <tr key={row.rowNumber}>
                          <th scope="row">{index + 1}</th>
                          <td>{row.studentCode || '—'}</td>
                          <td>{row.fullName || '—'}</td>
                          <td>{row.cohortCode || '—'}</td>
                          <td>{row.email || '—'}</td>
                          <td>{row.className || '—'}</td>
                          <td><ImportRowStatus row={row} /></td>
                          <td>{row.errorMessage ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {!preview.confirmed && (
                    <button
                      type="button"
                      className="btn btn-primary admin-primary-button"
                      disabled={busy || counts.validRows === 0}
                      onClick={() => setPreview(onImportStudents(preview))}
                    >
                      Xác nhận nhập hồ sơ hợp lệ
                    </button>
                  )}
                  {errorReportButton}
                </div>
                {errorReportError && <p className="alert alert-danger mt-3" role="alert">{errorReportError}</p>}
                <p className="small text-body-secondary mt-3 mb-0">
                  {preview.confirmed
                    ? 'Hồ sơ và lịch sử nhập chỉ lưu trong phiên hiện tại. Tài khoản chưa được tạo.'
                    : 'Chỉ các dòng hợp lệ được thêm. Dòng lỗi và trùng được bỏ qua. Dữ liệu hiện chỉ dùng để thử trên frontend.'}
                </p>
              </>
            ) : <p className="text-body-secondary mb-0">Chọn tệp hồ sơ sinh viên rồi bấm Xem trước tệp.</p>}
          </div>
        </section>
      )}

      {importType === 'Participations' && (
        <section className="card rounded-4 mb-4" aria-labelledby="participation-import-preview">
          <div className="card-body p-3 p-md-4">
            <h2 id="participation-import-preview" className="h5 mb-3">Xem trước lượt tham gia</h2>
            {preview ? (
              <>
                {preview.confirmed && (
                  <p className={preview.batch.errorRows ? 'alert alert-warning' : 'alert alert-success'} role="status">
                    Đã nhập {counts.successRows} lượt tham gia · {countDetails}.
                  </p>
                )}
                <p className="text-body-secondary">
                  {preview.fileName} · {previewActivity?.name} · {counts.totalRows} dòng{!preview.confirmed && ` · ${counts.validRows} hợp lệ · ${countDetails}`}
                </p>
                <div className="admin-table-scroll" role="region" aria-label="Xem trước lượt tham gia" tabIndex={0}>
                  <table className="table align-middle mb-0 admin-data-table import-preview-table">
                    <thead>
                      <tr>
                        {['STT', 'MSSV', 'Họ và tên', 'Kết quả', 'Chi tiết'].map((label) => <th scope="col" key={label}>{label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, index) => (
                        <tr key={row.rowNumber}>
                          <th scope="row">{index + 1}</th>
                          <td>{row.studentCode || '—'}</td>
                          <td>{row.fullName || '—'}</td>
                          <td><ImportRowStatus row={row} /></td>
                          <td>{row.errorMessage ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {!preview.confirmed && (
                    <button
                      type="button"
                      className="btn btn-primary admin-primary-button"
                      disabled={busy || counts.validRows === 0}
                      onClick={() => setPreview(onImportParticipations(preview))}
                    >
                      Xác nhận nhập lượt tham gia hợp lệ
                    </button>
                  )}
                  {errorReportButton}
                </div>
                {errorReportError && <p className="alert alert-danger mt-3" role="alert">{errorReportError}</p>}
                <p className="small text-body-secondary mt-3 mb-0">
                  {preview.confirmed
                    ? 'Lượt mới có trạng thái Chờ duyệt. Thay đổi chỉ lưu trong phiên thử.'
                    : 'Chỉ dòng hợp lệ được thêm vào danh sách lượt tham gia.'}
                </p>
              </>
            ) : <p className="text-body-secondary mb-0">Chọn hoạt động và tệp danh sách MSSV rồi bấm Xem trước tệp.</p>}
          </div>
        </section>
      )}

      <section className="card rounded-4" aria-labelledby="import-history">
        <div className="card-body p-3 p-md-4">
          <h2 id="import-history" className="h5 mb-3">Lịch sử nhập</h2>
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-7 col-xl-5">
              <label className="form-label" htmlFor="import-history-search">Tìm tên tệp</label>
              <input
                id="import-history-search"
                type="search"
                className="form-control"
                placeholder="Nhập tên tệp"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
              />
            </div>
            <div className="col-12 col-sm-5 col-xl-3">
              <label className="form-label" htmlFor="import-history-type">Loại dữ liệu</label>
              <select
                id="import-history-type"
                className="form-select"
                value={historyType}
                onChange={(event) => setHistoryType(event.target.value)}
              >
                <option value="">Tất cả loại dữ liệu</option>
                {Object.entries(importTypes).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
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
                  <th scope="col" className="ps-4 ps-lg-5">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {visibleHistory.map((batch) => (
                  <tr key={batch.batchId}>
                    <th scope="row">{batch.fileName}</th>
                    <td>{importTypes[batch.importType]}</td>
                    <td>{dateFormatter.format(new Date(batch.importedAt))}</td>
                    <td className="text-end">{batch.totalRows}</td>
                    <td className="text-end">{batch.successRows}</td>
                    <td className="text-end">{batch.duplicateRows}</td>
                    <td className="text-end">{batch.skippedRows}</td>
                    <td className="text-end">{batch.errorRows}</td>
                    <td className="ps-4 ps-lg-5"><span className={batch.errorRows ? 'badge text-bg-warning' : 'badge text-bg-success'}>{batchStatuses[batch.batchStatus]}{batch.errorRows > 0 && ' · Có lỗi'}</span></td>
                  </tr>
                ))}
                {visibleHistory.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-body-secondary">Không tìm thấy đợt nhập phù hợp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}
