import { NextRequest, NextResponse } from 'next/server'
import { aggregateNews } from '@/lib/news/aggregator'
import { getCachedNews, setCachedNews } from '@/lib/cache/redis'
import { TopicSlug } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const topic = (searchParams.get('topic') ?? 'all') as TopicSlug
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  const cached = await getCachedNews(topic, page)
  if (cached) {
    return NextResponse.json({ articles: cached, cached: true, total: cached.length })
  }

  const articles = await aggregateNews(topic, page)
  await setCachedNews(topic, page, articles)

  return NextResponse.json({ articles, cached: false, total: articles.length })
}
