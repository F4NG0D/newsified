# Newsified Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Five focused improvements to the Newsified UI and data layer: fully clickable news cards, draggable topic tabs with arrow navigation, named achievement badges, a live stock ticker in the header, and improved per-topic news aggregation accuracy.

**Architecture:** All changes are UI or server-side API layer only — no new dependencies on external services beyond Yahoo Finance's unofficial public quote API (no key needed). Stock data is cached in Upstash Redis for 15 minutes to avoid hammering Yahoo. No new npm packages required; CSS animations handle the marquee scroll.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Upstash Redis (already wired), Lucide React (already installed)

---

## File Map

```
Modified:
  components/news/NewsCard.tsx              — wrap entire card in Link, remove redundant footer link
  components/layout/TopicTabs.tsx           — add arrow buttons, useRef scroll, mouse drag
  components/gamification/BadgeGrid.tsx     — show icon + name + locked state per badge
  components/layout/Header.tsx              — embed StockTicker between logo and XP section
  lib/constants/topics.ts                   — improve per-topic keyword lists
  lib/news/newsapi.ts                       — use top-headlines for 'all', quoted phrases for topics
  lib/news/gnews.ts                         — use GNews native topic categories
  lib/news/mediastack.ts                    — use Mediastack native categories
  app/globals.css                           — add @keyframes marquee for ticker

Created:
  components/layout/StockTicker.tsx         — auto-scrolling ticker component
  app/api/stocks/route.ts                   — GET /api/stocks, fetches Yahoo Finance, caches 15min
```

---

## Task 1: Fully Clickable NewsCard

The card `<article>` element needs to be wrapped in a `<Link>` so clicking anywhere (image, title, description) navigates to the article. The existing "Read + Quiz →" footer link becomes redundant — replace it with a small visual affordance that isn't a separate link.

**Files:**
- Modify: `components/news/NewsCard.tsx`

- [ ] **Step 1: Rewrite NewsCard to use a full-card Link wrapper**

Replace the contents of `components/news/NewsCard.tsx` with:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/news/NewsCard.tsx
git commit -m "feat: make entire NewsCard clickable including image"
```

---

## Task 2: TopicTabs with Arrow Buttons and Mouse Drag

Add left/right scroll arrow buttons that appear when there is more content to scroll in that direction. Also enable click-and-drag scrolling with the mouse for desktop users.

**Files:**
- Modify: `components/layout/TopicTabs.tsx`

- [ ] **Step 1: Rewrite TopicTabs with scroll controls**

Replace the contents of `components/layout/TopicTabs.tsx` with:

```typescript
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

  // Mouse drag handlers
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
    didDrag.current = false
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
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/TopicTabs.tsx
git commit -m "feat: add arrow navigation and mouse drag to TopicTabs"
```

---

## Task 3: BadgeGrid with Visible Names

Change from icon-only squares to icon + name cards. Show locked badges at reduced opacity and grayscale. Use a 5-column grid with labels below each badge.

**Files:**
- Modify: `components/gamification/BadgeGrid.tsx`

- [ ] **Step 1: Rewrite BadgeGrid to show icon + name**

Replace the contents of `components/gamification/BadgeGrid.tsx` with:

```typescript
import { BADGES } from '@/lib/gamification/badges'
import clsx from 'clsx'

interface Props {
  earnedBadgeIds: string[]
}

