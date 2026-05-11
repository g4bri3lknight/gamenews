'use client'

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react'
import { useAppStore } from '@/lib/store'
import { getUpcomingReleases, getFollowedGames, followGame, unfollowGame } from '@/lib/api'
import {
  ITALIAN_MONTHS, ITALIAN_MONTHS_SHORT, formatCountdown, renderStars, formatMonthKey, getTodayMonthKey, formatDateDDMMYYYY,
} from '@/lib/constants'
import type { GameRelease, FollowedGame } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Calendar, Gamepad2, Star, Heart, Plus, ExternalLink, ChevronLeft,
  ChevronRight, Clock, Monitor, Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'

// ============================================
// RELEASE ITEM
// ============================================

function ReleaseItem({
  release,
  isFollowed,
  followedEntry,
  onToggleFollow,
}: {
  release: GameRelease
  isFollowed: boolean
  followedEntry: FollowedGame | undefined
  onToggleFollow: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors group"
    >
      {/* Cover image */}
      <a
        href={`https://rawg.io/games/${release.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0"
      >
        <div className="w-16 h-20 rounded-lg bg-muted overflow-hidden">
          {release.backgroundImage ? (
            <img
              src={release.backgroundImage}
              alt={release.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gamepad2 className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </a>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <a
          href={`https://rawg.io/games/${release.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link"
        >
          <h3 className="font-semibold text-sm leading-tight group-hover/link:text-primary transition-colors">
            {release.name}
            <ExternalLink className="h-3 w-3 inline ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </h3>
        </a>

        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {release.released ? formatDateDDMMYYYY(release.released + 'T12:00:00') : 'Data TBA'}
          </span>
          {release.rating > 0 && (
            <span className="flex items-center gap-0.5">
              {renderStars(release.rating).map(star => (
                <Star
                  key={star}
                  className={`h-2.5 w-2.5 ${star <= Math.round(release.rating * 2) ? 'text-star fill-star' : 'text-muted-foreground'}`}
                />
              ))}
              <span className="ml-0.5">{release.rating.toFixed(1)}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 mt-1.5">
          {release.genres.slice(0, 3).map(genre => (
            <Badge key={genre} variant="secondary" className="text-[10px] px-1.5 py-0">
              {genre}
            </Badge>
          ))}
          {release.platforms.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
              <Monitor className="h-2.5 w-2.5" />
              PC
            </Badge>
          )}
        </div>
      </div>

      {/* Follow button */}
      <Button
        variant={isFollowed ? 'secondary' : 'outline'}
        size="sm"
        onClick={onToggleFollow}
        className="flex-shrink-0 gap-1.5 h-8 text-xs"
      >
        {isFollowed ? (
          <>
            <Heart className="h-3.5 w-3.5 fill-heart text-heart" />
            <span className="hidden sm:inline">Seguito ✓</span>
          </>
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Segui</span>
          </>
        )}
      </Button>
    </motion.div>
  )
}

function ReleaseItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
      <Skeleton className="w-16 h-20 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
      <Skeleton className="h-8 w-16 rounded-md flex-shrink-0" />
    </div>
  )
}

// ============================================
// FOLLOWED GAME CARD (horizontal scroll)
// ============================================

