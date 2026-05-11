'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { getNews, getUpcomingReleases, getFollowedGames, followGame, unfollowGame } from '@/lib/api'
import {
  timeAgo, formatCountdown, renderStars, getSourceColor, formatDateDDMMYYYY,
} from '@/lib/constants'
import type { NewsArticle, GameRelease, FollowedGame } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Newspaper, Gamepad2, Star, ArrowRight, ExternalLink,
  Calendar, Heart, Plus, Clock, TrendingUp, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react'

// ============================================
// NEWS CARD (horizontal scroll)
// ============================================

function NewsCard({ article }: { article: NewsArticle }) {
  const sourceColor = getSourceColor(article.source)

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-72 bg-card border border-border rounded-xl overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <Badge
          className="absolute top-2 left-2 text-white text-[10px] px-2 py-0.5 border-0"
          style={{ backgroundColor: sourceColor }}
        >
          {article.source}
        </Badge>
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate max-w-[120px]">{article.author || article.source}</span>
          <span className="flex-shrink-0">{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
    </a>
  )
}

function NewsCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-72 bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="w-full aspect-video" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  )
}

// ============================================
// RELEASE CARD (horizontal layout for dashboard)
// ============================================

function ReleaseCard({
  release,
  followedGames,
  onFollow,
  onUnfollow,
}: {
  release: GameRelease
  followedGames: FollowedGame[]
  onFollow: (release: GameRelease) => void
  onUnfollow: (id: string) => void
}) {
  const isFollowed = followedGames.some(g => g.rawgId === release.id)
  const followedEntry = followedGames.find(g => g.rawgId === release.id)

  async function toggleFollow(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isFollowed && followedEntry) {
      await onUnfollow(followedEntry.id)
    } else {
      await onFollow(release)
    }
  }

  return (
    <a
      href={`https://rawg.io/games/${release.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
    >
      {/* Cover image */}
      <div className="w-24 h-32 rounded-lg bg-muted overflow-hidden flex-shrink-0">
        {release.backgroundImage ? (
          <img
            src={release.backgroundImage}
            alt={release.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gamepad2 className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {release.name}
          <ExternalLink className="h-3 w-3 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>

        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {release.released ? formatCountdown(release.released) : 'Data TBA'}
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

        <div className="flex flex-wrap items-center gap-1 mt-2">
          {release.genres.slice(0, 3).map(genre => (
            <Badge key={genre} variant="secondary" className="text-[10px] px-1.5 py-0">
              {genre}
            </Badge>
          ))}
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
            PC
          </Badge>
        </div>
      </div>

      {/* Follow button */}
      <Button
        size="icon"
        variant="ghost"
        onClick={toggleFollow}
        className="flex-shrink-0 h-8 w-8 hover:bg-muted"
      >
        {isFollowed ? (
          <Heart className="h-4 w-4 fill-heart text-heart" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </a>
  )
}

function ReleaseCardSkeleton() {
  return (
    <div className="flex items-start gap-4 p-3 rounded-xl bg-card border border-border">
      <Skeleton className="w-24 h-32 rounded-lg flex-shrink-0" />
      <div className="flex-1 py-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
    </div>
  )
}

// ============================================
// FOLLOWED GAME CARD
// ============================================

function FollowedGameCard({ game }: { game: FollowedGame }) {
  return (
    <a
      href={`https://rawg.io/games/${game.rawgId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors group"
    >
      {game.imageUrl ? (
        <img
          src={game.imageUrl}
          alt={game.title}
          className="h-12 w-12 rounded-md object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
          <Gamepad2 className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
          {game.title}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock className="h-3 w-3 flex-shrink-0" />
          {formatCountdown(game.releasedAt)}
        </p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </a>
  )
}

// ============================================
// MINI PAGINATOR
// ============================================

const ITEMS_PER_PAGE = 4

function MiniPaginator({
  total,
  currentPage,
  onPageChange,
}: {
  total: number
  currentPage: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-3 border-t border-border">
      <span className="text-xs text-muted-foreground">
        {currentPage * ITEMS_PER_PAGE - ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, total)} di {total} giochi
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            className="h-7 w-7 p-0 text-xs"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ============================================
// MAIN DASHBOARD VIEW
// ============================================

export default function DashboardView() {
  const { setCurrentView, followedGames, setFollowedGames, addFollowedGame, removeFollowedGame } = useAppStore()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [releases, setReleases] = useState<GameRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsRefreshing, setNewsRefreshing] = useState(false)
  const [releasesLoading, setReleasesLoading] = useState(true)
  const [followedPage, setFollowedPage] = useState(1)

  // Italian date header
  const todayStr = formatDateDDMMYYYY(new Date().toISOString())

  // Load news
  useEffect(() => {
    let cancelled = false
    getNews({ limit: 8 })
      .then(data => { if (!cancelled) setArticles(data.articles) })
      .catch(() => { if (!cancelled) setArticles([]) })
      .finally(() => { if (!cancelled) setNewsLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Refresh news
  const handleRefreshNews = useCallback(async () => {
    setNewsRefreshing(true)
    try {
      const data = await getNews({ limit: 8, refresh: true })
      setArticles(data.articles)
    } catch {
      // silent
    } finally {
      setNewsRefreshing(false)
    }
  }, [])

  // Load releases
  useEffect(() => {
    let cancelled = false
    getUpcomingReleases({ page: 1, pageSize: 8 })
      .then(data => { if (!cancelled) setReleases(data.results) })
      .catch(() => { if (!cancelled) setReleases([]) })
      .finally(() => { if (!cancelled) setReleasesLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Load followed games
  useEffect(() => {
    getFollowedGames()
      .then(setFollowedGames)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [setFollowedGames])

  // Reset page when followed games change
  useEffect(() => {
    setFollowedPage(1)
  }, [followedGames.length])

  async function handleFollow(release: GameRelease) {
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
    } catch {
      // silent fail
    }
  }

  async function handleUnfollow(id: string) {
    try {
      await unfollowGame(id)
      removeFollowedGame(id)
    } catch {
      // silent fail
    }
  }

  // Paginate followed games
  const pagedFollowedGames = followedGames.slice(
    (followedPage - 1) * ITEMS_PER_PAGE,
    followedPage * ITEMS_PER_PAGE,
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-80 mt-2 bg-muted rounded animate-pulse" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-hidden">
              {[...Array(4)].map((_, i) => <NewsCardSkeleton key={i} />)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <ReleaseCardSkeleton key={i} />)}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Il tuo Dashboard Gaming</h1>
          <p className="text-muted-foreground mt-1">{todayStr}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/15">
              <Newspaper className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Notizie Recenti</p>
              <p className="text-2xl font-bold">{articles.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-star/15">
              <Calendar className="h-5 w-5 text-star" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uscite in Arrivo</p>
              <p className="text-2xl font-bold">{releases.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-heart/15">
              <Heart className="h-5 w-5 text-heart" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Giochi Seguiti</p>
              <p className="text-2xl font-bold">{followedGames.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest News — horizontal scroll */}
      <Card className="overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Ultime Notizie
            </CardTitle>
            <CardDescription>Le notizie gaming più recenti dalle fonti italiane</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshNews}
              disabled={newsRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${newsRefreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentView('news')} className="gap-2">
              Vedi tutte
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {newsLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[...Array(4)].map((_, i) => <NewsCardSkeleton key={i} />)}
            </div>
          ) : articles.length > 0 ? (
            <ScrollArea className="w-full">
              <div className="flex gap-4 pt-1 pb-3">
                {articles.map(article => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
              <Newspaper className="h-10 w-10 mb-2" />
              <p className="text-sm">Nessuna notizia disponibile</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Releases — full width horizontal cards */}
      <Card className="overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Uscite in Arrivo
            </CardTitle>
            <CardDescription>Prossimi titoli per PC</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentView('calendar')} className="gap-2">
            Calendario
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {releasesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <ReleaseCardSkeleton key={i} />)}
            </div>
          ) : releases.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1 pb-1">
              {releases.slice(0, 8).map(release => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  followedGames={followedGames}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                />
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
              <Calendar className="h-10 w-10 mb-2" />
              <p className="text-sm">Nessuna uscita in arrivo</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Followed Games — with paginator */}
      {followedGames.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-heart" />
                Giochi Seguiti
              </CardTitle>
              <CardDescription>I giochi che stai aspettando</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentView('calendar')} className="gap-2">
              Vedi Calendario
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pagedFollowedGames.map(game => (
                <FollowedGameCard key={game.id} game={game} />
              ))}
            </div>
            <MiniPaginator
              total={followedGames.length}
              currentPage={followedPage}
              onPageChange={setFollowedPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
