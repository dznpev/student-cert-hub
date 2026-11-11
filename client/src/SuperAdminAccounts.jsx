import { useState } from 'react'
import { demoManagementAccounts } from './demoManagementAccounts.js'
import { normalizeSearch } from './normalizeSearch.js'
import { getStudentAccountStatus, studentAccountStatuses } from './studentAccountStatuses.js'

const roles = { admin: 'Admin', superAdmin: 'Super Admin', student: 'Sinh viên' }
const statuses = {
  demo: { label: 'Tài khoản mẫu', badge: 'text-bg-primary' },
  locked: { label: 'Đã khóa', badge: 'text-bg-danger' },
  ...studentAccountStatuses,
}

export default function SuperAdminAccounts({ students, adminLocked, onUpdateAdminLock, onUpdateStudentLock }) {
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
      canToggleLock: accountRole === 'admin',
      locked: accountRole === 'admin' && adminLocked,
    })),
    ...students.map((student) => ({
      id: 'student-' + student.studentId,
      identifier: student.studentCode,
      name: student.fullName,
      role: 'student',
      studentId: student.studentId,
      status: getStudentAccountStatus(student),
      canToggleLock: Boolean(student.userId),
      locked: Boolean(student.accountDisabled),
    })),
  ]
  const visibleRows = rows.filter((row) => (
    (!role || row.role === role) && (!status || row.status === status)
    && normalizeSearch(row.identifier + ' ' + row.name).includes(query)
  ))

  function confirmAccountLock() {
    const { role: accountRole, studentId, identifier, locked } = confirmLock
    if (accountRole === 'admin') onUpdateAdminLock(!locked)
    else onUpdateStudentLock(studentId, !locked)
    setNotice(`Đã ${locked ? 'mở khóa' : 'khóa'} tài khoản ${identifier}.`)
    setConfirmLock(null)
  }

  return (
    <>
      <h1 className="page-title mb-2">Quản lý tài khoản</h1>
      <p className="text-body-secondary mb-4">Danh sách tài khoản và hồ sơ sinh viên dùng thử. Trạng thái khóa được lưu trong phiên hiện tại.</p>
      {confirmLock !== null && (
        <section className="alert alert-warning" aria-labelledby="confirm-account-lock">
          <h2 id="confirm-account-lock" className="h6">{confirmLock.locked ? 'Mở khóa' : 'Khóa'} tài khoản {confirmLock.identifier}?</h2>
          <p>{confirmLock.locked ? 'Tài khoản mẫu có thể đăng nhập lại trong phiên này.' : 'Tài khoản mẫu sẽ bị chặn đăng nhập trong phiên này.'}</p>
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className={'btn ' + (confirmLock.locked ? 'btn-primary' : 'btn-danger')}
              onClick={confirmAccountLock}>{confirmLock.locked ? 'Xác nhận mở khóa' : 'Xác nhận khóa'}</button>
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
                    <td>{row.canToggleLock && (
                      <button type="button" className={'btn btn-sm ' + (row.locked ? 'btn-outline-primary' : 'btn-outline-danger')}
                        disabled={confirmLock !== null}
                        aria-label={`${row.locked ? 'Mở khóa' : 'Khóa'} tài khoản ${row.identifier}`}
                        onClick={() => { setNotice(''); setConfirmLock(row) }}>
                        {row.locked ? 'Mở khóa' : 'Khóa'}
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