export default function BadgeGrid({ earnedBadgeIds }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Achievements
      </p>
      <div className="grid grid-cols-5 gap-2">
        {BADGES.map(badge => {
          const earned = earnedBadgeIds.includes(badge.id)
          return (
            <div
              key={badge.id}
              title={badge.description}
              className={clsx(
                'flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all cursor-help',
                earned
                  ? 'bg-[var(--accent-gold)]/10 border-[var(--accent-gold)]/30 shadow-lg shadow-yellow-500/10'
                  : 'bg-[var(--bg-secondary)] border-[var(--border)] opacity-40 grayscale'
              )}
            >
              <span className="text-lg leading-none">{badge.icon}</span>
              <span className="text-[9px] font-medium text-center leading-tight text-[var(--text-muted)] line-clamp-2">
                {badge.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/gamification/BadgeGrid.tsx
git commit -m "feat: show badge names in achievement grid for locked and unlocked badges"
```

---

## Task 4: Live Stock Ticker in Header

Add a horizontally auto-scrolling stock ticker that sits between the Newsified logo and the XP/streak section. It fetches quote data from Yahoo Finance's public API (no key required), caches in Redis for 15 minutes, and shows symbol, price, and daily % change color-coded green/red.

**Files:**
- Create: `app/api/stocks/route.ts`
- Create: `components/layout/StockTicker.tsx`
- Modify: `components/layout/Header.tsx`
- Modify: `app/globals.css`

### Step 1: Stock API route

- [ ] **Step 1: Create `app/api/stocks/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { redis } from '@/lib/cache/redis'

const CACHE_KEY = 'stocks:quotes'
const CACHE_TTL = 900 // 15 minutes

const SYMBOLS = [
  { symbol: 'SPY',  label: 'S&P 500' },
  { symbol: 'QQQ',  label: 'NASDAQ' },
  { symbol: 'DIA',  label: 'DOW' },
  { symbol: 'IWM',  label: 'Russell 2k' },
  { symbol: 'AAPL', label: 'AAPL' },
  { symbol: 'MSFT', label: 'MSFT' },
  { symbol: 'NVDA', label: 'NVDA' },
  { symbol: 'TSLA', label: 'TSLA' },
  { symbol: 'AMZN', label: 'AMZN' },
  { symbol: 'META', label: 'META' },
  { symbol: 'GOOGL',label: 'GOOGL' },
]

export interface StockQuote {
  symbol: string
  label: string
  price: number
  change: number
  changePct: number
}

async function fetchQuote(symbol: string): Promise<number[] | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price: number = meta.regularMarketPrice ?? 0
    const prevClose: number = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change = price - prevClose
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0
    return [price, change, changePct]
  } catch {
    return null
  }
}

export async function GET() {
  // Try Redis cache first
  try {
    const cached = await redis.get<StockQuote[]>(CACHE_KEY)
    if (cached) return NextResponse.json({ quotes: cached, cached: true })
  } catch {
    // Redis unavailable — proceed to fetch
  }

  // Fetch all symbols in parallel
  const results = await Promise.allSettled(
    SYMBOLS.map(s => fetchQuote(s.symbol))
  )

  const quotes: StockQuote[] = SYMBOLS
    .map((s, i) => {
      const r = results[i]
      if (r.status !== 'fulfilled' || !r.value) return null
      const [price, change, changePct] = r.value
      return { symbol: s.symbol, label: s.label, price, change, changePct }
    })
    .filter((q): q is StockQuote => q !== null)

  // Cache result
  try {
    redis.set(CACHE_KEY, quotes, { ex: CACHE_TTL })
  } catch {
    // non-fatal
  }

  return NextResponse.json({ quotes, cached: false })
}
```

### Step 2: Stock Ticker component

- [ ] **Step 2: Create `components/layout/StockTicker.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import type { StockQuote } from '@/app/api/stocks/route'
import clsx from 'clsx'

function TickerItem({ quote }: { quote: StockQuote }) {
  const up = quote.changePct >= 0
  return (
    <span className="flex items-center gap-1.5 px-4 shrink-0">
      <span className="text-xs font-bold text-[var(--text-primary)]">{quote.label}</span>
      <span className="text-xs text-[var(--text-secondary)]">
        ${quote.price.toFixed(2)}
      </span>
      <span className={clsx(
        'text-[11px] font-semibold',
        up ? 'text-green-400' : 'text-red-400'
      )}>
        {up ? '▲' : '▼'} {Math.abs(quote.changePct).toFixed(2)}%
      </span>
      <span className="text-[var(--border)] select-none">·</span>
    </span>
  )
}

export default function StockTicker() {
  const [quotes, setQuotes] = useState<StockQuote[]>([])

  useEffect(() => {
    fetch('/api/stocks')
      .then(r => r.json())
      .then(d => setQuotes(d.quotes ?? []))
      .catch(() => {})
  }, [])

  if (quotes.length === 0) return null

  return (
    <div className="flex-1 min-w-0 overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap">
        {/* Duplicate for seamless loop */}
        {[...quotes, ...quotes].map((q, i) => (
          <TickerItem key={`${q.symbol}-${i}`} quote={q} />
        ))}
      </div>
    </div>
  )
}
```

### Step 3: Add ticker CSS animation

- [ ] **Step 3: Add `@keyframes ticker` and `animate-ticker` to `app/globals.css`**

Add before the final closing line of `app/globals.css`:

```css
/* Stock ticker marquee animation */
@keyframes ticker {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-ticker {
  animation: ticker 30s linear infinite;
}

.animate-ticker:hover {
  animation-play-state: paused;
}
```

### Step 4: Embed ticker in Header

- [ ] **Step 4: Update `components/layout/Header.tsx`**

Replace the contents of `components/layout/Header.tsx` with:

```typescript
'use client'
import Link from 'next/link'
import { Zap, Flame } from 'lucide-react'
import { useGameState } from '@/hooks/useGameState'
import { getXPProgress } from '@/lib/gamification/levels'
import XPToast from '@/components/gamification/XPToast'
import StockTicker from '@/components/layout/StockTicker'

export default function Header() {
  const { state, pendingXP, clearPendingXP } = useGameState()
  const { current, progressPct } = getXPProgress(state.xp)

  return (
    <>
      <header className="sticky top-0 z-50 bg-[var(--bg-secondary)]/95 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[var(--accent-gold)] rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" fill="black" />
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block">Newsified</span>
          </Link>

          {/* Stock ticker — fills center space */}
          <StockTicker />

          {/* XP / Level / Streak */}
          <div className="flex items-center gap-3 shrink-0">
            {state.streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1">
                <Flame className="w-3.5 h-3.5 text-[var(--accent-streak)]" fill="currentColor" />
                <span className="text-xs font-bold text-[var(--accent-streak)]">{state.streak}</span>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)] leading-none">Lv.{state.level}</p>
                <p className="text-xs font-semibold text-[var(--text-secondary)] leading-none mt-0.5">{current.title}</p>
              </div>
              <div className="w-24">
                <div className="xp-bar-track">
                  <div className="xp-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 text-center">{state.xp} XP</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {pendingXP && (
        <XPToast amount={pendingXP.amount} reason={pendingXP.reason} onDone={clearPendingXP} />
      )}
    </>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/stocks/route.ts components/layout/StockTicker.tsx components/layout/Header.tsx app/globals.css
git commit -m "feat: add live stock ticker to header with Yahoo Finance data and Redis cache"
```

---

## Task 5: Fix Per-Topic News Aggregation

The current implementation uses text keyword searches for all topics on all APIs. The root problems:

1. **GNews** has a native `topic` parameter that maps to real editorial categories — we're not using it
2. **Mediastack** has a native `categories` parameter — we're not using it
3. **NewsAPI** should use `/top-headlines` with `category` for the `all` tab instead of text search
4. **Keywords** for some topics (e.g. `us-politics`, `geopolitics`) use multi-word phrases without quotes — APIs treat them as independent words, not phrases
5. **Alpha Vantage** is only called for finance-adjacent topics but geopolitics has no AV topic mapping

**Files:**
- Modify: `lib/constants/topics.ts`
- Modify: `lib/news/newsapi.ts`
- Modify: `lib/news/gnews.ts`
- Modify: `lib/news/mediastack.ts`

> Note: `alphavantage.ts` and `aggregator.ts` are fine as-is. Alpha Vantage's coverage is intentionally finance-focused and the aggregator correctly routes topics.

- [ ] **Step 1: Improve keyword lists in `lib/constants/topics.ts`**

The keywords are used by NewsAPI and Mediastack as search terms. Multi-word phrases must be quoted in the query string to be treated as phrases. Update the keywords to use quoted phrases and stronger signal terms:

```typescript
import { Topic, TopicSlug } from '@/lib/types'

export const TOPICS: Topic[] = [
  {
    slug: 'all',
    label: 'All News',
    icon: 'Newspaper',
    keywords: ['breaking news', 'world news', 'politics', 'economy', 'technology'],
    color: 'bg-slate-500',
  },
  {
    slug: 'geopolitics',
    label: 'Geopolitics',
    icon: 'Globe2',
    keywords: ['geopolitics', 'diplomacy', 'sanctions', 'NATO', 'United Nations', 'foreign policy', 'international conflict'],
    color: 'bg-blue-600',
  },
  {
    slug: 'finance',
    label: 'Finance & Markets',
    icon: 'TrendingUp',
    keywords: ['stock market', 'S&P 500', 'Federal Reserve', 'interest rates', 'Wall Street', 'equities', 'bonds'],
    color: 'bg-green-600',
  },
  {
    slug: 'business',
    label: 'Business',
    icon: 'Briefcase',
    keywords: ['earnings', 'merger', 'acquisition', 'IPO', 'startup', 'CEO', 'corporate strategy', 'quarterly results'],
    color: 'bg-purple-600',
  },
  {
    slug: 'technology',
    label: 'Technology',
    icon: 'Cpu',
    keywords: ['artificial intelligence', 'semiconductor', 'cybersecurity', 'tech industry', 'software', 'big tech', 'chip'],
    color: 'bg-cyan-600',
  },
  {
    slug: 'us-politics',
    label: 'U.S. Politics',
    icon: 'Landmark',
    keywords: ['Congress', 'Senate', 'White House', 'legislation', 'Trump', 'Biden', 'Republican', 'Democrat'],
    color: 'bg-red-600',
  },
  {
    slug: 'energy',
    label: 'Energy & Commodities',
    icon: 'Zap',
    keywords: ['oil prices', 'natural gas', 'OPEC', 'crude oil', 'renewable energy', 'energy sector', 'commodities'],
    color: 'bg-yellow-600',
  },
  {
    slug: 'economy',
    label: 'Economy',
    icon: 'BarChart3',
    keywords: ['inflation', 'GDP', 'unemployment', 'recession', 'Federal Reserve', 'CPI', 'trade deficit', 'interest rates'],
    color: 'bg-orange-600',
  },
  {
    slug: 'science-health',
    label: 'Science & Health',
    icon: 'FlaskConical',
    keywords: ['medical research', 'FDA approval', 'pharmaceutical', 'climate change', 'biotechnology', 'vaccine', 'health care'],
    color: 'bg-teal-600',
  },
]

export const TOPIC_MAP = Object.fromEntries(
  TOPICS.map(t => [t.slug, t])
) as Record<TopicSlug, Topic>

export const getTopicBySlug = (slug: string): Topic | undefined =>
  TOPIC_MAP[slug as TopicSlug]
```

- [ ] **Step 2: Update `lib/news/newsapi.ts` to use top-headlines for 'all' and quoted phrases**

```typescript
import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

const BASE = 'https://newsapi.org/v2'

// NewsAPI top-headlines categories (used for 'all' tab)
const NEWSAPI_CATEGORY: Partial<Record<TopicSlug, string>> = {
  business:       'business',
  technology:     'technology',
  'science-health': 'science',
}

export async function fetchFromNewsAPI(
  keywords: string[],
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const apiKey = process.env.NEWSAPI_KEY!

  let url: URL

  if (topic === 'all') {
    // Top headlines — no query needed, returns current top stories
    url = new URL(`${BASE}/top-headlines`)
    url.searchParams.set('language', 'en')
    url.searchParams.set('pageSize', '20')
    url.searchParams.set('page', String(page))
  } else if (NEWSAPI_CATEGORY[topic]) {
    // Use category endpoint for better relevance
    url = new URL(`${BASE}/top-headlines`)
    url.searchParams.set('category', NEWSAPI_CATEGORY[topic]!)
    url.searchParams.set('language', 'en')
    url.searchParams.set('pageSize', '20')
    url.searchParams.set('page', String(page))
  } else {
    // Use keyword search with quoted phrases for precision
    const query = keywords
      .slice(0, 3)
      .map(k => (k.includes(' ') ? `"${k}"` : k))
      .join(' OR ')
    url = new URL(`${BASE}/everything`)
    url.searchParams.set('q', query)
    url.searchParams.set('language', 'en')
    url.searchParams.set('sortBy', 'publishedAt')
    url.searchParams.set('pageSize', '20')
    url.searchParams.set('page', String(page))
  }

  url.searchParams.set('apiKey', apiKey)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return []

  const data = await res.json()
  if (!data.articles) return []

  return data.articles
    .filter((a: any) => a.title && a.title !== '[Removed]' && a.url)
    .map((a: any): NormalizedArticle => ({
      id: generateId(a.url),
      title: a.title,
      description: a.description ?? '',
      content: a.content ?? null,
      url: a.url,
      imageUrl: a.urlToImage ?? null,
      source: a.source?.name ?? 'Unknown',
      publishedAt: a.publishedAt,
      topic,
      apiSource: 'newsapi',
    }))
}
```

- [ ] **Step 3: Update `lib/news/gnews.ts` to use native topic categories**

GNews supports a `topic` parameter that maps to editorial categories. This is far more accurate than keyword search.

```typescript
import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

const BASE = 'https://gnews.io/api/v4'

// GNews native topic values
// Available: breaking-news, world, nation, business, technology, entertainment, sports, science, health
const GNEWS_TOPIC: Partial<Record<TopicSlug, string>> = {
  all:             'breaking-news',
  geopolitics:     'world',
  finance:         'business',
  business:        'business',
  technology:      'technology',
  'us-politics':   'nation',
  energy:          'business',
  economy:         'business',
  'science-health': 'science',
}

export async function fetchFromGNews(
  keywords: string[],
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const gnewsTopic = GNEWS_TOPIC[topic]
  const url = new URL(`${BASE}/${gnewsTopic ? 'top-headlines' : 'search'}`)

  if (gnewsTopic) {
    url.searchParams.set('topic', gnewsTopic)
    url.searchParams.set('lang', 'en')
    url.searchParams.set('max', '20')
    url.searchParams.set('page', String(page))
  } else {
    // Fallback: keyword search with quoted phrases
    const query = keywords
      .slice(0, 2)
      .map(k => (k.includes(' ') ? `"${k}"` : k))
      .join(' OR ')
    url.searchParams.set('q', query)
    url.searchParams.set('lang', 'en')
    url.searchParams.set('max', '20')
    url.searchParams.set('page', String(page))
  }

  url.searchParams.set('token', process.env.GNEWS_API_KEY!)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return []

  const data = await res.json()
  if (!data.articles) return []

  return data.articles.map((a: any): NormalizedArticle => ({
    id: generateId(a.url),
    title: a.title,
    description: a.description ?? '',
    content: a.content ?? null,
    url: a.url,
    imageUrl: a.image ?? null,
    source: a.source?.name ?? 'Unknown',
    publishedAt: a.publishedAt,
    topic,
    apiSource: 'gnews',
  }))
}
```

- [ ] **Step 4: Update `lib/news/mediastack.ts` to use native categories**

Mediastack supports a `categories` parameter. Use it for better accuracy.

```typescript
import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

// ⚠️ Mediastack free tier does NOT support HTTPS (paid plans only).
// This runs server-side in Next.js API routes — browser mixed-content rules don't apply.
const BASE = 'http://api.mediastack.com/v1'

// Mediastack category values: general, business, entertainment, health, science, sports, technology
const MEDIASTACK_CATEGORY: Partial<Record<TopicSlug, string>> = {
  all:             'general',
  business:        'business',
  technology:      'technology',
  'science-health': 'health,science',
}

export async function fetchFromMediastack(
  keywords: string[],
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const url = new URL(`${BASE}/news`)
  url.searchParams.set('access_key', process.env.MEDIASTACK_API_KEY!)
  url.searchParams.set('languages', 'en')
  url.searchParams.set('limit', '20')
  url.searchParams.set('offset', String((page - 1) * 20))
  url.searchParams.set('sort', 'published_desc')

  const category = MEDIASTACK_CATEGORY[topic]
  if (category) {
    url.searchParams.set('categories', category)
  } else {
    // Use keyword search for topics without a direct Mediastack category
    url.searchParams.set('keywords', keywords.slice(0, 3).join(','))
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return []

  const data = await res.json()
  if (!data.data) return []

  return data.data
    .filter((a: any) => a.title && a.url)
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
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd "C:/Users/Nio/Desktop/Claude Work/news-gamifier-app" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no output (zero errors).

- [ ] **Step 6: Commit**

```bash
git add lib/constants/topics.ts lib/news/newsapi.ts lib/news/gnews.ts lib/news/mediastack.ts
git commit -m "fix: use native API category params and quoted keyword phrases for accurate per-topic news"
```

---

## Task 6: Quests Button (Coming Soon Placeholder)

Add a "Quests" button in the sidebar that opens a simple modal saying "Coming Soon". This reserves UI space for the future Quests feature (AI-generated article-finding missions with XP rewards) without implementing any backend logic.

**Files:**
- Modify: `components/layout/Sidebar.tsx`
- Create: `components/ui/QuestsModal.tsx`

- [ ] **Step 1: Create `components/ui/QuestsModal.tsx`**

```typescript
'use client'
import { X, Swords } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function QuestsModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="card w-full max-w-sm p-8 flex flex-col items-center gap-5 text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/20 flex items-center justify-center">
              <Swords className="w-8 h-8 text-[var(--accent-gold)]" />
            </div>

            <div>
              <h2 className="text-xl font-black">Quests</h2>
              <p className="text-[var(--text-muted)] text-sm mt-1">Coming Soon</p>
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Quests will challenge you to find articles that answer specific market questions —
              earn bonus XP for completing each mission.
            </p>

            <p className="text-xs text-[var(--text-muted)] italic">
              Example: "Find 5 articles explaining why the S&P 500 is at its current level."
            </p>

            <button onClick={onClose} className="btn-primary w-full">
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Add Quests button to `components/layout/Sidebar.tsx`**

Add `useState` import and `QuestsModal` to the sidebar. Place the button after the streak card and before the badges:

```typescript
'use client'
import { useState } from 'react'
import { Swords } from 'lucide-react'
import { useGameState } from '@/hooks/useGameState'
import LevelBadge from '@/components/gamification/LevelBadge'
import XPBar from '@/components/gamification/XPBar'
import StreakCounter from '@/components/gamification/StreakCounter'
import BadgeGrid from '@/components/gamification/BadgeGrid'
import QuestsModal from '@/components/ui/QuestsModal'

export default function Sidebar() {
  const { state } = useGameState()
  const [questsOpen, setQuestsOpen] = useState(false)

  return (
    <>
      <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
        {/* Level card */}
        <div className="card p-5 flex flex-col gap-4">
          <LevelBadge xp={state.xp} large />
          <XPBar xp={state.xp} />
          <div className="flex justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border)] pt-3">
            <span>{state.articlesRead.length} articles read</span>
            <span>{state.quizzesCompleted.length} quizzes done</span>
          </div>
        </div>

        {/* Streak card */}
        <div className="card p-5">
          <StreakCounter streak={state.streak} />
        </div>

        {/* Quests button */}
        <button
          onClick={() => setQuestsOpen(true)}
          className="card p-4 flex items-center gap-3 hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent-gold)]/30 transition-all duration-150 text-left w-full"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/20 flex items-center justify-center shrink-0">
            <Swords className="w-4 h-4 text-[var(--accent-gold)]" />
          </div>
          <div>
            <p className="text-sm font-semibold">Quests</p>
            <p className="text-xs text-[var(--text-muted)]">Coming soon...</p>
          </div>
        </button>

        {/* Badges */}
        <div className="card p-5">
          <BadgeGrid earnedBadgeIds={state.badges} />
        </div>
      </aside>

      <QuestsModal isOpen={questsOpen} onClose={() => setQuestsOpen(false)} />
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/QuestsModal.tsx components/layout/Sidebar.tsx
git commit -m "feat: add Quests coming-soon placeholder button and modal"
```

---

## Notes

- **Stock ticker on mobile:** The Newsified logo hides its text on small screens (`hidden sm:block`) to give the ticker more room. On very small screens the ticker will still appear between the logo icon and the XP section.
- **Redis cache invalidation:** The `stocks:quotes` cache key is shared across all requests. After first load, all users see the same quotes for 15 minutes. This is intentional to avoid hammering Yahoo Finance.
- **Quests future spec:** When implementing the full Quests feature, the modal in `components/ui/QuestsModal.tsx` can be replaced with the full quest UI. The sidebar button stays as-is.
