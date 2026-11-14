import { createElement } from 'react'
import PortalIcon from './PortalIcon.jsx'

const icon = (name) => createElement(PortalIcon, { name })

// "Nhật ký hệ thống" is one destination per shell, so its group is built once
// and reused by both the admin and the super-admin navigation.
const systemGroup = {
  group: 'Hệ thống',
  items: [{ id: 'audit', title: 'Nhật ký hệ thống', icon: icon('audit') }],
}

// §6.9.3 / R57: only pages that had their own search input show the topbar box.
// This map is the single source of truth for both the placeholder text and
// whether a section gets a search box at all.
const searchPlaceholders = {
  certificates: 'Tìm sinh viên, mã chứng nhận…',
  students: 'Tìm sinh viên, mã chứng nhận…',
  activities: 'Tìm mã hoặc tên hoạt động…',
  audit: 'Tìm trong nhật ký hệ thống…',
  templates: 'Tìm tên mẫu chứng nhận…',
  accounts: 'Tìm tài khoản quản trị…',
  imports: 'Tìm tên tệp đã nhập…',
}

export function searchPlaceholderFor(sectionId) {
  return Object.hasOwn(searchPlaceholders, sectionId) ? searchPlaceholders[sectionId] : null
}

function createBusinessItems(pendingCount) {
  return [
    { id: 'overview', title: 'Tổng quan', icon: icon('overview') },
    { id: 'cohorts', title: 'Khóa tuyển sinh', icon: icon('cohorts') },
    { id: 'students', title: 'Sinh viên', icon: icon('students') },
    { id: 'activities', title: 'Hoạt động', icon: icon('activities') },
    { id: 'participations', title: 'Lượt tham gia', icon: icon('participations'), badge: pendingCount },
    { id: 'certificates', title: 'Chứng nhận', icon: icon('certificates') },
    { id: 'imports', title: 'Nhập dữ liệu Excel', icon: icon('imports') },
  ]
}

export function createAdminSections(pendingCount) {
  return [
    { group: 'Nghiệp vụ', items: createBusinessItems(pendingCount) },
    systemGroup,
  ]
}

export function createSuperAdminSections(pendingCount) {
  return [
    { group: 'Quản trị', items: [
      { id: 'accounts', title: 'Quản lý tài khoản', icon: icon('accounts') },
      { id: 'templates', title: 'Mẫu chứng nhận', icon: icon('templates') },
    ] },
    { group: 'Nghiệp vụ', items: createBusinessItems(pendingCount) },
    systemGroup,
  ]
}

export function createSuperAdminWorkspaceSections(pendingCount) {
  return [
    // §6.9.1: "Về Super Admin" is a back button, so it renders without a group heading.
    { group: null, items: [{ id: 'back-to-super-admin', title: 'Về Super Admin', icon: icon('back-to-super-admin') }] },
    ...createAdminSections(pendingCount),
  ]
}
