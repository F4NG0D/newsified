'use client'
import { useNews } from '@/hooks/useNews'
import TopicTabs from '@/components/layout/TopicTabs'
import NewsFeed from '@/components/news/NewsFeed'
import Sidebar from '@/components/layout/Sidebar'

export default function NewsPage() {
  const { articles, loading, error } = useNews('all')

  return (
    <>
      <TopicTabs />
      <div className="flex gap-6 mt-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">All News</h1>
            <p className="text-sm text-[var(--text-muted)]">{articles.length} articles</p>
          </div>
          <NewsFeed articles={articles} loading={loading} error={error} />
        </div>
        <Sidebar />
      </div>
    </>
  )
}
