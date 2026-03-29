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
              title={badge.description}
              className={clsx(
                'flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all cursor-help',
                earned
                  ? 'bg-[var(--accent-gold)]/10 border-[var(--accent-gold)]/30 shadow-lg shadow-yellow-500/10'
                  : 'bg-[var(--bg-secondary)] border-[var(--border)] opacity-40 grayscale'
              )}
            >
              <span className="text-lg leading-none">{badge.icon}</span>
              <span className="text-[9px] font-medium text-center leading-tight text-[var(--text-muted)] line-clamp-2">
                {badge.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
