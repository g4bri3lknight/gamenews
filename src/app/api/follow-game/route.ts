import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET /api/follow-game — Return all followed games ──────────────────────────

export async function GET() {
  try {
    const games = await db.followedGame.findMany({
      orderBy: { addedAt: 'desc' },
    })

    const cleaned = games.map((g) => ({
      ...g,
      genres: JSON.parse(g.genres) as string[],
    }))

    return NextResponse.json({ games: cleaned })
  } catch (error) {
    console.error('[API /follow-game GET] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il caricamento dei giochi seguiti' },
      { status: 500 },
    )
  }
}

// ─── POST /api/follow-game — Upsert a followed game ─────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rawgId, title, imageUrl = '', releasedAt = '', genres = '[]', rating = 0 } = body

    if (rawgId === undefined || rawgId === null) {
      return NextResponse.json(
        { error: 'rawgId è obbligatorio' },
        { status: 400 },
      )
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'title è obbligatorio' },
        { status: 400 },
      )
    }

    // Ensure genres is a stringified JSON array
    const genresStr = typeof genres === 'string' ? genres : JSON.stringify(genres || [])

    const game = await db.followedGame.upsert({
      where: { rawgId: Number(rawgId) },
      update: {
        title,
        imageUrl: String(imageUrl),
        releasedAt: String(releasedAt),
        genres: genresStr,
        rating: Number(rating) || 0,
      },
      create: {
        rawgId: Number(rawgId),
        title,
        imageUrl: String(imageUrl),
        releasedAt: String(releasedAt),
        genres: genresStr,
        rating: Number(rating) || 0,
      },
    })

    return NextResponse.json({
      ...game,
      genres: JSON.parse(game.genres),
    })
  } catch (error) {
    console.error('[API /follow-game POST] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il salvataggio del gioco' },
      { status: 500 },
    )
  }
}

// ─── DELETE /api/follow-game — Remove a followed game ───────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'id è obbligatorio' },
        { status: 400 },
      )
    }

    await db.followedGame.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API /follow-game DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante la rimozione del gioco' },
      { status: 500 },
    )
  }
}
