import { useTheme } from '../themeContext.js'

// §6.10: the standalone screens have no account menu, so they carry their own
// toggle — otherwise a visitor stays stuck in light mode after signing in.
// The wording matches the account menu's own toggle (R128).
export default function ThemeToggleButton({ className = '' }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button type="button" className={'portal-theme-toggle' + (className ? ' ' + className : '')}
      aria-label={'Chuyển sang chế độ ' + (theme === 'light' ? 'tối' : 'sáng')}
      onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
