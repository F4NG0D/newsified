'use client'
import { use } from 'react'
import { notFound } from 'next/navigation'
import { useNews } from '@/hooks/useNews'
import { getTopicBySlug } from '@/lib/constants/topics'
import { TopicSlug } from '@/lib/types'
import TopicTabs from '@/components/layout/TopicTabs'
import NewsFeed from '@/components/news/NewsFeed'
import Sidebar from '@/components/layout/Sidebar'

export default function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const topic = getTopicBySlug(slug)

  if (!topic || slug === 'all') notFound()

  const { articles, loading, error } = useNews(slug as TopicSlug)

  return (
    <>
      <TopicTabs />
      <div className="flex gap-6 mt-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">{topic.label}</h1>
            <p className="text-sm text-[var(--text-muted)]">{articles.length} articles</p>
          </div>
          <NewsFeed articles={articles} loading={loading} error={error} />
        </div>
        <Sidebar />
      </div>
    </>
  )
}
