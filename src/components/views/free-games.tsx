'use client'

import { useState, useEffect, useCallback } from 'react'
import { getFreeGames } from '@/lib/api'
import type { FreeGame } from '@/lib/api'
import { DEAL_STORES, getStoreInfo } from '@/lib/constants'

const FREE_GAME_STORES = [
  { value: '', label: 'Tutti' },
  { value: 'epic', label: 'Epic Games' },
  { value: 'steam', label: 'Steam' },
  { value: 'amazon', label: 'Amazon Prime Gaming' },
  { value: 'ubisoft', label: 'Ubisoft' },
  { value: 'gog', label: 'GOG' },
  { value: 'humble', label: 'Humble' },
  { value: 'itchio', label: 'Itch.io' },
  { value: 'indiegala', label: 'IndieGala' },
  { value: 'other', label: 'Altro' },
]
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Gift, RefreshCw, ExternalLink, Loader2, Star } from 'lucide-react'


// ============================================
// FREE GAME CARD
// ============================================

function FreeGameCard({ deal }: { deal: FreeGame }) {
  const storeInfo = getStoreInfo(deal.storeID)
  const metacritic = parseInt(deal.metacriticScore, 10)
  const steamPercent = parseInt(deal.steamRatingPercent, 10)

  return (
    <a
      href={deal.dealUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-card border border-border rounded-xl overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {deal.thumb ? (
          <img
            src={deal.thumb}
            alt={deal.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gift className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        {/* GRATIS badge */}
        <Badge className="absolute top-2 right-2 bg-success text-success-foreground text-[10px] px-2 py-0.5 border-0 font-bold">
          GRATIS
        </Badge>

        {/* Store badge */}
        <Badge
          className="absolute top-2 left-2 text-white text-[10px] px-2 py-0.5 border-0"
          style={{ backgroundColor: storeInfo.color }}
        >
          {storeInfo.name}
        </Badge>
      </div>

      <CardContent className="p-3 space-y-2">
        <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors text-sm">
          {deal.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          {metacritic > 0 && (
            <Badge
              className={`text-[10px] px-1.5 py-0.5 border-0 font-bold ${
                metacritic > 75
                  ? 'bg-green-600 text-white'
                  : metacritic > 60
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-600 text-white'
              }`}
            >
              {metacritic}
            </Badge>
          )}
          {steamPercent > 0 && deal.steamRatingText && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              {steamPercent}% {deal.steamRatingText}
            </span>
          )}
        </div>

        <Button size="sm" variant="primary" className="w-full gap-1.5 text-xs h-7">
          <ExternalLink className="h-3 w-3" />
          Ottieni gratis
        </Button>
      </CardContent>
    </a>
  )
}


// ============================================
// SKELETON CARD
// ============================================

function FreeGameCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="w-full aspect-video" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-7 w-full" />
      </div>
    </div>
  )
}


// ============================================
// FREE GAMES VIEW
// ============================================

export function FreeGamesView() {
  const [games, setGames] = useState<FreeGame[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [store, setStore] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 20

  const fetchGames = useCallback(async (pageNum: number, storeFilter: string, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else if (pageNum === 0) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      const data = await getFreeGames({
        pageNumber: pageNum,
        pageSize,
        storeID: storeFilter || undefined,
      })

      if (isRefresh || pageNum === 0) {
        setGames(data)
      } else {
        setGames(prev => [...prev, ...data])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di caricamento')
      if (pageNum === 0) {
        setGames([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    setPage(0)
    fetchGames(0, store, true)
  }, [store, fetchGames])

  function handleRefresh() {
    setPage(0)
    fetchGames(0, store, true)
  }

  function handleRetry() {
    setPage(0)
    fetchGames(0, store, true)
  }

  function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    fetchGames(nextPage, store)
  }

  const hasMore = games.length >= pageSize && games.length % pageSize === 0

  // Loading skeleton
  if (loading && !refreshing) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-5 w-80 mt-2" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <FreeGameCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="h-7 w-7" />
            Giochi Gratis PC
          </h1>
          <p className="text-muted-foreground mt-1">
            Giochi attualmente gratuiti su diverse piattaforme
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>

      {/* Store filter pills */}
      <div className="flex flex-wrap gap-2">
        {FREE_GAME_STORES.map(s => {
          const storeVal = s.value
          return (
            <button
              key={storeVal}
              onClick={() => setStore(storeVal)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                store === storeVal
                  ? 'text-white border-transparent'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
              style={store === storeVal ? { backgroundColor: getStoreInfo(storeVal).color } : undefined}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Error state */}
      {error ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Gift className="h-10 w-10 text-destructive" />
          </div>
          <h3 className="text-lg font-medium mb-1">Errore di caricamento</h3>
          <p className="text-sm max-w-md text-center mb-4">{error}</p>
          <Button variant="outline" onClick={handleRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Riprova
          </Button>
        </div>
      ) : games.length > 0 ? (
        <>
          {/* Game grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {games.map(deal => (
              <FreeGameCard key={deal.dealID} deal={deal} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="gap-2"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gift className="h-4 w-4" />
                )}
                Carica altri giochi
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Gift className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-medium mb-1">Nessun gioco gratis trovato</h3>
          <p className="text-sm max-w-md text-center">
            Prova a cambiare negozio o riprova piu tardi per trovare nuove offerte gratuite.
          </p>
        </div>
      )}
    </div>
  )
}
