import { useState } from 'react'

const approvalStatuses = {
  Pending: { label: 'Chờ duyệt', badge: 'text-bg-warning' },
  Approved: { label: 'Đã duyệt', badge: 'text-bg-success' },
  Rejected: { label: 'Từ chối', badge: 'text-bg-danger' },
}

export default function ParticipationsPage({ activities, students, participations }) {
  const [selectedActivity, setSelectedActivity] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const visibleParticipations = participations.filter(({ activityId, approvalStatus }) => {
    const matchesActivity = selectedActivity === '' || String(activityId) === selectedActivity
    const matchesStatus = selectedStatus === '' || approvalStatus === selectedStatus
    return matchesActivity && matchesStatus
  })

  return (
    <>
      <h1 className="page-title mb-2">Lượt tham gia</h1>
      <p className="text-body-secondary mb-4">Dữ liệu mẫu</p>

      <div className="card rounded-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-7 col-xl-5">
              <label className="form-label" htmlFor="participation-activity">Hoạt động</label>
              <select
                id="participation-activity"
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
              <label className="form-label" htmlFor="participation-status">Trạng thái duyệt</label>
              <select
                id="participation-status"
                className="form-select"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(approvalStatuses).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
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
                {visibleParticipations.map(({ participationId, activityId, studentId, approvalStatus }) => {
                  const student = students.find((item) => item.studentId === studentId)
                  const activity = activities.find((item) => item.activityId === activityId)
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
                {visibleParticipations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-body-secondary">Không tìm thấy lượt tham gia phù hợp.</td>
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
