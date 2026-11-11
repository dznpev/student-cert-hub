import { useEffect, useRef, useState } from 'react'
import CertificateTemplateImage from './CertificateTemplateImage.jsx'
import { normalizeSearch } from './normalizeSearch.js'

const previewTypes = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' }

export default function CertificateTemplatesPage({ templates, onSetDefault, onAddTemplate, onAddVersion, onUpdateStatus }) {
  const [filePreview, setFilePreview] = useState(null)
  const [previewError, setPreviewError] = useState('')
  const [templateNameDraft, setTemplateNameDraft] = useState('')
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState('')
  const [versionTemplateId, setVersionTemplateId] = useState(null)
  const [statusTemplateId, setStatusTemplateId] = useState(null)
  const [statusError, setStatusError] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [templateStatusFilter, setTemplateStatusFilter] = useState('')
  const fileInput = useRef(null)
  const previewHeading = useRef(null)
  const previewUrl = filePreview?.url
  const versionTemplate = templates.find(({ templateId }) => templateId === versionTemplateId)
  const statusTemplate = templates.find(({ templateId }) => templateId === statusTemplateId)
  const canSave = filePreview?.ready && !filePreview.saved && !previewError
    && Boolean(versionTemplate || templateNameDraft.trim())
  const query = normalizeSearch(templateSearch.trim().replace(/\s+/g, ' '))
  const visibleTemplates = templates.filter(({ templateName, isActive, isDefault }) => {
    const matchesStatus = templateStatusFilter === ''
      || (templateStatusFilter === 'active' && isActive)
      || (templateStatusFilter === 'inactive' && !isActive)
      || (templateStatusFilter === 'default' && isDefault)
    return matchesStatus && normalizeSearch(templateName.replace(/\s+/g, ' ')).includes(query)
  })

  useEffect(() => {
    if (previewUrl) return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function openPreview(file, saved = false, fieldPositions = {}) {
    setFilePreview({ file, saved, fieldPositions, ready: file.type === 'application/pdf', url: URL.createObjectURL(file) })
    setPreviewError('')
    setSaveError('')
    setNotice('')
  }

  function choosePreview(event) {
    const file = event.target.files[0]
    setFilePreview(null)
    setPreviewError('')
    setSaveError('')
    setNotice('')
    if (!file) return

    const extension = file.name.match(/\.(pdf|png|jpe?g)$/i)?.[1].toLowerCase()
    const type = previewTypes[extension]
    if (!type || (file.type && file.type !== type)) {
      setPreviewError('Chọn tệp PDF, PNG hoặc JPG để xem trước.')
      return
    }
    if (!file.size) {
      setPreviewError('Tệp đang rỗng. Hãy chọn một tệp khác.')
      return
    }
    openPreview(new File([file], file.name, { type }))
  }

  function clearPreview() {
    fileInput.current.value = ''
    fileInput.current.focus()
    setFilePreview(null)
    setPreviewError('')
    setSaveError('')
  }

  function saveTemplate(event) {
    event.preventDefault()
    if (!canSave) return

    const error = versionTemplate
      ? onAddVersion(versionTemplate.templateId, filePreview.file, filePreview.fieldPositions)
      : onAddTemplate(templateNameDraft, filePreview.file, filePreview.fieldPositions)
    setSaveError(error)
    if (error) return

    const name = versionTemplate?.templateName ?? templateNameDraft.trim()
    const version = versionTemplate ? versionTemplate.version + 1 : 1
    setNotice(`Đã lưu mẫu ${name} · v${version}.`)
    setTemplateNameDraft('')
    setVersionTemplateId(null)
    clearPreview()
  }

  function viewSavedFile(file, fieldPositions) {
    setVersionTemplateId(null)
    fileInput.current.value = ''
    openPreview(file, true, fieldPositions)
    previewHeading.current.focus()
  }

  function startVersion(templateId) {
    setNotice('')
    setVersionTemplateId(templateId)
    clearPreview()
  }

  function confirmStatus() {
    const error = onUpdateStatus(statusTemplate.templateId, !statusTemplate.isActive)
    setStatusError(error)
    if (error) return
    setNotice(`Đã ${statusTemplate.isActive ? 'ngừng sử dụng' : 'sử dụng lại'} mẫu ${statusTemplate.templateName}.`)
    setStatusTemplateId(null)
  }

  return (
    <>
      <h1 className="page-title mb-2">Mẫu chứng nhận</h1>
      <p className="text-body-secondary mb-4">Danh mục mẫu dùng thử. Mẫu mặc định áp dụng cho yêu cầu chứng nhận mới của hoạt động dùng mẫu mặc định. Thay đổi lưu trong phiên hiện tại.</p>
      {notice && <p className="alert alert-success" role="status">{notice}</p>}
      {statusTemplate && (
        <section className="alert alert-warning" aria-labelledby="template-status-title">
          <h2 id="template-status-title" className="h6">
            {statusTemplate.isActive ? 'Ngừng sử dụng' : 'Sử dụng lại'} mẫu {statusTemplate.templateName}?
          </h2>
          <p>{statusTemplate.isActive
            ? 'Mẫu sẽ được ẩn khỏi lựa chọn khi thêm hoạt động. Hoạt động đang dùng mẫu này cần chọn mẫu khác để tạo yêu cầu chứng nhận mới.'
            : 'Mẫu sẽ xuất hiện lại trong danh sách chọn mẫu của hoạt động.'}</p>
          {statusError && <p className="text-danger" role="alert">{statusError}</p>}
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className={'btn ' + (statusTemplate.isActive ? 'btn-danger' : 'btn-success')} onClick={confirmStatus}>Xác nhận</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setStatusTemplateId(null)} autoFocus>Hủy</button>
          </div>
        </section>
      )}

      <div className="card rounded-4 mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-7">
              <label className="form-label" htmlFor="template-search">Tìm tên mẫu</label>
              <input id="template-search" type="search" className="form-control"
                placeholder="Nhập tên mẫu chứng nhận" value={templateSearch}
                onChange={(event) => setTemplateSearch(event.target.value)} />
            </div>
            <div className="col-12 col-md-5">
              <label className="form-label" htmlFor="template-status-filter">Trạng thái</label>
              <select id="template-status-filter" className="form-select" value={templateStatusFilter}
                onChange={(event) => setTemplateStatusFilter(event.target.value)}>
                <option value="">Tất cả mẫu</option>
                <option value="active">Đang sử dụng</option>
                <option value="inactive">Ngừng sử dụng</option>
                <option value="default">Mẫu mặc định</option>
              </select>
            </div>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
            <span className="small text-body-secondary" role="status">Hiển thị {visibleTemplates.length}/{templates.length} mẫu</span>
            {(templateSearch || templateStatusFilter) && (
              <button type="button" className="btn btn-sm btn-outline-secondary"
                onClick={() => { setTemplateSearch(''); setTemplateStatusFilter('') }}>Xóa bộ lọc</button>
            )}
          </div>
          <div className="admin-table-scroll" role="region" aria-label="Danh sách mẫu chứng nhận" tabIndex={0}>
            <table className="table align-middle mb-0 admin-data-table">
              <thead>
                <tr>
                  <th scope="col">Tên mẫu</th>
                  <th scope="col" className="text-nowrap">Phiên bản</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleTemplates.map(({ templateId, templateName, version, isActive, isDefault, templateFile, fieldPositions, previousVersions }) => (
                  <tr key={templateId}>
                    <th scope="row">{templateName}</th>
                    <td>
                      v{version}
                      {previousVersions?.length > 0 && (
                        <details className="mt-1 small">
                          <summary>Lịch sử phiên bản</summary>
                          <ul className="list-unstyled mb-0">
                            {previousVersions.toReversed().map(({ version: previousVersion, templateFile: previousFile, fieldPositions: previousPositions }) => (
                              <li key={previousVersion}>
                                {previousFile ? (
                                  <button type="button" className="btn btn-link btn-sm px-0"
                                    onClick={() => viewSavedFile(previousFile, previousPositions)}>Xem tệp v{previousVersion}</button>
                                ) : <span className="text-body-secondary">v{previousVersion} · Chưa có tệp</span>}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <span className={'badge text-wrap ' + (isActive ? 'text-bg-success' : 'text-bg-secondary')}>
                          {isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                        </span>
                        {isDefault && isActive && <span className="badge text-bg-primary">Mặc định</span>}
                      </div>
                    </td>
                    <td><div className="d-flex flex-wrap gap-2">
                      {templateFile && (
                        <button type="button" className="btn btn-sm btn-outline-primary"
                          aria-label={`Xem tệp mẫu: ${templateName}`} onClick={() => viewSavedFile(templateFile, fieldPositions)}>Xem tệp</button>
                      )}
                      <button type="button" className="btn btn-sm template-version-button"
                        aria-label={`Thêm phiên bản: ${templateName}`} onClick={() => startVersion(templateId)}>Thêm phiên bản</button>
                      {isActive && !isDefault && (
                        <button type="button" className="btn btn-sm btn-outline-success"
                          aria-label={`Đặt làm mặc định: ${templateName}`} onClick={() => onSetDefault(templateId)}>
                          Đặt làm mặc định
                        </button>
                      )}
                      {!isDefault && (
                        <button type="button" className={'btn btn-sm ' + (isActive ? 'btn-outline-danger' : 'btn-outline-success')}
                          disabled={statusTemplateId !== null}
                          aria-label={`${isActive ? 'Ngừng sử dụng' : 'Sử dụng lại'} mẫu: ${templateName}`}
                          onClick={() => { setStatusTemplateId(templateId); setStatusError(''); setNotice('') }}>
                          {isActive ? 'Ngừng sử dụng' : 'Sử dụng lại'}
                        </button>
                      )}
                      {isDefault && <span className="small text-body-secondary">Chọn mẫu mặc định khác trước khi ngừng sử dụng.</span>}
                    </div></td>
                  </tr>
                ))}
                {visibleTemplates.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-body-secondary">
                    {templates.length ? 'Không tìm thấy mẫu phù hợp.' : 'Chưa có mẫu chứng nhận.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <section className="card rounded-4" aria-labelledby="template-preview-title">
        <div className="card-body p-3 p-md-4">
          <h2 id="template-preview-title" className="h5 mb-3" ref={previewHeading} tabIndex={-1}>
            {versionTemplate ? `Thêm phiên bản v${versionTemplate.version + 1} · ${versionTemplate.templateName}` : 'Xem trước tệp mẫu'}
          </h2>
          {versionTemplate && (
            <button type="button" className="btn btn-sm btn-outline-secondary mb-3" onClick={() => startVersion(null)}>
              Hủy thêm phiên bản
            </button>
          )}
          <div className="mb-3">
            <label className="form-label" htmlFor="template-preview-file">Tệp mẫu</label>
            <input id="template-preview-file" className="form-control" type="file" ref={fileInput}
              accept=".pdf,.png,.jpg,.jpeg" aria-describedby="template-preview-help" onChange={choosePreview} />
            <div id="template-preview-help" className="form-text">Có thể đặt vị trí trường trên ảnh PNG hoặc JPG. PDF hỗ trợ xem trước.</div>
          </div>
          {previewError && <p className="alert alert-danger" role="alert">{previewError}</p>}
          {filePreview && (
            <>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span className="fw-medium text-break">{filePreview.file.name}</span>
                {filePreview.file.type === 'application/pdf' && (
                  <a href={filePreview.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">Mở PDF trong tab mới</a>
                )}
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearPreview}>Bỏ tệp</button>
              </div>
              {filePreview.file.type === 'application/pdf' ? (
                <div className="ratio ratio-4x3">
                  <iframe key={filePreview.url} src={filePreview.url} className="border rounded" title={`Xem trước mẫu PDF ${filePreview.file.name}`} />
                </div>
              ) : !previewError && (
                <CertificateTemplateImage key={filePreview.url} src={filePreview.url} fileName={filePreview.file.name}
                  fieldPositions={filePreview.fieldPositions}
                  onChange={!filePreview.saved && filePreview.ready ? (fieldPositions) => setFilePreview((current) => ({ ...current, fieldPositions })) : undefined}
                  onLoad={() => setFilePreview((current) => current?.url === filePreview.url ? { ...current, ready: true } : current)}
                  onError={() => setPreviewError('Không mở được ảnh. Hãy kiểm tra tệp hoặc chọn ảnh khác.')} />
              )}
              {!filePreview.saved && (
                <form className="mt-3" onSubmit={saveTemplate}>
                  {!versionTemplate && (
                    <>
                      <label className="form-label" htmlFor="new-template-name">Tên mẫu mới</label>
                      <input id="new-template-name" className="form-control mb-2" value={templateNameDraft} required
                        onChange={(event) => { setTemplateNameDraft(event.target.value); setSaveError('') }} />
                    </>
                  )}
                  {saveError && <p className="text-danger" role="alert">{saveError}</p>}
                  <button type="submit" className="btn btn-primary" disabled={!canSave}>
                    {versionTemplate ? 'Lưu phiên bản mới' : 'Lưu mẫu mới'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
