import { useState } from 'react'
import { certificateStatuses } from './certificateStatuses.js'

const sampleCertificates = [
  { certificateCode: 'CN-MAU-001', participationId: 2, issuedAt: '2026-10-26', status: 'Issued' },
  { certificateCode: 'CN-MAU-002', participationId: 3, issuedAt: '2026-10-26', status: 'Revoked' },
  { certificateCode: 'CN-MAU-003', participationId: 5, issuedAt: null, status: 'Generating' },
  { certificateCode: 'CN-MAU-004', participationId: 6, issuedAt: null, status: 'Failed' },
]

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

export default function CertificatesPage({ activities, students, participations }) {
  const [selectedActivity, setSelectedActivity] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const visibleCertificates = sampleCertificates
    .map((certificate) => ({
      certificate,
      participation: participations.find(({ participationId }) => participationId === certificate.participationId),
    }))
    .filter(({ certificate, participation }) => {
      const matchesActivity = selectedActivity === '' || String(participation?.activityId) === selectedActivity
      const matchesStatus = selectedStatus === '' || certificate.status === selectedStatus
      return matchesActivity && matchesStatus
    })

  return (
    <>
      <h1 className="page-title mb-2">Chứng nhận</h1>
      <p className="text-body-secondary mb-4">Dữ liệu mẫu</p>

      <div className="card rounded-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-7 col-xl-5">
              <label className="form-label" htmlFor="certificate-activity">Hoạt động</label>
              <select
                id="certificate-activity"
                className="form-select"
                value={selectedActivity}
                onChange={(event) => setSelectedActivity(event.target.value)}
              >
                <option value="">Tất cả hoạt động</option>
                {activities.map(({ activityId, code, name }) => (
                  <option key={activityId} value={activityId}>{code} · {name}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-5 col-xl-3">
              <label className="form-label" htmlFor="certificate-status">Trạng thái chứng nhận</label>
              <select
                id="certificate-status"
                className="form-select"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {certificateStatuses.map(({ status, label }) => (
                  <option key={status} value={status}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-table-scroll" role="region" aria-label="Danh sách chứng nhận" tabIndex={0}>
            <table className="table align-middle mb-0 admin-data-table certificates-table">
              <caption className="visually-hidden">Danh sách chứng nhận mẫu</caption>
              <thead>
                <tr>
                  <th scope="col">Mã chứng nhận</th>
                  <th scope="col">MSSV</th>
                  <th scope="col">Họ và tên</th>
                  <th scope="col">Hoạt động</th>
                  <th scope="col">Ngày phát hành</th>
                  <th scope="col">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {visibleCertificates.map(({ certificate, participation }) => {
                  const { certificateCode, issuedAt, status } = certificate
                  const student = students.find((item) => item.studentId === participation?.studentId)
                  const activity = activities.find((item) => item.activityId === participation?.activityId)
                  const statusInfo = certificateStatuses.find((item) => item.status === status)

                  return (
                    <tr key={certificateCode}>
                      <th scope="row">{certificateCode}</th>
                      <td>{student?.studentCode ?? '—'}</td>
                      <td>{student?.fullName ?? 'Chưa xác định'}</td>
                      <td>{activity?.name ?? 'Chưa xác định'}</td>
                      <td>{issuedAt ? dateFormatter.format(new Date(issuedAt)) : '—'}</td>
                      <td><span className={'badge text-wrap ' + statusInfo.badge}>{statusInfo.label}</span></td>
                    </tr>
                  )
                })}
                {visibleCertificates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-body-secondary">Không tìm thấy chứng nhận phù hợp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
