import { useState } from 'react'
import { sampleActivities } from './sampleActivities.js'

const activityStatuses = {
  Draft: 'Bản nháp',
  Open: 'Đang mở',
  Closed: 'Đã kết thúc',
  Archived: 'Đã lưu trữ',
}

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

export default function ActivitiesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const query = search.trim().toLocaleLowerCase('vi-VN')
  const visibleActivities = sampleActivities.filter((activity) => {
    const matchesSearch = activity.code.toLocaleLowerCase('vi-VN').includes(query)
      || activity.name.toLocaleLowerCase('vi-VN').includes(query)
    return matchesSearch && (status === '' || activity.status === status)
  })

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h1 className="page-title mb-0">Hoạt động</h1>
        <button type="button" className="btn btn-primary admin-primary-button" disabled>
          Thêm hoạt động
        </button>
      </div>

      <div className="card activities-card">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-7 col-xl-5">
              <label className="form-label" htmlFor="activity-search">Tìm kiếm</label>
              <input
                id="activity-search"
                type="search"
                className="form-control"
                placeholder="Nhập mã hoặc tên hoạt động"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="col-12 col-sm-5 col-xl-3">
              <label className="form-label" htmlFor="activity-status">Trạng thái</label>
              <select
                id="activity-status"
                className="form-select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(activityStatuses).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-table-scroll" role="region" aria-label="Danh sách hoạt động" tabIndex={0}>
            <table className="table align-middle mb-0 admin-data-table activities-table">
              <caption className="visually-hidden">Danh sách hoạt động mẫu</caption>
              <thead>
                <tr>
                  <th scope="col">Mã hoạt động</th>
                  <th scope="col">Tên hoạt động</th>
                  <th scope="col">Bắt đầu</th>
                  <th scope="col">Kết thúc</th>
                  <th scope="col">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {visibleActivities.map((activity) => (
                  <tr key={activity.code}>
                    <th scope="row">{activity.code}</th>
                    <td>{activity.name}</td>
                    <td>{dateFormatter.format(new Date(activity.startDate))}</td>
                    <td>{dateFormatter.format(new Date(activity.endDate))}</td>
                    <td>{activityStatuses[activity.status]}</td>
                  </tr>
                ))}
                {visibleActivities.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-body-secondary">
                      Không tìm thấy hoạt động phù hợp.
                    </td>
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
