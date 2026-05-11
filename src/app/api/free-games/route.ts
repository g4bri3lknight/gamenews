import { NextRequest, NextResponse } from 'next/server'

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
let cache: { data: unknown; timestamp: number; key: string } | null = null

// ============================================
// UNIFIED FREE GAME INTERFACE
// ============================================

interface FreeGame {
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

// ============================================
// 1. EPIC GAMES — Direct API
// ============================================

async function fetchEpicFreeGames(): Promise<FreeGame[]> {
  try {
    const url = 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=it-IT&country=IT&allowCountries=IT'
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GameVault/1.0' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []

    const json = await res.json()
    const elements: Record<string, unknown>[] = json?.data?.Catalog?.searchStore?.elements ?? []

    const now = Date.now()
    const games: FreeGame[] = []

    for (const el of elements) {
      const promotions = el.promotions as Record<string, unknown> | undefined
      const promotionalOffers = promotions?.promotionalOffers as Record<string, unknown>[] | undefined
      const upcomingOffers = promotions?.upcomingPromotionalOffers as Record<string, unknown>[] | undefined

      function extractDates(offerGroup: Record<string, unknown> | undefined): { start: number; end: number; discount: number }[] {
        if (!offerGroup) return []
        return offerGroup.promotionalOffers
          ? ((offerGroup.promotionalOffers as Record<string, unknown>[]).map((o) => ({
              start: new Date(o.startDate as string).getTime(),
              end: new Date(o.endDate as string).getTime(),
              discount: ((o.discountSetting as Record<string, unknown>)?.discountPercentage as number) ?? 0,
            })))
          : []
      }

      const activeDates = promotionalOffers?.flatMap(extractDates) ?? []
      const isActive = activeDates.some(d => d.discount === 0 && now >= d.start && now <= d.end)

      const upcomingDates = upcomingOffers?.flatMap(extractDates) ?? []
      const isUpcoming = upcomingDates.some(d => d.discount === 0 && now < d.start)

      if (!isActive && !isUpcoming) continue

      const title = (el.title as string) || 'Senza titolo'
      if (title.toLowerCase().startsWith('mystery')) continue

      const keyImages = el.keyImages as Record<string, string>[]
      const thumb = keyImages?.find(img => img.type === 'OfferImageWide')?.url
        || keyImages?.find(img => img.type === 'Thumbnail')?.url
        || ''
      const price = el.price as Record<string, unknown>
      const totalPrice = price?.totalPrice as Record<string, unknown>
      const originalPrice = ((totalPrice?.originalPrice as number) || 0) / 100
      const id = el.id as string || ''

      // Extract pageSlug from catalogNs.mappings for proper URL
      const catalogNs = el.catalogNs as Record<string, unknown> | undefined
      const mappings = catalogNs?.mappings as Record<string, string>[] | undefined
      const pageSlug = mappings?.find(m => m.pageType === 'productHome')?.pageSlug || ''

      if (isUpcoming && !isActive && originalPrice === 0) continue

      // Use pageSlug for direct product URL (namespace UUIDs don't route properly)
      const dealUrl = pageSlug
        ? `https://store.epicgames.com/it/p/${pageSlug}`
        : 'https://store.epicgames.com/it/free-games'

      games.push({
        title,
        dealID: `epic-${id}`,
        storeID: 'epic',
        storeName: 'Epic Games',
        gameID: id,
        salePrice: isActive ? '0.00' : originalPrice.toFixed(2),
        normalPrice: originalPrice.toFixed(2),
        savings: isActive ? '100' : '0',
        metacriticScore: '0',
        steamRatingText: '',
        steamRatingPercent: '0',
        steamAppID: '',
        releaseDate: 0,
        dealRating: '9',
        thumb: thumb.replace(' ', ''),
        dealUrl,
      })
    }

    return games
  } catch (err) {
    console.error('Epic Games free games error:', err)
    return []
  }
}

// ============================================
// 2. GAMERPOWER — Multi-platform Free Games
// ============================================

async function fetchGamerPowerGames(): Promise<FreeGame[]> {
  try {
    const res = await fetch('https://www.gamerpower.com/api/giveaways?type=game&platform=pc', {
      headers: { 'User-Agent': 'GameVault/1.0' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []

    const data = await res.json()
    if (!Array.isArray(data)) return []

    const now = Date.now()
    const games: FreeGame[] = []

    for (const item of data) {
      // Skip expired
      const endStr = item.end_date as string
      if (endStr && endStr !== 'N/A') {
        const endTime = new Date(endStr).getTime()
        if (now > endTime) continue
      }

      // Skip non-active
      if (item.status !== 'Active') continue

      const title = (item.title as string) || 'Senza titolo'
      const platforms = (item.platforms as string) || ''
      const thumbnail = (item.thumbnail as string) || ''
      const image = (item.image as string) || ''
      const worth = (item.worth as string) || '$0'
      const gameUrl = (item.open_giveaway_url as string) || (item.gamerpower_url as string) || ''

      // Determine store name from platforms
      let storeName = 'Altro'
      let storeID = 'other'
      if (platforms.includes('Epic Games Store')) { storeName = 'Epic Games'; storeID = 'epic' }
      else if (platforms.includes('Steam')) { storeName = 'Steam'; storeID = 'steam' }
      else if (platforms.includes('GOG')) { storeName = 'GOG'; storeID = 'gog' }
      else if (platforms.includes('Humble')) { storeName = 'Humble'; storeID = 'humble' }
      else if (platforms.includes('Amazon') || platforms.includes('Prime Gaming')) { storeName = 'Amazon Prime Gaming'; storeID = 'amazon' }
      else if (platforms.includes('Ubisoft') || platforms.includes('Uplay')) { storeName = 'Ubisoft'; storeID = 'ubisoft' }
      else if (platforms.includes('Itch.io')) { storeName = 'Itch.io'; storeID = 'itchio' }

      // Skip Epic games (we have direct API)
      if (storeID === 'epic') continue

      // Parse worth to normalPrice
      const normalPrice = parseFloat(worth.replace(/[^0-9.]/g, '')) || 0

      games.push({
        title,
        dealID: `gp-${item.id}`,
        storeID,
        storeName,
        gameID: String(item.id),
        salePrice: '0.00',
        normalPrice: normalPrice.toFixed(2),
        savings: normalPrice > 0 ? '100' : '0',
        metacriticScore: '0',
        steamRatingText: '',
        steamRatingPercent: '0',
        steamAppID: '',
        releaseDate: 0,
        dealRating: '7',
        thumb: image || thumbnail,
        dealUrl: gameUrl,
      })
    }

    return games
  } catch (err) {
    console.error('GamerPower free games error:', err)
    return []
  }
}

// ============================================
// 3. CHEAPSHARK — Steam + GOG Free Games
// ============================================

const CHEAPSHARK_STORE_MAP: Record<string, string> = {
  '1': 'Steam',
  '2': 'GamersGate',
  '3': 'GreenManGaming',
  '7': 'GOG',
  '8': 'EA',
  '9': 'Ubisoft',
  '11': 'Humble',
  '13': 'Voidu',
  '15': 'Epic',
  '21': 'WinGameStore',
  '23': 'GameBillet',
  '24': 'Fanatical',
  '25': 'DreamGame',
}

async function fetchCheapSharkFreeGames(): Promise<FreeGame[]> {
  try {
    // Fetch ALL free games (pageSize=60 to get maximum coverage)
    const url = `https://www.cheapshark.com/api/1.0/deals?upperPrice=0&pageNumber=0&pageSize=60&sortBy=Deal Rating`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'GameVault/1.0' },
      next: { revalidate: 300 },
    })
    if (!response.ok) return []

    const data = await response.json()

    return (data as Record<string, string>[])
      .filter((deal: Record<string, string>) => {
        // Include all stores with thumbnails (not just Steam/GOG)
        return deal.thumb && deal.thumb.length > 0
      })
      .map((deal: Record<string, string>) => ({
        title: deal.title,
        dealID: `cs-${deal.dealID}`,
        storeID: deal.storeID === '1' ? 'steam' : deal.storeID === '7' ? 'gog' : deal.storeID === '15' ? 'epic' : 'other',
        storeName: CHEAPSHARK_STORE_MAP[deal.storeID] || 'Altro',
        gameID: deal.steamAppID || deal.gameID,
        salePrice: '0.00',
        normalPrice: deal.normalPrice || '0.00',
        savings: deal.savings || '100',
        metacriticScore: deal.metacriticScore || '0',
        steamRatingText: deal.steamRatingText || '',
        steamRatingPercent: deal.steamRatingPercent || '0',
        steamAppID: deal.steamAppID || '',
        releaseDate: parseInt(deal.releaseDate) || 0,
        dealRating: deal.dealRating || '7',
        thumb: deal.thumb,
        dealUrl: deal.storeID === '1' && deal.steamAppID
          ? `https://store.steampowered.com/app/${deal.steamAppID}/`
          : `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
      }))
  } catch (err) {
    console.error('CheapShark free games error:', err)
    return []
  }
}

// ============================================
// MAIN API HANDLER
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pageNumber = searchParams.get('pageNumber') || '0'
  const pageSize = searchParams.get('pageSize') || '30'
  const storeID = searchParams.get('storeID') || ''

  const cacheKey = `free-${pageNumber}-${pageSize}-${storeID}`
  if (cache && cache.timestamp + CACHE_TTL > Date.now() && cache.key === cacheKey) {
    return NextResponse.json(cache.data)
  }

  try {
    // Fetch from all sources in parallel
    const [epicGames, gamerPowerGames, cheapSharkGames] = await Promise.allSettled([
      fetchEpicFreeGames(),
      fetchGamerPowerGames(),
      fetchCheapSharkFreeGames(),
    ])

    const allSources: FreeGame[][] = [
      epicGames.status === 'fulfilled' ? epicGames.value : [],
      gamerPowerGames.status === 'fulfilled' ? gamerPowerGames.value : [],
      cheapSharkGames.status === 'fulfilled' ? cheapSharkGames.value : [],
    ]

    // Merge all sources, deduplicate by title
    const seen = new Set<string>()
    const merged: FreeGame[] = []

    for (const source of allSources) {
      for (const game of source) {
        const key = game.title.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (!seen.has(key)) {
          seen.add(key)
          merged.push(game)
        }
      }
    }

    // Filter by store if requested
    let result = storeID
      ? merged.filter(g => g.storeID === storeID)
      : merged

    // Apply pagination
    const page = parseInt(pageNumber) || 0
    const size = parseInt(pageSize) || 30
    result = result.slice(page * size, (page + 1) * size)

    cache = { data: result, timestamp: Date.now(), key: cacheKey }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Free games API error:', error)
    return NextResponse.json(
      { error: 'Impossibile recuperare i giochi gratis' },
      { status: 500 }
    )
  }
}
