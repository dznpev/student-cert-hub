import { sampleActivities } from './sampleActivities.js'
import { sampleParticipations } from './sampleParticipations.js'
import { sampleStudents } from './sampleStudents.js'

const approvalStatuses = {
  Pending: { label: 'Chờ duyệt', badge: 'text-bg-warning' },
  Approved: { label: 'Đã duyệt', badge: 'text-bg-success' },
  Rejected: { label: 'Từ chối', badge: 'text-bg-danger' },
}

export default function ParticipationsPage() {
  return (
    <>
      <h1 className="page-title mb-2">Lượt tham gia</h1>
      <p className="text-body-secondary mb-4">Dữ liệu mẫu</p>

      <div className="card rounded-4">
        <div className="card-body p-3 p-md-4">
          <div className="admin-table-scroll" role="region" aria-label="Danh sách lượt tham gia" tabIndex={0}>
            <table className="table align-middle mb-0 admin-data-table participations-table">
              <caption className="visually-hidden">Danh sách lượt tham gia mẫu</caption>
              <thead>
                <tr>
                  <th scope="col">MSSV</th>
                  <th scope="col">Họ và tên</th>
                  <th scope="col">Hoạt động</th>
                  <th scope="col">Trạng thái duyệt</th>
                </tr>
              </thead>
              <tbody>
                {sampleParticipations.map(({ participationId, activityId, studentId, approvalStatus }) => {
                  const student = sampleStudents.find((item) => item.studentId === studentId)
                  const activity = sampleActivities.find((item) => item.activityId === activityId)
                  const status = approvalStatuses[approvalStatus]

                  return (
                    <tr key={participationId}>
                      <th scope="row">{student?.studentCode ?? '—'}</th>
                      <td>{student?.fullName ?? 'Chưa xác định'}</td>
                      <td>{activity?.name ?? 'Chưa xác định'}</td>
                      <td><span className={'badge text-wrap ' + status.badge}>{status.label}</span></td>
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
