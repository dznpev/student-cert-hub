import { lazy, Suspense, useEffect, useState } from 'react'
import CertificateTemplateImage from './CertificateTemplateImage.jsx'

const CertificateTemplatePdf = lazy(() => import('./CertificateTemplatePdf.jsx'))

export default function CertificateSnapshotPreview({ certificate, filePreview, onClose }) {
  const file = certificate.templateSnapshot?.templateFile
  const [previewError, setPreviewError] = useState('')

  useEffect(() => {
    if (filePreview) return () => URL.revokeObjectURL(filePreview)
  }, [filePreview])

  return (
    <section className="card rounded-4 mb-4" aria-labelledby="certificate-snapshot-title">
      <div className="card-body p-3 p-md-4">
        <h2 id="certificate-snapshot-title" className="h5">Bản mẫu đã chốt</h2>
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
