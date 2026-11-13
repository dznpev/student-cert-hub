import { createContext, useContext } from 'react'

export const ThemeContext = createContext(null)

/** Returns the current `{ theme, toggleTheme }` from the nearest ThemeProvider. */
export function useTheme() {
  return useContext(ThemeContext)
}
