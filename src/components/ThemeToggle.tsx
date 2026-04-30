'use client'

import { useTheme } from './ThemeProvider'
import { useRef } from 'react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    if (btnRef.current) {
      btnRef.current.classList.remove('theme-burst')
      // Force reflow to restart animation
      void (btnRef.current as HTMLElement).offsetWidth
      btnRef.current.classList.add('theme-burst')
    }
    toggleTheme()
  }

  const isLight = theme === 'light'

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className="theme-toggle-btn"
      title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      aria-label="Toggle theme"
    >
      <span className="theme-toggle-track">
        <span className={`theme-toggle-thumb ${isLight ? 'light' : 'dark'}`}>
          {isLight ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
      </span>
    </button>
  )
}
