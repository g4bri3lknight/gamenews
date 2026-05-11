# GameVault Worklog

## Task 3: Multi-Theme CSS System
**Agent:** frontend-styling-expert
**Date:** 2025-01-24
**Status:** ✅ Complete

### Summary
Built a comprehensive multi-theme CSS system for the GameVault application in `src/app/globals.css`. The system supports 6 named themes plus a `.dark` class fallback, all using CSS custom properties with the oklch color space for perceptual uniformity.

### Changes Made

**File:** `src/app/globals.css`

#### Preserved (unchanged)
- `@import "tailwindcss"` and `@import "tw-animate-css"`
- `@custom-variant dark` directive
- `@theme inline` block with all `--color-*` Tailwind mappings

#### Themes Defined (6 total)
Each theme defines the full set of 30+ CSS custom properties:
`background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `border`, `input`, `ring`, `chart-1`–`chart-5`, `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring`

| Theme | Selector | Type | Description |
|-------|----------|------|-------------|
| Default Light | `:root` | Light | Original neutral light theme (unchanged) |
| `light` | `[data-theme="light"]` | Light | Mirrors `:root` — explicit data-theme option |
| `nord` | `[data-theme="nord"]` | Light | Cool blue-gray palette with steel blue accents |
| `midnight` | `[data-theme="midnight"]` | Dark | Dark blue-gray gaming theme with vibrant purple accent |
| `ember` | `[data-theme="ember"]` | Dark | Dark warm theme with orange/amber accents |
| `ocean` | `[data-theme="ocean"]` | Dark | Dark teal-gray theme with bright cyan accents |
| `forest` | `[data-theme="forest"]` | Dark | Dark green-gray theme with emerald accents |

#### Dark Mode Fallback
- `.dark` class now uses midnight theme colors so dark mode still works when no `data-theme` attribute is set.

#### Base Layer Additions
1. **Border/outline defaults** — `@apply border-border outline-ring/50`
2. **Body styling** — `@apply bg-background text-foreground`
3. **Custom scrollbar** — Webkit scrollbar with 8px width, transparent track, gray rounded thumb
4. **Smooth transitions** — `background-color 0.2s`, `border-color 0.2s`, `color 0.1s` on all elements

### Usage
Set theme via `data-theme` attribute on `<html>`:
```html
<html data-theme="midnight">
<html data-theme="ember">
<html data-theme="ocean">
<html data-theme="forest">
<html data-theme="light">
<html data-theme="nord">
```
Or use `.dark` class for midnight fallback.

### Next Steps
- Integrate a theme provider/context in the app to toggle `data-theme` dynamically
- Persist theme preference to localStorage
- Consider adding a "system" theme option that respects OS dark/light preference

---

## Task 3b: Theme Provider & Zustand Stores
**Agent:** full-stack-developer
**Date:** 2025-01-24
**Status:** ✅ Complete

### Summary
Created the core state management and client-side infrastructure for the GameVault app: a Zustand store for navigation and theme state, a ThemeProvider component for persistent theme initialization, an API helper module for all backend endpoints, and a constants module with store/theme definitions and utility functions.

### Files Created

#### 1. `src/lib/store.ts` — Zustand Store
- **Navigation state**: `currentView` (View type with 5 views: dashboard, library, add-game, steam-import, settings) and `selectedGameId`
- **Theme state**: `currentTheme` with `setCurrentTheme` that:
  - Sets `data-theme` attribute on `<html>` element
  - Persists to `localStorage` under key `gamevault-theme`
  - Toggles `.dark` class for dark themes (midnight, ember, ocean, forest)
- **Type exports**: `View`, `Game` (full game model), `RawgGame` (RAWG API search result)

#### 2. `src/components/theme-provider.tsx` — Theme Provider
- Client component that reads saved theme from `localStorage` on mount
- Falls back to `midnight` theme if no saved preference
- Wraps children in a fragment (no extra DOM)

#### 3. `src/lib/api.ts` — API Helper Functions
- Generic `fetchAPI<T>` wrapper with error handling
- **Games CRUD**: `getGames` (with store/search/genre filters), `getGame`, `createGame`, `updateGame`, `deleteGame`
- **RAWG integration**: `searchRawg` (paginated search), `enrichGame` (attach RAWG data to local game)
- **Steam import**: `importFromSteam` (import games from Steam profile)
- **Settings**: `getSettings`, `setSetting`
- **Stats**: `getStats` (returns totalGames, totalPlaytimeMinutes, gamesByStore, topGenres, recentlyAdded, avgRating)

#### 4. `src/lib/constants.ts` — Constants & Utilities
- `STORES` — Array of 6 game store definitions (Steam, Epic, GOG, Ubisoft, EA, Altro) with label and color
- `THEMES` — Array of 6 theme definitions with value, label, type (dark/light), description, and preview colors
- `formatPlaytime()` — Utility to format minutes into human-readable strings (e.g., `45m`, `12h 30m`, `3h`)

### Integration Notes
- ThemeProvider should be placed in the root layout wrapping all content
- `useAppStore` is the single source of truth for navigation and theme state
- All API functions are ready to connect to the backend routes once implemented

---

## Task 10: Backend API Routes
**Agent:** full-stack-developer
**Date:** 2025-01-24
**Status:** ✅ Complete

### Summary
Created all 7 backend API route files for the GameVault PC game library application. All routes use NextRequest/NextResponse from `next/server`, Prisma via `@/lib/db`, and include comprehensive error handling with try/catch.

### Files Created

#### 1. `src/app/api/games/route.ts` — Games Collection
- **GET**: Returns all games ordered by `addedAt` desc. Supports query params: `store` (filter), `search` (case-insensitive title search via Prisma `contains`), `genre` (filters by checking JSON array in app layer). Parses `screenshots` and `genres` JSON fields before returning.
- **POST**: Creates a new game with all fields from request body. Validates that `title` is present. Serializes `screenshots` and `genres` arrays as JSON strings. Returns created game with parsed JSON fields (201).
- **DELETE**: Deletes a game by `id` from request body. Validates `id` is present.

#### 2. `src/app/api/games/[id]/route.ts` — Single Game Resource
- **GET**: Returns a single game by ID (from URL param). Returns 404 if not found. Parses JSON fields.
- **PUT**: Updates a game by ID. Builds update data dynamically from request body fields only. Supports partial updates. Parses JSON fields in response.
- **DELETE**: Deletes a game by ID (from URL param).

#### 3. `src/app/api/games/search-rawg/route.ts` — RAWG Game Search
- **GET**: Searches the RAWG API for games. Required query param: `query`, optional: `page` (default 1). Validates `RAWG_API_KEY` env var is set (returns 500 error if missing). Fetches search results then enriches each result with up to 4 screenshots from the RAWG screenshots endpoint. Returns transformed data: id, name, released, rating, backgroundImage, genres (name array), platforms (name array), shortDescription, screenshots (image URLs).

#### 4. `src/app/api/games/import-steam/route.ts` — Steam Import
- **POST**: Imports games from a Steam profile. Body: `{ steamId, steamApiKey }`. Validates credentials by calling Steam's `GetPlayerSummaries` API. Fetches owned games via `GetOwnedGames` API. Deduplicates against existing games (by title + store=steam, case-insensitive). Creates Game records with store="steam", rawgId=null, and playtime from Steam. Returns `{ imported, total, skipped }` counts.

#### 5. `src/app/api/games/enrich-rawg/route.ts` — RAWG Data Enrichment
- **POST**: Enriches a local game with data from RAWG. Body: `{ gameId, rawgId }`. Validates `RAWG_API_KEY` env var. Fetches game details and screenshots from RAWG API. Downloads images (cover + screenshots) and converts to base64 data URIs using the `imageUrlToBase64` helper function. Updates the game record with coverImage, screenshots (base64 array), description, genres, rating, releasedAt, and rawgId. Returns the updated game with parsed JSON fields.
- **Helper**: `imageUrlToBase64(url)` — fetches image URL, converts ArrayBuffer to base64 with proper content-type MIME prefix.

#### 6. `src/app/api/settings/route.ts` — App Settings
- **GET**: Returns all settings as a flat key-value object (`Record<string, string>`).
- **PUT**: Upserts a setting using Prisma's `upsert`. Body: `{ key, value }`. Validates key is present and non-empty.

#### 7. `src/app/api/stats/route.ts` — Library Statistics
- **GET**: Returns aggregated statistics:
  - `totalGames`: count of all games
  - `totalPlaytimeMinutes`: sum of all playtimeMinutes
  - `gamesByStore`: count grouped by store as `Record<string, number>`
  - `topGenres`: top 10 genres by frequency (parsed from JSON arrays across all games)
  - `avgRating`: average rating rounded to 2 decimal places
  - `recentlyAdded`: last 5 games with parsed JSON fields

### Technical Details
- All routes use `NextRequest`/`NextResponse` from `next/server`
- Next.js 16 async params pattern: `{ params }: { params: Promise<{ id: string }> }` with `await params`
- Prisma `db` client imported from `@/lib/db`
- JSON fields (`screenshots`, `genres`) consistently parsed on read and serialized on write
- Steam import deduplication uses case-insensitive title matching
- RAWG image enrichment downloads images server-side and stores as base64 data URIs
- Lint passes cleanly with zero errors

---

## Task 5: Dashboard & Settings View Components
**Agent:** full-stack-developer
**Date:** 2025-01-24
**Status:** ✅ Complete

### Summary
Built the Dashboard and Settings view components for the GameVault app. Both are `'use client'` components consuming the Zustand store and API helpers created in previous tasks.

### Files Created

#### 1. `src/components/views/dashboard.tsx` — Dashboard View

**Welcome Header:**
- Displays "La tua Libreria" title with Italian date formatted via `toLocaleDateString('it-IT', ...)` and first letter capitalized.
- "Vai alla Libreria" navigation button using `setCurrentView('library')`.

**4 Stat Cards** (responsive grid: 1 col → 2 cols sm → 4 cols lg):
| Card | Icon | Value | Color Style |
|------|------|-------|-------------|
| Totale Giochi | Gamepad2 | `totalGames` | Dynamic theme accent (primary bg) |
| Ore di Gioco Totali | Clock | `totalPlaytimeMinutes / 60` formatted to 1 decimal | oklch secondary |
| Media Rating | Star | `avgRating`/5 | oklch yellow |
| Numero Store | Store | Count of unique stores with >0 games | oklch secondary |

**Giochi per Store Section:**
- Uses recharts `BarChart` with `ResponsiveContainer`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, and `Cell` for per-bar colors.
- Maps `STORES` array to chart data with store labels and colors.
- Wrapped in shadcn `Card` with `CardHeader` + `CardContent`.
- Empty state message when no games exist.

**Generi Più Comuni Section:**
- Horizontal div-based bars (no recharts) with genre name, colored bar proportional to max count, and count number.
- Bar opacity decreases per index for visual hierarchy.
- Uses dynamic theme accent color for bars.

**Aggiunti di Recente Section:**
- `ScrollArea` with `max-h-64` containing small game cards.
- Each card shows: cover image (or Gamepad2 placeholder), game title, playtime, store badge, and hover arrow.
- Clicking calls `setSelectedGameId(game.id)` to open game detail.

**Loading State:**
- Skeleton UI with `animate-pulse` placeholders matching the layout structure.

#### 2. `src/components/views/settings.tsx` — Settings View

**API Keys Section** (Card with 3 settings):
- **RAWG API Key** (`rawg_api_key`): Password input with link to rawg.io/apidocs, save button.
- **Steam API Key** (`steam_api_key`): Password input with link to steamcommunity.com/dev/apikey, save button.
- **Steam ID** (`steam_id`): Text input for numeric Steam ID, save button.
- Each field: loads current value from `getSettings()` on mount, saves via `setSetting()`.
- Loading spinner animation during save.
- Toast notifications (sonner) on success/failure.
- Fields separated by `Separator` components.

**Theme Selector Section** (Card with 6 theme cards):
- 2 cols mobile → 3 cols desktop grid.
- Each card shows: theme preview (bg color + accent circle), theme name, description.
- Active theme highlighted with primary border, check icon on preview, "Attivo" badge.
- Click calls `setCurrentTheme()` from Zustand store.

### Technical Details
- Both components use `useState` + `useEffect` for data fetching on mount.
- `useAppStore` for navigation (`setCurrentView`, `setSelectedGameId`) and theme (`currentTheme`, `setCurrentTheme`).
- API calls via `getStats()` and `getSettings()`/`setSetting()` from `@/lib/api`.
- recharts used for store bar chart with `Cell` component for per-bar coloring.
- ESLint passes cleanly with zero errors.

---

## Task 6-7: Library View & Game Detail Dialog
**Agent:** full-stack-developer
**Date:** 2025-01-24
**Status:** ✅ Complete

### Summary
Built the Library view component and Game Detail dialog for the GameVault app. The Library view provides a full-featured game browsing experience with search, filtering, and sorting capabilities. The Game Detail dialog shows comprehensive game information with RAWG enrichment and delete functionality.

### Files Created

#### 1. `src/components/views/library.tsx` — Library View

**Header Section:**
- "Libreria" title with "Aggiungi Gioco" button that navigates to the add-game view via `setCurrentView('add-game')`.

**Search Bar:**
- Input with search icon, debounced at 300ms to avoid excessive API calls.
- Clear button (X icon) appears when search query is active.
- Filters games by title using the `search` parameter of `getGames()`.

**Filter Row:**
- **Store filter pills**: Horizontal scrollable row of small rounded-full buttons for each store from `STORES`. "Tutti" (All) is the default selected state. Uses `variant="default"` for active, `variant="outline"` for inactive.
- **Sort dropdown**: Select component with 5 options: "Più recenti" (recent), "A-Z", "Z-A", "Più giocati" (most played), "Miglior rating" (best rated). Sorting is applied client-side via `useMemo`.

**Game Grid:**
- Responsive grid: 1 col → 2 cols sm → 3 cols md → 4 cols xl → 5 cols 2xl.
- Each game card (shadcn Card) includes:
  - Cover image with 3:4 aspect ratio (or gradient placeholder with Gamepad2 icon).
  - Store badge (bottom-left, secondary variant).
  - Playtime badge (bottom-right, dark backdrop-blur with Clock icon) — shown when playtime > 0.
  - Title truncated to 2 lines (`line-clamp-2`).
  - Rating stars (5-star display with filled yellow stars and numeric rating) — shown when rating > 0.
- Framer Motion hover animation: `whileHover={{ y: -4 }}` for lift effect.
- Clicking a card calls `setSelectedGameId(game.id)` to open the detail dialog.

**Empty & Loading States:**
- Loading: 10 skeleton cards matching the card layout (aspect ratio + text lines).
- Empty with filters: "Nessun gioco nella libreria" with "Prova a modificare i filtri di ricerca".
- Empty with no filters: Gamepad2 icon, "Nessun gioco nella libreria", and "Aggiungi il primo gioco" button.

#### 2. `src/components/game-detail-dialog.tsx` — Game Detail Dialog

**Dialog Management:**
- Opens when `selectedGameId` is not null in the Zustand store.
- Fetches full game details via `getGame(id)` in a `useEffect` when dialog opens.
- Resets game state and expanded screenshot when dialog closes.

**Layout:**
- Responsive layout: cover image on top (mobile) / left side (desktop), info on the right.
- Content wrapped in `ScrollArea` with `max-h-[90vh]` for long game descriptions.
- Dialog max-width: `sm:max-w-3xl`.

**Game Info Display:**
- **Cover image**: Large 3:4 aspect ratio with gradient placeholder fallback.
- **Title**: Bold, large text.
- **Meta row**: Store badge (secondary variant), release date (Calendar icon, Italian locale formatting).
- **Rating**: 5-star display with numeric "X / 5" text.
- **Playtime**: Clock icon with formatted playtime text.
- **Genres**: Flex-wrap row of outline badges.

**Description Section:**
- "Descrizione" section header (uppercase tracking-wider).
- Text with `whitespace-pre-line` to preserve line breaks.

**Screenshots Gallery:**
- Horizontal scrollable row of screenshot thumbnails (w-48 h-28).
- Each thumbnail has border with hover primary highlight.
- Clicking opens a fullscreen overlay using `AnimatePresence` with framer-motion.
- Overlay: black/90 backdrop, close button (X), centered image with scale animation.

**Action Buttons:**
- **"Aggiorna da RAWG"**: Outline button with spinning RefreshCw icon during enrichment. Only shown if `rawgId` exists. Calls `enrichGame(gameId, rawgId)` and refreshes the displayed game data.
- **"Elimina"**: Destructive button wrapped in `AlertDialog` for confirmation. Shows game title in confirmation message. Calls `deleteGame(id)`, closes dialog, shows toast notification.

**Loading State:**
- Skeleton UI with cover placeholder + info area skeletons matching the dialog layout.

### Technical Details
- Both components are `'use client'` and use the Zustand store (`useAppStore`) for navigation and game selection state.
- API calls via `getGames()`, `getGame()`, `enrichGame()`, `deleteGame()` from `@/lib/api`.
- Client-side sorting via `useMemo` with 5 sort strategies.
- Search debounce implemented with `useRef` timer and `useEffect` cleanup.
- Framer Motion used for card hover animations and dialog/overlay transitions.
- Toast notifications via `sonner` for enrich/delete operations.
- ESLint passes cleanly with zero errors.

---

## Task 8-9: Add Game View & Steam Import View
**Agent:** full-stack-developer
**Date:** 2025-01-24
**Status:** ✅ Complete

### Summary
Built the Add Game view (RAWG search) and Steam Import view for the GameVault app. Also fixed the `searchRawg` and `importFromSteam` API function return types in `api.ts` to match the actual backend response format.

### Files Modified

#### 1. `src/lib/api.ts` — API Type Fixes
- Added `RawgSearchResponse` interface matching the actual backend response: `{ results: [...], count: number, nextPage: string | null }` with camelCase fields.
- Updated `searchRawg()` return type from `Promise<RawgGame[]>` to `Promise<RawgSearchResponse>` to match the backend wrapper object.
- Updated `importFromSteam()` return type from `{ imported: number }` to `{ imported, total, skipped, message? }` to match the backend response.

### Files Created

#### 2. `src/components/views/add-game.tsx` — Add Game View

**Search Bar:**
- Input with search icon prefix, Enter key support, and search button with loading spinner.
- Disabled state during search.

**Empty State:**
- Before first search: Gamepad2 icon, "Cerca giochi su RAWG" heading, descriptive text about RAWG database.

**Loading State:**
- 6 skeleton cards matching the result card layout (aspect ratio image + content lines).

**Search Results Grid:**
- Responsive: 1 col → 2 cols sm → 3 cols lg.
- Results count text above grid.
- Each result card includes:
  - Cover image (backgroundImage URL from RAWG) with 16:9 aspect ratio and hover scale effect.
  - Gamepad2 placeholder when no image available.
  - PC badge overlay (Monitor icon) shown when "PC" is in the platforms array.
  - "Added" overlay (green badge with Check icon) for already-added games.
  - Game name (line-clamp-2), release year (Calendar icon), and 5-star rating display.
  - Genre badges: first 3 genres as outline badges, "+N" for overflow.
  - "Aggiungi alla Libreria" button that opens the add dialog.
- Staggered framer-motion entrance animation per card.

**Add to Library Dialog:**
- Game preview with cover image, name, genres, and release year.
- Store selector dropdown from `STORES` constant with color dot indicators.
- Optional playtime minutes input (number type).
- Cancel and "Aggiungi" buttons with loading spinner during creation.
- Calls `createGame()` with RAWG data (title, description, coverImage, screenshots, store, rawgId, genres, rating, releasedAt, playtimeMinutes).
- Success/error toast notifications.
- Marks card as added (overlay + button state change) after successful creation.

**Pagination:**
- "Carica altri risultati" button at bottom when `nextPage` is available.
- Loading spinner during page fetch.
- Appends new results to existing list.

**No Results State:**
- Search icon, "Nessun risultato trovato" message with suggestion to try a different title.

#### 3. `src/components/views/steam-import.tsx` — Steam Import View

**Info Card:**
- "Come ottenere le credenziali Steam" card with two sections:
  - Steam API Key: description + link to steamcommunity.com/dev/apikey (ExternalLink icon).
  - Steam ID (64-bit): description + link to steamid.io (ExternalLink icon).
- Separated by a `Separator`.

**Credentials Form:**
- Steam API Key input with show/hide toggle button (Eye/EyeOff icons).
- Steam ID text input with placeholder "76561198xxxxxxxxx".
- Both fields disabled during import.
- Green checkmark indicator when saved credentials are pre-filled.

**Import Flow:**
- "Importa Libreria" button (disabled when inputs empty, loading spinner during import).
- Progress text during import: "Recupero della libreria Steam in corso..."
- On success: green Alert with imported count, skipped count, and total.
- On failure: destructive Alert with error message.
- Toast notifications for success/failure.

**Post-Import Actions:**
- "Importa di nuovo" button to reset and allow re-import.
- "Vai alla Libreria" button with ArrowRight icon, calls `setCurrentView('library')`.

**Enrichment Tip:**
- Info Alert after successful import suggesting to enrich games with RAWG data from the library page.

**Credential Persistence:**
- Loads saved `steam_api_key` and `steam_id` from `getSettings()` on mount.
- Saves credentials via `setSetting()` after successful import.
- Non-failure handling for credential save (silently catches errors).

### Technical Details
- Both components are `'use client'` and fully typed with TypeScript.
- `useCallback` for memoized event handlers, `useState` for local state, `useEffect` for mount-time loading.
- `AnimatePresence` and `motion` from framer-motion for entrance/exit animations.
- All UI components from shadcn/ui (Card, Dialog, Select, Badge, Input, Button, Alert, etc.).
- Italian UI text throughout.
- ESLint passes cleanly with zero errors.

---

## Task 4 & 11: Layout Integration, Sidebar & Final Assembly
**Agent:** main (Z.ai Code)
**Date:** 2025-01-24
**Status:** ✅ Complete

### Summary
Assembled the full application by creating the root layout with ThemeProvider, the app sidebar with navigation and theme quick-switch, the main page.tsx shell that renders all views, and fixed all import mismatches between components.

### Files Created/Modified

#### 1. `src/app/layout.tsx` — Root Layout (Modified)
- Added `ThemeProvider` wrapper from `@/components/theme-provider`
- Updated metadata: title "GameVault - La tua libreria PC", Italian description
- Kept Geist fonts, globals.css import, and Toaster

#### 2. `src/components/app-sidebar.tsx` — App Sidebar (New)
- Desktop: collapsible sidebar (w-60 or w-16) with toggle button
- Mobile: Sheet-based slide-in menu with hamburger trigger
- Navigation items: Dashboard, Libreria, Aggiungi Gioco, Importa Steam, Impostazioni
- Gamepad2 logo with "GameVault" branding
- Theme quick-switch button in footer (cycles through all 6 themes with tooltip)
- Sidebar uses CSS custom properties (bg-sidebar, text-sidebar-foreground, etc.)

#### 3. `src/app/page.tsx` — Main Page (Rewritten)
- Client component using `useAppStore` for `currentView` state
- Flex layout: sidebar + main content area
- Conditionally renders the active view component
- Always renders `GameDetailDialog` overlay

#### 4. Import Fixes
- Fixed mixed default/named exports across view components
- `DashboardView`, `AddGameView`, `SteamImportView`, `SettingsView`: imported as default
- `LibraryView`, `AppSidebar`, `GameDetailDialog`: imported as named exports

### Application Architecture
```
layout.tsx (ThemeProvider)
  └─ page.tsx (App Shell)
       ├─ AppSidebar (Navigation)
       ├─ DashboardView (Stats + Charts)
       ├─ LibraryView (Game Grid + Filters)
       ├─ AddGameView (RAWG Search)
       ├─ SteamImportView (Steam Import)
       ├─ SettingsView (API Keys + Theme Selector)
       └─ GameDetailDialog (Modal Overlay)
