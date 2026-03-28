# Newsified MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Newsified — a gamified, all-in-one news aggregator that compiles articles from 4 APIs across 8 topic tabs, generates AI-powered market-impact quizzes via Claude Haiku, and tracks user XP/streaks/badges in localStorage.

**Architecture:** Next.js 14 App Router with API routes acting as a backend proxy for all 4 news APIs (NewsAPI, GNews, Alpha Vantage, Mediastack). Upstash Redis caches aggregated articles for 15 minutes and persists generated quizzes indefinitely so Claude Haiku is only called once per article. All user state (XP, level, streaks, badges) lives in localStorage — no database, no auth for MVP.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Upstash Redis (`@upstash/redis`), Anthropic SDK (`@anthropic-ai/sdk`), Framer Motion (XP animations), Lucide React (icons), clsx

---

## File Map

```
newsified/
├── app/
│   ├── layout.tsx                   # Root layout — Header, providers, font setup
│   ├── page.tsx                     # Redirects to /news
│   ├── globals.css                  # CSS variables, base styles, Ground.news-inspired palette
│   ├── news/
│   │   └── page.tsx                 # Main feed — defaults to "All" tab
│   ├── topic/
│   │   └── [slug]/
│   │       └── page.tsx             # Per-topic feed page
│   ├── article/
│   │   └── [id]/
│   │       └── page.tsx             # Article detail + embedded quiz
│   └── api/
│       ├── news/route.ts            # GET /api/news?topic=&page= — aggregates all 4 APIs
│       ├── quiz/route.ts            # POST /api/quiz — generates quiz via Claude Haiku
│       └── health/route.ts          # GET /api/health — sanity check
├── components/
│   ├── layout/
│   │   ├── Header.tsx               # Logo, nav, XP bar mini-display, streak chip
│   │   ├── TopicTabs.tsx            # Horizontal scrollable tab bar (8 topics + All)
│   │   └── Sidebar.tsx              # Right sidebar — level card, streak, badge grid
│   ├── news/
│   │   ├── NewsCard.tsx             # Article card — image, headline, source chips, topic tag
│   │   ├── NewsFeed.tsx             # Responsive grid of NewsCards with pagination
│   │   └── SourceChip.tsx           # Source name pill with favicon
│   ├── quiz/
│   │   ├── QuizModal.tsx            # Full-screen overlay wrapping the quiz flow
│   │   ├── QuizQuestion.tsx         # Single question with 4 MCQ options
│   │   └── QuizResults.tsx          # Score summary + XP gained + continue button
│   └── gamification/
│       ├── XPBar.tsx                # Animated horizontal XP progress bar
│       ├── LevelBadge.tsx           # Level number + title label (e.g. "Lv.4 Market Analyst")
│       ├── StreakCounter.tsx         # Flame icon + streak day count
│       ├── BadgeGrid.tsx            # Grid of earned/locked achievement badges
│       └── XPToast.tsx              # Floating "+XP" toast notification (Framer Motion)
├── lib/
│   ├── types.ts                     # All shared TypeScript interfaces
│   ├── constants/
│   │   └── topics.ts                # Topic definitions, slugs, API keyword mappings
│   ├── news/
│   │   ├── newsapi.ts               # NewsAPI.org client
│   │   ├── gnews.ts                 # GNews API client
│   │   ├── alphavantage.ts          # Alpha Vantage News client (finance focus)
│   │   ├── mediastack.ts            # Mediastack client
│   │   └── aggregator.ts            # Fetches all 4, dedupes, normalizes → NormalizedArticle[]
│   ├── quiz/
│   │   └── generator.ts             # Claude Haiku: article → 3 MCQ questions
│   ├── cache/
│   │   └── redis.ts                 # Upstash Redis client, getNews(), setNews(), getQuiz(), setQuiz()
│   └── gamification/
│       ├── storage.ts               # localStorage read/write for GameState
│       ├── xp.ts                    # XP award logic (read article, quiz score, streak bonus)
│       ├── levels.ts                # Level thresholds + titles (Lv.1 Novice → Lv.20 Oracle)
│       ├── streaks.ts               # Streak increment, reset, bonus XP calculation
│       └── badges.ts                # Badge definitions + unlock condition checkers
├── context/
│   └── GameStateContext.tsx         # React Context + Provider — single shared game state instance
├── hooks/
│   ├── useGameState.ts              # Thin hook: consumes GameStateContext (no direct localStorage)
│   ├── useNews.ts                   # Plain fetch hook: GET /api/news with useEffect
│   └── useQuiz.ts                   # Quiz flow state: questions, selected answers, submission
└── public/
    └── badges/                      # SVG badge icons (10 badges for MVP)

> Note: `lib/news/utils.ts` (generateId via Node crypto) is also part of the file map — listed under lib/news/ above.
```

---

## Task 1: Project Scaffolding & Dependencies

**Files:**
- Create: `package.json` (via `create-next-app`)
- Create: `tailwind.config.ts`
- Create: `.env.local` (API keys template)
- Create: `tsconfig.json`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd "C:/Users/Nio/Desktop/Claude Work/news-gamifier-app"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --yes
```

Expected: Next.js 14 project created with App Router, TypeScript, Tailwind.

- [ ] **Step 2: Install dependencies**

```bash
npm install @upstash/redis @anthropic-ai/sdk framer-motion lucide-react clsx
npm install -D @types/node
```

- [ ] **Step 3: Create `.env.local` with all required keys**

```bash
cat > .env.local << 'EOF'
# News APIs
NEWSAPI_KEY=your_newsapi_key_here
GNEWS_API_KEY=your_gnews_key_here
ALPHAVANTAGE_API_KEY=your_alphavantage_key_here
MEDIASTACK_API_KEY=your_mediastack_key_here

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key_here
EOF
```

- [ ] **Step 4: Configure Tailwind with Ground.news-inspired tokens**

Edit `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1a1a2e',
          accent: '#16213e',
          highlight: '#0f3460',
          gold: '#e94560',
          xp: '#4ade80',
          streak: '#f97316',
        },
        surface: {
          light: '#f5f5f0',
          dark: '#111118',
          card: '#1e1e2e',
          border: '#2a2a3e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'xp-fill': 'xpFill 0.8s ease-out forwards',
        'toast-up': 'toastUp 2.5s ease-out forwards',
        'badge-pop': 'badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        xpFill: {
          '0%': { width: 'var(--xp-from)' },
          '100%': { width: 'var(--xp-to)' },
        },
        toastUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '20%': { opacity: '1', transform: 'translateY(0)' },
          '80%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-20px)' },
        },
        badgePop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Initialize git and first commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 14 project with dependencies"
```

---

## Task 2: Shared Types & Topic Constants

**Files:**
- Create: `lib/types.ts`
- Create: `lib/constants/topics.ts`

- [ ] **Step 1: Write shared TypeScript types**

Create `lib/types.ts`:

```typescript
// ─── Article ─────────────────────────────────────────────────────────────────
export interface NormalizedArticle {
  id: string              // sha256 hash of url for deduplication
  title: string
  description: string
  content: string | null
  url: string
  imageUrl: string | null
  source: string          // e.g. "Reuters", "Bloomberg"
  publishedAt: string     // ISO 8601
  topic: TopicSlug
  apiSource: 'newsapi' | 'gnews' | 'alphavantage' | 'mediastack'
}

// ─── Topics ──────────────────────────────────────────────────────────────────
export type TopicSlug =
  | 'all'
  | 'geopolitics'
  | 'finance'
  | 'business'
  | 'technology'
  | 'us-politics'
  | 'energy'
  | 'economy'
  | 'science-health'

