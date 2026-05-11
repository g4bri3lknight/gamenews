'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { getNews, getUpcomingReleases, getFollowedGames, followGame, unfollowGame, getFreeGames, getDeals } from '@/lib/api'
import type { FreeGame, GameDeal } from '@/lib/api'
import {
  timeAgo, formatCountdown, getSourceColor, getStoreInfo,
} from '@/lib/constants'
import type { NewsArticle, GameRelease, FollowedGame } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Newspaper, Gamepad2, Star, ArrowRight, ExternalLink,
  Calendar, Heart, Plus, Clock, TrendingUp, RefreshCw, ChevronLeft, ChevronRight,
  Gift, Percent,
} from 'lucide-react'

// ============================================
// REUSABLE HORIZONTAL SCROLL SECTION
// ============================================

interface ScrollSectionProps {
  title: string
  icon: React.ReactNode
  description: string
  action?: React.ReactNode
  children: React.ReactNode
  loading: boolean
  emptyIcon?: React.ElementType
  emptyText?: string
  hasItems?: boolean
}

function ScrollSection({
  title, icon, description, action, children,
  loading, emptyIcon: EmptyIcon, emptyText, hasItems = true,
}: ScrollSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' })
  }

  return (
    <Card className="overflow-visible">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            {icon}
            <span className="truncate">{title}</span>
          </CardTitle>
          <CardDescription className="hidden sm:block text-xs sm:text-sm">{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-56 sm:w-64 bg-card border border-border rounded-xl overflow-hidden">
                <Skeleton className="w-full aspect-video" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : hasItems ? (
          <div className="relative group/scroll">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 backdrop-blur border border-border rounded-full shadow-md h-8 w-8 opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden sm:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div ref={scrollRef} className="overflow-x-auto scroll-smooth no-scrollbar">
              <div className="flex gap-3 pt-1 pb-3">
                {children}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 backdrop-blur border border-border rounded-full shadow-md h-8 w-8 opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden sm:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : EmptyIcon && emptyText ? (
          <div className="h-28 flex flex-col items-center justify-center text-muted-foreground">
            <EmptyIcon className="h-8 w-8 mb-2" />
            <p className="text-sm">{emptyText}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ============================================
// NEWS CARD
// ============================================

function NewsCard({ article }: { article: NewsArticle }) {
  const sourceColor = getSourceColor(article.source)
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-56 sm:w-64 bg-card border border-border rounded-xl overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Newspaper className="h-8 w-8 text-muted-foreground" /></div>
        )}
        <Badge className="absolute top-2 left-2 text-white text-[10px] px-2 py-0.5 border-0" style={{ backgroundColor: sourceColor }}>
          {article.source}
        </Badge>
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{article.title}</h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate max-w-[110px]">{article.author || article.source}</span>
          <span className="flex-shrink-0">{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
    </a>
  )
}

// ============================================
// RELEASE CARD (vertical, same style as NewsCard)
// ============================================

function ReleaseCard({
  release, followedGames, onFollow, onUnfollow,
}: {
  release: GameRelease
  followedGames: FollowedGame[]
  onFollow: (release: GameRelease) => void
  onUnfollow: (id: string) => void
}) {
  const isFollowed = followedGames.some(g => g.rawgId === release.id)
  const followedEntry = followedGames.find(g => g.rawgId === release.id)

  async function toggleFollow(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (isFollowed && followedEntry) await onUnfollow(followedEntry.id)
    else await onFollow(release)
  }

  return (
    <a
      href={`https://rawg.io/games/${release.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-56 sm:w-64 bg-card border border-border rounded-xl overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {release.backgroundImage ? (
          <img src={release.backgroundImage} alt={release.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Gamepad2 className="h-8 w-8 text-muted-foreground" /></div>
        )}
        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 border-0 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {release.released ? formatCountdown(release.released) : 'TBA'}
        </Badge>
        {isFollowed && (
          <Badge className="absolute top-2 right-2 bg-heart/20 text-heart text-[10px] px-1.5 py-0.5 border-0">
            <Heart className="h-3 w-3 fill-heart" />
          </Badge>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{release.name}</h3>
        <div className="flex flex-wrap items-center gap-1">
          {release.genres.slice(0, 2).map(genre => (
            <Badge key={genre} variant="secondary" className="text-[10px] px-1.5 py-0">{genre}</Badge>
          ))}
          {release.rating > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
              <Star className="h-3 w-3 text-star fill-star" />
              {release.rating.toFixed(1)}
            </span>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={toggleFollow} className="w-full gap-1.5 text-xs h-7 mt-1 hover:bg-muted">
          {isFollowed ? <Heart className="h-3 w-3 fill-heart text-heart" /> : <Plus className="h-3 w-3" />}
          {isFollowed ? 'Non seguire' : 'Segui'}
        </Button>
      </div>
    </a>
  )
}

// ============================================
// FOLLOWED GAME CARD (vertical, same style)
// ============================================

function FollowedGameCard({ game }: { game: FollowedGame }) {
  return (
    <a
      href={`https://rawg.io/games/${game.rawgId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-56 sm:w-64 bg-card border border-border rounded-xl overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {game.imageUrl ? (
          <img src={game.imageUrl} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Gamepad2 className="h-8 w-8 text-muted-foreground" /></div>
        )}
        <Badge className="absolute top-2 left-2 bg-heart/20 text-heart text-[10px] px-1.5 py-0.5 border-0 flex items-center gap-0.5">
          <Heart className="h-3 w-3 fill-heart" /> Seguito
        </Badge>
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{game.title}</h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 flex-shrink-0" />
            {formatCountdown(game.releasedAt)}
          </span>
          {game.rating > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 text-star fill-star" />
              {game.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </a>
  )
}

// ============================================
// FREE GAME CARD (compact, dashboard)
// ============================================

function FreeGameCard({ deal }: { deal: FreeGame }) {
  const storeInfo = getStoreInfo(deal.storeID)
  return (
    <a
      href={deal.dealUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-56 sm:w-64 bg-card border border-border rounded-xl overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {deal.thumb ? (
          <img src={deal.thumb} alt={deal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Gift className="h-8 w-8 text-muted-foreground" /></div>
        )}
        <Badge className="absolute top-2 right-2 bg-success text-success-foreground text-[10px] px-2 py-0.5 border-0 font-bold">GRATIS</Badge>
        <Badge className="absolute top-2 left-2 text-white text-[10px] px-2 py-0.5 border-0" style={{ backgroundColor: storeInfo.color }}>
          {storeInfo.name}
        </Badge>
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{deal.title}</h3>
        <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs h-7">
          <ExternalLink className="h-3 w-3" /> Ottieni gratis
        </Button>
      </div>
    </a>
  )
}

// ============================================
// DEAL CARD (compact, dashboard)
// ============================================

function DealCard({ deal }: { deal: GameDeal }) {
  const storeInfo = getStoreInfo(deal.storeID)
  const savings = Math.round(parseFloat(deal.savings))
  const isFree = deal.salePrice === '0.00'

  return (
    <a
      href={deal.dealUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-56 sm:w-64 bg-card border border-border rounded-xl overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {deal.thumb ? (
          <img src={deal.thumb} alt={deal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Percent className="h-8 w-8 text-muted-foreground" /></div>
        )}
        {savings > 0 && (
          <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded">-{savings}%</span>
        )}
        <Badge className="absolute top-2 left-2 text-white text-[10px] px-2 py-0.5 border-0" style={{ backgroundColor: storeInfo.color }}>
          {storeInfo.name}
        </Badge>
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{deal.title}</h3>
        <div className="flex items-center gap-2">
          {isFree ? (
            <span className="text-sm font-bold text-green-500">GRATIS</span>
          ) : (
            <>
              <span className="text-xs line-through text-muted-foreground">{parseFloat(deal.normalPrice).toFixed(2)}&euro;</span>
              <span className="text-sm font-bold text-primary">{parseFloat(deal.salePrice).toFixed(2)}&euro;</span>
            </>
          )}
        </div>
      </div>
    </a>
  )
}

// ============================================
// MAIN DASHBOARD VIEW
// ============================================

export default function DashboardView() {
  const { setCurrentView, followedGames, setFollowedGames, addFollowedGame, removeFollowedGame } = useAppStore()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [releases, setReleases] = useState<GameRelease[]>([])
  const [freeGames, setFreeGames] = useState<FreeGame[]>([])
  const [deals, setDeals] = useState<GameDeal[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [newsLoading, setNewsLoading] = useState(true)
  const [releasesLoading, setReleasesLoading] = useState(true)
  const [freeGamesLoading, setFreeGamesLoading] = useState(true)
  const [dealsLoading, setDealsLoading] = useState(true)
  const [newsRefreshing, setNewsRefreshing] = useState(false)

  // Load news
  useEffect(() => {
    let cancelled = false
    getNews({ limit: 12 })
      .then(data => { if (!cancelled) setArticles(data.articles) })
      .catch(() => { if (!cancelled) setArticles([]) })
      .finally(() => { if (!cancelled) setNewsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleRefreshNews = useCallback(async () => {
    setNewsRefreshing(true)
    try {
      const data = await getNews({ limit: 12, refresh: true })
      setArticles(data.articles)
    } catch { /* silent */ }
    finally { setNewsRefreshing(false) }
  }, [])

  // Load releases
  useEffect(() => {
    let cancelled = false
    getUpcomingReleases({ page: 1, pageSize: 12 })
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
      .finally(() => setInitialLoading(false))
  }, [setFollowedGames])

  // Load free games
  useEffect(() => {
    let cancelled = false
    getFreeGames({ pageNumber: 0, pageSize: 12 })
      .then(data => { if (!cancelled) setFreeGames(data) })
      .catch(() => { if (!cancelled) setFreeGames([]) })
      .finally(() => { if (!cancelled) setFreeGamesLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Load deals
  useEffect(() => {
    let cancelled = false
    getDeals({ pageNumber: 0, pageSize: 12, sortBy: 'Deal Rating' })
      .then(data => { if (!cancelled) setDeals(data) })
      .catch(() => { if (!cancelled) setDeals([]) })
      .finally(() => { if (!cancelled) setDealsLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function handleFollow(release: GameRelease) {
    try {
      const result = await followGame({
        rawgId: release.id, title: release.name, imageUrl: release.backgroundImage,
        releasedAt: release.released, genres: release.genres, rating: release.rating,
      })
      addFollowedGame(result)
    } catch { /* silent */ }
  }

  async function handleUnfollow(id: string) {
    try { await unfollowGame(id); removeFollowedGame(id) } catch { /* silent */ }
  }

  // Skeleton loading
  if (initialLoading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        {/* Sticky header skeleton (hidden on mobile - mobile header is in page.tsx) */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 hidden md:block">
          <div className="h-7 w-48 bg-muted rounded animate-pulse" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-hidden">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex-shrink-0 w-56 bg-card border border-border rounded-xl overflow-hidden">
                    <Skeleton className="w-full aspect-video" />
                    <div className="p-3 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-3/4" /></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Sticky header (hidden on mobile - mobile header is in page.tsx) */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 hidden md:flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground flex-shrink-0">
            <Gamepad2 className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-none">GameVault</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Dashboard Gaming</p>
          </div>
        </div>
      </div>

      {/* NEWS */}
      <ScrollSection
        title="Ultime Notizie"
        icon={<Newspaper className="h-5 w-5" />}
        description="Le notizie gaming piu recenti dalle fonti italiane"
        action={
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleRefreshNews} disabled={newsRefreshing} className="gap-1 h-7 sm:h-8 px-2 text-xs">
              <RefreshCw className={`h-3 w-3 ${newsRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Aggiorna</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentView('news')} className="gap-1 h-7 sm:h-8 px-2 text-xs">
              Tutte <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        }
        loading={newsLoading}
        emptyIcon={Newspaper}
        emptyText="Nessuna notizia disponibile"
        hasItems={articles.length > 0}
      >
        {articles.map(article => <NewsCard key={article.id} article={article} />)}
      </ScrollSection>

      {/* UPCOMING RELEASES */}
      <ScrollSection
        title="Uscite in Arrivo"
        icon={<TrendingUp className="h-5 w-5" />}
        description="Prossimi titoli per PC"
        action={
          <Button variant="outline" size="sm" onClick={() => setCurrentView('calendar')} className="gap-1 h-7 sm:h-8 px-2 text-xs flex-shrink-0">
            Calendario <ArrowRight className="h-3 w-3" />
          </Button>
        }
        loading={releasesLoading}
        emptyIcon={Calendar}
        emptyText="Nessuna uscita in arrivo"
        hasItems={releases.length > 0}
      >
        {releases.slice(0, 12).map(release => (
          <ReleaseCard key={release.id} release={release} followedGames={followedGames} onFollow={handleFollow} onUnfollow={handleUnfollow} />
        ))}
      </ScrollSection>

      {/* FOLLOWED GAMES */}
      {followedGames.length > 0 && (
        <ScrollSection
          title="Giochi Seguiti"
          icon={<Heart className="h-5 w-5 text-heart" />}
          description="I giochi che stai aspettando"
          action={
            <Button variant="outline" size="sm" onClick={() => setCurrentView('calendar')} className="gap-1 h-7 sm:h-8 px-2 text-xs flex-shrink-0">
              Calendario <ArrowRight className="h-3 w-3" />
            </Button>
          }
          loading={false}
          hasItems={followedGames.length > 0}
        >
          {followedGames.map(game => <FollowedGameCard key={game.id} game={game} />)}
        </ScrollSection>
      )}

      {/* FREE GAMES */}
      <ScrollSection
        title="Giochi Gratis"
        icon={<Gift className="h-5 w-5" />}
        description="Giochi attualmente gratuiti su diverse piattaforme"
        action={
          <Button variant="outline" size="sm" onClick={() => setCurrentView('free-games')} className="gap-1 h-7 sm:h-8 px-2 text-xs flex-shrink-0">
            Tutti <ArrowRight className="h-3 w-3" />
          </Button>
        }
        loading={freeGamesLoading}
        emptyIcon={Gift}
        emptyText="Nessun gioco gratis trovato"
        hasItems={freeGames.length > 0}
      >
        {freeGames.slice(0, 12).map(deal => <FreeGameCard key={deal.dealID} deal={deal} />)}
      </ScrollSection>

      {/* DEALS */}
      <ScrollSection
        title="Offerte Gaming"
        icon={<Percent className="h-5 w-5" />}
        description="Le migliori offerte e sconti su PC"
        action={
          <Button variant="outline" size="sm" onClick={() => setCurrentView('deals')} className="gap-1 h-7 sm:h-8 px-2 text-xs flex-shrink-0">
            Tutte <ArrowRight className="h-3 w-3" />
          </Button>
        }
        loading={dealsLoading}
        emptyIcon={Percent}
        emptyText="Nessuna offerta trovata"
        hasItems={deals.length > 0}
      >
        {deals.slice(0, 12).map(deal => <DealCard key={deal.dealID} deal={deal} />)}
      </ScrollSection>
    </div>
  )
}
