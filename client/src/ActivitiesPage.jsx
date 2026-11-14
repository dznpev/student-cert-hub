import { useState } from 'react'
import ActivityForm from './ActivityForm.jsx'
import PortalChip from './components/PortalChip.jsx'
import PortalPageHeader from './components/PortalPageHeader.jsx'
import PortalPanel from './components/PortalPanel.jsx'
import PortalTable from './components/PortalTable.jsx'
import { activityStatuses } from './activityStatuses.js'

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

export default function ActivitiesPage({ activities, templates, onAddActivity, onUpdateActivity, search = '', onSearchChange = () => {} }) {
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
      <PortalPageHeader title="Hoạt động" actions={
        <button type="button" className="btn btn-primary" disabled={showForm} onClick={() => { setEditingActivity(null); setShowForm(true); setNotice('') }}>
          Thêm hoạt động
        </button>
      } />

      {showForm && (
        <ActivityForm
          activities={activities}
          templates={templates}
          initialActivity={editingActivity}
          onCancel={() => setShowForm(false)}
          onSave={(activity) => {
            if (editingActivity) {
              onUpdateActivity(editingActivity.activityId, activity)
            } else {
              onAddActivity(activity)
            }
            setShowForm(false)
            onSearchChange('')
            setStatus('')
            setNotice((editingActivity ? 'Đã cập nhật hoạt động ' : 'Đã thêm bản nháp ') + activity.code + '.')
          }}
        />
      )}
      {notice && <p className="alert alert-success" role="status">{notice}</p>}

      <PortalPanel className="portal-panel--stacked portal-panel--padded">
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-5 col-xl-3">
              <label className="form-label" htmlFor="activity-status">Trạng thái</label>
              <select
                id="activity-status"
                className="fld w-100"
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
      </PortalPanel>
      <PortalPanel>
          <PortalTable label="Danh sách hoạt động" minWidth="38rem">
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
                        : templates.find(({ templateId }) => templateId === activity.templateId)?.templateName ?? 'Chưa xác định'}
                    </td>
                    <td>
                      <PortalChip tone={activityStatuses[activity.status].tone} label={activityStatuses[activity.status].label} />
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
          </PortalTable>
      </PortalPanel>
    </>
  )
}
