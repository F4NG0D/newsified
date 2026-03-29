'use client'
import { useState } from 'react'
import { Swords } from 'lucide-react'
import { useGameState } from '@/hooks/useGameState'
import LevelBadge from '@/components/gamification/LevelBadge'
import XPBar from '@/components/gamification/XPBar'
import StreakCounter from '@/components/gamification/StreakCounter'
import BadgeGrid from '@/components/gamification/BadgeGrid'
import QuestsModal from '@/components/ui/QuestsModal'

export default function Sidebar() {
  const { state } = useGameState()
  const [questsOpen, setQuestsOpen] = useState(false)

  return (
    <>
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
          <button
            onClick={() => setQuestsOpen(true)}
            className="w-full flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          >
            <Swords className="w-5 h-5 text-[var(--accent-gold)]" />
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">Quests</div>
              <div className="text-xs text-[var(--text-muted)]">Coming soon</div>
            </div>
            <span className="ml-auto text-[10px] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] px-2 py-0.5 rounded-full font-medium">NEW</span>
          </button>
        </div>

        <div className="card p-5">
          <BadgeGrid earnedBadgeIds={state.badges} />
        </div>
      </aside>

      <QuestsModal isOpen={questsOpen} onClose={() => setQuestsOpen(false)} />
    </>
  )
}
