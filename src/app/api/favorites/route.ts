import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET /api/favorites — Return all favorites ───────────────────────────

export async function GET() {
  try {
    const favorites = await db.favorite.findMany({
      orderBy: { addedAt: 'desc' },
    })

    return NextResponse.json(favorites)
  } catch (error) {
    console.error('[API /favorites GET] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il caricamento dei preferiti' },
      { status: 500 },
    )
  }
}

// ─── POST /api/favorites — Add a favorite ────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,
      title,
      link,
      imageUrl = '',
      description = '',
      source = '',
      metadata = '{}',
    } = body

    if (!type || !title || !link) {
      return NextResponse.json(
        { error: 'type, title e link sono obbligatori' },
        { status: 400 },
      )
    }

    // Check for duplicate by link
    const existing = await db.favorite.findFirst({ where: { link } })
    if (existing) {
      return NextResponse.json(existing)
    }

    const favorite = await db.favorite.create({
      data: {
        type: String(type),
        title: String(title),
        link: String(link),
        imageUrl: String(imageUrl),
        description: String(description),
        source: String(source),
        metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
      },
    })

    return NextResponse.json(favorite)
  } catch (error) {
    console.error('[API /favorites POST] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il salvataggio del preferito' },
      { status: 500 },
    )
  }
}

// ─── DELETE /api/favorites — Remove a favorite ───────────────────────────

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

    await db.favorite.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API /favorites DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante la rimozione del preferito' },
      { status: 500 },
    )
  }
}
