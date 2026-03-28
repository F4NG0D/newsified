import { getXPProgress } from '@/lib/gamification/levels'

interface Props {
  xp: number
  large?: boolean
}

export default function LevelBadge({ xp, large }: Props) {
  const { current } = getXPProgress(xp)

  return (
    <div className={`flex items-center gap-2 ${large ? 'gap-3' : ''}`}>
      <div className={`
        flex items-center justify-center rounded-xl font-black text-black bg-[var(--accent-gold)]
        ${large ? 'w-14 h-14 text-xl' : 'w-9 h-9 text-sm'}
      `}>
        {current.level}
      </div>
      <div>
        <p className={`font-bold leading-none ${large ? 'text-base' : 'text-sm'}`}>
          {current.title}
        </p>
        <p className={`text-[var(--text-muted)] leading-none mt-0.5 ${large ? 'text-sm' : 'text-xs'}`}>
          Level {current.level}
        </p>
      </div>
    </div>
  )
}
