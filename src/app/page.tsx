'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { AppSidebar } from '@/components/app-sidebar'
import DashboardView from '@/components/views/dashboard'
import { NewsView } from '@/components/views/news'
import { CalendarView } from '@/components/views/calendar'
import SettingsView from '@/components/views/settings'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import { Gamepad2 } from 'lucide-react'

export default function Home() {
  const { currentView } = useAppStore()
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(0)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const main = mainRef.current
    if (!main) return

    function handleScroll() {
      setShowScrollTop(main.scrollTop > 300)
    }

    main.addEventListener('scroll', handleScroll, { passive: true })
    return () => main.removeEventListener('scroll', handleScroll)
  }, [])

  // Track sidebar width via ResizeObserver on sibling
  useEffect(() => {
    const sidebar = document.querySelector<HTMLElement>('aside')
    if (!sidebar) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSidebarWidth(entry.contentRect.width)
      }
    })
    ro.observe(sidebar)
    // Initial value via requestAnimationFrame to avoid synchronous setState
    const raf = requestAnimationFrame(() => {
      setSidebarWidth(sidebar.offsetWidth)
    })
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  function scrollToTop() {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main ref={mainRef} className="flex-1 overflow-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 lg:p-8 pb-20"
          >
            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'news' && <NewsView />}
            {currentView === 'calendar' && <CalendarView />}
            {currentView === 'settings' && <SettingsView />}
          </motion.div>
        </AnimatePresence>

        {/* Fixed Footer */}
        <footer
          className="fixed bottom-0 right-0 border-t border-border bg-card/80 backdrop-blur-md z-40 transition-[left] duration-300"
          style={{ left: sidebarWidth > 0 ? `${sidebarWidth}px` : 0 }}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 h-12">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Gamepad2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">GameVault</span>
              <span className="hidden md:inline">·</span>
              <span className="hidden md:inline">News & Calendar</span>
            </div>
            <Button
              size="icon"
              variant={showScrollTop ? 'default' : 'ghost'}
              onClick={scrollToTop}
              className={`h-8 w-8 transition-all duration-300 ${
                showScrollTop
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
              aria-label="Torna in cima"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
          </div>
        </footer>
      </main>
    </div>
  )
}
