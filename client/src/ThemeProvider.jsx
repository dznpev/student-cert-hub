import { useLayoutEffect, useState } from 'react'
import { ThemeContext } from './themeContext.js'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('student-cert-theme') === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useLayoutEffect(() => {
    document.documentElement.dataset.bsTheme = theme
    try {
      localStorage.setItem('student-cert-theme', theme)
    } catch {
      // The selected theme still applies when browser storage is unavailable.
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme((current) => current === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  )
}
