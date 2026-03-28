'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as LucideIcons from 'lucide-react'
import { TOPICS } from '@/lib/constants/topics'
import clsx from 'clsx'

export default function TopicTabs() {
  const pathname = usePathname()

  const isActive = (slug: string) => {
    if (slug === 'all') return pathname === '/' || pathname === '/news'
    return pathname === `/topic/${slug}`
  }

  return (
    <div className="sticky top-14 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border)]">
      <div className="flex gap-1 overflow-x-auto no-scrollbar px-1 py-2">
        {TOPICS.map(topic => {
          const Icon = (LucideIcons as any)[topic.icon]
          const active = isActive(topic.slug)
          const href = topic.slug === 'all' ? '/news' : `/topic/${topic.slug}`

          return (
            <Link
              key={topic.slug}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 shrink-0',
                active
                  ? 'bg-[var(--accent-gold)] text-black shadow-lg shadow-yellow-500/20'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {topic.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