function FollowedGameCard({ game }: { game: FollowedGame }) {
  return (
    <a
      href={`https://rawg.io/games/${game.rawgId}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div
        className="flex-shrink-0 w-48 p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-md group"
      >
        <div className="w-full aspect-video rounded-lg bg-muted overflow-hidden mb-2">
          {game.imageUrl ? (
            <img
              src={game.imageUrl}
              alt={game.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gamepad2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <h4 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {game.title}
        </h4>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatCountdown(game.releasedAt)}</span>
        </div>
      </div>
    </a>
  )
}

// ============================================
// MAIN CALENDAR VIEW
// ============================================

export function CalendarView() {
  const { selectedMonth, setSelectedMonth, followedGames, setFollowedGames, addFollowedGame, removeFollowedGame } = useAppStore()
  const [releases, setReleases] = useState<GameRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  // Parse selected month
  const [year, month] = useMemo(() => {
    const parts = selectedMonth.split('-').map(Number)
    return [parts[0], parts[1]]
  }, [selectedMonth])

  const monthName = ITALIAN_MONTHS[month - 1] || ''

  // Navigate months
  function goToPrevMonth() {
    const d = new Date(year, month - 2, 1)
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  function goToNextMonth() {
    const d = new Date(year, month, 1)
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // Fetch releases
  useEffect(() => {
    let cancelled = false
    startTransition(() => { setLoading(true) })
    getUpcomingReleases({ page: 1, pageSize: 50, month: selectedMonth })
      .then(data => { if (!cancelled) setReleases(data.results) })
      .catch(() => { if (!cancelled) setReleases([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedMonth])

  // Fetch followed games
  useEffect(() => {
    getFollowedGames()
      .then(setFollowedGames)
      .catch(() => {})
  }, [setFollowedGames])

  // Group releases by date
  const groupedReleases = useMemo(() => {
    const groups: Record<string, GameRelease[]> = {}
    releases.forEach(r => {
      const key = r.released || 'TBA'
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })

    // Sort groups: TBA last, others chronologically
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'TBA') return 1
      if (b === 'TBA') return -1
      return new Date(a).getTime() - new Date(b).getTime()
    })

    return sortedKeys.map(key => ({
      date: key,
      releases: groups[key],
    }))
  }, [releases])

  // Toggle follow
  const toggleFollow = useCallback(async (release: GameRelease) => {
    const followedEntry = followedGames.find(g => g.rawgId === release.id)
    if (followedEntry) {
      try {
        await unfollowGame(followedEntry.id)
        removeFollowedGame(followedEntry.id)
      } catch { /* silent */ }
    } else {
      try {
        const result = await followGame({
          rawgId: release.id,
          title: release.name,
          imageUrl: release.backgroundImage,
          releasedAt: release.released,
          genres: release.genres,
          rating: release.rating,
        })
        addFollowedGame(result)
      } catch { /* silent */ }
    }
  }, [followedGames, addFollowedGame, removeFollowedGame])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-7 w-7" />
            Calendario Uscite PC
          </h1>
          <p className="text-muted-foreground mt-1">
            {loading ? 'Caricamento...' : `${releases.length} uscite trovate`}
          </p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevMonth} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[180px] text-center">
            <span className="text-lg font-semibold">
              {monthName} {year}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Followed Games (horizontal scroll) */}
      {followedGames.length > 0 && (
        <Card className="overflow-visible">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-heart" />
              Giochi Seguiti
            </CardTitle>
            <CardDescription>I giochi che stai aspettando</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pt-1 pb-3">
                {followedGames.map(game => (
                  <FollowedGameCard key={game.id} game={game} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Releases list */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <ReleaseItemSkeleton key={i} />)}
          </div>
          <Skeleton className="h-6 w-32 mt-4" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <ReleaseItemSkeleton key={i} />)}
          </div>
        </div>
      ) : groupedReleases.length > 0 ? (
        <div className="space-y-6">
          {groupedReleases.map(({ date, releases: dateReleases }) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                  {date === 'TBA' ? (
                    '📅 Data TBA'
                  ) : (
                    formatDateDDMMYYYY(date + 'T12:00:00')
                  )}
                </h2>
                <Separator className="flex-1" />
                <Badge variant="secondary" className="text-[10px]">
                  {dateReleases.length} giochi
                </Badge>
              </div>

              {/* Release items */}
              <div className="space-y-2">
                {dateReleases.map(release => (
                  <ReleaseItem
                    key={release.id}
                    release={release}
                    isFollowed={followedGames.some(g => g.rawgId === release.id)}
                    followedEntry={followedGames.find(g => g.rawgId === release.id)}
                    onToggleFollow={() => toggleFollow(release)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Calendar className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-medium mb-1">Nessuna uscita trovata</h3>
          <p className="text-sm max-w-md text-center">
            Non ci sono uscite programmate per {monthName} {year}.
            Prova a controllare un altro mese.
          </p>
        </div>
      )}
    </div>
  )
}
