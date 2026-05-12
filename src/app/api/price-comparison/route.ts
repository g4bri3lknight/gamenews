import { NextRequest, NextResponse } from 'next/server'
import { CHEAPSHARK_STORE_MAP } from '@/lib/constants'

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const FETCH_TIMEOUT = 12000 // 12 seconds
let cache: { data: unknown; timestamp: number; key: string } | null = null

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')

  if (!title || title.trim().length === 0) {
    return NextResponse.json(
      { error: 'Il parametro "title" è obbligatorio' },
      { status: 400 }
    )
  }

  const cacheKey = `price-comparison-${title.toLowerCase().trim()}`
  if (cache && cache.timestamp + CACHE_TTL > Date.now() && cache.key === cacheKey) {
    return NextResponse.json(cache.data)
  }

  try {
    // Step 1: Search for games matching the title on CheapShark
    // Try multiple search strategies for better matching
    const searchTitle = title.trim()
    const searchUrl = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(searchTitle)}&limit=10`
    const searchRes = await fetchWithTimeout(searchUrl, {
      headers: { 'User-Agent': 'GameVault/1.0' },
      next: { revalidate: 600 },
    })

    if (!searchRes.ok) {
      throw new Error(`CheapShark search error: ${searchRes.status}`)
    }

    const searchResults = await searchRes.json() as Array<{
      gameID: string
      steamAppID: string
      cheapest: string
      cheapestDealID: string
      external: string
    }>

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json([])
    }

    // Find best match - try exact title first, then partial match
    const normalizedTitle = searchTitle.toLowerCase()
    const normalizedClean = normalizedTitle.replace(/[^a-z0-9]/g, '')

    let bestMatch = searchResults.find(
      (r) => r.external.toLowerCase() === normalizedTitle
    ) || searchResults.find(
      (r) => r.external.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedClean
    ) || searchResults.find(
      (r) => normalizedTitle.includes(r.external.toLowerCase()) || r.external.toLowerCase().includes(normalizedTitle)
    ) || searchResults[0]

    const cheapSharkGameId = bestMatch.gameID

    // Step 2: Get deals for this game across all stores
    const dealsUrl = `https://www.cheapshark.com/api/1.0/games?id=${cheapSharkGameId}`
    const dealsRes = await fetchWithTimeout(dealsUrl, {
      headers: { 'User-Agent': 'GameVault/1.0' },
      next: { revalidate: 600 },
    })

    if (!dealsRes.ok) {
      throw new Error(`CheapShark deals error: ${dealsRes.status}`)
    }

    const dealsData = await dealsRes.json() as {
      info: {
        title: string
        steamAppID: string
        cheapest: string
        cheapestDealID: string
      }
      deals: Array<{
        storeID: string
        dealID: string
        price: string
        retailPrice: string
        savings: string
      }>
    }

    if (!dealsData.deals || dealsData.deals.length === 0) {
      return NextResponse.json([])
    }

    // Step 3: Transform and enrich with store info
    const storePrices = dealsData.deals
      .filter((deal) => {
        // Only include active deals with a valid price
        return deal.price !== undefined && deal.storeID
      })
      .map((deal) => {
        const storeInfo = CHEAPSHARK_STORE_MAP[deal.storeID] || {
          name: `Store ${deal.storeID}`,
          color: '#666666',
        }

        return {
          storeID: deal.storeID,
          storeName: storeInfo.name,
          price: parseFloat(deal.price).toFixed(2),
          normalPrice: parseFloat(deal.retailPrice).toFixed(2),
          savings: Math.round(parseFloat(deal.savings)),
          dealUrl: deal.storeID === '1' && dealsData.info.steamAppID
            ? `https://store.steampowered.com/app/${dealsData.info.steamAppID}/`
            : `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
          color: storeInfo.color,
        }
      })
      // Filter out stores with price 0 that aren't actually free
      .filter((sp) => parseFloat(sp.price) >= 0)
      // Sort by price ascending (cheapest first)
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))

    cache = { data: storePrices, timestamp: Date.now(), key: cacheKey }
    return NextResponse.json(storePrices)
  } catch (error) {
    console.error('Price comparison API error:', error)
    return NextResponse.json(
      { error: 'Impossibile recuperare il confronto prezzi' },
      { status: 500 }
    )
  }
}
