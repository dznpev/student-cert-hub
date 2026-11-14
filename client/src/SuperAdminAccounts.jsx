import { useState } from 'react'
import ManagementAccountForm from './ManagementAccountForm.jsx'
import PortalChip from './components/PortalChip.jsx'
import PortalTable from './components/PortalTable.jsx'
import { normalizeSearch } from './normalizeSearch.js'
import { getStudentAccountStatus, studentAccountStatuses } from './studentAccountStatuses.js'

const roles = { admin: 'Admin', superAdmin: 'Super Admin', student: 'Sinh viên' }
const statuses = {
  demo: { label: 'Tài khoản mẫu', tone: 'info' },
  locked: { label: 'Đã khóa', tone: 'danger' },
  ...studentAccountStatuses,
}

export default function SuperAdminAccounts({ students, managementAccounts, currentAccountId, onSaveManagementAccount, onUpdateAdminLock, onUpdateStudentLock, onIssueActivationCode, search = '' }) {
  const [editingAccount, setEditingAccount] = useState(null)
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [confirmLock, setConfirmLock] = useState(null)
  const [notice, setNotice] = useState('')
  const [activationTarget, setActivationTarget] = useState(null)
  const [issuedActivation, setIssuedActivation] = useState(null)
  const [activationError, setActivationError] = useState('')
  const query = normalizeSearch(search.trim())
  const rows = [
    ...managementAccounts.map((account) => ({
      id: account.accountId, identifier: account.username, name: account.fullName, role: account.role,
      status: account.disabled ? 'locked' : 'demo',
      canToggleLock: account.accountId !== currentAccountId,
      locked: account.disabled, account,
    })),
    ...students.map((student) => ({
      id: 'student-' + student.studentId,
      identifier: student.studentCode,
      name: student.fullName,
      role: 'student',
      studentId: student.studentId,
      status: getStudentAccountStatus(student),
      canToggleLock: Boolean(student.userId),
      canIssueActivation: getStudentAccountStatus(student) !== 'active' && !student.accountDisabled,
      locked: Boolean(student.accountDisabled),
    })),
  ]
  const visibleRows = rows.filter((row) => (
    (!role || row.role === role) && (!status || row.status === status)
    && normalizeSearch(row.identifier + ' ' + row.name).includes(query)
  ))

  function confirmAccountLock() {
    const { id, role: accountRole, studentId, identifier, locked } = confirmLock
    if (accountRole !== 'student') onUpdateAdminLock(id, !locked)
    else onUpdateStudentLock(studentId, !locked)
    setNotice(`Đã ${locked ? 'mở khóa' : 'khóa'} tài khoản ${identifier}.`)
    setConfirmLock(null)
  }

  return (
    <>
      <h1 className="page-title mb-2">Quản lý tài khoản</h1>
      <p className="text-body-secondary mb-4">Danh sách tài khoản và hồ sơ sinh viên dùng thử. Trạng thái khóa được lưu trong phiên hiện tại.</p>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary" disabled={editingAccount !== null || confirmLock !== null || activationTarget !== null}
          onClick={() => { setEditingAccount({}); setNotice('') }}>Thêm tài khoản quản trị</button>
      </div>
      {editingAccount !== null && <ManagementAccountForm key={editingAccount.accountId ?? 'new'} account={editingAccount.accountId ? editingAccount : null}
        isCurrentAccount={editingAccount.accountId === currentAccountId} onCancel={() => setEditingAccount(null)}
        onSave={(id, values) => {
          const errors = onSaveManagementAccount(id, values)
          if (!Object.keys(errors).length) { setEditingAccount(null); setNotice(id ? 'Đã lưu tài khoản quản trị.' : 'Đã tạo tài khoản quản trị mẫu. Có thể đăng nhập trong phiên này.') }
          return errors
        }} />}
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
      {activationTarget && (
        <section className="alert alert-warning" aria-labelledby="activation-issue-title">
          <h2 id="activation-issue-title" className="h6">Cấp mã kích hoạt mới cho {activationTarget.identifier}?</h2>
          <p>Mã thử mới có hạn 15 phút, dùng một lần và thay thế mã trước trong phiên. Mã sẽ hiển thị tại đây để kiểm tra luồng.</p>
          {activationError && <p className="text-danger" role="alert">{activationError}</p>}
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => {
              const result = onIssueActivationCode(activationTarget.studentId)
              setActivationError(result.error)
              if (result.error) return
              setIssuedActivation(result)
              setActivationTarget(null)
            }}>Cấp mã mới</button>
            <button type="button" className="btn btn-outline-secondary" autoFocus onClick={() => setActivationTarget(null)}>Hủy</button>
          </div>
        </section>
      )}
      {issuedActivation && (
        <section className="alert alert-info" aria-labelledby="activation-issued-title">
          <h2 id="activation-issued-title" className="h6">Mã thử cho MSSV {issuedActivation.studentCode}</h2>
          <p className="text-break mb-2"><code id="issued-activation-code">{issuedActivation.code}</code></p>
          <p className="small mb-2">Hết hạn lúc {new Date(issuedActivation.expiresAt).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}. Mã chỉ dùng để thử trong phiên hiện tại.</p>
          <p className="small mb-2">Mở liên kết thử sẽ chuyển sang màn hình sinh viên trong cùng tab. Chưa gửi email.</p>
          <a className="btn btn-sm btn-outline-primary me-2 mb-2"
            href={'#kich-hoat?' + new URLSearchParams({ mssv: issuedActivation.studentCode, ma: issuedActivation.code })}>Mở liên kết kích hoạt thử</a>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setIssuedActivation(null)}>Ẩn mã</button>
        </section>
      )}
      <section className="card rounded-4" aria-label="Danh sách tài khoản và hồ sơ">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 mb-3">
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
          <PortalTable label="Bảng tài khoản và hồ sơ">
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
                    <td><PortalChip tone={statuses[row.status].tone} label={statuses[row.status].label} /></td>
                    <td><div className="d-flex flex-wrap gap-2">
                      {row.account && <button type="button" className="btn btn-sm btn-outline-primary"
                        aria-label={`Sửa tài khoản ${row.identifier}`} disabled={editingAccount !== null || confirmLock !== null || activationTarget !== null}
                        onClick={() => { setEditingAccount(row.account); setNotice('') }}>Sửa</button>}
                      {row.canToggleLock && (
                      <button type="button" className={'btn btn-sm ' + (row.locked ? 'btn-outline-primary' : 'btn-outline-danger')}
                        disabled={confirmLock !== null || activationTarget !== null || editingAccount !== null}
                        aria-label={`${row.locked ? 'Mở khóa' : 'Khóa'} tài khoản ${row.identifier}`}
                        onClick={() => { setNotice(''); setConfirmLock(row) }}>
                        {row.locked ? 'Mở khóa' : 'Khóa'}
                      </button>
                    )}
                      {row.canIssueActivation && (
                        <button type="button" className="btn btn-sm btn-outline-primary"
                          disabled={confirmLock !== null || activationTarget !== null || editingAccount !== null}
                          aria-label={`Cấp mã kích hoạt ${row.identifier}`}
                          onClick={() => { setActivationTarget(row); setActivationError(''); setIssuedActivation(null); setNotice('') }}>
                          Cấp mã kích hoạt
                        </button>
                      )}
                    </div></td>
                  </tr>
                ))}
                {visibleRows.length === 0 && <tr><td colSpan={5} className="text-center text-body-secondary">Không tìm thấy mục phù hợp.</td></tr>}
              </tbody>
          </PortalTable>
        </div>
      </section>
    </>
  )
}
