// Student navigation is data, not a component: keeping it in its own module
// lets the portal and its tests share the exact ids and titles (R125, R132)
// without tripping the React fast-refresh export rule.
//
// §6.9.1: the student shell has one ungrouped list of four sections. The ids
// must not reuse AppShell's account ids ('profile', 'account', 'password'):
// selecting one of those opens the account panel instead of the section and
// marks two nav items aria-current="page" (R125).
export const studentPages = [
  { id: 'overview', title: 'Tổng quan', iconName: 'overview' },
  { id: 'student-profile', title: 'Hồ sơ', iconName: 'profile' },
  { id: 'participations', title: 'Lượt tham gia', iconName: 'participations' },
  { id: 'certificates', title: 'Chứng nhận', iconName: 'certificates' },
]

export const studentSections = [{ group: null, items: studentPages }]

// R132: the student's own "Hồ sơ" is a navigation section, so the account group
// keeps only the two pages that have no section of their own.
export const studentAccountSections = [
  { id: 'account', title: 'Tài khoản', iconName: 'account' },
  { id: 'password', title: 'Đổi mật khẩu', iconName: 'password' },
]
