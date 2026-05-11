'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const setCurrentTheme = useAppStore((s) => s.setCurrentTheme)

  useEffect(() => {
    const saved = localStorage.getItem('gamevault-theme')
    if (saved) {
      setCurrentTheme(saved)
    } else {
      setCurrentTheme('midnight')
    }
  }, [setCurrentTheme])

  return <>{children}</>
}
