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
