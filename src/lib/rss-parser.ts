import { XMLParser } from 'fast-xml-parser'

// ─── Feed configuration (exported for frontend use) ───────────────────────────

export interface RSSFeedConfig {
  url: string
  name: string
  color: string // tailwind color for UI badges / accents
}

export const RSS_FEEDS: RSSFeedConfig[] = [
  {
    url: 'https://multiplayer.it/feed',
    name: 'Multiplayer.it',
    color: '#e20613',
  },
  {
    url: 'https://it.ign.com/rss',
    name: 'IGN Italia',
    color: '#bf2026',
  },
  {
    url: 'https://www.gamesurf.it/feed',
    name: 'Gamesurf',
    color: '#e8a317',
  },
  {
    url: 'https://gamingtoday.it/feed/',
    name: 'GamingToday',
    color: '#1a8cff',
  },
  {
    url: 'https://leganerd.com/feed/',
    name: 'Lega Nerd',
    color: '#6c3483',
  },
]

// ─── Normalized article shape ─────────────────────────────────────────────────

export interface ParsedArticle {
  title: string
  link: string
  description: string
  content: string
  imageUrl: string
  author: string
  category: string
  publishedAt: Date
  source: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely coerce a value to string, handling nested objects from XML parsing. */
function safeString(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  // XMLParser sometimes returns objects like { '#text': '...' } or { name: '...' }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>
    // Try #text first (common XMLParser pattern)
    if (typeof obj['#text'] === 'string') return obj['#text']
    // Try name (Atom author pattern)
    if (typeof obj['name'] === 'string') return obj['name']
    // Try nestedStr or _text
    if (typeof obj['_text'] === 'string') return obj['_text']
    // Try nestedStr
    if (typeof obj['nestedStr'] === 'string') return obj['nestedStr']
    // Fallback: try all string values
    for (const v of Object.values(obj)) {
      if (typeof v === 'string' && v.trim()) return v
    }
  }
  return ''
}

/** Strip all HTML tags and decode entities, keeping only text. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Extract the first `src` from an HTML string. */
function firstImgSrc(html: string): string {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return m?.[1] ?? ''
}

/** Try to parse a date string. Returns `null` on failure. */
function tryParseDate(raw: string | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

// ─── Core parser ──────────────────────────────────────────────────────────────

export async function parseRSSFeed(
  feedUrl: string,
  feedName: string,
): Promise<ParsedArticle[]> {
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'GameVault/1.0' },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${feedUrl}`)
  }

  const xml = await res.text()

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) =>
      name === 'item' || name === 'entry' || name === 'category',
  })

  const parsed = parser.parse(xml)

  // RSS 2.0 → { rss.channel.item[] }
  // Atom      → { feed.entry[] }
  const channel =
    parsed?.rss?.channel ?? parsed?.feed ?? parsed
  const items: unknown[] = channel?.item ?? channel?.entry ?? []

  if (!Array.isArray(items) || items.length === 0) return []

  return items
    .map((item: Record<string, unknown>) => {
      // ── Title / Link ────────────────────────────────────
      const title = safeString(item.title)
      const link = safeString(item.link ?? item.id)

      if (!title || !link) return null

      // ── Description / Content ───────────────────────────
      const description = safeString(item.description ?? item.summary)
      const contentRaw = item['content:encoded']
        ? safeString(item['content:encoded'])
        : safeString(item.content)

      // ── Image URL extraction ────────────────────────────
      let imageUrl = ''

      // 1. enclosure url
      const enclosure = item.enclosure
      if (enclosure) {
        const enc =
          Array.isArray(enclosure) ? enclosure[0] : enclosure
        if ((enc as Record<string, string>)['@_url']) {
          imageUrl = (enc as Record<string, string>)['@_url']
        }
      }

      // 2. media:content url
      if (!imageUrl && item['media:content']) {
        const media = Array.isArray(item['media:content'])
          ? item['media:content'][0]
          : item['media:content']
        if ((media as Record<string, string>)['@_url']) {
          imageUrl = (media as Record<string, string>)['@_url']
        }
      }

      // 3. media:thumbnail
      if (!imageUrl && item['media:thumbnail']) {
        const thumb = Array.isArray(item['media:thumbnail'])
          ? item['media:thumbnail'][0]
          : item['media:thumbnail']
        if ((thumb as Record<string, string>)['@_url']) {
          imageUrl = (thumb as Record<string, string>)['@_url']
        }
      }

      // 4. first img in content:encoded
      if (!imageUrl && contentRaw) {
        imageUrl = firstImgSrc(contentRaw)
      }

      // 5. first img in description
      if (!imageUrl && description) {
        imageUrl = firstImgSrc(description)
      }

      // ── Author ──────────────────────────────────────────
      let author = ''
      if (item['dc:creator']) {
        author = safeString(item['dc:creator'])
      } else if (item.author) {
        author = safeString(item.author)
      }

      // ── Category ────────────────────────────────────────
      let category = ''
      if (Array.isArray(item.category) && item.category.length > 0) {
        // Prefer specific gaming categories
        const filtered = item.category
          .map((c) => safeString(c))
          .filter(
            (c: string) =>
              !['Notizie', 'News'].includes(c) ||
              (item.category as unknown[]).length === 1,
          )
          .filter((c: string) => c && !c.startsWith('[object'))
        category = filtered[0] ?? ''
      } else if (item.category) {
        category = safeString(item.category)
      }

      // ── Published date ──────────────────────────────────
      const rawDate = safeString(
        item.pubDate ?? item.published ?? item.updated,
      )
      const publishedAt =
        tryParseDate(rawDate) ?? new Date() // fallback to now

      return {
        title,
        link,
        description: stripHtml(description),
        content: contentRaw,
        imageUrl,
        author: stripHtml(author),
        category: stripHtml(category),
        publishedAt,
        source: feedName,
      } satisfies ParsedArticle
    })
    .filter((a): a is ParsedArticle => a !== null)
}

// ─── Fetch all feeds with deduplication ───────────────────────────────────────

export async function fetchAllFeeds(): Promise<ParsedArticle[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map((f) => parseRSSFeed(f.url, f.name)),
  )

  const seen = new Set<string>()
  const articles: ParsedArticle[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const article of result.value) {
        if (!seen.has(article.link)) {
          seen.add(article.link)
          articles.push(article)
        }
      }
    } else {
      console.error(
        `[RSS] Failed to fetch feed: ${(result as PromiseRejectedResult).reason}`,
      )
    }
  }

  // Sort newest first
  articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())

  return articles
}
