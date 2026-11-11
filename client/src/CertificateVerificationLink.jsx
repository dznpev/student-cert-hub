import { useEffect, useId, useState } from 'react'

export default function CertificateVerificationLink({ certificateCode }) {
  const panelId = useId()
  const [showQr, setShowQr] = useState(false)
  const [qr, setQr] = useState(null)
  const href = '#tra-cuu?ma=' + encodeURIComponent(certificateCode)
  const url = new URL(href, window.location.href).href
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
  const image = qr?.url === url ? qr.image : null
  const failed = qr?.url === url && qr.failed

  useEffect(() => {
    if (!showQr) return
    let canceled = false
    async function generateQr() {
      try {
        const { default: QRCode } = await import('qrcode')
        const image = await QRCode.toDataURL(url, { width: 224, margin: 4, errorCorrectionLevel: 'M' })
        if (!canceled) setQr({ url, image })
      } catch {
        if (!canceled) setQr({ url, failed: true })
      }
    }
    generateQr()
    return () => { canceled = true }
  }, [showQr, url])

  return (
    <div className="mt-3">
      <div className="d-flex flex-wrap gap-2">
        <a className="btn btn-sm btn-outline-primary" href={href}
          aria-label={'Tra cứu chứng nhận ' + certificateCode}>Tra cứu chứng nhận</a>
        <button type="button" className="btn btn-sm btn-outline-secondary"
          aria-controls={panelId} aria-expanded={showQr}
          onClick={() => { if (!showQr && failed) setQr(null); setShowQr(!showQr) }}>
          {showQr ? 'Ẩn mã QR' : 'Hiện mã QR'}
        </button>
      </div>
      <div id={panelId} className="mt-2" hidden={!showQr}>
        {image ? (
          <img className="img-fluid border rounded bg-white" src={image} width="224" height="224"
            alt={'Mã QR tra cứu chứng nhận ' + certificateCode} />
        ) : <p className="small text-body-secondary mb-0" role="status">
          {failed ? 'Chưa tạo được QR. Bạn vẫn có thể bấm Tra cứu chứng nhận.' : 'Đang tạo mã QR…'}
        </p>}
        {isLocal && <p className="small text-body-secondary mt-2 mb-0">Liên kết localhost chỉ mở được trên máy đang chạy dự án.</p>}
      </div>
    </div>
  )
}
