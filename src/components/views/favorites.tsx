'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { getFavorites, removeFavorite as apiRemoveFavorite } from '@/lib/api'
import { getStoreInfo } from '@/lib/constants'
import type { Favorite } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Bookmark, BookmarkCheck, Newspaper, Gift, Percent,
  ExternalLink, Trash2, Star, Clock,
} from 'lucide-react'
import { toast } from 'sonner'

// ============================================
// FAVORITE CARD
// ============================================

function FavoriteCard({ favorite, onRemove }: { favorite: Favorite; onRemove: (id: string) => void }) {
  const meta: Record<string, string> = favorite.metadata ? JSON.parse(favorite.metadata) : {}

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    try {
      await apiRemoveFavorite(favorite.id)
      onRemove(favorite.id)
      toast.success('Rimosso dai preferiti')
    } catch {
      toast.error('Errore durante la rimozione')
    }
  }

  const isArticle = favorite.type === 'article'
  const isFreeGame = favorite.type === 'free_game'
  const isDeal = favorite.type === 'deal'

  return (
    <a
      href={favorite.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-card border border-border rounded-xl overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {favorite.imageUrl ? (
          <img
            src={favorite.imageUrl}
            alt={favorite.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isArticle ? <Newspaper className="h-10 w-10 text-muted-foreground" /> :
             isFreeGame ? <Gift className="h-10 w-10 text-muted-foreground" /> :
             <Percent className="h-10 w-10 text-muted-foreground" />}
          </div>
        )}

        {/* BookmarkCheck indicator - top left */}
        <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5 border-0 flex items-center gap-1">
          <BookmarkCheck className="h-3 w-3" />
          Salvato
        </Badge>

        {/* Type badge */}
        {isArticle && favorite.source && (
          <Badge
            className="absolute top-2 right-10 text-white text-[10px] px-2 py-0.5 border-0"
            style={{ backgroundColor: '#666' }}
          >
            {favorite.source}
          </Badge>
        )}

        {/* Free game / Deal badge */}
        {isFreeGame && (
          <Badge className="absolute top-2 right-10 bg-success text-success-foreground text-[10px] px-2 py-0.5 border-0 font-bold">
            GRATIS
          </Badge>
        )}
        {isDeal && meta.savings && (
          <span className="absolute top-2 right-10 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded">
            -{Math.round(parseFloat(meta.savings))}%
          </span>
        )}

        {/* Remove button */}
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:bg-destructive/80 transition-colors"
          aria-label="Rimuovi dai preferiti"
        >
          <Trash2 className="h-3.5 w-3.5 text-white" />
        </button>
      </div>

      <CardContent className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {favorite.title}
        </h3>

        {/* Deal price info */}
        {isDeal && meta.salePrice && meta.salePrice !== '0.00' && (
          <div className="flex items-center gap-2">
            {meta.normalPrice && (
              <span className="text-xs line-through text-muted-foreground">
                {parseFloat(meta.normalPrice).toFixed(2)}&euro;
              </span>
            )}
            <span className="text-sm font-bold text-primary">
              {parseFloat(meta.salePrice).toFixed(2)}&euro;
            </span>
          </div>
        )}

        {isDeal && meta.salePrice === '0.00' && (
          <span className="text-sm font-bold text-green-500">GRATIS</span>
        )}

        {/* Store info for free games & deals */}
        {(isFreeGame || isDeal) && meta.storeID && (
          <div className="flex items-center gap-1.5">
            <Badge
              className="text-[10px] px-1.5 py-0 border-0 text-white"
              style={{ backgroundColor: getStoreInfo(meta.storeID).color }}
            >
              {meta.storeName || getStoreInfo(meta.storeID).name}
            </Badge>
          </div>
        )}

        {/* Saved date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(favorite.addedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </a>
  )
}

// ============================================
// SKELETON
// ============================================

function FavoriteCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="w-full aspect-video" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

// ============================================
// TAB CONTENT
// ============================================

function FavoriteTabContent({ items, onRemove }: { items: Favorite[]; onRemove: (id: string) => void }) {
  if (items.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
          <Bookmark className="h-8 w-8" />
        </div>
        <h3 className="text-base font-medium mb-1">Nessun preferito</h3>
        <p className="text-sm">Salva articoli, offerte o giochi gratis per trovarli qui.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((fav) => (
        <FavoriteCard key={fav.id} favorite={fav} onRemove={onRemove} />
      ))}
    </div>
  )
}

// ============================================
// FAVORITES VIEW
// ============================================

export function FavoritesView() {
  const { favorites, setFavorites } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFavorites()
      .then(setFavorites)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [setFavorites])

  function handleRemove(id: string) {
    setFavorites(favorites.filter((f) => f.id !== id))
  }

  const articles = favorites.filter((f) => f.type === 'article')
  const deals = favorites.filter((f) => f.type === 'deal')
  const freeGames = favorites.filter((f) => f.type === 'free_game')
  const total = favorites.length

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-32 mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <FavoriteCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bookmark className="h-7 w-7" />
          Preferiti
        </h1>
        <p className="text-muted-foreground mt-1">
          {total === 0
            ? 'Nessun preferito salvato'
            : `${total} element${total === 1 ? 'o' : 'i'} salvat${total === 1 ? 'o' : 'i'}`}
        </p>
      </div>

      {total === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bookmark className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-medium mb-1">Nessun preferito</h3>
          <p className="text-sm max-w-md text-center">
            Salva articoli, offerte o giochi gratis cliccando sull&apos;icona del segnalibro nelle card per trovarli qui.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all" className="gap-1.5">
              <Bookmark className="h-3.5 w-3.5" />
              Tutti ({total})
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-1.5">
              <Newspaper className="h-3.5 w-3.5" />
              Articoli ({articles.length})
            </TabsTrigger>
            <TabsTrigger value="deals" className="gap-1.5">
              <Percent className="h-3.5 w-3.5" />
              Offerte ({deals.length})
            </TabsTrigger>
            <TabsTrigger value="free_games" className="gap-1.5">
              <Gift className="h-3.5 w-3.5" />
              Gratis ({freeGames.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <FavoriteTabContent items={favorites} onRemove={handleRemove} />
          </TabsContent>

          <TabsContent value="articles" className="mt-6">
            <FavoriteTabContent items={articles} onRemove={handleRemove} />
          </TabsContent>

          <TabsContent value="deals" className="mt-6">
            <FavoriteTabContent items={deals} onRemove={handleRemove} />
          </TabsContent>

          <TabsContent value="free_games" className="mt-6">
            <FavoriteTabContent items={freeGames} onRemove={handleRemove} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
