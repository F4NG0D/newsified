import { Flame } from 'lucide-react'

interface Props {
  streak: number
}

export default function StreakCounter({ streak }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
        <Flame className="w-5 h-5 text-[var(--accent-streak)]" fill="currentColor" />
      </div>
      <div>
        <p className="font-bold leading-none">{streak} <span className="text-[var(--text-muted)] font-normal text-xs">days</span></p>
        <p className="text-xs text-[var(--text-muted)] leading-none mt-0.5">Current Streak</p>
      </div>
    </div>
  )
}
