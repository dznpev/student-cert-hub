import { useState } from 'react'
import { certificateStatuses } from './certificateStatuses.js'

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh',
})

const statusMessages = {
  Issued: 'Chứng nhận đang hiệu lực trong dữ liệu mẫu.',
  Revoked: 'Chứng nhận đã bị thu hồi và không còn hiệu lực.',
  Generating: 'Chứng nhận đang được tạo và chưa có hiệu lực.',
  Failed: 'Chứng nhận chưa được phát hành.',
}

export default function CertificateVerification({ initialCode = '', certificates, participations, activities }) {
  const [input, setInput] = useState(initialCode)
  const [searchedCode, setSearchedCode] = useState(() => initialCode.trim().toUpperCase())
  const [error, setError] = useState('')
  const certificate = searchedCode && certificates.find((item) => item.certificateCode?.toUpperCase() === searchedCode)
  const status = certificate && certificateStatuses.find((item) => item.status === certificate.status)
  const participation = certificate && participations.find((item) => item.participationId === certificate.participationId)
  const activity = participation && activities.find((item) => item.activityId === participation.activityId)

  function verify(event) {
    event.preventDefault()
    const code = input.trim().toUpperCase()
    setSearchedCode(code)
    setError(code ? '' : 'Nhập mã chứng nhận để tra cứu.')
  }

  return (
    <main className="student-login-screen">
      <section className="student-login-card card border-0 rounded-4 shadow" aria-labelledby="verify-title">
        <div className="card-body p-4">
          <p className="small fw-semibold text-primary mb-1">Student Cert Hub · Bản xem thử</p>
          <h1 id="verify-title" className="h3 fw-bold mb-3">Tra cứu chứng nhận</h1>
          <form onSubmit={verify} noValidate>
            <label htmlFor="verification-code" className="form-label">Mã chứng nhận</label>
            <input id="verification-code" className="form-control mb-2" value={input} required autoComplete="off"
              onChange={(event) => { setInput(event.target.value); setError(''); setSearchedCode('') }}
              aria-invalid={Boolean(error)} aria-describedby={error ? 'verify-error' : 'verify-example'} />
            <p id="verify-example" className="small text-body-secondary">Ví dụ <code>CN-MAU-001</code></p>
            {error && <p id="verify-error" className="text-danger" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary w-100">Tra cứu</button>
          </form>
          {searchedCode && (
            <div className="mt-3 p-3 bg-body-tertiary rounded-3 text-break" role="status">
              {certificate ? (
                <>
                  <span className={'badge ' + (status?.badge ?? 'text-bg-secondary')}>{status?.label ?? 'Chưa xác định'}</span>
                  <p className="my-2">{statusMessages[certificate.status] ?? 'Chưa xác định được hiệu lực của chứng nhận.'}</p>
                  <dl className="mb-0">
                    <dt>Mã chứng nhận</dt><dd>{certificate.certificateCode}</dd>
                    {activity && <><dt>Hoạt động</dt><dd>{activity.name}</dd></>}
                    {certificate.issuedAt && <><dt>Ngày phát hành</dt><dd className="mb-0">{dateFormat.format(new Date(certificate.issuedAt))}</dd></>}
                  </dl>
                </>
              ) : <p className="mb-0">Không tìm thấy chứng nhận có mã <strong>{searchedCode}</strong>.</p>}
            </div>
          )}
          <a href="#sinh-vien" className="d-inline-block mt-3">Về cổng sinh viên</a>
        </div>
      </section>
    </main>
  )
}
