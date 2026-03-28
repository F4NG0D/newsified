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
