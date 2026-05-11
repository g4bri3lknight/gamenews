'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDeals } from '@/lib/api'
import type { GameDeal } from '@/lib/api'
import { DEAL_STORES, DEAL_SORT_OPTIONS, getStoreInfo } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Percent, RefreshCw, ExternalLink, Star, Loader2 } from 'lucide-react'


// ============================================
// DEAL CARD
// ============================================

function DealCard({ deal }: { deal: GameDeal }) {
  const storeInfo = getStoreInfo(deal.storeID)
  const savings = Math.round(parseFloat(deal.savings))
  const metacritic = parseInt(deal.metacriticScore, 10)
  const steamPercent = parseInt(deal.steamRatingPercent, 10)
  const isFree = deal.salePrice === '0.00'

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
            <Percent className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        {/* Discount badge - top right */}
        {savings > 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">
              -{savings}%
            </span>
          </div>
        )}

        {/* Store badge - top left */}
        <div className="absolute top-2 left-2">
          <Badge
            className="text-white text-[10px] px-2 py-0.5 border-0"
            style={{ backgroundColor: storeInfo.color }}
          >
            {storeInfo.name}
          </Badge>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {deal.title}
        </h3>

        {/* Price section */}
        <div className="flex items-center gap-2">
          {isFree ? (
            <span className="text-lg font-bold text-green-500">GRATIS</span>
          ) : (
            <>
              <span className="text-sm line-through text-muted-foreground">
                {parseFloat(deal.normalPrice).toFixed(2)} &euro;
              </span>
              <span className="text-lg font-bold text-primary">
                {parseFloat(deal.salePrice).toFixed(2)} &euro;
              </span>
            </>
          )}
        </div>

        {/* Metacritic score */}
        {metacritic > 0 && (
          <div className="flex items-center gap-1.5">
            <Badge
              className={`text-[10px] font-bold px-1.5 py-0.5 border-0 ${
                metacritic > 75
                  ? 'bg-green-600 text-white'
                  : metacritic > 60
                    ? 'bg-yellow-500 text-black'
                    : ''
              }`}
              variant={metacritic <= 60 ? 'secondary' : undefined}
            >
              {metacritic}
            </Badge>
            <span className="text-[10px] text-muted-foreground">Metacritic</span>
          </div>
        )}

        {/* Steam rating */}
        {steamPercent > 0 && (
          <div className="flex items-center gap-1.5">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">
              {steamPercent}% {deal.steamRatingText}
            </span>
          </div>
        )}

        {/* CTA button */}
        <Button size="sm" variant="outline" className="w-full mt-1 gap-1.5 text-xs">
          <ExternalLink className="h-3 w-3" />
          Vai all&apos;offerta
        </Button>
      </div>
    </a>
  )
}


// ============================================
// SKELETON CARD
// ============================================

function DealCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="w-full aspect-video" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-8 w-full mt-1" />
      </div>
    </div>
  )
}


// ============================================
// DEALS VIEW
// ============================================

export function DealsView() {
  const [deals, setDeals] = useState<GameDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [store, setStore] = useState('')
  const [sortBy, setSortBy] = useState('Deal Rating')
  const [page, setPage] = useState(0)
  const pageSize = 20

  // Fetch deals
  const fetchDeals = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else if (pageNum === 0) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      const data = await getDeals({
        pageNumber: pageNum,
        pageSize,
        storeID: store || undefined,
        sortBy: sortBy || undefined,
      })
      if (pageNum === 0) {
        setDeals(data)
      } else {
        setDeals(prev => [...prev, ...data])
      }
    } catch {
      setError('Errore durante il caricamento delle offerte')
      if (pageNum === 0) {
        setDeals([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }, [store, sortBy, pageSize])

  // Initial fetch
  useEffect(() => {
    fetchDeals(0)
  }, [fetchDeals])

  // Reset and re-fetch when filters change
  useEffect(() => {
    setPage(0)
    fetchDeals(0, true)
  }, [store, sortBy])

  function handleRefresh() {
    setPage(0)
    fetchDeals(0, true)
  }

  function loadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    fetchDeals(nextPage)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Percent className="h-7 w-7" />
            Offerte Gaming PC
          </h1>
          <p className="text-muted-foreground mt-1">
            Le migliori offerte e sconti su PC
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

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Store filter pills */}
        {DEAL_STORES.map(s => {
          const storeVal = s.value
          const info = getStoreInfo(storeVal)
          const isActive = store === storeVal
          return (
            <button
              key={storeVal}
              onClick={() => setStore(storeVal)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? 'text-white border-transparent'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
              style={isActive ? { backgroundColor: info.color } : undefined}
            >
              {s.label}
            </button>
          )
        })}

        {/* Sort dropdown */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[170px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEAL_SORT_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error state */}
      {error && !loading && deals.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Percent className="h-10 w-10 text-destructive" />
          </div>
          <h3 className="text-lg font-medium mb-1">{error}</h3>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Riprova
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && !error ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <DealCardSkeleton key={i} />
          ))}
        </div>
      ) : deals.length > 0 ? (
        <>
          {/* Deals grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {deals.map(deal => (
              <DealCard key={deal.dealID} deal={deal} />
            ))}
          </div>

          {/* Load more */}
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loadingMore}
              className="gap-2"
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Percent className="h-4 w-4" />
              )}
              Carica altre offerte
            </Button>
          </div>
        </>
      ) : !error ? (
        /* Empty state */
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Percent className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-medium mb-1">Nessuna offerta trovata</h3>
          <p className="text-sm max-w-md text-center">
            Prova a modificare i filtri per trovare offerte gaming.
          </p>
        </div>
      ) : null}
    </div>
  )
}
