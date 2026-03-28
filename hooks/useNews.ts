'use client'
import { useState, useEffect } from 'react'
import { NormalizedArticle, TopicSlug } from '@/lib/types'

export function useNews(topic: TopicSlug, page = 1) {
  const [articles, setArticles] = useState<NormalizedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/news?topic=${topic}&page=${page}`)
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load news')
        setLoading(false)
      })
  }, [topic, page])

  return { articles, loading, error }
}
