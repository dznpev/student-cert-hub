import { useState } from 'react'
import { demoManagementAccounts } from './demoManagementAccounts.js'
import { normalizeSearch } from './normalizeSearch.js'

const roles = { admin: 'Admin', superAdmin: 'Super Admin', student: 'Sinh viên' }
const statuses = {
  demo: { label: 'Tài khoản mẫu', badge: 'text-bg-primary' },
  locked: { label: 'Đã khóa', badge: 'text-bg-danger' },
  linked: { label: 'Đã liên kết', badge: 'text-bg-success' },
  unlinked: { label: 'Chưa liên kết', badge: 'text-bg-secondary' },
}

export default function SuperAdminAccounts({ students, adminLocked, onUpdateAdminLock }) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [confirmLock, setConfirmLock] = useState(null)
  const [notice, setNotice] = useState('')
  const query = normalizeSearch(search.trim())
  const rows = [
    ...Object.entries(demoManagementAccounts).map(([accountRole, account]) => ({
      id: accountRole, identifier: account.username, name: account.label, role: accountRole,
      status: accountRole === 'admin' && adminLocked ? 'locked' : 'demo',
    })),
    ...students.map((student) => ({
      id: 'student-' + student.studentId,
      identifier: student.studentCode,
      name: student.fullName,
      role: 'student',
      status: student.userId ? 'linked' : 'unlinked',
    })),
  ]
  const visibleRows = rows.filter((row) => (
    (!role || row.role === role) && (!status || row.status === status)
    && normalizeSearch(row.identifier + ' ' + row.name).includes(query)
  ))

  return (
    <>
      <h1 className="page-title mb-2">Quản lý tài khoản</h1>
      <p className="text-body-secondary mb-4">Danh sách xem thử gồm tài khoản quản trị mẫu và trạng thái liên kết của hồ sơ sinh viên.</p>
      {confirmLock !== null && (
        <section className="alert alert-warning" aria-labelledby="confirm-admin-lock">
          <h2 id="confirm-admin-lock" className="h6">{confirmLock ? 'Khóa tài khoản admin?' : 'Mở khóa tài khoản admin?'}</h2>
          <p>{confirmLock ? 'Tài khoản Admin mẫu sẽ bị chặn đăng nhập trong phiên này.' : 'Tài khoản Admin mẫu có thể đăng nhập lại trong phiên này.'}</p>
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className={'btn ' + (confirmLock ? 'btn-danger' : 'btn-primary')}
              onClick={() => {
                onUpdateAdminLock(confirmLock)
                setNotice(confirmLock ? 'Đã khóa tài khoản admin.' : 'Đã mở khóa tài khoản admin.')
                setConfirmLock(null)
              }}>{confirmLock ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}</button>
            <button type="button" className="btn btn-outline-secondary" autoFocus onClick={() => setConfirmLock(null)}>Hủy</button>
          </div>
        </section>
      )}
      {notice && <p className="alert alert-success" role="status">{notice}</p>}
      <section className="card rounded-4" aria-label="Danh sách tài khoản và hồ sơ">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label htmlFor="account-search" className="form-label">Tìm kiếm</label>
              <input id="account-search" type="search" className="form-control" placeholder="Tên đăng nhập, MSSV hoặc họ tên"
                value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <label htmlFor="account-role" className="form-label">Vai trò</label>
              <select id="account-role" className="form-select" value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="">Tất cả vai trò</option>
                {Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <label htmlFor="account-status" className="form-label">Trạng thái</label>
              <select id="account-status" className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">Tất cả trạng thái</option>
                {Object.entries(statuses).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
              </select>
            </div>
          </div>
          <div className="admin-table-scroll" role="region" aria-label="Bảng tài khoản và hồ sơ" tabIndex={0}>
            <table className="table align-middle mb-0">
              <thead><tr>
                <th scope="col">Tên đăng nhập / MSSV</th>
                <th scope="col">Tên hiển thị</th>
                <th scope="col">Vai trò</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr></thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.identifier}</th>
                    <td>{row.name}</td>
                    <td>{roles[row.role]}</td>
                    <td><span className={'badge text-wrap ' + statuses[row.status].badge}>{statuses[row.status].label}</span></td>
                    <td>{row.role === 'admin' && (
                      <button type="button" className={'btn btn-sm ' + (adminLocked ? 'btn-outline-primary' : 'btn-outline-danger')}
                        disabled={confirmLock !== null}
                        onClick={() => { setNotice(''); setConfirmLock(!adminLocked) }}>
                        {adminLocked ? 'Mở khóa' : 'Khóa'}
                      </button>
                    )}</td>
                  </tr>
                ))}
                {visibleRows.length === 0 && <tr><td colSpan={5} className="text-center text-body-secondary">Không tìm thấy mục phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}
