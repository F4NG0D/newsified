import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

const BASE = 'https://newsapi.org/v2'

// NewsAPI top-headlines categories (used for specific tabs)
const NEWSAPI_CATEGORY: Partial<Record<TopicSlug, string>> = {
  business:         'business',
  technology:       'technology',
  'science-health': 'science',
}

export async function fetchFromNewsAPI(
  keywords: string[],
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const apiKey = process.env.NEWSAPI_KEY!

  let url: URL

  if (topic === 'all') {
    // Top headlines — no query needed, returns current top stories
    url = new URL(`${BASE}/top-headlines`)
    url.searchParams.set('language', 'en')
    url.searchParams.set('pageSize', '20')
    url.searchParams.set('page', String(page))
  } else if (NEWSAPI_CATEGORY[topic]) {
    // Use category endpoint for better relevance
    url = new URL(`${BASE}/top-headlines`)
    url.searchParams.set('category', NEWSAPI_CATEGORY[topic]!)
    url.searchParams.set('language', 'en')
    url.searchParams.set('pageSize', '20')
    url.searchParams.set('page', String(page))
  } else {
    // Use keyword search with quoted phrases for precision
    const query = keywords
      .slice(0, 3)
      .map(k => (k.includes(' ') ? `"${k}"` : k))
      .join(' OR ')
    url = new URL(`${BASE}/everything`)
    url.searchParams.set('q', query)
    url.searchParams.set('language', 'en')
    url.searchParams.set('sortBy', 'publishedAt')
    url.searchParams.set('pageSize', '20')
    url.searchParams.set('page', String(page))
  }

  url.searchParams.set('apiKey', apiKey)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return []

  const data = await res.json()
  if (!data.articles) return []

  return data.articles
    .filter((a: any) => a.title && a.title !== '[Removed]' && a.url)
    .map((a: any): NormalizedArticle => ({
      id: generateId(a.url),
      title: a.title,
      description: a.description ?? '',
      content: a.content ?? null,
      url: a.url,
      imageUrl: a.urlToImage ?? null,
      source: a.source?.name ?? 'Unknown',
      publishedAt: a.publishedAt,
      topic,
      apiSource: 'newsapi',
    }))
}
