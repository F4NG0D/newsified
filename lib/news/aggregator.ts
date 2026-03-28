import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { TOPIC_MAP } from '@/lib/constants/topics'
import { fetchFromNewsAPI } from './newsapi'
import { fetchFromGNews } from './gnews'
import { fetchFromAlphaVantage } from './alphavantage'
import { fetchFromMediastack } from './mediastack'

const FINANCE_TOPICS: TopicSlug[] = ['finance', 'economy', 'energy', 'business']

export async function aggregateNews(
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const topicConfig = TOPIC_MAP[topic]
  const keywords = topicConfig.keywords

  const results = await Promise.allSettled([
    fetchFromNewsAPI(keywords, topic, page),
    fetchFromGNews(keywords, topic, page),
    FINANCE_TOPICS.includes(topic) || topic === 'all'
      ? fetchFromAlphaVantage(topic)
      : Promise.resolve([]),
    fetchFromMediastack(keywords, topic, page),
  ])

  const allArticles: NormalizedArticle[] = results
    .filter((r): r is PromiseFulfilledResult<NormalizedArticle[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)

  const seen = new Set<string>()
  const deduped = allArticles.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })

  return deduped.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}
