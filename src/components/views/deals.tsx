'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDeals } from '@/lib/api'
import type { GameDeal } from '@/lib/api'
import { addFavorite, removeFavorite, getFavorites } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { DEAL_STORES, DEAL_SORT_OPTIONS, getStoreInfo } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Percent, RefreshCw, ExternalLink, Star, Loader2, SlidersHorizontal, ChevronDown, Scale, TrendingDown, Bookmark, BookmarkCheck } from 'lucide-react'
import { PriceComparisonDialog } from '@/components/price-comparison-dialog'
import { PriceHistoryDialog } from '@/components/price-history-dialog'


// ============================================
// DEAL CARD
// ============================================

function DealCard({ deal, onCompare, onHistory }: { deal: GameDeal; onCompare: (title: string) => void; onHistory: (title: string, steamAppID: string) => void }) {
  const storeInfo = getStoreInfo(deal.storeID)
  const savings = Math.round(parseFloat(deal.savings))
  const metacritic = parseInt(deal.metacriticScore, 10)
  const steamPercent = parseInt(deal.steamRatingPercent, 10)
  const isFree = deal.salePrice === '0.00'
  const bookmarked = useAppStore((s) => s.isFavorite(deal.dealUrl))
  const { addFavorite: addFav, removeFavorite: removeFav } = useAppStore()

  async function toggleBookmark(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (bookmarked) {
      const fav = useAppStore.getState().favorites.find(f => f.link === deal.dealUrl)
      if (fav) { await removeFavorite(fav.id); removeFav(fav.id) }
    } else {
      const fav = await addFavorite({ type: 'deal', title: deal.title, link: deal.dealUrl, imageUrl: deal.thumb, source: storeInfo.name, metadata: JSON.stringify({ storeID: deal.storeID, storeName: deal.storeName, salePrice: deal.salePrice, normalPrice: deal.normalPrice, savings: deal.savings }) })
      addFav(fav)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col">
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

        {/* Bookmark button */}
        <button
          onClick={toggleBookmark}
          className="absolute top-2 right-2 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
          aria-label={bookmarked ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          style={savings > 0 ? { top: '2.25rem' } : undefined}
        >
          {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5 text-primary fill-primary" /> : <Bookmark className="h-3.5 w-3.5 text-white" />}
        </button>
      </div>

      <div className="p-3 space-y-2 flex flex-col flex-1">
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

        {/* Action buttons */}
        <div className="flex gap-1.5 mt-auto pt-1">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" asChild>
            <a href={deal.dealUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              <span className="truncate">Offerta</span>
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 shrink-0"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCompare(deal.title)
            }}
            aria-label="Confronta prezzi"
            title="Confronta prezzi"
          >
            <Scale className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 shrink-0"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onHistory(deal.title, deal.steamAppID)
            }}
            aria-label="Cronologia prezzi"
            title="Cronologia prezzi"
          >
            <TrendingDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
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
// METACRITIC OPTIONS
// ============================================

const METACRITIC_OPTIONS = [
  { value: '0', label: 'Qualsiasi' },
  { value: '75', label: '75+' },
  { value: '80', label: '80+' },
  { value: '85', label: '85+' },
  { value: '90', label: '90+' },
]


// ============================================
// DEALS VIEW
// ============================================

export function DealsView() {
  const { setFavorites } = useAppStore()
  const [deals, setDeals] = useState<GameDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Basic filters
  const [store, setStore] = useState('')
  const [sortBy, setSortBy] = useState('Deal Rating')
  const [page, setPage] = useState(0)
  const pageSize = 20

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lowerPrice, setLowerPrice] = useState('')
  const [upperPrice, setUpperPrice] = useState('')
  const [metacritic, setMetacritic] = useState('0')
  const [onSale, setOnSale] = useState(true)

  // Dialogs
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareTitle, setCompareTitle] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyTitle, setHistoryTitle] = useState('')
  const [historySteamAppID, setHistorySteamAppID] = useState('')

  function handleCompare(title: string) {
    setCompareTitle(title)
    setCompareOpen(true)
  }

  function handleHistory(title: string, steamAppID: string) {
    setHistoryTitle(title)
    setHistorySteamAppID(steamAppID)
    setHistoryOpen(true)
  }

  // Load favorites
  useEffect(() => {
    getFavorites().then(setFavorites).catch(() => {})
  }, [setFavorites])

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
        lowerPrice: lowerPrice ? parseFloat(lowerPrice) : undefined,
        upperPrice: upperPrice ? parseFloat(upperPrice) : undefined,
        metacritic: metacritic !== '0' ? parseInt(metacritic, 10) : undefined,
        onSale,
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
  }, [store, sortBy, pageSize, lowerPrice, upperPrice, metacritic, onSale])

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

  function applyAdvancedFilters() {
    setPage(0)
    fetchDeals(0, true)
  }

  function resetAdvancedFilters() {
    setLowerPrice('')
    setUpperPrice('')
    setMetacritic('0')
    setOnSale(true)
  }

  const hasActiveAdvancedFilters = lowerPrice || upperPrice || metacritic !== '0' || !onSale

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

        {/* Advanced filters toggle button */}
        <Button
          variant={showAdvanced ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-1.5 text-xs h-8"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtri Avanzati
          {hasActiveAdvancedFilters && (
            <Badge className="ml-1 h-4 px-1.5 text-[10px] border-0 bg-white/20 text-white">
              !
            </Badge>
          )}
          <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Min Price */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Prezzo Minimo (&euro;)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={lowerPrice}
                  onChange={(e) => setLowerPrice(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Max Price */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Prezzo Massimo (&euro;)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="999.99"
                  value={upperPrice}
                  onChange={(e) => setUpperPrice(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Metacritic */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Voto Metacritic Minimo</Label>
                <Select value={metacritic} onValueChange={setMetacritic}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METACRITIC_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* On Sale Toggle */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Solo in Offerta</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={onSale}
                    onCheckedChange={setOnSale}
                    id="on-sale-toggle"
                  />
                  <label
                    htmlFor="on-sale-toggle"
                    className="text-sm cursor-pointer select-none"
                  >
                    {onSale ? 'Solo sconti attivi' : 'Includi tutto'}
                  </label>
                </div>
              </div>
            </div>

            {/* Apply / Reset buttons */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
              <Button
                size="sm"
                onClick={applyAdvancedFilters}
                disabled={refreshing}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                Applica Filtri
              </Button>
              {hasActiveAdvancedFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAdvancedFilters}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Resetta Filtri
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
              <DealCard key={deal.dealID} deal={deal} onCompare={handleCompare} onHistory={handleHistory} />
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

      {/* Price Comparison Dialog */}
      <PriceComparisonDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        gameTitle={compareTitle}
      />

      {/* Price History Dialog */}
      <PriceHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        gameTitle={historyTitle}
        steamAppID={historySteamAppID}
      />
    </div>
  )
}
