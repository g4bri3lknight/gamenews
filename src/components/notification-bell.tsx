'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { getDeals, getFreeGames } from '@/lib/api'
import type { GameDeal, FreeGame } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Bell,
  Percent,
  Gift,
  ExternalLink,
  X,
  Check,
  Clock,
} from 'lucide-react'
import { formatCountdown } from '@/lib/constants'

export interface GameNotification {
  id: string
  type: 'deal' | 'free' | 'release'
  title: string
  message: string
  url: string
  imageUrl: string
  timestamp: number
  dismissed: boolean
  price?: string
  normalPrice?: string
  savings?: number
  storeID?: string
  storeName?: string
}

const CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
const MAX_NOTIFICATIONS = 50
const NOTIFICATIONS_KEY = 'gamevault-notifications'
const KNOWN_ITEMS_KEY = 'gamevault-known-items' // track already-seen deal/free items

function loadNotifications(): GameNotification[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveNotifications(notifications: GameNotification[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)))
  } catch {
    // ignore
  }
}

function loadKnownItems(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(KNOWN_ITEMS_KEY)
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveKnownItems(items: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KNOWN_ITEMS_KEY, JSON.stringify([...items]))
  } catch {
    // ignore
  }
}

function hashTitle(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

export function NotificationBell() {
  const { followedGames } = useAppStore()
  const [notifications, setNotifications] = useState<GameNotification[]>([])
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const lastCheckRef = useRef(0)
  const prevTitlesRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadNotifications()
    setNotifications(loaded)

    // Initialize known items from existing notifications to prevent duplicates
    const knownItems = loadKnownItems()
    if (knownItems.size === 0 && loaded.length > 0) {
      // Migrate: build known items from existing notifications on first load
      const items = new Set<string>()
      for (const n of loaded) {
        if (n.type === 'deal') items.add(`deal:${n.title.toLowerCase()}`)
        if (n.type === 'free') items.add(`free:${n.title.toLowerCase()}`)
        if (n.type === 'release') items.add(n.id)
      }
      prevTitlesRef.current = items
      saveKnownItems(items)
    } else {
      prevTitlesRef.current = knownItems
    }
    initializedRef.current = true
  }, [])

  const checkForNotifications = useCallback(async () => {
    if (!initializedRef.current) return
    if (followedGames.length === 0) return
    if (Date.now() - lastCheckRef.current < CHECK_INTERVAL) return
    lastCheckRef.current = Date.now()
    setChecking(true)

    try {
      const followedTitles = new Set(followedGames.map(g => g.title.toLowerCase()))

      // Fetch deals and free games in parallel
      const [dealsResult, freeGamesResult] = await Promise.allSettled([
        getDeals({ pageNumber: 0, pageSize: 60, sortBy: 'Deal Rating' }),
        getFreeGames({ pageNumber: 0, pageSize: 60 }),
      ])

      const deals: GameDeal[] = dealsResult.status === 'fulfilled' ? dealsResult.value : []
      const freeGames: FreeGame[] = freeGamesResult.status === 'fulfilled' ? freeGamesResult.value : []

      const newNotifications: GameNotification[] = []
      const currentTitles = new Set<string>(prevTitlesRef.current)

      // Check deals for followed games
      for (const deal of deals) {
        const dealTitle = deal.title.toLowerCase()
        const key = `deal:${dealTitle}`
        currentTitles.add(key)
        if (followedTitles.has(dealTitle) && !prevTitlesRef.current.has(key)) {
          const savings = Math.round(parseFloat(deal.savings))
          newNotifications.push({
            id: `deal-${hashTitle(deal.title)}-${Date.now()}`,
            type: 'deal',
            title: deal.title,
            message: `In offerta a €${parseFloat(deal.salePrice).toFixed(2)} (${savings}% di sconto)`,
            url: deal.dealUrl,
            imageUrl: deal.thumb,
            timestamp: Date.now(),
            dismissed: false,
            price: deal.salePrice,
            normalPrice: deal.normalPrice,
            savings,
            storeID: deal.storeID,
            storeName: deal.storeName,
          })
        }
      }

      // Check free games for followed games
      for (const game of freeGames) {
        const gameTitle = game.title.toLowerCase()
        const key = `free:${gameTitle}`
        currentTitles.add(key)
        if (followedTitles.has(gameTitle) && !prevTitlesRef.current.has(key)) {
          newNotifications.push({
            id: `free-${hashTitle(game.title)}-${Date.now()}`,
            type: 'free',
            title: game.title,
            message: 'Ora disponibile gratuitamente!',
            url: game.dealUrl,
            imageUrl: game.thumb,
            timestamp: Date.now(),
            dismissed: false,
            storeID: game.storeID,
            storeName: game.storeName,
          })
        }
      }

      // Check for release notifications (games released today or within 3 days)
      const now = new Date()
      for (const game of followedGames) {
        if (!game.releasedAt) continue
        const releaseDate = new Date(game.releasedAt)
        const daysUntilRelease = Math.ceil((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilRelease >= 0 && daysUntilRelease <= 3) {
          const releaseKey = `release:${game.title}:${releaseDate.toISOString().split('T')[0]}`
          currentTitles.add(releaseKey)
          const alreadyNotified = prevTitlesRef.current.has(releaseKey)
          const existingDismissed = notifications.some(
            n => n.id === releaseKey && n.dismissed
          )
          if (!alreadyNotified && !existingDismissed) {
            newNotifications.push({
              id: releaseKey,
              type: 'release',
              title: game.title,
              message: daysUntilRelease <= 0
                ? 'È uscito oggi!'
                : formatCountdown(game.releasedAt),
              url: `https://rawg.io/games/${game.rawgId}`,
              imageUrl: game.imageUrl,
              timestamp: Date.now(),
              dismissed: false,
            })
          }
        }
      }

      // Persist known items to prevent re-detection on refresh
      prevTitlesRef.current = currentTitles
      saveKnownItems(currentTitles)

      if (newNotifications.length > 0) {
        setNotifications(prev => {
          const updated = [...newNotifications, ...prev].slice(0, MAX_NOTIFICATIONS)
          saveNotifications(updated)
          return updated
        })
      }
    } catch {
      // silent
    } finally {
      setChecking(false)
    }
  }, [followedGames, notifications])

  // Check on mount and on interval
  useEffect(() => {
    // Small delay to let prevTitlesRef initialize from localStorage
    const timer = setTimeout(() => {
      checkForNotifications()
    }, 1000)
    const interval = setInterval(checkForNotifications, CHECK_INTERVAL)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [checkForNotifications])

  const unreadCount = notifications.filter(n => !n.dismissed).length

  function dismissNotification(id: string) {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
      saveNotifications(updated)
      return updated
    })
  }

  function dismissAll() {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, dismissed: true }))
      saveNotifications(updated)
      return updated
    })
  }

  function clearAll() {
    setNotifications([])
    saveNotifications([])
  }

  const activeNotifications = notifications.filter(n => !n.dismissed)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label="Notifiche"
        >
          {checking ? (
            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold text-sm">Notifiche</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {unreadCount} nuove
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {activeNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissAll}
                className="h-6 text-xs gap-1 px-2"
              >
                <Check className="h-3 w-3" />
                Leggi tutte
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-6 text-xs gap-1 px-2"
              >
                <X className="h-3 w-3" />
                Pulisci
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {followedGames.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground px-4">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Segui dei giochi per ricevere notifiche</p>
              <p className="text-xs mt-1">Vai al Calendario Uscite per iniziare</p>
            </div>
          ) : activeNotifications.length > 0 ? (
            <div className="divide-y divide-border">
              {activeNotifications.map(notification => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  {/* Icon + Image */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted overflow-hidden">
                    {notification.imageUrl ? (
                      <img
                        src={notification.imageUrl}
                        alt={notification.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : notification.type === 'deal' ? (
                      <div className="w-full h-full flex items-center justify-center bg-destructive/10">
                        <Percent className="h-4 w-4 text-destructive" />
                      </div>
                    ) : notification.type === 'free' ? (
                      <div className="w-full h-full flex items-center justify-center bg-success/10">
                        <Gift className="h-4 w-4 text-success" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium leading-tight line-clamp-1">
                      {notification.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.storeName && (
                      <Badge variant="secondary" className="text-[9px] mt-1 px-1.5 py-0 h-4">
                        {notification.storeName}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <a
                      href={notification.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground px-4">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessuna notifica</p>
              <p className="text-xs mt-1">
                Le notifiche vengono controllate ogni 5 minuti
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
