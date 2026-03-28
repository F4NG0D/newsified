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
      <div className="card p-5 flex flex-col gap-4">
        <LevelBadge xp={state.xp} large />
        <XPBar xp={state.xp} />
        <div className="flex justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border)] pt-3">
          <span>{state.articlesRead.length} articles read</span>
          <span>{state.quizzesCompleted.length} quizzes done</span>
        </div>
      </div>

      <div className="card p-5">
        <StreakCounter streak={state.streak} />
      </div>

      <div className="card p-5">
        <BadgeGrid earnedBadgeIds={state.badges} />
      </div>
    </aside>
  )
}
