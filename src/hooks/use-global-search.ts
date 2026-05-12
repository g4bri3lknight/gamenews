'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getNews, getDeals, getFreeGames, getUpcomingReleases } from '@/lib/api'
import type { NewsArticle, GameDeal, FreeGame, GameRelease } from '@/lib/api'
import { getStoreInfo } from '@/lib/constants'

export interface SearchResult {
  type: 'news' | 'deal' | 'free' | 'release'
  title: string
  subtitle: string
  badge: string
  badgeColor: string
  url: string
}

interface SearchResults {
  results: SearchResult[]
  loading: boolean
  error: string | null
}

export function useGlobalSearch(query: string, enabled: boolean): SearchResults {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [newsRes, dealsRes, freeRes, releasesRes] = await Promise.allSettled([
        getNews({ search: q, limit: 5 }),
        getDeals({ pageSize: 5 }),
        getFreeGames({ pageSize: 10 }),
        getUpcomingReleases({ pageSize: 10 }),
      ])

      const allResults: SearchResult[] = []
      const lowerQ = q.toLowerCase()

      // News results
      if (newsRes.status === 'fulfilled') {
        for (const article of newsRes.value.articles) {
          allResults.push({
            type: 'news',
            title: article.title,
            subtitle: article.source,
            badge: 'Notizia',
            badgeColor: '#e11d48',
            url: article.link,
          })
        }
      }

      // Deals - filter client-side by title
      if (dealsRes.status === 'fulfilled') {
        for (const deal of dealsRes.value) {
          if (deal.title.toLowerCase().includes(lowerQ)) {
            const storeInfo = getStoreInfo(deal.storeID)
            allResults.push({
              type: 'deal',
              title: deal.title,
              subtitle: `${storeInfo.name} · ${parseFloat(deal.salePrice).toFixed(2)} €`,
              badge: 'Offerta',
              badgeColor: '#f59e0b',
              url: deal.dealUrl,
            })
          }
        }
      }

      // Free games - filter client-side by title
      if (freeRes.status === 'fulfilled') {
        for (const game of freeRes.value) {
          if (game.title.toLowerCase().includes(lowerQ)) {
            const storeInfo = getStoreInfo(game.storeID)
            allResults.push({
              type: 'free',
              title: game.title,
              subtitle: storeInfo.name,
              badge: 'Gratis',
              badgeColor: '#10b981',
              url: game.dealUrl,
            })
          }
        }
      }

      // Releases - filter client-side by name
      if (releasesRes.status === 'fulfilled') {
        for (const release of releasesRes.value.results) {
          if (release.name.toLowerCase().includes(lowerQ)) {
            const genreStr = release.genres.slice(0, 2).join(', ') || 'PC'
            allResults.push({
              type: 'release',
              title: release.name,
              subtitle: release.released
                ? `${new Date(release.released).toLocaleDateString('it-IT')} · ${genreStr}`
                : genreStr,
              badge: 'Uscita',
              badgeColor: '#6366f1',
              url: `https://rawg.io/games/${release.id}`,
            })
          }
        }
      }

      setResults(allResults)
    } catch {
      setError('Errore durante la ricerca')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!query.trim()) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(() => {
      search(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, enabled, search])

  // Re-export types used in components
  return { results, loading, error }
}

// Re-export for convenience
export type { NewsArticle, GameDeal, FreeGame, GameRelease }
