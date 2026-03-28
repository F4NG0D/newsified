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
    return { newStreak: currentStreak, didIncrement: false }
  }

  if (lastReadDate === yesterday) {
    return { newStreak: currentStreak + 1, didIncrement: true }
  }

  return { newStreak: 1, didIncrement: lastReadDate === null ? false : true }
}
