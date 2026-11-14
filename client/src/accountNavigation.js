import { createElement } from 'react'
import PortalIcon from './PortalIcon.jsx'

// Account navigation is data, not a component, so it lives outside AppShell:
// the shell and its tests then share the exact group the admin sidebar shows
// (R132, R138) without tripping the React fast-refresh export rule.
//
// Explicit createElement keeps the module free of JSX: Vitest's SSR transform
// compiles JSX with the classic runtime, which looks React up on the global
// scope at module-evaluation time.
export const BACK_TO_SECTIONS = 'back-to-sections'

const icon = (name) => createElement(PortalIcon, { name })

// §6.9.1: the account sub-navigation lives in its own sidebar group instead of
// replacing the whole navigation, so the user keeps a way back to every section.
// R132: a portal whose own navigation already has "Hồ sơ" can drop the account
// group's copy of it, so two visible items never share a label.
export const DEFAULT_ACCOUNT_ITEMS = [
  { id: 'profile', title: 'Hồ sơ', icon: icon('profile') },
  { id: 'account', title: 'Tài khoản', icon: icon('account') },
  { id: 'password', title: 'Đổi mật khẩu', icon: icon('password') },
]

export function createAccountGroup(items = DEFAULT_ACCOUNT_ITEMS) {
  return {
    group: 'Tài khoản',
    items: [
      ...items,
      { id: BACK_TO_SECTIONS, title: 'Quay lại', icon: icon('back-to-super-admin') },
    ],
  }
}
