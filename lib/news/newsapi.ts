import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

const BASE = 'https://newsapi.org/v2'

export async function fetchFromNewsAPI(
  keywords: string[],
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const query = keywords.slice(0, 3).join(' OR ')
  const url = new URL(`${BASE}/everything`)
  url.searchParams.set('q', query)
  url.searchParams.set('language', 'en')
  url.searchParams.set('sortBy', 'publishedAt')
  url.searchParams.set('page', String(page))
  url.searchParams.set('pageSize', '20')
  url.searchParams.set('apiKey', process.env.NEWSAPI_KEY!)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return []

  const data = await res.json()
  if (!data.articles) return []

  return data.articles
    .filter((a: any) => a.title && a.title !== '[Removed]')
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
