import { Redis } from '@upstash/redis'
import { NormalizedArticle, ArticleQuiz } from '@/lib/types'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// ─── Cache Keys ───────────────────────────────────────────────────────────────
const newsKey = (topic: string, page: number) => `news:${topic}:page:${page}`
const quizKey = (articleId: string) => `quiz:${articleId}`

// ─── News Cache (15 min TTL) ──────────────────────────────────────────────────
export async function getCachedNews(
  topic: string,
  page: number
): Promise<NormalizedArticle[] | null> {
  try {
    const data = await redis.get<NormalizedArticle[]>(newsKey(topic, page))
    return data
  } catch {
    return null  // graceful degradation — don't crash if Redis is down
  }
}

export async function setCachedNews(
  topic: string,
  page: number,
  articles: NormalizedArticle[]
): Promise<void> {
  try {
    await redis.set(newsKey(topic, page), articles, { ex: 900 }) // 15 min
  } catch {
    // non-fatal — just skip caching
  }
}

// ─── Quiz Cache (no expiry — quizzes don't change) ───────────────────────────
export async function getCachedQuiz(articleId: string): Promise<ArticleQuiz | null> {
  try {
    return await redis.get<ArticleQuiz>(quizKey(articleId))
  } catch {
    return null
  }
}

export async function setCachedQuiz(articleId: string, quiz: ArticleQuiz): Promise<void> {
  try {
    await redis.set(quizKey(articleId), quiz)
  } catch {
    // non-fatal
  }
}
