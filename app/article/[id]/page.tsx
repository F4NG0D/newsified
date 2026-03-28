'use client'
import { use, useState, useEffect } from 'react'
import { NormalizedArticle } from '@/lib/types'
import { useGameState } from '@/hooks/useGameState'
import QuizModal from '@/components/quiz/QuizModal'
import { Brain, ExternalLink, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { TOPIC_MAP } from '@/lib/constants/topics'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor(diff / 60000)
  if (h >= 24) return `${Math.floor(h / 24)}d ago`
  if (h >= 1) return `${h}h ago`
  return `${m}m ago`
}

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [article, setArticle] = useState<NormalizedArticle | null>(null)
  const [quizOpen, setQuizOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { state, recordArticleRead } = useGameState()

  useEffect(() => {
    const stored = sessionStorage.getItem(`article_${id}`)
    if (stored) {
      const parsed: NormalizedArticle = JSON.parse(stored)
      setArticle(parsed)
      setLoading(false)
      recordArticleRead(id)
    } else {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-2xl mb-3">🔍</p>
        <h2 className="text-xl font-bold mb-2">Article not found</h2>
        <p className="text-[var(--text-muted)] mb-6">This article may have expired from the session.</p>
        <Link href="/news" className="btn-primary">← Back to News</Link>
      </div>
    )
  }

  const topic = TOPIC_MAP[article.topic]
  const alreadyQuizzed = state.quizzesCompleted.includes(article.id)

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Link href="/news" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to News
      </Link>

      <article className="card overflow-hidden">
        {article.imageUrl && (
          <div className="relative w-full aspect-[21/9]">
            <Image src={article.imageUrl} alt={article.title} fill className="object-cover" unoptimized />
          </div>
        )}

        <div className="p-6 md:p-8 flex flex-col gap-5">
          <div className="flex items-center gap-2 flex-wrap">
            {topic && <span className={`tag text-white/80 ${topic.color}`}>{topic.label}</span>}
            <span className="text-[var(--text-muted)] text-xs font-medium">{article.source}</span>
            <div className="flex items-center gap-1 text-[var(--text-muted)] text-xs ml-auto">
              <Clock className="w-3 h-3" />
              {timeAgo(article.publishedAt)}
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black leading-tight">{article.title}</h1>

          {article.description && (
            <p className="text-[var(--text-secondary)] text-base leading-relaxed border-l-2 border-[var(--accent-gold)] pl-4">
              {article.description}
            </p>
          )}

          {article.content && (
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-line">
              {article.content.replace(/\[\+\d+ chars\]/, '').trim()}
            </p>
          )}

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[var(--accent-blue)] hover:underline"
          >
            Read full article on {article.source}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border)] flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Brain className="w-5 h-5 text-[var(--accent-gold)]" />
                Market Impact Quiz
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {alreadyQuizzed
                  ? '✅ Quiz completed — you earned XP for this article!'
                  : "Test your understanding of this article's market implications. Earn XP!"}
              </p>
            </div>
            <button
              onClick={() => setQuizOpen(true)}
              disabled={alreadyQuizzed}
              className={alreadyQuizzed ? 'btn-ghost opacity-60 cursor-not-allowed' : 'btn-primary flex items-center gap-2 shrink-0'}
            >
              <Brain className="w-4 h-4" />
              {alreadyQuizzed ? 'Already Completed' : 'Take Quiz →'}
            </button>
          </div>
        </div>
      </article>

      <QuizModal article={article} isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  )
}
