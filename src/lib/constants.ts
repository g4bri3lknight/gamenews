// ============================================
// TYPES
// ============================================

export type View = 'dashboard' | 'news' | 'calendar' | 'settings'

export interface NewsArticle {
  id: string
  title: string
  link: string
  description: string
  imageUrl: string
  source: string
  author: string
  category: string
  publishedAt: string
  fetchedAt: string
}

export interface GameRelease {
  id: number
  name: string
  released: string
  rating: number
  backgroundImage: string
  genres: string[]
  platforms: string[]
  shortDescription: string
}

export interface FollowedGame {
  id: string
  rawgId: number
  title: string
  imageUrl: string
  releasedAt: string
  genres: string[]
  rating: number
  addedAt: string
  updatedAt: string
}

export interface FeedSource {
  name: string
  url: string
  color: string
  icon: string
}

// ============================================
// RSS FEED SOURCES
// ============================================

export const RSS_FEEDS: FeedSource[] = [
  { name: 'Multiplayer.it', url: 'https://multiplayer.it/feed', color: '#e20613', icon: 'monitor' },
  { name: 'IGN Italia', url: 'https://it.ign.com/rss', color: '#bf1313', icon: 'flame' },
  { name: 'Gamesurf', url: 'https://www.gamesurf.it/feed', color: '#00a651', icon: 'gamepad2' },
  { name: 'GamingToday', url: 'https://gamingtoday.it/feed/', color: '#6366f1', icon: 'newspaper' },
  { name: 'Lega Nerd', url: 'https://leganerd.com/feed/', color: '#e11d48', icon: 'glasses' },
]

export const ALL_SOURCES = [
  { name: 'Tutte le Fonti', value: '', color: '#666' },
  ...RSS_FEEDS.map(f => ({ name: f.name, value: f.name, color: f.color })),
]

export const NEWS_CATEGORIES = [
  'Tutte le Categorie',
  'Notizie',
  'Recensioni',
  'Anticipazioni',
  'Guide',
  'Eventi',
  'Hardware',
]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Più recenti' },
  { value: 'oldest', label: 'Più vecchi' },
]

// ============================================
// THEMES
// ============================================

export const THEMES = [
  { value: 'midnight', label: 'Midnight', type: 'dark', description: 'Tema scuro con accento viola', preview: { bg: '#1a1a2e', accent: '#9333ea' } },
  { value: 'ember', label: 'Ember', type: 'dark', description: 'Tema scuro con accento arancione', preview: { bg: '#2d1b0e', accent: '#f59e0b' } },
  { value: 'ocean', label: 'Ocean', type: 'dark', description: 'Tema scuro con accento teal', preview: { bg: '#0e2d2d', accent: '#14b8a6' } },
  { value: 'forest', label: 'Forest', type: 'dark', description: 'Tema scuro con accento verde', preview: { bg: '#0e2d1b', accent: '#10b981' } },
  { value: 'emerald', label: 'Emerald', type: 'dark', description: 'Tema scuro con accento smeraldo brillante', preview: { bg: '#0a2920', accent: '#34d399' } },
  { value: 'rose', label: 'Rose', type: 'dark', description: 'Tema scuro con accento rosa', preview: { bg: '#2d0e1e', accent: '#f43f5e' } },
  { value: 'crimson', label: 'Crimson', type: 'dark', description: 'Tema scuro con accento cremisi', preview: { bg: '#2d0a0a', accent: '#dc2626' } },
  { value: 'sunset', label: 'Sunset', type: 'dark', description: 'Tema scuro con accento tramonto caldo', preview: { bg: '#2d1a0e', accent: '#fb923c' } },
  { value: 'light', label: 'Light', type: 'light', description: 'Tema chiaro classico', preview: { bg: '#ffffff', accent: '#171717' } },
  { value: 'nord', label: 'Nord', type: 'light', description: 'Tema chiaro toni freddi', preview: { bg: '#eceff4', accent: '#5e81ac' } },
  { value: 'paper', label: 'Paper', type: 'light', description: 'Tema chiaro tono carta calda', preview: { bg: '#faf8f5', accent: '#a0522d' } },
  { value: 'mint', label: 'Mint', type: 'light', description: 'Tema chiaro tono menta', preview: { bg: '#f0fdf4', accent: '#059669' } },
] as const

// ============================================
// ITALIAN MONTH NAMES
// ============================================

export const ITALIAN_MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

export const ITALIAN_MONTHS_SHORT = [
  'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
  'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic',
]

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'ora'
  if (diffMin < 60) return `${diffMin}m fa`
  if (diffHour < 24) return `${diffHour}h fa`
  if (diffDay === 1) return 'ieri'
  if (diffDay < 7) return `${diffDay}gg fa`

  // Older than 7 days: show dd/mm/yyyy
  return formatDateDDMMYYYY(dateStr)
}

export function formatDate(dateStr: string): string {
  return formatDateDDMMYYYY(dateStr)
}

export function formatDateDDMMYYYY(dateStr: string): string {
  const date = new Date(dateStr)
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatCountdown(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Disponibile!'
  if (diffDays === 0) return 'Oggi!'
  if (diffDays === 1) return 'Domani!'
  if (diffDays < 7) return `${diffDays} giorni`

  // 7+ days away: show dd/mm/yyyy
  return formatDateDDMMYYYY(dateStr)
}

export function getSourceColor(source: string): string {
  const feed = RSS_FEEDS.find(f => f.name === source)
  return feed?.color || '#666'
}

export function renderStars(rating: number): number[] {
  const stars = Math.round(rating)
  return Array.from({ length: 5 }, (_, i) => i + 1)
}

export function formatMonthKey(month: string): string {
  const [year, monthNum] = month.split('-').map(Number)
  if (!year || !monthNum) return month
  return `${ITALIAN_MONTHS[monthNum - 1]} ${year}`
}

export function getTodayMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