```

### Verification
- ESLint: 0 errors
- Dev server: GET / 200 (successful compilation and render)
- All 6 themes functional via data-theme attribute switching
- All 5 views render correctly

---
Task ID: rewrite-1
Agent: main (Z.ai Code)
Task: Complete rewrite of GameVault from game library manager to gaming news aggregator + release calendar

Work Log:
- Tested RSS feeds from 8 Italian gaming sources
- Found 4 working RSS feeds: IGN Italia (it.ign.com/rss), Gamesurf, GamingToday, Lega Nerd
- Installed fast-xml-parser v5.x for RSS parsing
- Redesigned Prisma schema: Article, FollowedGame, Setting models
- Pushed schema to SQLite database
- Built RSS parser utility (src/lib/rss-parser.ts) with multi-feed support, dedup, image extraction
- Built News API (GET /api/news) with source/search/category filters, pagination, caching
- Built Releases API (GET /api/releases) with RAWG integration for upcoming PC games
- Built Follow Game API (GET/POST/DELETE /api/follow-game)
- Rewrote Zustand store with new views (dashboard/news/calendar/settings)
- Rewrote all constants with new types, feed sources, Italian utilities
- Rewrote all API helpers for new endpoints
- Built new Dashboard view with news + releases overview + recharts donut chart
- Built News view with source filters, search, category filter, article grid
- Built Calendar view with month navigation, release dates, follow/unfollow
- Rewrote Settings with theme selector + RAWG API key
- Rewrote AppSidebar with new navigation items
- Updated page.tsx main shell
- Deleted obsolete files: steam-import.tsx, library.tsx, add-game.tsx, game-detail-dialog.tsx
- ESLint passes with zero errors
- Dev server compiles successfully (GET / 200)

Stage Summary:
- GameVault is now a gaming news aggregator + release calendar app
- 4 Italian RSS sources working (IGN Italia, Gamesurf, GamingToday, Lega Nerd)
- RAWG API integration for upcoming PC release calendar
- 6 themes preserved (Midnight, Ember, Ocean, Forest, Light, Nord)
- All UI text in Italian
---
Task ID: date-format-fix
Agent: main (Z.ai Code)
Task: Fix date formatting across the app to use dd/mm/yyyy format

Work Log:
- Updated `formatCountdown()` in constants.ts: now shows relative format only for ≤ 7 days (Oggi!, Domani!, X giorni), and dd/mm/yyyy for anything beyond 1 week
- Updated `timeAgo()` in constants.ts: now shows relative format only for < 7 days (ora, Xm fa, Xh fa, ieri, Xgg fa), and dd/mm/yyyy for anything older
- Created `formatDateDDMMYYYY()` utility function that formats any date string to dd/mm/yyyy
- Updated `formatDate()` to use `formatDateDDMMYYYY()` internally
- Updated dashboard header date from Italian long format to dd/mm/yyyy
- Updated calendar date group headers from "day month short" to dd/mm/yyyy
- Updated calendar ReleaseItem raw date display to dd/mm/yyyy
- Added `formatDateDDMMYYYY` import to calendar.tsx and dashboard.tsx
- Fixed parsing error (missing closing brace in JSX ternary)
- ESLint passes with zero errors

Stage Summary:
- All release countdowns now show dd/mm/yyyy for dates > 7 days away
- All news article timestamps now show dd/mm/yyyy for articles > 7 days old
- Calendar date headers show dd/mm/yyyy format
- Dashboard header shows dd/mm/yyyy format
- Relative time kept for recent items (< 7 days)
