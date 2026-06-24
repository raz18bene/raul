'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('tn_theme') as Theme | null
    if (saved) {
      setTheme(saved)
      document.documentElement.classList.toggle('light-mode', saved === 'light')
    }
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    // Remove transition BEFORE changing class
    document.documentElement.classList.add('no-transition')
    document.documentElement.classList.toggle('light-mode', next === 'light')
    // Re-enable after one frame
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transition')
    })
    setTheme(next)
    localStorage.setItem('tn_theme', next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
