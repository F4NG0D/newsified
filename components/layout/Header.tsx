'use client'
import Link from 'next/link'
import { Zap, Flame } from 'lucide-react'
import { useGameState } from '@/hooks/useGameState'
import { getXPProgress } from '@/lib/gamification/levels'
import XPToast from '@/components/gamification/XPToast'

export default function Header() {
  const { state, pendingXP, clearPendingXP } = useGameState()
  const { current, progressPct } = getXPProgress(state.xp)

  return (
    <>
      <header className="sticky top-0 z-50 bg-[var(--bg-secondary)]/95 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[var(--accent-gold)] rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" fill="black" />
            </div>
            <span className="text-lg font-bold tracking-tight">Newsified</span>
          </Link>

          <div className="flex items-center gap-3">
            {state.streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1">
                <Flame className="w-3.5 h-3.5 text-[var(--accent-streak)]" fill="currentColor" />
                <span className="text-xs font-bold text-[var(--accent-streak)]">{state.streak}</span>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)] leading-none">Lv.{state.level}</p>
                <p className="text-xs font-semibold text-[var(--text-secondary)] leading-none mt-0.5">{current.title}</p>
              </div>
              <div className="w-24">
                <div className="xp-bar-track">
                  <div className="xp-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 text-center">{state.xp} XP</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {pendingXP && (
        <XPToast amount={pendingXP.amount} reason={pendingXP.reason} onDone={clearPendingXP} />
      )}
    </>
  )
}
