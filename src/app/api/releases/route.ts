import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RAWGGame {
  id: number
  name: string
  released: string | null
  rating: number
  background_image: string | null
  genres: { name: string }[]
  platforms: { platform: { name: string } }[]
  short_description: string
}

interface RAWGResponse {
  results: RAWGGame[]
  count: number
  next: string | null
  previous: string | null
}

/** Get the RAWG API key from env or the Setting table. */
async function getRawgApiKey(): Promise<string | null> {
  if (process.env.RAWG_API_KEY) return process.env.RAWG_API_KEY
  try {
    const setting = await db.setting.findUnique({ where: { key: 'rawg_api_key' } })
    return setting?.value ?? null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(Number(searchParams.get('page') ?? 1), 1)
    const pageSize = Math.min(Math.max(Number(searchParams.get('page_size') ?? 20), 1), 50)
    const monthParam = searchParams.get('month') ?? ''

    const apiKey = await getRawgApiKey()

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Chiave API RAWG non configurata. Imposta la variabile RAWG_API_KEY o aggiungi la chiave nelle impostazioni.',
          games: [],
          count: 0,
        },
        { status: 400 },
      )
    }

    // ── Build dates range ─────────────────────────────────────────────────────
    let dates: string
    if (monthParam) {
      // Specific month: 2024-06 → 2024-06-01,2024-06-30
      const [year, month] = monthParam.split('-').map(Number)
      const lastDay = new Date(year, month, 0).getDate()
      dates = `${year}-${String(month).padStart(2, '0')}-01,${year}-${String(month).padStart(2, '0')}-${lastDay}`
    } else {
      // Default: today → 6 months from now
      const today = new Date()
      const sixMonthsLater = new Date(today)
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)
      const fmt = (d: Date) => d.toISOString().split('T')[0]
      dates = `${fmt(today)},${fmt(sixMonthsLater)}`
    }

    // ── Call RAWG API ─────────────────────────────────────────────────────────
    const params = new URLSearchParams({
      dates,
      platforms: '4', // PC
      ordering: '-added',
      page: String(page),
      page_size: String(pageSize),
      key: apiKey,
    })

    const res = await fetch(
      `https://api.rawg.io/api/games?${params.toString()}`,
      { cache: 'no-store' },
    )

    if (!res.ok) {
      console.error(`[API /releases] RAWG returned ${res.status}`)
      return NextResponse.json(
        { error: `Errore RAWG API (HTTP ${res.status})`, games: [], count: 0 },
        { status: 502 },
      )
    }

    const data: RAWGResponse = await res.json()

    const games = (data.results ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      released: g.released,
      rating: g.rating,
      backgroundImage: g.background_image,
      genres: (g.genres ?? []).map((genre) => genre.name),
      platforms: (g.platforms ?? []).map((p) => p.platform.name),
      shortDescription: g.short_description,
    }))

    return NextResponse.json({
      results: games,
      count: data.count,
      next: data.next,
      previous: data.previous,
    })
  } catch (error) {
    console.error('[API /releases] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il caricamento delle uscite', results: [], count: 0 },
      { status: 500 },
    )
  }
}
