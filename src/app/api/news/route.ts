import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchAllFeeds } from '@/lib/rss-parser'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const source = searchParams.get('source') ?? ''
    const search = searchParams.get('search') ?? ''
    const category = searchParams.get('category') ?? ''
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 50), 1), 200)
    const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0)
    const refresh = searchParams.get('refresh') === 'true'

    // ── Refresh from RSS if requested or DB is empty ──────────────────────────
    if (refresh) {
      const articles = await fetchAllFeeds()

      if (articles.length > 0) {
        // Upsert in batches to avoid overwhelming SQLite
        for (const article of articles) {
          try {
            await db.article.upsert({
              where: { link: article.link },
              update: {
                title: article.title,
                description: article.description,
                content: article.content,
                imageUrl: article.imageUrl,
                source: article.source,
                author: article.author,
                category: article.category,
                publishedAt: article.publishedAt,
                fetchedAt: new Date(),
              },
              create: {
                title: article.title,
                link: article.link,
                description: article.description,
                content: article.content,
                imageUrl: article.imageUrl,
                source: article.source,
                author: article.author,
                category: article.category,
                publishedAt: article.publishedAt,
              },
            })
          } catch {
            // Skip individual failures (e.g. link collision edge-cases)
          }
        }
      }
    } else {
      // Check if DB is empty → trigger initial fetch
      const count = await db.article.count()
      if (count === 0) {
        const articles = await fetchAllFeeds()

        for (const article of articles) {
          try {
            await db.article.upsert({
              where: { link: article.link },
              update: {
                title: article.title,
                description: article.description,
                content: article.content,
                imageUrl: article.imageUrl,
                source: article.source,
                author: article.author,
                category: article.category,
                publishedAt: article.publishedAt,
                fetchedAt: new Date(),
              },
              create: {
                title: article.title,
                link: article.link,
                description: article.description,
                content: article.content,
                imageUrl: article.imageUrl,
                source: article.source,
                author: article.author,
                category: article.category,
                publishedAt: article.publishedAt,
              },
            })
          } catch {
            // Skip individual failures
          }
        }
      }
    }

    // ── Build where clause ────────────────────────────────────────────────────
    const where: Record<string, unknown> = {}

    if (source) {
      where.source = { equals: source, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' }
    }

    // ── Query ─────────────────────────────────────────────────────────────────
    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.article.count({ where }),
    ])

    // ── Transform: strip HTML from description for the response ────────────────
    const cleaned = articles.map((a) => ({
      ...a,
      description: a.description
        .replace(/<[^>]*>/g, ' ')
        .replace(/\[object Object\]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim(),
      author: typeof a.author === 'string' ? a.author.replace(/\[object Object\]/g, '').trim() : '',
      category: typeof a.category === 'string' ? a.category.replace(/\[object Object\]/g, '').trim() : '',
    }))

    return NextResponse.json({
      articles: cleaned,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[API /news] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il caricamento delle notizie' },
      { status: 500 },
    )
  }
}