export interface Topic {
  slug: TopicSlug
  label: string
  icon: string            // Lucide icon name
  keywords: string[]      // API query keywords
  color: string           // Tailwind color class for accent
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export interface QuizOption {
  id: 'a' | 'b' | 'c' | 'd'
  text: string
  isCorrect: boolean
}

export interface QuizQuestion {
  id: string
  type: 'market-impact' | 'macro-micro-context' | 'prediction'
  question: string
  options: QuizOption[]
  explanation: string     // shown after answer
}

export interface ArticleQuiz {
  articleId: string
  questions: QuizQuestion[]
  generatedAt: string
}

// ─── Gamification ────────────────────────────────────────────────────────────
export interface GameState {
  xp: number
  level: number
  streak: number
  lastReadDate: string | null   // ISO date string YYYY-MM-DD
  articlesRead: string[]        // article IDs
  quizzesCompleted: string[]    // article IDs where quiz was finished
  badges: string[]              // badge IDs earned
  totalCorrectAnswers: number
  totalQuestions: number
}

export interface LevelDefinition {
  level: number
  title: string
  xpRequired: number           // cumulative XP to reach this level
  xpToNext: number             // XP needed to advance from this level
}

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  condition: (state: GameState) => boolean
}

// ─── API Responses ───────────────────────────────────────────────────────────
export interface NewsApiResponse {
  articles: NormalizedArticle[]
  total: number
  page: number
  hasMore: boolean
}

export interface QuizApiResponse {
  quiz: ArticleQuiz
  cached: boolean
}
```

- [ ] **Step 2: Write topic constants**

Create `lib/constants/topics.ts`:

```typescript
import { Topic, TopicSlug } from '@/lib/types'

export const TOPICS: Topic[] = [
  {
    slug: 'all',
    label: 'All News',
    icon: 'Newspaper',
    keywords: ['world', 'news', 'politics', 'economy', 'technology'],
    color: 'bg-slate-500',
  },
  {
    slug: 'geopolitics',
    label: 'Geopolitics',
    icon: 'Globe2',
    keywords: ['geopolitics', 'international relations', 'diplomacy', 'war', 'sanctions', 'NATO', 'UN'],
    color: 'bg-blue-600',
  },
  {
    slug: 'finance',
    label: 'Finance & Markets',
    icon: 'TrendingUp',
    keywords: ['stock market', 'S&P 500', 'Federal Reserve', 'interest rates', 'bonds', 'equities', 'Wall Street'],
    color: 'bg-green-600',
  },
  {
    slug: 'business',
    label: 'Business',
    icon: 'Briefcase',
    keywords: ['business', 'earnings', 'merger', 'acquisition', 'CEO', 'startup', 'IPO', 'corporate'],
    color: 'bg-purple-600',
  },
  {
    slug: 'technology',
    label: 'Technology',
    icon: 'Cpu',
    keywords: ['technology', 'AI', 'artificial intelligence', 'tech', 'software', 'semiconductor', 'cybersecurity'],
    color: 'bg-cyan-600',
  },
  {
    slug: 'us-politics',
    label: 'U.S. Politics',
    icon: 'Landmark',
    keywords: ['US politics', 'Congress', 'Senate', 'White House', 'legislation', 'election', 'Democrat', 'Republican'],
    color: 'bg-red-600',
  },
  {
    slug: 'energy',
    label: 'Energy & Commodities',
    icon: 'Zap',
    keywords: ['oil', 'gas', 'energy', 'OPEC', 'crude', 'commodities', 'renewable energy', 'LNG'],
    color: 'bg-yellow-600',
  },
  {
    slug: 'economy',
    label: 'Economy',
    icon: 'BarChart3',
    keywords: ['inflation', 'GDP', 'unemployment', 'recession', 'monetary policy', 'fiscal policy', 'CPI', 'trade'],
    color: 'bg-orange-600',
  },
  {
    slug: 'science-health',
    label: 'Science & Health',
    icon: 'FlaskConical',
    keywords: ['science', 'health', 'medicine', 'research', 'FDA', 'pharmaceutical', 'climate', 'biotech'],
    color: 'bg-teal-600',
  },
]

export const TOPIC_MAP = Object.fromEntries(
  TOPICS.map(t => [t.slug, t])
) as Record<TopicSlug, Topic>

export const getTopicBySlug = (slug: string): Topic =>
  TOPIC_MAP[slug as TopicSlug] ?? TOPIC_MAP['all']
```

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts lib/constants/topics.ts
git commit -m "feat: add shared types and topic constants"
```

---

## Task 3: Upstash Redis Cache Layer

**Files:**
- Create: `lib/cache/redis.ts`

- [ ] **Step 1: Write Redis client and cache helpers**

Create `lib/cache/redis.ts`:

```typescript
import { Redis } from '@upstash/redis'
import { NormalizedArticle, ArticleQuiz } from '@/lib/types'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// ─── Cache Keys ───────────────────────────────────────────────────────────────
const newsKey = (topic: string, page: number) => `news:${topic}:page:${page}`
const quizKey = (articleId: string) => `quiz:${articleId}`

// ─── News Cache (15 min TTL) ──────────────────────────────────────────────────
export async function getCachedNews(
  topic: string,
  page: number
): Promise<NormalizedArticle[] | null> {
  try {
    const data = await redis.get<NormalizedArticle[]>(newsKey(topic, page))
    return data
  } catch {
    return null  // graceful degradation — don't crash if Redis is down
  }
}

export async function setCachedNews(
  topic: string,
  page: number,
  articles: NormalizedArticle[]
): Promise<void> {
  try {
    await redis.set(newsKey(topic, page), articles, { ex: 900 }) // 15 min
  } catch {
    // non-fatal — just skip caching
  }
}

// ─── Quiz Cache (no expiry — quizzes don't change) ───────────────────────────
export async function getCachedQuiz(articleId: string): Promise<ArticleQuiz | null> {
  try {
    return await redis.get<ArticleQuiz>(quizKey(articleId))
  } catch {
    return null
  }
}

export async function setCachedQuiz(articleId: string, quiz: ArticleQuiz): Promise<void> {
  try {
    await redis.set(quizKey(articleId), quiz)
  } catch {
    // non-fatal
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/cache/redis.ts
git commit -m "feat: add Upstash Redis cache layer for news and quizzes"
```

---

## Task 4: News API Clients

**Files:**
- Create: `lib/news/newsapi.ts`
- Create: `lib/news/gnews.ts`
- Create: `lib/news/alphavantage.ts`
- Create: `lib/news/mediastack.ts`

> Each client returns `NormalizedArticle[]` — uniform shape regardless of source.

- [ ] **Step 1: Write the NewsAPI client**

Create `lib/news/newsapi.ts`:

```typescript
import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

const BASE = 'https://newsapi.org/v2'

export async function fetchFromNewsAPI(
  keywords: string[],
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const query = keywords.slice(0, 3).join(' OR ')
  const url = new URL(`${BASE}/everything`)
  url.searchParams.set('q', query)
  url.searchParams.set('language', 'en')
  url.searchParams.set('sortBy', 'publishedAt')
  url.searchParams.set('page', String(page))
  url.searchParams.set('pageSize', '20')
  url.searchParams.set('apiKey', process.env.NEWSAPI_KEY!)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return []

  const data = await res.json()
  if (!data.articles) return []

  return data.articles
    .filter((a: any) => a.title && a.title !== '[Removed]')
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

- [ ] **Step 2: Write the GNews client**

Create `lib/news/gnews.ts`:

```typescript
import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

const BASE = 'https://gnews.io/api/v4'

