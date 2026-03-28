import { BADGES } from '@/lib/gamification/badges'
import clsx from 'clsx'

interface Props {
  earnedBadgeIds: string[]
}

export default function BadgeGrid({ earnedBadgeIds }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Achievements
      </p>
      <div className="grid grid-cols-5 gap-2">
        {BADGES.map(badge => {
          const earned = earnedBadgeIds.includes(badge.id)
          return (
            <div
              key={badge.id}
              title={`${badge.name}: ${badge.description}`}
              className={clsx(
                'aspect-square rounded-xl flex items-center justify-center text-xl cursor-help transition-all',
                earned
                  ? 'bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/30 shadow-lg shadow-yellow-500/10'
                  : 'bg-[var(--bg-secondary)] border border-[var(--border)] opacity-30 grayscale'
              )}
            >
              {badge.icon}
            </div>
          )
        })}
      </div>
    </div>
  )
}
