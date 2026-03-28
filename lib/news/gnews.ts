import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

const BASE = 'https://gnews.io/api/v4'

export async function fetchFromGNews(
  keywords: string[],
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const query = keywords.slice(0, 2).join(' OR ')
  const url = new URL(`${BASE}/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('lang', 'en')
  url.searchParams.set('max', '20')
  url.searchParams.set('page', String(page))
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
