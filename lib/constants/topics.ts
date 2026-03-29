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
