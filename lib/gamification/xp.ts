export const XP_VALUES = {
  READ_ARTICLE: 10,
  QUIZ_COMPLETE: 20,
  QUIZ_CORRECT_ANSWER: 5,
  STREAK_BONUS_PER_DAY: 2,
  PERFECT_QUIZ: 25,
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