export async function fetchFromGNews(
  keywords: string[],
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const query = keywords.slice(0, 2).join(' OR ')
  const url = new URL(`${BASE}/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('lang', 'en')
  url.searchParams.set('max', '20')
  url.searchParams.set('page', String(page))
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

- [ ] **Step 3: Write the Alpha Vantage client (finance-focused)**

Create `lib/news/alphavantage.ts`:

```typescript
import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

const BASE = 'https://www.alphavantage.co/query'

// Alpha Vantage topic mappings
const AV_TOPICS: Record<string, string> = {
  finance: 'financial_markets',
  economy: 'economy_macro',
  technology: 'technology',
  business: 'earnings',
  energy: 'energy_transportation',
  all: 'financial_markets',
}

export async function fetchFromAlphaVantage(
  topic: TopicSlug
): Promise<NormalizedArticle[]> {
  const avTopic = AV_TOPICS[topic] ?? 'financial_markets'
  const url = new URL(BASE)
  url.searchParams.set('function', 'NEWS_SENTIMENT')
  url.searchParams.set('topics', avTopic)
  url.searchParams.set('limit', '20')
  url.searchParams.set('sort', 'LATEST')
  url.searchParams.set('apikey', process.env.ALPHAVANTAGE_API_KEY!)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return []

  const data = await res.json()
  if (!data.feed) return []

  return data.feed.map((a: any): NormalizedArticle => ({
    id: generateId(a.url),
    title: a.title,
    description: a.summary ?? '',
    content: a.summary ?? null,
    url: a.url,
    imageUrl: a.banner_image ?? null,
    source: a.source ?? 'Unknown',
    publishedAt: a.time_published
      ? new Date(
          a.time_published.replace(
            /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
            '$1-$2-$3T$4:$5:$6'
          )
        ).toISOString()
      : new Date().toISOString(),
    topic,
    apiSource: 'alphavantage',
  }))
}
```

- [ ] **Step 4: Write the Mediastack client**

Create `lib/news/mediastack.ts`:

```typescript
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
```

- [ ] **Step 5: Write the URL hash utility**

Create `lib/news/utils.ts`:

```typescript
// Server-side only — this file runs in Next.js API routes, never the browser.
// Uses Node.js built-in crypto for collision-resistant article IDs.
import { createHash } from 'crypto'

export function generateId(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16)
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/news/
git commit -m "feat: add all 4 news API clients (NewsAPI, GNews, AlphaVantage, Mediastack)"
```

---

## Task 5: News Aggregator

**Files:**
- Create: `lib/news/aggregator.ts`

- [ ] **Step 1: Write the aggregator**

Create `lib/news/aggregator.ts`:

```typescript
import { NormalizedArticle, TopicSlug } from '@/lib/types'
import { TOPIC_MAP } from '@/lib/constants/topics'
import { fetchFromNewsAPI } from './newsapi'
import { fetchFromGNews } from './gnews'
import { fetchFromAlphaVantage } from './alphavantage'
import { fetchFromMediastack } from './mediastack'

const FINANCE_TOPICS: TopicSlug[] = ['finance', 'economy', 'energy', 'business']

export async function aggregateNews(
  topic: TopicSlug,
  page = 1
): Promise<NormalizedArticle[]> {
  const topicConfig = TOPIC_MAP[topic]
  const keywords = topicConfig.keywords

  // Run all API calls in parallel — if one fails, others succeed
  const results = await Promise.allSettled([
    fetchFromNewsAPI(keywords, topic, page),
    fetchFromGNews(keywords, topic, page),
    // Alpha Vantage only for finance-adjacent topics
    FINANCE_TOPICS.includes(topic) || topic === 'all'
      ? fetchFromAlphaVantage(topic)
      : Promise.resolve([]),
    fetchFromMediastack(keywords, topic, page),
  ])

  const allArticles: NormalizedArticle[] = results
    .filter((r): r is PromiseFulfilledResult<NormalizedArticle[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)

  // Deduplicate by ID
  const seen = new Set<string>()
  const deduped = allArticles.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })

  // Sort by publishedAt descending
  return deduped.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/news/aggregator.ts
git commit -m "feat: add parallel news aggregator with deduplication"
```

---

## Task 6: Claude Haiku Quiz Generator

**Files:**
- Create: `lib/quiz/generator.ts`

- [ ] **Step 1: Write the quiz generator**

Create `lib/quiz/generator.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { NormalizedArticle, ArticleQuiz, QuizQuestion } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SYSTEM_PROMPT = `You are a financial and geopolitical education expert.
Given a news article, generate exactly 3 multiple choice quiz questions to help readers
understand the market and economic implications. Each question must have exactly 4 options (a, b, c, d)
with exactly one correct answer.

Question types:
1. "market-impact": How does this event affect financial markets, stocks, or specific sectors?
2. "macro-micro-context": What is the broader macroeconomic or microeconomic context/significance?
3. "prediction": Based on historical precedent, what is the most likely next development?

Return ONLY valid JSON matching this exact structure:
{
  "questions": [
    {
      "type": "market-impact",
      "question": "...",
      "options": [
        { "id": "a", "text": "...", "isCorrect": false },
        { "id": "b", "text": "...", "isCorrect": true },
        { "id": "c", "text": "...", "isCorrect": false },
        { "id": "d", "text": "...", "isCorrect": false }
      ],
      "explanation": "Brief explanation of why the correct answer is right (2-3 sentences)"
    }
  ]
}`

export async function generateQuiz(article: NormalizedArticle): Promise<ArticleQuiz> {
  const articleText = [
    `Title: ${article.title}`,
    `Source: ${article.source}`,
    `Description: ${article.description}`,
    article.content ? `Content: ${article.content.slice(0, 1500)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate 3 quiz questions for this article:\n\n${articleText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  const parsed = JSON.parse(content.text)

  const questions: QuizQuestion[] = parsed.questions.map((q: any, i: number) => ({
    id: `${article.id}-q${i}`,
    type: q.type,
    question: q.question,
    options: q.options,
    explanation: q.explanation,
  }))

  return {
    articleId: article.id,
    questions,
    generatedAt: new Date().toISOString(),
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/quiz/generator.ts
git commit -m "feat: add Claude Haiku quiz generator with 3 MCQ questions per article"
```

---

## Task 7: Gamification Logic

**Files:**
- Create: `lib/gamification/levels.ts`
- Create: `lib/gamification/badges.ts`
- Create: `lib/gamification/xp.ts`
- Create: `lib/gamification/streaks.ts`
- Create: `lib/gamification/storage.ts`

- [ ] **Step 1: Write level definitions**

Create `lib/gamification/levels.ts`:

```typescript
import { LevelDefinition } from '@/lib/types'

export const LEVELS: LevelDefinition[] = [
  { level: 1,  title: 'Novice',             xpRequired: 0,    xpToNext: 100   },
  { level: 2,  title: 'Curious Reader',     xpRequired: 100,  xpToNext: 150   },
  { level: 3,  title: 'News Follower',      xpRequired: 250,  xpToNext: 200   },
  { level: 4,  title: 'Market Watcher',     xpRequired: 450,  xpToNext: 300   },
  { level: 5,  title: 'Finance Apprentice', xpRequired: 750,  xpToNext: 400   },
  { level: 6,  title: 'Policy Tracker',     xpRequired: 1150, xpToNext: 500   },
  { level: 7,  title: 'Analyst',            xpRequired: 1650, xpToNext: 650   },
  { level: 8,  title: 'Market Analyst',     xpRequired: 2300, xpToNext: 800   },
  { level: 9,  title: 'Macro Thinker',      xpRequired: 3100, xpToNext: 1000  },
  { level: 10, title: 'Strategist',         xpRequired: 4100, xpToNext: 1200  },
  { level: 11, title: 'Senior Analyst',     xpRequired: 5300, xpToNext: 1500  },
  { level: 12, title: 'Portfolio Manager',  xpRequired: 6800, xpToNext: 1800  },
  { level: 13, title: 'Macro Economist',    xpRequired: 8600, xpToNext: 2200  },
  { level: 14, title: 'Chief Analyst',      xpRequired: 10800, xpToNext: 2600 },
  { level: 15, title: 'Market Sage',        xpRequired: 13400, xpToNext: 3000 },
  { level: 16, title: 'Geopolitician',      xpRequired: 16400, xpToNext: 3500 },
  { level: 17, title: 'Global Strategist',  xpRequired: 19900, xpToNext: 4000 },
  { level: 18, title: 'Financial Oracle',   xpRequired: 23900, xpToNext: 5000 },
  { level: 19, title: 'Grand Analyst',      xpRequired: 28900, xpToNext: 6000 },
  { level: 20, title: 'Oracle',             xpRequired: 34900, xpToNext: Infinity },
]

export function getLevelFromXP(xp: number): LevelDefinition {
  let current = LEVELS[0]
  for (const level of LEVELS) {
    if (xp >= level.xpRequired) {
      current = level
    } else {
      break
    }
  }
  return current
}

export function getXPProgress(xp: number): { current: LevelDefinition; progressPct: number } {
  const current = getLevelFromXP(xp)
  const xpIntoLevel = xp - current.xpRequired
  const progressPct = current.xpToNext === Infinity
    ? 100
    : Math.min(100, Math.round((xpIntoLevel / current.xpToNext) * 100))
  return { current, progressPct }
}
```

- [ ] **Step 2: Write badge definitions**

Create `lib/gamification/badges.ts`:

```typescript
import { BadgeDefinition, GameState } from '@/lib/types'

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first-article',
    name: 'First Read',
    description: 'Read your first article',
    icon: '📰',
    condition: (s) => s.articlesRead.length >= 1,
  },
  {
    id: 'quiz-starter',
    name: 'Quiz Starter',
    description: 'Complete your first quiz',
    icon: '🎯',
    condition: (s) => s.quizzesCompleted.length >= 1,
  },
  {
    id: 'streak-3',
    name: '3-Day Streak',
    description: 'Read news 3 days in a row',
    icon: '🔥',
    condition: (s) => s.streak >= 3,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Read news 7 days in a row',
    icon: '⚡',
    condition: (s) => s.streak >= 7,
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Read news 30 days in a row',
    icon: '👑',
    condition: (s) => s.streak >= 30,
  },
  {
    id: 'news-10',
    name: 'News Junkie',
    description: 'Read 10 articles',
    icon: '📚',
    condition: (s) => s.articlesRead.length >= 10,
  },
  {
    id: 'news-50',
    name: 'Well Read',
    description: 'Read 50 articles',
    icon: '🎓',
    condition: (s) => s.articlesRead.length >= 50,
  },
  {
    id: 'quiz-5',
    name: 'Quiz Champion',
    description: 'Complete 5 quizzes',
    icon: '🏆',
    condition: (s) => s.quizzesCompleted.length >= 5,
  },
  {
    id: 'accuracy-80',
    name: 'Sharp Mind',
    description: 'Achieve 80%+ quiz accuracy over 10+ questions',
    icon: '🧠',
    condition: (s) =>
      s.totalQuestions >= 10 &&
      s.totalCorrectAnswers / s.totalQuestions >= 0.8,
  },
  {
    id: 'level-5',
    name: 'Finance Apprentice',
    description: 'Reach Level 5',
    icon: '⭐',
    condition: (s) => s.level >= 5,
  },
]

export function checkNewBadges(state: GameState): string[] {
  return BADGES
    .filter(b => !state.badges.includes(b.id) && b.condition(state))
    .map(b => b.id)
}

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find(b => b.id === id)
}
```

- [ ] **Step 3: Write XP award logic**

Create `lib/gamification/xp.ts`:

```typescript
// XP values
export const XP_VALUES = {
  READ_ARTICLE: 10,
  QUIZ_COMPLETE: 20,
  QUIZ_CORRECT_ANSWER: 5,     // per correct answer (max 15 extra)
  STREAK_BONUS_PER_DAY: 2,    // multiplied by streak count
  PERFECT_QUIZ: 25,           // all 3 correct
} as const

export function calculateQuizXP(correctCount: number, totalQuestions: number, streak: number): number {
  const base = XP_VALUES.QUIZ_COMPLETE
  const correctBonus = correctCount * XP_VALUES.QUIZ_CORRECT_ANSWER
  const perfectBonus = correctCount === totalQuestions ? XP_VALUES.PERFECT_QUIZ : 0
  const streakBonus = Math.floor(streak * XP_VALUES.STREAK_BONUS_PER_DAY)
  return base + correctBonus + perfectBonus + streakBonus
}

export function calculateReadXP(streak: number): number {
  const streakBonus = Math.floor(streak * XP_VALUES.STREAK_BONUS_PER_DAY)
  return XP_VALUES.READ_ARTICLE + streakBonus
}
```

- [ ] **Step 4: Write streak logic**

Create `lib/gamification/streaks.ts`:

```typescript
// Returns today's date as YYYY-MM-DD
export function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function yesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export type StreakResult = {
  newStreak: number
  didIncrement: boolean
}

export function updateStreak(
  currentStreak: number,
  lastReadDate: string | null
): StreakResult {
  const today = todayString()
  const yesterday = yesterdayString()

  if (lastReadDate === today) {
    // Already read today — no change
    return { newStreak: currentStreak, didIncrement: false }
  }

  if (lastReadDate === yesterday) {
    // Consecutive day — increment streak
    return { newStreak: currentStreak + 1, didIncrement: true }
  }

  // Streak broken or first read
  return { newStreak: 1, didIncrement: lastReadDate === null ? false : true }
}
```

- [ ] **Step 5: Write localStorage helpers**

Create `lib/gamification/storage.ts`:

```typescript
import { GameState } from '@/lib/types'
import { getLevelFromXP } from './levels'

const STORAGE_KEY = 'newsified_game_state'

export const DEFAULT_STATE: GameState = {
  xp: 0,
  level: 1,
  streak: 0,
  lastReadDate: null,
  articlesRead: [],
  quizzesCompleted: [],
  badges: [],
  totalCorrectAnswers: 0,
  totalQuestions: 0,
}

export function loadGameState(): GameState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    return JSON.parse(raw) as GameState
  } catch {
    return DEFAULT_STATE
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

export function updateGameStateXP(state: GameState, xpGained: number): GameState {
  const newXP = state.xp + xpGained
  const levelDef = getLevelFromXP(newXP)
  return { ...state, xp: newXP, level: levelDef.level }
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/gamification/
git commit -m "feat: add full gamification system (XP, levels, badges, streaks, storage)"
```

---

## Task 8: API Routes

**Files:**
- Create: `app/api/news/route.ts`
- Create: `app/api/quiz/route.ts`
- Create: `app/api/health/route.ts`

- [ ] **Step 1: Write the news aggregation API route**

Create `app/api/news/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { aggregateNews } from '@/lib/news/aggregator'
import { getCachedNews, setCachedNews } from '@/lib/cache/redis'
import { TopicSlug } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const topic = (searchParams.get('topic') ?? 'all') as TopicSlug
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  // Try cache first
  const cached = await getCachedNews(topic, page)
  if (cached) {
    return NextResponse.json({ articles: cached, cached: true, total: cached.length })
  }

  // Aggregate from all APIs
  const articles = await aggregateNews(topic, page)
  await setCachedNews(topic, page, articles)

  return NextResponse.json({ articles, cached: false, total: articles.length })
}
```

- [ ] **Step 2: Write the quiz generation API route**

Create `app/api/quiz/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateQuiz } from '@/lib/quiz/generator'
import { getCachedQuiz, setCachedQuiz } from '@/lib/cache/redis'
import { NormalizedArticle } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const article = body.article as NormalizedArticle

  if (!article?.id || !article?.title) {
    return NextResponse.json({ error: 'Invalid article data' }, { status: 400 })
  }

  // Try cache first — quiz generation is expensive
  const cached = await getCachedQuiz(article.id)
  if (cached) {
    return NextResponse.json({ quiz: cached, cached: true })
  }

  const quiz = await generateQuiz(article)
  await setCachedQuiz(article.id, quiz)

  return NextResponse.json({ quiz, cached: false })
}
```

- [ ] **Step 3: Write health check route**

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/
git commit -m "feat: add API routes for news aggregation and quiz generation"
```

---

## Task 9: GameState Context + Hooks

> **Fix for Issue #3:** `useGameState` is promoted to a React Context so all components (Header, Sidebar, article page, QuizModal) share a single state instance. Without this, XP toasts fire but the XP bar stays frozen until navigation.

**Files:**
- Create: `context/GameStateContext.tsx`
- Create: `hooks/useGameState.ts`
- Create: `hooks/useNews.ts`
- Create: `hooks/useQuiz.ts`

- [ ] **Step 1: Write GameStateContext (the single source of truth)**

Create `context/GameStateContext.tsx`:

```typescript
'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { GameState } from '@/lib/types'
import { loadGameState, saveGameState, updateGameStateXP, DEFAULT_STATE } from '@/lib/gamification/storage'
import { updateStreak, todayString } from '@/lib/gamification/streaks'
import { calculateReadXP, calculateQuizXP } from '@/lib/gamification/xp'
import { checkNewBadges } from '@/lib/gamification/badges'

export interface XPGainEvent {
  amount: number
  reason: string
}

interface GameStateContextValue {
  state: GameState
  pendingXP: XPGainEvent | null
  newBadges: string[]
  recordArticleRead: (articleId: string) => void
  recordQuizComplete: (articleId: string, correctCount: number, totalQuestions: number) => void
  clearPendingXP: () => void
  clearNewBadges: () => void
}

const GameStateContext = createContext<GameStateContextValue | null>(null)

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(DEFAULT_STATE)
  const [pendingXP, setPendingXP] = useState<XPGainEvent | null>(null)
  const [newBadges, setNewBadges] = useState<string[]>([])

  // Hydrate from localStorage once on mount (client only)
  useEffect(() => {
    setState(loadGameState())
  }, [])

  const recordArticleRead = useCallback((articleId: string) => {
    setState(prev => {
      if (prev.articlesRead.includes(articleId)) return prev

      const { newStreak } = updateStreak(prev.streak, prev.lastReadDate)
      const xpGained = calculateReadXP(newStreak)
      const updated: GameState = {
        ...prev,
        articlesRead: [...prev.articlesRead, articleId],
        streak: newStreak,
        lastReadDate: todayString(),
      }
      const withXP = updateGameStateXP(updated, xpGained)
      const earnedBadges = checkNewBadges(withXP)
      const finalState = { ...withXP, badges: [...withXP.badges, ...earnedBadges] }

      saveGameState(finalState)
      setPendingXP({ amount: xpGained, reason: 'Article Read' })
      if (earnedBadges.length > 0) setNewBadges(earnedBadges)

      return finalState
    })
  }, [])

  const recordQuizComplete = useCallback((articleId: string, correctCount: number, totalQuestions: number) => {
    setState(prev => {
      if (prev.quizzesCompleted.includes(articleId)) return prev

      // Capture xpGained inside setState for consistency with actual state at submission time
      const xpGained = calculateQuizXP(correctCount, totalQuestions, prev.streak)
      const updated: GameState = {
        ...prev,
        quizzesCompleted: [...prev.quizzesCompleted, articleId],
        totalCorrectAnswers: prev.totalCorrectAnswers + correctCount,
        totalQuestions: prev.totalQuestions + totalQuestions,
      }
      const withXP = updateGameStateXP(updated, xpGained)
      const earnedBadges = checkNewBadges(withXP)
      const finalState = { ...withXP, badges: [...withXP.badges, ...earnedBadges] }

      saveGameState(finalState)
      setPendingXP({ amount: xpGained, reason: `Quiz Complete (+${correctCount}/${totalQuestions} correct)` })
      if (earnedBadges.length > 0) setNewBadges(earnedBadges)

      return finalState
    })
  }, [])

  const clearPendingXP = useCallback(() => setPendingXP(null), [])
  const clearNewBadges = useCallback(() => setNewBadges([]), [])

  return (
    <GameStateContext.Provider value={{
      state, pendingXP, newBadges,
      recordArticleRead, recordQuizComplete,
      clearPendingXP, clearNewBadges,
    }}>
      {children}
    </GameStateContext.Provider>
  )
}

export function useGameStateContext(): GameStateContextValue {
  const ctx = useContext(GameStateContext)
  if (!ctx) throw new Error('useGameStateContext must be used inside <GameStateProvider>')
  return ctx
}
```

- [ ] **Step 2: Write useGameState (thin consumer hook)**

Create `hooks/useGameState.ts`:

```typescript
// Thin re-export so components import from a consistent path
export { useGameStateContext as useGameState } from '@/context/GameStateContext'
export type { XPGainEvent } from '@/context/GameStateContext'
```

- [ ] **Step 3: Write useNews hook**

Create `hooks/useNews.ts`:

```typescript
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
```

- [ ] **Step 4: Write useQuiz hook**

Create `hooks/useQuiz.ts`:

```typescript
'use client'
import { useState } from 'react'
import { NormalizedArticle, ArticleQuiz } from '@/lib/types'

type QuizState = 'idle' | 'loading' | 'active' | 'submitted' | 'error'

export function useQuiz(article: NormalizedArticle | null) {
  const [quizState, setQuizState] = useState<QuizState>('idle')
  const [quiz, setQuiz] = useState<ArticleQuiz | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const startQuiz = async () => {
    if (!article) return
    setQuizState('loading')
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article }),
      })
      const data = await res.json()
      setQuiz(data.quiz)
      setQuizState('active')
    } catch {
      setQuizState('error')
    }
  }

  const selectAnswer = (questionId: string, optionId: string) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  const submitQuiz = () => {
    if (!quiz || submitted) return
    setSubmitted(true)
    setQuizState('submitted')
  }

  const getScore = (): { correct: number; total: number } => {
    if (!quiz) return { correct: 0, total: 0 }
    const correct = quiz.questions.filter(q => {
      const selected = answers[q.id]
      return selected === q.options.find(o => o.isCorrect)?.id
    }).length
    return { correct, total: quiz.questions.length }
  }

  const reset = () => {
    setQuizState('idle')
    setQuiz(null)
    setAnswers({})
    setSubmitted(false)
  }

  return { quizState, quiz, answers, submitted, startQuiz, selectAnswer, submitQuiz, getScore, reset }
}
```

- [ ] **Step 5: Commit**

```bash
git add context/ hooks/
git commit -m "feat: add GameStateContext provider and useGameState/useNews/useQuiz hooks"
```

---

## Task 10: Global Styles & Layout

**Files:**
- Modify: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `components/layout/Header.tsx`
- Create: `components/layout/TopicTabs.tsx`

- [ ] **Step 1: Write global CSS with Ground.news-inspired dark theme**

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-primary: #0d0d14;
    --bg-secondary: #14141f;
    --bg-card: #1a1a2a;
    --bg-card-hover: #20203a;
    --border: #2a2a40;
    --text-primary: #f0f0f8;
    --text-secondary: #9090a8;
    --text-muted: #5a5a78;
    --accent-gold: #f5c842;
    --accent-xp: #4ade80;
    --accent-streak: #f97316;
    --accent-blue: #60a5fa;
  }

  * {
    box-sizing: border-box;
  }

  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg-secondary);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }
}

@layer components {
  .card {
    @apply bg-[var(--bg-card)] border border-[var(--border)] rounded-xl;
  }

  .card-hover {
    @apply card transition-all duration-200 hover:bg-[var(--bg-card-hover)] hover:border-[#3a3a58] hover:-translate-y-0.5;
  }

  .tag {
    @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium;
  }

  .btn-primary {
    @apply px-4 py-2 bg-[var(--accent-gold)] text-black font-semibold rounded-lg
           hover:brightness-110 transition-all duration-150 active:scale-95;
  }

  .btn-ghost {
    @apply px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--text-secondary)]
           hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-all duration-150;
  }

  .xp-bar-track {
    @apply w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden;
  }

  .xp-bar-fill {
    @apply h-full bg-gradient-to-r from-[var(--accent-xp)] to-emerald-400 rounded-full transition-all duration-700 ease-out;
  }
}
```

