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
