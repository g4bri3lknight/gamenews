import { NextRequest, NextResponse } from 'next/server'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let cache: { data: unknown; timestamp: number; key: string } | null = null

const STORE_MAP: Record<string, string> = {
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pageNumber = searchParams.get('pageNumber') || '0'
  const pageSize = searchParams.get('pageSize') || '30'
  const storeID = searchParams.get('storeID') || ''
  const sortBy = searchParams.get('sortBy') || 'Deal Rating'
  const upperPrice = searchParams.get('upperPrice') || ''

  const cacheKey = `deals-${pageNumber}-${pageSize}-${storeID}-${sortBy}-${upperPrice}`
  if (cache && cache.timestamp + CACHE_TTL > Date.now() && cache.key === cacheKey) {
    return NextResponse.json(cache.data)
  }

  try {
    // onSale=1 + lowerPrice=0.01 to EXCLUDE free games from deals
    let url = `https://www.cheapshark.com/api/1.0/deals?onSale=1&pageNumber=${pageNumber}&pageSize=${pageSize}&sortBy=${encodeURIComponent(sortBy)}&lowerPrice=0.01`
    if (storeID) url += `&storeID=${storeID}`
    if (upperPrice) url += `&upperPrice=${upperPrice}`

    const response = await fetch(url, {
      headers: { 'User-Agent': 'GameVault/1.0' },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`CheapShark API error: ${response.status}`)
    }

    const data = await response.json()

    // Filter out games with no thumbnail, enrich, and ensure no free games leak through
    const enriched = (data as Record<string, string>[])
      .filter((deal: Record<string, string>) => deal.thumb && deal.thumb.length > 0)
      .filter((deal: Record<string, string>) => parseFloat(deal.salePrice) > 0)
      .map((deal: Record<string, string>) => {
        // Build direct URL when possible, otherwise use CheapShark redirect
        let dealUrl: string
        const sid = deal.storeID
        const steamAppID = deal.steamAppID

        if (sid === '1' && steamAppID) {
          // Steam: direct link to store page
          dealUrl = `https://store.steampowered.com/app/${steamAppID}/`
        } else {
          // Other stores: CheapShark redirect (dealID is already URL-encoded, no need for encodeURIComponent)
          dealUrl = `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`
        }

        return {
          ...deal,
          storeName: STORE_MAP[sid] || `Store ${sid}`,
          dealUrl,
        }
      })

    cache = { data: enriched, timestamp: Date.now(), key: cacheKey }
    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Deals API error:', error)
    return NextResponse.json(
      { error: 'Impossibile recuperare le offerte' },
      { status: 500 }
    )
  }
}
