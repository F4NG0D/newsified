'use client'
import { getXPProgress } from '@/lib/gamification/levels'

interface Props {
  xp: number
}

export default function XPBar({ xp }: Props) {
  const { current, progressPct } = getXPProgress(xp)
  const xpIntoLevel = xp - current.xpRequired
  const xpToNext = current.xpToNext

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-[var(--text-muted)]">
          {xpIntoLevel} / {xpToNext === Infinity ? '∞' : xpToNext} XP
        </span>
        <span className="text-xs font-semibold text-[var(--accent-xp)]">{progressPct}%</span>
      </div>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  )
}
