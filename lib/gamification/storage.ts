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
  } catch {}
}

export function updateGameStateXP(state: GameState, xpGained: number): GameState {
  const newXP = state.xp + xpGained
  const levelDef = getLevelFromXP(newXP)
  return { ...state, xp: newXP, level: levelDef.level }
}
