'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

// Read theme synchronously from localStorage — runs once, avoids mismatch
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem('bs-theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use a lazy initializer so the first client render matches the inline script
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // Sync the data-theme attribute in case it wasn't set by the inline script
  useEffect(() => {
    const stored = localStorage.getItem('bs-theme') as Theme | null
    const active = (stored === 'light' || stored === 'dark') ? stored : 'light'
    setTheme(active)
    document.documentElement.setAttribute('data-theme', active)
  }, [])

  const toggleTheme = useCallback(() => {
    const root = document.documentElement
    root.classList.add('theme-switching')
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('bs-theme', next)
      root.setAttribute('data-theme', next)
      return next
    })
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('theme-switching')
      })
    })
  }, [])

  // Always render the Provider (no conditional return) to avoid hydration mismatch
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
