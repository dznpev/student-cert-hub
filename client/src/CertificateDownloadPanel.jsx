import { useEffect, useState } from 'react'

export default function CertificateDownloadPanel({ request, certificates, onClose }) {
  const [downloadStatus, setDownloadStatus] = useState('idle')
  const [outcome, setOutcome] = useState('success')
  const records = request.certificateIds.map((id) => certificates.find((item) => item.certificateId === id))
  const unavailable = records.some((item) => !item || item.status !== 'Issued')

  useEffect(() => {
    if (downloadStatus !== 'preparing') return
    const timer = window.setTimeout(() => setDownloadStatus(outcome === 'success' ? 'ready' : 'failed'), 700)
    return () => window.clearTimeout(timer)
  }, [downloadStatus, outcome])

  return (
    <section className="portal-panel portal-panel--stacked portal-panel--padded" aria-labelledby="certificate-download-title">
      <header className="portal-panel__header">
        <h2 id="certificate-download-title" className="portal-panel__title">{request.format === 'zip' ? 'Tải ZIP theo lô' : 'Tải PDF chứng nhận'}</h2>
      </header>
      <div className="portal-panel__body">
        <p className="small text-body-secondary">Bản xem thử giao diện. Chưa kết nối API cấp tệp và kiểm tra quyền tải; thao tác này chưa tải tệp thật.</p>
        <p className="text-break">{records.length} chứng nhận · {records.map((item) => item?.certificateCode ?? 'Không còn dữ liệu').join(', ')}</p>
        {unavailable ? <p className="alert alert-warning" role="alert">Có chứng nhận không còn hiệu lực. Hãy đóng bảng tải và chọn lại chứng nhận.</p> : <>
          <label htmlFor="download-demo-outcome" className="form-label">Kết quả chuẩn bị thử</label>
          <select id="download-demo-outcome" className="fld w-100 mb-3" value={outcome} disabled={downloadStatus === 'preparing'}
            onChange={(event) => { setOutcome(event.target.value); setDownloadStatus('idle') }}>
            <option value="success">Sẵn sàng (mô phỏng)</option>
            <option value="failure">Lỗi chuẩn bị tệp (mô phỏng)</option>
          </select>
          <p className={'alert ' + (downloadStatus === 'failed' ? 'alert-danger' : 'alert-info')} role={downloadStatus === 'failed' ? 'alert' : 'status'}>
            {downloadStatus === 'preparing' ? 'Đang chuẩn bị tệp (mô phỏng)…'
              : downloadStatus === 'ready' ? 'Sẵn sàng (mô phỏng). Chờ API cung cấp tệp thật để tải.'
                : downloadStatus === 'failed' ? 'Chuẩn bị tệp thất bại (mô phỏng). Bạn có thể thử lại.'
                  : 'Chưa chuẩn bị tệp. Chọn kết quả để thử giao diện.'}
          </p>
          <div className="d-flex flex-wrap gap-2 mb-2">
            <button type="button" className="btn btn-primary" disabled={downloadStatus === 'preparing'}
              onClick={() => setDownloadStatus('preparing')}>{downloadStatus === 'failed' ? 'Thử chuẩn bị lại' : 'Chuẩn bị thử'}</button>
            {downloadStatus === 'ready' && <button type="button" className="btn btn-outline-primary" disabled>Tải {request.format.toUpperCase()} · Chờ API</button>}
          </div>
        </>}
        <button type="button" className="btn btn-outline-secondary mt-2" onClick={onClose}>Đóng bảng tải</button>
      </div>
    </section>
  )
}
