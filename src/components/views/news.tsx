'use client'

import { useState, useEffect, useCallback } from 'react'
import { getNews, addFavorite, removeFavorite, getFavorites } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import {
  ALL_SOURCES, NEWS_CATEGORIES, SORT_OPTIONS, timeAgo, getSourceColor,
} from '@/lib/constants'
import type { NewsArticle } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Newspaper, Search, RefreshCw, ExternalLink, User, Tag, Loader2,
  Bookmark, BookmarkCheck,
} from 'lucide-react'


// ============================================
// ARTICLE CARD
// ============================================

function ArticleCard({ article }: { article: NewsArticle }) {
  const sourceColor = getSourceColor(article.source)
  const bookmarked = useAppStore((s) => s.isFavorite(article.link))
  const { addFavorite: addFav, removeFavorite: removeFav } = useAppStore()

  async function toggleBookmark(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (bookmarked) {
      const fav = useAppStore.getState().favorites.find(f => f.link === article.link)
      if (fav) { await removeFavorite(fav.id); removeFav(fav.id) }
    } else {
      const fav = await addFavorite({ type: 'article', title: article.title, link: article.link, imageUrl: article.imageUrl, description: article.description, source: article.source })
      addFav(fav)
    }
  }

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-card border border-border rounded-xl overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <Badge
            className="text-white text-[10px] px-2 py-0.5 border-0"
            style={{ backgroundColor: sourceColor }}
          >
            {article.source}
          </Badge>
          {article.category && (
            <Badge variant="secondary" className="text-[10px] bg-black/40 text-white border-0">
              {article.category}
            </Badge>
          )}
        </div>
        <button
          onClick={toggleBookmark}
          className="absolute top-2 right-2 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
          aria-label={bookmarked ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
        >
          {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5 text-primary fill-primary" /> : <Bookmark className="h-3.5 w-3.5 text-white" />}
        </button>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {article.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {article.author}
            </span>
            {article.category && (
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {article.category}
              </span>
            )}
          </div>
          <span>{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
    </a>
  )
}

function ArticleCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="w-full aspect-video" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  )
}

// ============================================
// NEWS VIEW
// ============================================

export function NewsView() {
  const { setFavorites } = useAppStore()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [source, setSource] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [offset, setOffset] = useState(0)
  const limit = 12

  // Load favorites
  useEffect(() => {
    getFavorites().then(setFavorites).catch(() => {})
  }, [setFavorites])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch news
  const fetchNews = useCallback(async (isRefresh = false) => {
    const currentOffset = isRefresh ? 0 : offset
    if (isRefresh) {
      setRefreshing(true)
    } else if (currentOffset === 0) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const data = await getNews({
        source: source || undefined,
        search: debouncedSearch || undefined,
        category: category || undefined,
        limit,
        offset: currentOffset,
        refresh: isRefresh || undefined,
      })
      if (isRefresh || currentOffset === 0) {
        setArticles(data.articles)
      } else {
        setArticles(prev => [...prev, ...data.articles])
      }
      setTotal(data.total)
    } catch {
      if (isRefresh || currentOffset === 0) {
        setArticles([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }, [source, debouncedSearch, category, sort, offset])

  // Reset and fetch when filters change
  useEffect(() => {
    setOffset(0)
    fetchNews(true)
  }, [source, debouncedSearch, category, sort])

  // Sort client-side
  const displayedArticles = [...articles].sort((a, b) => {
    if (sort === 'newest') {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    }
    return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  })

  const hasMore = displayedArticles.length < total

  function loadMore() {
    setOffset(prev => prev + limit)
    fetchNews()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Newspaper className="h-7 w-7" />
            Notizie Gaming
          </h1>
          <p className="text-muted-foreground mt-1">
            {loading ? 'Caricamento...' : `${total} articoli trovati`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchNews(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca notizie..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Source pills */}
        {ALL_SOURCES.map(src => (
          <button
            key={src.value}
            onClick={() => setSource(src.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              source === src.value
                ? 'text-white border-transparent'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
            style={source === src.value ? { backgroundColor: src.color } : undefined}
          >
            {src.name}
          </button>
        ))}

        {/* Category dropdown */}
        <Select value={category || undefined} onValueChange={(v) => setCategory(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {NEWS_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat === 'Tutte le Categorie' ? '__all__' : cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort dropdown */}
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filters indicator */}
      {(source || category || debouncedSearch) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Filtri attivi:</span>
          {debouncedSearch && (
            <Badge variant="secondary" className="text-[10px]">
              &ldquo;{debouncedSearch}&rdquo;
            </Badge>
          )}
          {source && (
            <Badge variant="secondary" className="text-[10px]">
              {source}
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="text-[10px]">
              {category}
            </Badge>
          )}
        </div>
      )}

      {/* Articles grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      ) : displayedArticles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
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
                  <Newspaper className="h-4 w-4" />
                )}
                Carica altre notizie
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Newspaper className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-medium mb-1">Nessuna notizia trovata</h3>
          <p className="text-sm max-w-md text-center">
            Prova a modificare i filtri o la ricerca per trovare articoli gaming.
          </p>
        </div>
      )}
    </div>
  )
}
