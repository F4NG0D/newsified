'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useEffect, useCallback } from 'react'
import * as LucideIcons from 'lucide-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TOPICS } from '@/lib/constants/topics'
import clsx from 'clsx'

export default function TopicTabs() {
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Drag state
  const isDragging = useRef(false)
  const didDrag = useRef(false)       // true if mouse moved >5px — suppresses click-after-drag
  const dragStartX = useRef(0)
  const dragScrollLeft = useRef(0)

  const updateArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      ro.disconnect()
    }
  }, [updateArrows])

  const scrollBy = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
  }

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current
    if (!el) return
    isDragging.current = true
    didDrag.current = false
    dragStartX.current = e.pageX - el.offsetLeft
    dragScrollLeft.current = el.scrollLeft
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - dragStartX.current) * 1.5
    if (Math.abs(walk) > 5) {
      didDrag.current = true
      e.preventDefault()
    }
    scrollRef.current.scrollLeft = dragScrollLeft.current - walk
  }

  const onMouseUp = () => {
    isDragging.current = false
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab'
      scrollRef.current.style.userSelect = ''
    }
  }

  // Suppress link navigation when the mouseup lands on a Link after a real drag
  const onClickCapture = (e: React.MouseEvent) => {
    if (didDrag.current) {
      e.preventDefault()
      e.stopPropagation()
      didDrag.current = false
    }
  }

  const isActive = (slug: string) => {
    if (slug === 'all') return pathname === '/' || pathname === '/news'
    return pathname === `/topic/${slug}`
  }

  return (
    <div className="sticky top-14 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border)]">
      <div className="relative flex items-center">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scrollBy('left')}
            className="absolute left-0 z-10 flex items-center justify-center w-8 h-full bg-gradient-to-r from-[var(--bg-primary)] to-transparent shrink-0"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        )}

        {/* Scrollable tab list */}
        <div
          ref={scrollRef}
          className="flex gap-1 overflow-x-auto no-scrollbar px-1 py-2 cursor-grab select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onClickCapture={onClickCapture}
        >
          {TOPICS.map(topic => {
            const Icon = (LucideIcons as any)[topic.icon]
            const active = isActive(topic.slug)
            const href = topic.slug === 'all' ? '/news' : `/topic/${topic.slug}`

            return (
              <Link
                key={topic.slug}
                href={href}
                draggable={false}
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

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scrollBy('right')}
            className="absolute right-0 z-10 flex items-center justify-center w-8 h-full bg-gradient-to-l from-[var(--bg-primary)] to-transparent shrink-0"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        )}
      </div>
    </div>
  )
}
