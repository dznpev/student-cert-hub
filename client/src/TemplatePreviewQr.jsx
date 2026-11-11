import { useEffect, useState } from 'react'

export default function TemplatePreviewQr() {
  const [qr, setQr] = useState(null)
  const url = new URL('#tra-cuu?ma=CN-MAU-001', window.location.href).href

  useEffect(() => {
    let canceled = false
    async function generate() {
      try {
        const { default: QRCode } = await import('qrcode')
        const image = await QRCode.toDataURL(url, { width: 320, margin: 4, errorCorrectionLevel: 'M' })
        if (!canceled) setQr({ image })
      } catch {
        if (!canceled) setQr({ failed: true })
      }
    }
    generate()
    return () => { canceled = true }
  }, [url])

  return qr?.image ? (
    <img src={qr.image} alt="QR xem thử chứng nhận CN-MAU-001" className="d-block w-100" draggable={false} />
  ) : <span className="small text-wrap" role="status">{qr?.failed ? 'Không tạo được QR' : 'Đang tạo QR…'}</span>
}
