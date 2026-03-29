import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

// ⚠️ Mediastack free tier does NOT support HTTPS (paid plans only).
// This runs server-side in Next.js API routes — browser mixed-content rules don't apply.
const BASE = 'http://api.mediastack.com/v1'

// Mediastack category values: general, business, entertainment, health, science, sports, technology
const MEDIASTACK_CATEGORY: Partial<Record<TopicSlug, string>> = {
  all:              'general',
  business:         'business',
  technology:       'technology',
  'science-health': 'health,science',
}

export async function fetchFromMediastack(
  keywords: string[],
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const url = new URL(`${BASE}/news`)
  url.searchParams.set('access_key', process.env.MEDIASTACK_API_KEY!)
  url.searchParams.set('languages', 'en')
  url.searchParams.set('limit', '20')
  url.searchParams.set('offset', String((page - 1) * 20))
  url.searchParams.set('sort', 'published_desc')

  const category = MEDIASTACK_CATEGORY[topic]
  if (category) {
    url.searchParams.set('categories', category)
  } else {
    // Use keyword search for topics without a direct Mediastack category
    url.searchParams.set('keywords', keywords.slice(0, 3).join(','))
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return []

  const data = await res.json()
  if (!data.data) return []

  return data.data
    .filter((a: any) => a.title && a.url)
    .map((a: any): NormalizedArticle => ({
      id: generateId(a.url),
      title: a.title,
      description: a.description ?? '',
      content: null,
      url: a.url,
      imageUrl: a.image ?? null,
      source: a.source ?? 'Unknown',
      publishedAt: a.published_at,
      topic,
      apiSource: 'mediastack',
    }))
}
