'use client'
import { NormalizedArticle } from '@/lib/types'
import NewsCard from './NewsCard'
import { Loader2 } from 'lucide-react'

interface Props {
  articles: NormalizedArticle[]
  loading: boolean
  error: string | null
}

export default function NewsFeed({ articles, loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Aggregating news from 4 sources...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="card p-8 text-center max-w-sm">
          <p className="text-2xl mb-2">📡</p>
          <p className="font-semibold mb-1">Couldn&apos;t load news</p>
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
        </div>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="card p-8 text-center max-w-sm">
          <p className="text-2xl mb-2">🔍</p>
          <p className="font-semibold">No articles found</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Try a different topic</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {articles.map(article => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  )
}
