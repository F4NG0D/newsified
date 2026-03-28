# Newsified

A gamified, all-in-one news aggregator that turns reading the news into a progression experience. Read articles, take AI-generated quizzes, earn XP, level up, and maintain your daily streak — all without an account.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)

---

## What It Does

Newsified aggregates news from 4 different APIs in real time across 8 topic categories, then uses Claude AI (Haiku) to generate 3 multiple-choice quiz questions for every article — covering market impact, macroeconomic context, and predictions. Your progress (XP, level, streak, badges) is saved locally in your browser with no account required.

### Topic Categories

- Geopolitics
- Finance & Markets
- Business
- Technology
- U.S. Politics
- Energy & Commodities
- Economy
- Science & Health

### Gamification

| Feature | Details |
|---|---|
| XP System | Earn XP for reading articles and completing quizzes |
| 20 Levels | Novice → Curious Reader → Market Analyst → Oracle |
| Streaks | Daily reading streak with bonus XP multiplier |
| 10 Badges | Unlock achievements (First Read, Week Warrior, Sharp Mind, etc.) |
| XP Toasts | Animated floating notifications when you earn XP |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5`) |
| Cache | Upstash Redis |
| Animations | Framer Motion |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Architecture

```
Browser (localStorage)          Vercel Edge
      │                               │
      │  GET /api/news?topic=finance  │
      │ ─────────────────────────────►│
      │                               │  Check Upstash Redis (15min TTL)
      │                               │  ──► Cache hit → return instantly
      │                               │  ──► Cache miss → fetch all 4 APIs in parallel
      │                               │       NewsAPI + GNews + AlphaVantage + Mediastack
      │                               │       Deduplicate + sort by date → cache + return
      │◄──────────────────────────────│
      │                               │
      │  POST /api/quiz { article }   │
      │ ─────────────────────────────►│
      │                               │  Check Upstash Redis (permanent)
      │                               │  ──► Cache hit → return instantly
      │                               │  ──► Cache miss → call Claude Haiku → cache + return
      │◄──────────────────────────────│
```

- **No database** — user state (XP, level, streak, badges) lives in `localStorage`
- **News cached for 15 minutes** — prevents hitting API rate limits on every visit
- **Quizzes cached permanently** — Claude Haiku is only called once per article, ever
- **All API keys server-side only** — never exposed to the client bundle

---

## Getting Started

### Prerequisites

- Node.js 18+
- API keys for the services listed below

### 1. Clone and install

```bash
git clone https://github.com/F4NG0D/newsified.git
cd newsified
npm install
```

### 2. Set up environment variables

Fill in `.env.local` with your keys:

```env
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
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Keys

All services have free tiers sufficient for personal use.

| Service | Free Tier | Signup |
|---|---|---|
| NewsAPI | 100 req/day | https://newsapi.org/register |
| GNews | 100 req/day | https://gnews.io |
| Alpha Vantage | 25 req/day | https://www.alphavantage.co/support/#api-key |
| Mediastack | 500 req/month | https://mediastack.com/signup/free |
| Upstash Redis | 10,000 commands/day | https://console.upstash.com |
| Anthropic (Haiku) | Pay-as-you-go (~$0.001/quiz) | https://console.anthropic.com |

---

## Deploying to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add all 7 environment variables in **Project → Settings → Environment Variables**
4. Deploy

Vercel auto-detects Next.js — no `vercel.json` needed.

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout — GameStateProvider, Header, Suspense
│   ├── page.tsx                # Redirects to /news
│   ├── globals.css             # CSS variables, dark theme, component classes
│   ├── news/page.tsx           # Main feed (All topics)
│   ├── topic/[slug]/page.tsx   # Per-topic feed
│   ├── article/[id]/page.tsx   # Article detail + quiz CTA
│   └── api/
│       ├── news/route.ts       # GET /api/news — aggregates 4 APIs with Redis cache
│       ├── quiz/route.ts       # POST /api/quiz — generates quiz via Claude Haiku
│       └── health/route.ts     # GET /api/health — sanity check
├── components/
│   ├── layout/                 # Header, TopicTabs, Sidebar
│   ├── news/                   # NewsCard, NewsFeed, SourceChip
│   ├── quiz/                   # QuizModal, QuizQuestion, QuizResults
│   └── gamification/           # XPBar, LevelBadge, StreakCounter, BadgeGrid, XPToast
├── lib/
│   ├── types.ts                # All shared TypeScript interfaces
│   ├── constants/topics.ts     # Topic definitions and slugs
│   ├── cache/redis.ts          # Upstash Redis helpers
│   ├── news/                   # 4 API clients + aggregator
│   ├── quiz/generator.ts       # Claude Haiku quiz generation
│   └── gamification/           # XP, levels, badges, streaks, localStorage
├── context/
│   └── GameStateContext.tsx    # Shared game state (single React Context instance)
└── hooks/
    ├── useGameState.ts         # Thin re-export of context hook
    ├── useNews.ts              # Fetches /api/news
    └── useQuiz.ts              # Quiz state machine (idle → loading → active → submitted)
```

---

## License

MIT
