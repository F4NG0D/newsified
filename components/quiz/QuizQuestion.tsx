'use client'
import { QuizQuestion as IQuizQuestion } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  question: IQuizQuestion
  questionNumber: number
  selectedOptionId: string | undefined
  submitted: boolean
  onSelect: (optionId: string) => void
}

const TYPE_LABELS = {
  'market-impact': '📈 Market Impact',
  'macro-micro-context': '🌐 Macro/Micro Context',
  'prediction': '🔮 What Happens Next?',
}

export default function QuizQuestion({
  question, questionNumber, selectedOptionId, submitted, onSelect
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="tag bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 text-xs mb-2 inline-block">
          {TYPE_LABELS[question.type]} · Q{questionNumber}
        </span>
        <h3 className="font-semibold text-base leading-snug">{question.question}</h3>
      </div>

      <div className="flex flex-col gap-2">
        {question.options.map(option => {
          const isSelected = selectedOptionId === option.id
          const isCorrect = option.isCorrect
          const showResult = submitted

          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              disabled={submitted}
              className={clsx(
                'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150',
                !showResult && !isSelected && 'border-[var(--border)] hover:border-[var(--accent-gold)]/50 hover:bg-[var(--bg-card-hover)]',
                !showResult && isSelected && 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10',
                showResult && isCorrect && 'border-green-500 bg-green-500/10 text-green-400',
                showResult && isSelected && !isCorrect && 'border-red-500 bg-red-500/10 text-red-400',
                showResult && !isSelected && !isCorrect && 'border-[var(--border)] opacity-50',
              )}
            >
              <span className="font-bold mr-2 uppercase">{option.id}.</span>
              {option.text}
            </button>
          )
        })}
      </div>

      {submitted && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--accent-xp)] mb-1">💡 Explanation</p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}
