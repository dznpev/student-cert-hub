import { lazy, Suspense, useEffect, useState } from 'react'
import CertificateTemplateImage from './CertificateTemplateImage.jsx'

const CertificateTemplatePdf = lazy(() => import('./CertificateTemplatePdf.jsx'))

export default function CertificateSnapshotPreview({ certificate, onClose }) {
  const file = certificate.templateSnapshot?.templateFile
  const [filePreview, setFilePreview] = useState(null)
  const [previewError, setPreviewError] = useState('')

  useEffect(() => {
    if (!file) return
    let active = true
    let url
    queueMicrotask(() => {
      if (!active) return
      url = URL.createObjectURL(file)
      setFilePreview(url)
    })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [file])

  return (
    <section className="portal-panel portal-panel--stacked portal-panel--padded" aria-labelledby="certificate-snapshot-title">
      <header className="portal-panel__header">
        <h2 id="certificate-snapshot-title" className="portal-panel__title">Bản mẫu đã chốt</h2>
      </header>
      <div className="portal-panel__body">
        <p className="text-break">{certificate.certificateCode} · {certificate.templateName ?? 'Chưa có tên mẫu'} · v{certificate.templateVersion ?? '—'}</p>
        <p className="small text-body-secondary">Tệp và vị trí chữ/QR được giữ cùng yêu cầu chứng nhận trong phiên này. Nội dung xem thử dùng dữ liệu minh họa.</p>
        {!file ? <p className="alert alert-info">Chưa có tệp mẫu được lưu cho chứng nhận này.</p>
          : filePreview && !previewError && <>
            <p className="small text-break">{file.name}</p>
            {file.type === 'application/pdf' ? <Suspense fallback={<p role="status">Đang mở PDF…</p>}>
              <CertificateTemplatePdf url={filePreview} fileName={file.name} fieldPositions={certificate.templateSnapshot.fieldPositions} />
            </Suspense> : <CertificateTemplateImage src={filePreview} fileName={file.name}
              fieldPositions={certificate.templateSnapshot.fieldPositions} onError={() => setPreviewError('Không mở được ảnh mẫu đã lưu.')} />}
          </>}
        {previewError && <p className="alert alert-danger" role="alert">{previewError}</p>}
        <button type="button" className="btn btn-outline-secondary mt-3" onClick={onClose}>Đóng bản mẫu</button>
      </div>
    </section>
  )
}
