import { BadgeDefinition, GameState } from '@/lib/types'

export const BADGES: BadgeDefinition[] = [
  { id: 'first-article', name: 'First Read', description: 'Read your first article', icon: '📰', condition: (s) => s.articlesRead.length >= 1 },
  { id: 'quiz-starter', name: 'Quiz Starter', description: 'Complete your first quiz', icon: '🎯', condition: (s) => s.quizzesCompleted.length >= 1 },
  { id: 'streak-3', name: '3-Day Streak', description: 'Read news 3 days in a row', icon: '🔥', condition: (s) => s.streak >= 3 },
  { id: 'streak-7', name: 'Week Warrior', description: 'Read news 7 days in a row', icon: '⚡', condition: (s) => s.streak >= 7 },
  { id: 'streak-30', name: 'Monthly Master', description: 'Read news 30 days in a row', icon: '👑', condition: (s) => s.streak >= 30 },
  { id: 'news-10', name: 'News Junkie', description: 'Read 10 articles', icon: '📚', condition: (s) => s.articlesRead.length >= 10 },
  { id: 'news-50', name: 'Well Read', description: 'Read 50 articles', icon: '🎓', condition: (s) => s.articlesRead.length >= 50 },
  { id: 'quiz-5', name: 'Quiz Champion', description: 'Complete 5 quizzes', icon: '🏆', condition: (s) => s.quizzesCompleted.length >= 5 },
  { id: 'accuracy-80', name: 'Sharp Mind', description: 'Achieve 80%+ quiz accuracy over 10+ questions', icon: '🧠', condition: (s) => s.totalQuestions >= 10 && s.totalCorrectAnswers / s.totalQuestions >= 0.8 },
  { id: 'level-5', name: 'Finance Apprentice', description: 'Reach Level 5', icon: '⭐', condition: (s) => s.level >= 5 },
]

export function checkNewBadges(state: GameState): string[] {
  return BADGES
    .filter(b => !state.badges.includes(b.id) && b.condition(state))
    .map(b => b.id)
}

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find(b => b.id === id)
}
