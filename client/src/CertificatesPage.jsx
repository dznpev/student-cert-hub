import { certificateStatuses } from './certificateStatuses.js'
import { sampleActivities } from './sampleActivities.js'
import { sampleParticipations } from './sampleParticipations.js'
import { sampleStudents } from './sampleStudents.js'

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

export default function CertificatesPage() {
  return (
    <>
      <h1 className="page-title mb-2">Chứng nhận</h1>
      <p className="text-body-secondary mb-4">Dữ liệu mẫu</p>

      <div className="card rounded-4">
        <div className="card-body p-3 p-md-4">
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
                {sampleCertificates.map(({ certificateCode, participationId, issuedAt, status }) => {
                  const participation = sampleParticipations.find((item) => item.participationId === participationId)
                  const student = sampleStudents.find((item) => item.studentId === participation?.studentId)
                  const activity = sampleActivities.find((item) => item.activityId === participation?.activityId)
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