- [ ] **Step 2: Write root layout**

Create `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import Header from '@/components/layout/Header'
import { GameStateProvider } from '@/context/GameStateContext'

export const metadata: Metadata = {
  title: 'Newsified — Gamified News Intelligence',
  description: 'Understand the real-world market impact of global news. Read, learn, level up.',
  openGraph: {
    title: 'Newsified',
    description: 'Gamified news for the financially curious',
    type: 'website',
  },
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--bg-primary)]">
        {/* GameStateProvider wraps everything — single shared state instance */}
        <GameStateProvider>
          <Header />
          <main className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-16">
            {/* Suspense boundary covers use(params) calls in topic/article pages */}
            <Suspense fallback={<PageLoader />}>
              {children}
            </Suspense>
          </main>
        </GameStateProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Write Header component**

Create `components/layout/Header.tsx`:

```typescript
'use client'
import Link from 'next/link'
import { Zap, Flame } from 'lucide-react'
import { useGameState } from '@/hooks/useGameState'
import { getXPProgress } from '@/lib/gamification/levels'
import XPToast from '@/components/gamification/XPToast'

export default function Header() {
  const { state, pendingXP, clearPendingXP } = useGameState()
  const { current, progressPct } = getXPProgress(state.xp)

  return (
    <>
      <header className="sticky top-0 z-50 bg-[var(--bg-secondary)]/95 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[var(--accent-gold)] rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" fill="black" />
            </div>
            <span className="text-lg font-bold tracking-tight">Newsified</span>
          </Link>

          {/* XP / Level mini display */}
          <div className="flex items-center gap-3">
            {/* Streak chip */}
            {state.streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1">
                <Flame className="w-3.5 h-3.5 text-[var(--accent-streak)]" fill="currentColor" />
                <span className="text-xs font-bold text-[var(--accent-streak)]">{state.streak}</span>
              </div>
            )}

            {/* XP + Level */}
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

- [ ] **Step 4: Write TopicTabs component**

Create `components/layout/TopicTabs.tsx`:

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx components/layout/
git commit -m "feat: add global styles, root layout, Header, and TopicTabs"
```

---

## Task 11: News Components

**Files:**
- Create: `components/news/SourceChip.tsx`
- Create: `components/news/NewsCard.tsx`
- Create: `components/news/NewsFeed.tsx`

- [ ] **Step 1: Write SourceChip**

Create `components/news/SourceChip.tsx`:

```typescript
import clsx from 'clsx'

interface Props {
  source: string
  apiSource: string
  className?: string
}

const SOURCE_COLORS: Record<string, string> = {
  newsapi: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  gnews: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  alphavantage: 'bg-green-500/10 text-green-400 border-green-500/20',
  mediastack: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

export default function SourceChip({ source, apiSource, className }: Props) {
  return (
    <span className={clsx(
      'tag border text-[11px]',
      SOURCE_COLORS[apiSource] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      className
    )}>
      {source}
    </span>
  )
}
```

- [ ] **Step 2: Write NewsCard component**

Create `components/news/NewsCard.tsx`:

```typescript
'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, ExternalLink } from 'lucide-react'
import { NormalizedArticle } from '@/lib/types'
import { TOPIC_MAP } from '@/lib/constants/topics'
import SourceChip from './SourceChip'
import clsx from 'clsx'

interface Props {
  article: NormalizedArticle
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor(diff / 60000)
  if (h >= 24) return `${Math.floor(h / 24)}d ago`
  if (h >= 1) return `${h}h ago`
  return `${m}m ago`
}

export default function NewsCard({ article }: Props) {
  const topic = TOPIC_MAP[article.topic]

  return (
    <article className="card-hover group flex flex-col overflow-hidden">
      {/* Image */}
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
        {/* Topic tag + time */}
        <div className="flex items-center justify-between gap-2">
          <span className={clsx('tag text-white/80', topic?.color ?? 'bg-slate-600')}>
            {topic?.label ?? 'News'}
          </span>
          <div className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
            <Clock className="w-3 h-3" />
            {timeAgo(article.publishedAt)}
          </div>
        </div>

        {/* Headline */}
        <h3 className="text-sm font-semibold leading-snug text-[var(--text-primary)] line-clamp-3 group-hover:text-[var(--accent-gold)] transition-colors">
          {article.title}
        </h3>

        {/* Description */}
        {article.description && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {article.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-[var(--border)]">
          <SourceChip source={article.source} apiSource={article.apiSource} />
          <div className="flex gap-2">
            <Link
              href={`/article/${article.id}`}
              className="text-xs font-medium text-[var(--accent-gold)] hover:underline"
            >
              Read + Quiz →
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Step 3: Write NewsFeed component**

Create `components/news/NewsFeed.tsx`:

```typescript
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
          <p className="font-semibold mb-1">Couldn't load news</p>
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
```

- [ ] **Step 4: Commit**

```bash
git add components/news/
git commit -m "feat: add SourceChip, NewsCard, and NewsFeed components"
```

---

## Task 12: Gamification Components

**Files:**
- Create: `components/gamification/XPBar.tsx`
- Create: `components/gamification/LevelBadge.tsx`
- Create: `components/gamification/StreakCounter.tsx`
- Create: `components/gamification/BadgeGrid.tsx`
- Create: `components/gamification/XPToast.tsx`
- Create: `components/layout/Sidebar.tsx`

- [ ] **Step 1: Write XPBar**

Create `components/gamification/XPBar.tsx`:

```typescript
'use client'
import { getXPProgress } from '@/lib/gamification/levels'

interface Props {
  xp: number
}

export default function XPBar({ xp }: Props) {
  const { current, progressPct } = getXPProgress(xp)
  const xpIntoLevel = xp - current.xpRequired
  const xpToNext = current.xpToNext

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-[var(--text-muted)]">
          {xpIntoLevel} / {xpToNext === Infinity ? '∞' : xpToNext} XP
        </span>
        <span className="text-xs font-semibold text-[var(--accent-xp)]">{progressPct}%</span>
      </div>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write LevelBadge**

Create `components/gamification/LevelBadge.tsx`:

```typescript
import { getXPProgress } from '@/lib/gamification/levels'

interface Props {
  xp: number
  large?: boolean
}

export default function LevelBadge({ xp, large }: Props) {
  const { current } = getXPProgress(xp)

  return (
    <div className={`flex items-center gap-2 ${large ? 'gap-3' : ''}`}>
      <div className={`
        flex items-center justify-center rounded-xl font-black text-black bg-[var(--accent-gold)]
        ${large ? 'w-14 h-14 text-xl' : 'w-9 h-9 text-sm'}
      `}>
        {current.level}
      </div>
      <div>
        <p className={`font-bold leading-none ${large ? 'text-base' : 'text-sm'}`}>
          {current.title}
        </p>
        <p className={`text-[var(--text-muted)] leading-none mt-0.5 ${large ? 'text-sm' : 'text-xs'}`}>
          Level {current.level}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write StreakCounter**

Create `components/gamification/StreakCounter.tsx`:

```typescript
import { Flame } from 'lucide-react'

interface Props {
  streak: number
}

export default function StreakCounter({ streak }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
        <Flame className="w-5 h-5 text-[var(--accent-streak)]" fill="currentColor" />
      </div>
      <div>
        <p className="font-bold leading-none">{streak} <span className="text-[var(--text-muted)] font-normal text-xs">days</span></p>
        <p className="text-xs text-[var(--text-muted)] leading-none mt-0.5">Current Streak</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write BadgeGrid**

Create `components/gamification/BadgeGrid.tsx`:

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
              title={`${badge.name}: ${badge.description}`}
              className={clsx(
                'aspect-square rounded-xl flex items-center justify-center text-xl cursor-help transition-all',
                earned
                  ? 'bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/30 shadow-lg shadow-yellow-500/10 animate-[badgePop_0.4s_ease-out]'
                  : 'bg-[var(--bg-secondary)] border border-[var(--border)] opacity-30 grayscale'
              )}
            >
              {badge.icon}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write XPToast**

Create `components/gamification/XPToast.tsx`:

```typescript
'use client'
import { useEffect } from 'react'
import { Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  amount: number
  reason: string
  onDone: () => void
}

export default function XPToast({ amount, reason, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl
                   bg-[var(--bg-card)] border border-[var(--accent-xp)]/40 shadow-2xl shadow-green-500/20"
      >
        <div className="w-9 h-9 rounded-xl bg-[var(--accent-xp)]/10 flex items-center justify-center">
          <Zap className="w-4.5 h-4.5 text-[var(--accent-xp)]" fill="currentColor" />
        </div>
        <div>
          <p className="font-black text-[var(--accent-xp)] text-lg leading-none">+{amount} XP</p>
          <p className="text-xs text-[var(--text-muted)] leading-none mt-0.5">{reason}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
```

- [ ] **Step 6: Write Sidebar**

Create `components/layout/Sidebar.tsx`:

```typescript
'use client'
import { useGameState } from '@/hooks/useGameState'
import LevelBadge from '@/components/gamification/LevelBadge'
import XPBar from '@/components/gamification/XPBar'
import StreakCounter from '@/components/gamification/StreakCounter'
import BadgeGrid from '@/components/gamification/BadgeGrid'

export default function Sidebar() {
  const { state } = useGameState()

  return (
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

      {/* Badges */}
      <div className="card p-5">
        <BadgeGrid earnedBadgeIds={state.badges} />
      </div>
    </aside>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add components/gamification/ components/layout/Sidebar.tsx
git commit -m "feat: add gamification components (XPBar, LevelBadge, StreakCounter, BadgeGrid, XPToast, Sidebar)"
```

---

## Task 13: Quiz Components

**Files:**
- Create: `components/quiz/QuizQuestion.tsx`
- Create: `components/quiz/QuizResults.tsx`
- Create: `components/quiz/QuizModal.tsx`

- [ ] **Step 1: Write QuizQuestion component**

Create `components/quiz/QuizQuestion.tsx`:

```typescript
'use client'
import { QuizQuestion as IQuizQuestion } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  question: IQuizQuestion
  questionNumber: number
  selectedOptionId: string | undefined
  submitted: boolean
  onSelect: (optionId: string) => void
}

const TYPE_LABELS = {
  'market-impact': '📈 Market Impact',
  'macro-micro-context': '🌐 Macro/Micro Context',
  'prediction': '🔮 What Happens Next?',
}

export default function QuizQuestion({
  question, questionNumber, selectedOptionId, submitted, onSelect
}: Props) {
  const correctOption = question.options.find(o => o.isCorrect)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="tag bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 text-xs mb-2 inline-block">
          {TYPE_LABELS[question.type]} · Q{questionNumber}
        </span>
        <h3 className="font-semibold text-base leading-snug">{question.question}</h3>
      </div>

      <div className="flex flex-col gap-2">
        {question.options.map(option => {
          const isSelected = selectedOptionId === option.id
          const isCorrect = option.isCorrect
          const showResult = submitted

          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              disabled={submitted}
              className={clsx(
                'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150',
                !showResult && !isSelected && 'border-[var(--border)] hover:border-[var(--accent-gold)]/50 hover:bg-[var(--bg-card-hover)]',
                !showResult && isSelected && 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10',
                showResult && isCorrect && 'border-green-500 bg-green-500/10 text-green-400',
                showResult && isSelected && !isCorrect && 'border-red-500 bg-red-500/10 text-red-400',
                showResult && !isSelected && !isCorrect && 'border-[var(--border)] opacity-50',
              )}
            >
              <span className="font-bold mr-2 uppercase">{option.id}.</span>
              {option.text}
            </button>
          )
        })}
      </div>

      {submitted && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--accent-xp)] mb-1">💡 Explanation</p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write QuizResults component**

Create `components/quiz/QuizResults.tsx`:

```typescript
import { Zap, Trophy, RotateCcw } from 'lucide-react'

interface Props {
  correct: number
  total: number
  xpGained: number
  onClose: () => void
}

const SCORE_LABELS = [
  { min: 0,   label: 'Keep Reading',      emoji: '📖' },
  { min: 1,   label: 'Good Effort',       emoji: '💪' },
  { min: 2,   label: 'Well Done',         emoji: '🎯' },
  { min: 3,   label: 'Perfect Score!',    emoji: '🏆' },
]

export default function QuizResults({ correct, total, xpGained, onClose }: Props) {
  const scoreLabel = SCORE_LABELS.slice().reverse().find(s => correct >= s.min) ?? SCORE_LABELS[0]
  const pct = Math.round((correct / total) * 100)

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="text-6xl">{scoreLabel.emoji}</div>

      <div>
        <p className="text-2xl font-black">{scoreLabel.label}</p>
        <p className="text-[var(--text-muted)] mt-1">
          {correct} out of {total} correct — {pct}%
        </p>
      </div>

      {/* XP reward */}
      <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--accent-xp)]/10 border border-[var(--accent-xp)]/30">
        <Zap className="w-5 h-5 text-[var(--accent-xp)]" fill="currentColor" />
        <span className="font-black text-[var(--accent-xp)] text-xl">+{xpGained} XP</span>
        <span className="text-[var(--text-muted)] text-sm">earned</span>
      </div>

      <button onClick={onClose} className="btn-primary flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        Continue Reading
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Write QuizModal**

Create `components/quiz/QuizModal.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { X, Brain, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NormalizedArticle } from '@/lib/types'
import { useQuiz } from '@/hooks/useQuiz'
import { useGameState } from '@/hooks/useGameState'
import { calculateQuizXP } from '@/lib/gamification/xp'
import QuizQuestion from './QuizQuestion'
import QuizResults from './QuizResults'

interface Props {
  article: NormalizedArticle
  isOpen: boolean
  onClose: () => void
}

export default function QuizModal({ article, isOpen, onClose }: Props) {
  const { state, recordQuizComplete } = useGameState()
  const { quizState, quiz, answers, submitted, startQuiz, selectAnswer, submitQuiz, getScore } = useQuiz(article)
  const [currentQ, setCurrentQ] = useState(0)
  // Store xpGained at submission time to avoid display drift after state updates
  const [awardedXP, setAwardedXP] = useState(0)

  const allAnswered = quiz ? quiz.questions.every(q => answers[q.id]) : false
  const score = getScore()

  const handleSubmit = () => {
    const { correct, total } = getScore()
    // Calculate XP using current streak BEFORE state update (same value recordQuizComplete uses)
    const xp = calculateQuizXP(correct, total, state.streak)
    setAwardedXP(xp)
    submitQuiz()
    recordQuizComplete(article.id, correct, total)
  }

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
            className="card w-full max-w-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[var(--accent-gold)]" />
                <span className="font-bold">Market Impact Quiz</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {quizState === 'idle' && (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <p className="text-[var(--text-secondary)] text-sm max-w-xs">
                    Test your understanding of this article with 3 AI-generated questions about market impact, economic context, and predictions.
                  </p>
                  <button onClick={startQuiz} className="btn-primary flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Start Quiz
                  </button>
                </div>
              )}

              {quizState === 'loading' && (
                <div className="flex flex-col items-center gap-3 py-8 text-[var(--text-muted)]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-sm">Generating questions with Claude AI...</p>
                </div>
              )}

              {(quizState === 'active' || quizState === 'submitted') && quiz && (
                <div className="flex flex-col gap-6">
                  {/* Question navigator */}
                  <div className="flex gap-2">
                    {quiz.questions.map((q, i) => (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQ(i)}
                        className={`flex-1 h-1.5 rounded-full transition-all ${
                          i === currentQ ? 'bg-[var(--accent-gold)]' : answers[q.id] ? 'bg-[var(--accent-xp)]' : 'bg-[var(--border)]'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Current question */}
                  <QuizQuestion
                    question={quiz.questions[currentQ]}
                    questionNumber={currentQ + 1}
                    selectedOptionId={answers[quiz.questions[currentQ].id]}
                    submitted={submitted}
                    onSelect={(optId) => selectAnswer(quiz.questions[currentQ].id, optId)}
                  />

                  {/* Nav buttons */}
                  <div className="flex justify-between gap-3 pt-2 border-t border-[var(--border)]">
                    <button
                      onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                      disabled={currentQ === 0}
                      className="btn-ghost text-sm disabled:opacity-30"
                    >
                      ← Previous
                    </button>

                    {currentQ < quiz.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQ(q => q + 1)}
                        className="btn-primary text-sm"
                      >
                        Next →
                      </button>
                    ) : !submitted ? (
                      <button
                        onClick={handleSubmit}
                        disabled={!allAnswered}
                        className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Submit Quiz ✓
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {quizState === 'submitted' && submitted && (
                <div className="mt-4 border-t border-[var(--border)] pt-4">
                  <QuizResults
                    correct={score.correct}
                    total={score.total}
                    xpGained={awardedXP}
                    onClose={onClose}
                  />
                </div>
              )}

              {quizState === 'error' && (
                <div className="text-center py-6">
                  <p className="text-red-400 text-sm">Failed to generate quiz. Try again.</p>
                  <button onClick={startQuiz} className="btn-ghost mt-3 text-sm">Retry</button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/quiz/
git commit -m "feat: add QuizQuestion, QuizResults, and QuizModal components"
```

---

## Task 14: Pages

**Files:**
- Modify: `app/page.tsx`
- Create: `app/news/page.tsx`
- Create: `app/topic/[slug]/page.tsx`
- Create: `app/article/[id]/page.tsx`

- [ ] **Step 1: Write homepage redirect**

Replace `app/page.tsx`:

```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/news')
}
```

- [ ] **Step 2: Write main news feed page**

Create `app/news/page.tsx`:

```typescript
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
```

- [ ] **Step 3: Write per-topic feed page**

Create `app/topic/[slug]/page.tsx`:

```typescript
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
```

- [ ] **Step 4: Write article detail page**

Create `app/article/[id]/page.tsx`:

```typescript
'use client'
import { use, useState, useEffect } from 'react'
import { useSearchParams, notFound } from 'next/navigation'
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

  // Load article from sessionStorage (passed from news feed on click).
  // Only `id` in deps — recordArticleRead is stable (useCallback []) so
  // listing it would cause double-fires during context hydration re-renders.
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
      {/* Back button */}
      <Link href="/news" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to News
      </Link>

      {/* Article */}
      <article className="card overflow-hidden">
        {article.imageUrl && (
          <div className="relative w-full aspect-[21/9]">
            <Image src={article.imageUrl} alt={article.title} fill className="object-cover" unoptimized />
          </div>
        )}

        <div className="p-6 md:p-8 flex flex-col gap-5">
          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            {topic && <span className={`tag text-white/80 ${topic.color}`}>{topic.label}</span>}
            <span className="text-[var(--text-muted)] text-xs font-medium">{article.source}</span>
            <div className="flex items-center gap-1 text-[var(--text-muted)] text-xs ml-auto">
              <Clock className="w-3 h-3" />
              {timeAgo(article.publishedAt)}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-black leading-tight">{article.title}</h1>

          {/* Description */}
          {article.description && (
            <p className="text-[var(--text-secondary)] text-base leading-relaxed border-l-2 border-[var(--accent-gold)] pl-4">
              {article.description}
            </p>
          )}

          {/* Content */}
          {article.content && (
            <div className="prose prose-invert max-w-none">
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-line">
                {article.content.replace(/\[\+\d+ chars\]/, '').trim()}
              </p>
            </div>
          )}

          {/* Read full article link */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[var(--accent-blue)] hover:underline"
          >
            Read full article on {article.source}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Quiz CTA */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border)] flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Brain className="w-5 h-5 text-[var(--accent-gold)]" />
                Market Impact Quiz
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {alreadyQuizzed
                  ? '✅ Quiz completed — you earned XP for this article!'
                  : 'Test your understanding of this article\'s market implications. Earn XP!'}
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

      {/* Quiz Modal */}
      <QuizModal article={article} isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 5: Update NewsCard to store article in sessionStorage before navigating**

Edit `components/news/NewsCard.tsx` — update the "Read + Quiz →" link to store article data:

```typescript
// Add this to NewsCard component before the return:
const handleClick = () => {
  sessionStorage.setItem(`article_${article.id}`, JSON.stringify(article))
}

// Update the Link:
<Link
  href={`/article/${article.id}`}
  className="text-xs font-medium text-[var(--accent-gold)] hover:underline"
  onClick={handleClick}
>
  Read + Quiz →
</Link>
```

- [ ] **Step 6: Commit**

```bash
git add app/ components/news/NewsCard.tsx
git commit -m "feat: add all pages (news feed, topic feed, article detail with quiz CTA)"
```

---

## Task 15: Final Polish & Vercel Config

> No `vercel.json` needed — Vercel auto-detects Next.js projects. The only config required is `next.config.ts` and environment variables set in the Vercel dashboard.

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Configure Next.js for external images**

> **Fix for Issue #9:** `hostname: '**'` is invalid in Next.js remotePatterns and causes a startup error. Use `unoptimized: true` instead — all `<Image>` components in the plan already have `unoptimized` prop, so this is consistent and zero-config.

Create/update `next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Allow all external image URLs without a whitelist.
    // All <Image> components use unoptimized={true} so Next.js
    // proxying is bypassed — no remotePatterns needed.
    unoptimized: true,
  },
  reactStrictMode: true,
}

export default nextConfig
```

- [ ] **Step 2: Add no-scrollbar CSS utility to globals.css**

Add to `app/globals.css`:

```css
/* Hide scrollbar but keep scrollability */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

- [ ] **Step 3: Test the full app locally**

```bash
npm run dev
```

Open http://localhost:3000 and verify:
- [ ] Homepage redirects to /news
- [ ] Topic tabs render and navigate correctly
- [ ] News cards load from API (check Network tab for /api/news calls)
- [ ] Clicking "Read + Quiz →" goes to article page
- [ ] Article page shows quiz CTA
- [ ] Quiz modal opens and generates questions
- [ ] XP toast appears after reading
- [ ] Sidebar shows XP bar, streak, badges
- [ ] localStorage has state saved (check Application tab)

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Newsified MVP — gamified news aggregator with 4 APIs, Claude Haiku quizzes, XP system"
```

---

## API Keys Signup Checklist

Before running, register for:
- [ ] **NewsAPI**: https://newsapi.org/register (free: 100 req/day dev, 500/day with verification)
- [ ] **GNews**: https://gnews.io (free: 100 req/day)
- [ ] **Alpha Vantage**: https://www.alphavantage.co/support/#api-key (free: 25 req/day)
- [ ] **Mediastack**: https://mediastack.com/signup/free (free: 500 req/month)
- [ ] **Upstash Redis**: https://console.upstash.com (free: 10k commands/day)
- [ ] **Anthropic API**: https://console.anthropic.com (pay-as-you-go, Haiku is ~$0.001/quiz)

---

## Environment Variables for Vercel

Set all 7 keys in the Vercel dashboard under Project → Settings → Environment Variables:

```
NEWSAPI_KEY
GNEWS_API_KEY
ALPHAVANTAGE_API_KEY
MEDIASTACK_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
ANTHROPIC_API_KEY
```
