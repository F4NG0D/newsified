import { Zap, Trophy } from 'lucide-react'

interface Props {
  correct: number
  total: number
  xpGained: number
  onClose: () => void
}

const SCORE_LABELS = [
  { min: 0, label: 'Keep Reading',   emoji: '📖' },
  { min: 1, label: 'Good Effort',    emoji: '💪' },
  { min: 2, label: 'Well Done',      emoji: '🎯' },
  { min: 3, label: 'Perfect Score!', emoji: '🏆' },
]

export default function QuizResults({ correct, total, xpGained, onClose }: Props) {
  const scoreLabel = SCORE_LABELS.slice().reverse().find(s => correct >= s.min) ?? SCORE_LABELS[0]
  const pct = Math.round((correct / total) * 100)

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="text-6xl">{scoreLabel.emoji}</div>
      <div>
        <p className="text-2xl font-black">{scoreLabel.label}</p>
        <p className="text-[var(--text-muted)] mt-1">{correct} out of {total} correct — {pct}%</p>
      </div>
      <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--accent-xp)]/10 border border-[var(--accent-xp)]/30">
        <Zap className="w-5 h-5 text-[var(--accent-xp)]" fill="currentColor" />
        <span className="font-black text-[var(--accent-xp)] text-xl">+{xpGained} XP</span>
        <span className="text-[var(--text-muted)] text-sm">earned</span>
      </div>
      <button onClick={onClose} className="btn-primary flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        Continue Reading
      </button>
    </div>
  )
}
