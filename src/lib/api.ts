import type { NewsArticle, GameRelease, FollowedGame } from './constants'

const BASE = '/api'

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ============================================
// NEWS API
// ============================================

export async function getNews(params?: {
  source?: string
  search?: string
  category?: string
  limit?: number
  offset?: number
  refresh?: boolean
}): Promise<{ articles: NewsArticle[]; total: number }> {
  const searchParams = new URLSearchParams()
  if (params?.source) searchParams.set('source', params.source)
  if (params?.search) searchParams.set('search', params.search)
  if (params?.category) searchParams.set('category', params.category)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))
  if (params?.refresh) searchParams.set('refresh', 'true')
  const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return fetchAPI<{ articles: NewsArticle[]; total: number }>(`${BASE}/news${query}`)
}

// ============================================
// RELEASES API (RAWG)
// ============================================

export async function getUpcomingReleases(params?: {
  page?: number
  pageSize?: number
  month?: string
}): Promise<{ results: GameRelease[]; count: number; next?: string }> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.pageSize) searchParams.set('page_size', String(params.pageSize))
  if (params?.month) searchParams.set('month', params.month)
  const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return fetchAPI<{ results: GameRelease[]; count: number; next?: string }>(`${BASE}/releases${query}`)
}

// ============================================
// FOLLOW GAME API
// ============================================

export async function getFollowedGames(): Promise<FollowedGame[]> {
  const res = await fetchAPI<{ games: FollowedGame[] }>(`${BASE}/follow-game`)
  return res.games ?? []
}

export async function followGame(data: {
  rawgId: number
  title: string
  imageUrl: string
  releasedAt: string
  genres: string[]
  rating: number
}): Promise<FollowedGame> {
  return fetchAPI<FollowedGame>(`${BASE}/follow-game`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function unfollowGame(id: string): Promise<void> {
  return fetchAPI<void>(`${BASE}/follow-game`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
}

// ============================================
// SETTINGS API
// ============================================

export async function getSettings(): Promise<Record<string, string>> {
  return fetchAPI<Record<string, string>>(`${BASE}/settings`)
}

export async function setSetting(key: string, value: string): Promise<void> {
  return fetchAPI<void>(`${BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  })
}

// ============================================
// FREE GAMES API (CheapShark)
// ============================================

export interface FreeGame {
  title: string
  dealID: string
  storeID: string
  storeName: string
  gameID: string
  salePrice: string
  normalPrice: string
  savings: string
  metacriticScore: string
  steamRatingText: string
  steamRatingPercent: string
  steamAppID: string
  releaseDate: number
  dealRating: string
  thumb: string
  dealUrl: string
}

export async function getFreeGames(params?: {
  pageNumber?: number
  pageSize?: number
  storeID?: string
}): Promise<FreeGame[]> {
  const sp = new URLSearchParams()
  if (params?.pageNumber !== undefined) sp.set('pageNumber', String(params.pageNumber))
  if (params?.pageSize !== undefined) sp.set('pageSize', String(params.pageSize))
  if (params?.storeID) sp.set('storeID', params.storeID)
  const query = sp.toString() ? `?${sp.toString()}` : ''
  return fetchAPI<FreeGame[]>(`${BASE}/free-games${query}`)
}

// ============================================
// DEALS API (CheapShark)
// ============================================

export interface GameDeal extends FreeGame {
  isOnSale: string
  steamRatingCount: string
}

export async function getDeals(params?: {
  pageNumber?: number
  pageSize?: number
  storeID?: string
  sortBy?: string
  upperPrice?: number
}): Promise<GameDeal[]> {
  const sp = new URLSearchParams()
  if (params?.pageNumber !== undefined) sp.set('pageNumber', String(params.pageNumber))
  if (params?.pageSize !== undefined) sp.set('pageSize', String(params.pageSize))
  if (params?.storeID) sp.set('storeID', params.storeID)
  if (params?.sortBy) sp.set('sortBy', params.sortBy)
  if (params?.upperPrice !== undefined) sp.set('upperPrice', String(params.upperPrice))
  const query = sp.toString() ? `?${sp.toString()}` : ''
  return fetchAPI<GameDeal[]>(`${BASE}/deals${query}`)
}
