import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

// ⚠️ Mediastack free tier does NOT support HTTPS (paid plans only).
// This runs server-side in Next.js API routes — browser mixed-content rules don't apply.
// Vercel's outbound network allows HTTP, so this is safe. If Mediastack returns empty
// arrays, verify your API key and that you haven't exhausted the 500 req/month free limit.
const BASE = 'http://api.mediastack.com/v1'

export async function fetchFromMediastack(
  keywords: string[],
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const url = new URL(`${BASE}/news`)
  url.searchParams.set('access_key', process.env.MEDIASTACK_API_KEY!)
  url.searchParams.set('keywords', keywords.slice(0, 3).join(','))
  url.searchParams.set('languages', 'en')
  url.searchParams.set('limit', '20')
  url.searchParams.set('offset', String((page - 1) * 20))
  url.searchParams.set('sort', 'published_desc')

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return []

  const data = await res.json()
  if (!data.data) return []

  return data.data
    .filter((a: any) => a.title)
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
