import { demoStudentActivation } from './demoStudentActivation.js'

export const studentAccountStatuses = {
  active: { label: 'Đã kích hoạt', tone: 'success' },
  pending: { label: 'Chờ kích hoạt', tone: 'warn' },
  disabled: { label: 'Vô hiệu hóa', tone: 'danger' },
  unlinked: { label: 'Chưa liên kết', tone: 'mute' },
}

export function getStudentAccountStatus({ studentCode, userId, accountDisabled, activationPending }) {
  if (accountDisabled) return 'disabled'
  if (activationPending) return 'pending'
  if (userId) return 'active'
  return studentCode === demoStudentActivation.studentCode ? 'pending' : 'unlinked'
}
