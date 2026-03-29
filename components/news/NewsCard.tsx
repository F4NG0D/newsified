'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, ArrowRight } from 'lucide-react'
import { NormalizedArticle } from '@/lib/types'
import { TOPIC_MAP } from '@/lib/constants/topics'
import SourceChip from './SourceChip'
import clsx from 'clsx'
import { timeAgo } from '@/lib/utils/time'

interface Props {
  article: NormalizedArticle
}

export default function NewsCard({ article }: Props) {
  const topic = TOPIC_MAP[article.topic]

  const handleClick = () => {
    sessionStorage.setItem(`article_${article.id}`, JSON.stringify(article))
  }

  return (
    <Link
      href={`/article/${article.id}`}
      onClick={handleClick}
      className="card-hover group flex flex-col overflow-hidden cursor-pointer"
    >
      {article.imageUrl && (
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-[var(--bg-secondary)]">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            unoptimized
          />
        </div>
      )}

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className={clsx('tag text-white/80', topic?.color ?? 'bg-slate-600')}>
            {topic?.label ?? 'News'}
          </span>
          <div className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
            <Clock className="w-3 h-3" />
            {timeAgo(article.publishedAt)}
          </div>
        </div>

        <h3 className="text-sm font-semibold leading-snug text-[var(--text-primary)] line-clamp-3 group-hover:text-[var(--accent-gold)] transition-colors">
          {article.title}
        </h3>

        {article.description && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {article.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-[var(--border)]">
          <SourceChip source={article.source} apiSource={article.apiSource} />
          <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent-gold)] group-hover:gap-2 transition-all">
            Read + Quiz <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}
