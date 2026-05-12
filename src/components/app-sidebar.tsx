'use client'

import { useState } from 'react'
import { useAppStore, type View } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Newspaper,
  CalendarDays,
  Settings,
  ChevronLeft,
  ChevronRight,
  Gift,
  Percent,
  Bookmark,
} from 'lucide-react'

const navItems: { view: View; icon: React.ReactNode; label: string }[] = [
  { view: 'dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
  { view: 'news', icon: <Newspaper className="h-5 w-5" />, label: 'Notizie' },
  { view: 'calendar', icon: <CalendarDays className="h-5 w-5" />, label: 'Calendario Uscite' },
  { view: 'free-games', icon: <Gift className="h-5 w-5" />, label: 'Giochi Gratis' },
  { view: 'deals', icon: <Percent className="h-5 w-5" />, label: 'Offerte' },
  { view: 'favorites', icon: <Bookmark className="h-5 w-5" />, label: 'Preferiti' },
  { view: 'settings', icon: <Settings className="h-5 w-5" />, label: 'Impostazioni' },
]

function SidebarContent({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen } = useAppStore()

  function handleNav(view: View) {
    setCurrentView(view)
    setSidebarOpen(false)
  }

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Header - empty space, title is in the fixed top header */}
      <div className="min-h-[64px]" />

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <TooltipProvider key={item.view} delayDuration={collapsed ? 0 : 300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentView === item.view ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 h-10 ${currentView === item.view ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'}`}
                  onClick={() => handleNav(item.view)}
                >
                  {item.icon}
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </nav>

      {/* Footer - just collapse toggle */}
      <div className="p-2 flex items-center justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggle}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{collapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen border-r border-sidebar-border transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </aside>

      {/* Mobile sidebar (controlled by store, triggered from page.tsx header) */}
      <div className="md:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-60">
            <SheetTitle className="sr-only">Menu di navigazione</SheetTitle>
            <SidebarContent collapsed={false} onToggle={() => {}} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
