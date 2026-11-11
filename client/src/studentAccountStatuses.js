import { demoStudentActivation } from './demoStudentActivation.js'

export const studentAccountStatuses = {
  active: { label: 'Đã kích hoạt', badge: 'text-bg-success' },
  pending: { label: 'Chờ kích hoạt', badge: 'text-bg-warning' },
  disabled: { label: 'Vô hiệu hóa', badge: 'text-bg-danger' },
  unlinked: { label: 'Chưa liên kết', badge: 'text-bg-secondary' },
}

export function getStudentAccountStatus({ studentCode, userId, accountDisabled, activationPending }) {
  if (userId) return accountDisabled ? 'disabled' : 'active'
  return activationPending || studentCode === demoStudentActivation.studentCode ? 'pending' : 'unlinked'
}
