import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

const BASE = 'https://www.alphavantage.co/query'

const AV_TOPICS: Record<string, string> = {
  finance: 'financial_markets',
  economy: 'economy_macro',
  technology: 'technology',
  business: 'earnings',
  energy: 'energy_transportation',
  all: 'financial_markets',
}

export async function fetchFromAlphaVantage(
  topic: TopicSlug
): Promise<NormalizedArticle[]> {
  const avTopic = AV_TOPICS[topic] ?? 'financial_markets'
  const url = new URL(BASE)
  url.searchParams.set('function', 'NEWS_SENTIMENT')
  url.searchParams.set('topics', avTopic)
  url.searchParams.set('limit', '20')
  url.searchParams.set('sort', 'LATEST')
  url.searchParams.set('apikey', process.env.ALPHAVANTAGE_API_KEY!)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return []

  const data = await res.json()
  if (!data.feed) return []

  return data.feed.map((a: any): NormalizedArticle => ({
    id: generateId(a.url),
    title: a.title,
    description: a.summary ?? '',
    content: a.summary ?? null,
    url: a.url,
    imageUrl: a.banner_image ?? null,
    source: a.source ?? 'Unknown',
    publishedAt: a.time_published
      ? new Date(
          a.time_published.replace(
            /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
            '$1-$2-$3T$4:$5:$6'
          )
        ).toISOString()
      : new Date().toISOString(),
    topic,
    apiSource: 'alphavantage',
  }))
}
