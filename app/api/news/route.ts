import { NextRequest, NextResponse } from 'next/server'
import { aggregateNews } from '@/lib/news/aggregator'
import { getCachedNews, setCachedNews } from '@/lib/cache/redis'
import { TopicSlug } from '@/lib/types'
import { TOPIC_MAP } from '@/lib/constants/topics'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawTopic = searchParams.get('topic') ?? 'all'
  const topic = (rawTopic in TOPIC_MAP ? rawTopic : 'all') as TopicSlug
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  const cached = await getCachedNews(topic, page)
  if (cached) {
    return NextResponse.json({ articles: cached, cached: true, total: cached.length })
  }

  const articles = await aggregateNews(topic, page)
  setCachedNews(topic, page, articles) // fire and forget - gracefully handles errors internally

  return NextResponse.json({ articles, cached: false, total: articles.length })
}
