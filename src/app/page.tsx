'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { THEMES } from '@/lib/constants'
import { AppSidebar } from '@/components/app-sidebar'
import DashboardView from '@/components/views/dashboard'
import { NewsView } from '@/components/views/news'
import { CalendarView } from '@/components/views/calendar'
import { FreeGamesView } from '@/components/views/free-games'
import { DealsView } from '@/components/views/deals'
import { FavoritesView } from '@/components/views/favorites'
import SettingsView from '@/components/views/settings'
import { GlobalSearchDialog } from '@/components/global-search'
import { NotificationBell } from '@/components/notification-bell'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowUp, Gamepad2, Menu, Search, Moon, Sun } from 'lucide-react'

function HeaderThemeButton() {
  const { currentTheme, setCurrentTheme } = useAppStore()
  const theme = THEMES.find((t) => t.value === currentTheme) || THEMES[0]
  const nextThemeIndex = (THEMES.findIndex((t) => t.value === currentTheme) + 1) % THEMES.length
  const nextTheme = THEMES[nextThemeIndex]

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentTheme(nextTheme.value)}
            className="relative overflow-hidden h-8 w-8"
          >
            <div
              className="absolute inset-0 rounded-md opacity-80"
              style={{ backgroundColor: theme.preview.accent }}
            />
            {theme.type === 'dark' ? (
              <Moon className="h-4 w-4 relative z-10 text-white" />
            ) : (
              <Sun className="h-4 w-4 relative z-10 text-white" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Tema selezionato: {theme.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function Home() {
  const { currentView, setSidebarOpen, searchOpen, setSearchOpen } = useAppStore()
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

  // Cmd+K / Ctrl+K keyboard shortcut for global search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setSearchOpen])

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />

      {/* Global Search Dialog (rendered once, outside views) */}
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Fixed Header - visible on both mobile and desktop */}
      <header
        className="fixed top-0 z-40 flex items-center gap-3 h-14 border-b border-border bg-card/80 backdrop-blur-md transition-[left] duration-300"
        style={{ left: sidebarWidth > 0 ? `${sidebarWidth}px` : 0, right: 0 }}
      >
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 flex-shrink-0"
          onClick={() => setSidebarOpen(true)}
          aria-label="Apri menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo + title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground flex-shrink-0">
            <Gamepad2 className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-base tracking-tight">GameVault</span>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          <HeaderThemeButton />
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSearchOpen(true)}
            aria-label="Cerca"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main ref={mainRef} className="flex-1 overflow-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-4 sm:px-6 lg:px-8 pt-[4.25rem] pb-20"
          >
            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'news' && <NewsView />}
            {currentView === 'calendar' && <CalendarView />}
            {currentView === 'free-games' && <FreeGamesView />}
            {currentView === 'deals' && <DealsView />}
            {currentView === 'favorites' && <FavoritesView />}
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
              variant="ghost"
              onClick={scrollToTop}
              className={`h-8 w-8 ${showScrollTop ? 'flex' : 'hidden'}`}
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
