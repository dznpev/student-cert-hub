import { useState } from 'react'
import ActivityForm from './ActivityForm.jsx'
import { activityStatuses } from './activityStatuses.js'
import { sampleCertificateTemplates } from './sampleCertificateTemplates.js'

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

export default function ActivitiesPage({ activities, onAddActivity, onUpdateActivity }) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [notice, setNotice] = useState('')
  const [status, setStatus] = useState('')
  const query = search.trim().toLocaleLowerCase('vi-VN')
  const visibleActivities = activities.filter((activity) => {
    const matchesSearch = activity.code.toLocaleLowerCase('vi-VN').includes(query)
      || activity.name.toLocaleLowerCase('vi-VN').includes(query)
    return matchesSearch && (status === '' || activity.status === status)
  })

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h1 className="page-title mb-0">Hoạt động</h1>
        <button type="button" className="btn btn-primary admin-primary-button" disabled={showForm} onClick={() => { setEditingActivity(null); setShowForm(true); setNotice('') }}>
          Thêm hoạt động
        </button>
      </div>

      {showForm && (
        <ActivityForm
          activities={activities}
          initialActivity={editingActivity}
          onCancel={() => setShowForm(false)}
          onSave={(activity) => {
            if (editingActivity) {
              onUpdateActivity(editingActivity.activityId, activity)
            } else {
              onAddActivity(activity)
            }
            setShowForm(false)
            setSearch('')
            setStatus('')
            setNotice((editingActivity ? 'Đã cập nhật hoạt động ' : 'Đã thêm bản nháp ') + activity.code + '.')
          }}
        />
      )}
      {notice && <p className="alert alert-success" role="status">{notice}</p>}

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
                {Object.entries(activityStatuses).map(([value, { label }]) => (
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
                  <th scope="col">Mẫu chứng nhận</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col" className="text-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleActivities.map((activity) => (
                  <tr key={activity.activityId}>
                    <th scope="row">{activity.code}</th>
                    <td>{activity.name}</td>
                    <td>{dateFormatter.format(new Date(activity.startDate))}</td>
                    <td>{dateFormatter.format(new Date(activity.endDate))}</td>
                    <td>
                      {activity.templateId == null
                        ? 'Dùng mẫu mặc định'
                        : sampleCertificateTemplates.find(({ templateId }) => templateId === activity.templateId)?.templateName ?? 'Chưa xác định'}
                    </td>
                    <td>
                      <span className={'badge text-wrap ' + activityStatuses[activity.status].badge}>
                        {activityStatuses[activity.status].label}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        aria-label={'Sửa hoạt động ' + activity.code}
                        disabled={showForm}
                        onClick={() => {
                          setEditingActivity(activity)
                          setShowForm(true)
                          setNotice('')
                        }}
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleActivities.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-body-secondary">
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
