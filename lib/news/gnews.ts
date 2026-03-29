import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

const BASE = 'https://gnews.io/api/v4'

// GNews native topic values
// Available: breaking-news, world, nation, business, technology, entertainment, sports, science, health
const GNEWS_TOPIC: Partial<Record<TopicSlug, string>> = {
  all:              'breaking-news',
  geopolitics:      'world',
  finance:          'business',
  business:         'business',
  technology:       'technology',
  'us-politics':    'nation',
  energy:           'business',
  economy:          'business',
  'science-health': 'science',
}

export async function fetchFromGNews(
  keywords: string[],
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const gnewsTopic = GNEWS_TOPIC[topic]
  const url = new URL(`${BASE}/${gnewsTopic ? 'top-headlines' : 'search'}`)

  if (gnewsTopic) {
    url.searchParams.set('topic', gnewsTopic)
    url.searchParams.set('lang', 'en')
    url.searchParams.set('max', '20')
    url.searchParams.set('page', String(page))
  } else {
    // Fallback: keyword search with quoted phrases
    const query = keywords
      .slice(0, 2)
      .map(k => (k.includes(' ') ? `"${k}"` : k))
      .join(' OR ')
    url.searchParams.set('q', query)
    url.searchParams.set('lang', 'en')
    url.searchParams.set('max', '20')
    url.searchParams.set('page', String(page))
  }

  url.searchParams.set('token', process.env.GNEWS_API_KEY!)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return []

  const data = await res.json()
  if (!data.articles) return []

  return data.articles.map((a: any): NormalizedArticle => ({
    id: generateId(a.url),
    title: a.title,
    description: a.description ?? '',
    content: a.content ?? null,
    url: a.url,
    imageUrl: a.image ?? null,
    source: a.source?.name ?? 'Unknown',
    publishedAt: a.publishedAt,
    topic,
    apiSource: 'gnews',
  }))
}
