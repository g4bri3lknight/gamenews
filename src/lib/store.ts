import { create } from 'zustand'
import type { View, FollowedGame, NewsArticle, GameRelease } from './constants'
import { applyThemeCSSVars } from './theme-vars'

export type { View, FollowedGame, NewsArticle, GameRelease }

interface AppState {
  // Navigation
  currentView: View
  setCurrentView: (view: View) => void

  // Theme
  currentTheme: string
  setCurrentTheme: (theme: string) => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Followed Games (local cache)
  followedGames: FollowedGame[]
  setFollowedGames: (games: FollowedGame[]) => void
  addFollowedGame: (game: FollowedGame) => void
  removeFollowedGame: (id: string) => void
  isFollowed: (rawgId: number) => boolean

  // Calendar month
  selectedMonth: string
  setSelectedMonth: (month: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),

  // Theme
  currentTheme: 'midnight',
  setCurrentTheme: (theme) => {
    set({ currentTheme: theme })
    if (typeof window !== 'undefined') {
      // Apply CSS variables directly via inline styles for maximum specificity
      applyThemeCSSVars(theme)
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('gamevault-theme', theme)
      const darkThemes = ['midnight', 'ember', 'ocean', 'forest', 'emerald', 'rose', 'crimson', 'sunset']
      if (darkThemes.includes(theme)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  },

  // Sidebar
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Followed Games
  followedGames: [],
  setFollowedGames: (games) => set({ followedGames: games }),
  addFollowedGame: (game) =>
    set((state) => ({ followedGames: [...state.followedGames, game] })),
  removeFollowedGame: (id) =>
    set((state) => ({
      followedGames: state.followedGames.filter((g) => g.id !== id),
    })),
  isFollowed: (rawgId) => get().followedGames.some((g) => g.rawgId === rawgId),

  // Calendar month
  selectedMonth: (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })(),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
}))
