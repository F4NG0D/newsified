'use client'
import { useState } from 'react'
import { X, Brain, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NormalizedArticle } from '@/lib/types'
import { useQuiz } from '@/hooks/useQuiz'
import { useGameState } from '@/hooks/useGameState'
import { calculateQuizXP } from '@/lib/gamification/xp'
import QuizQuestion from './QuizQuestion'
import QuizResults from './QuizResults'

interface Props {
  article: NormalizedArticle
  isOpen: boolean
  onClose: () => void
}

export default function QuizModal({ article, isOpen, onClose }: Props) {
  const { state, recordQuizComplete } = useGameState()
  const { quizState, quiz, answers, submitted, startQuiz, selectAnswer, submitQuiz, getScore } = useQuiz(article)
  const [currentQ, setCurrentQ] = useState(0)
  const [awardedXP, setAwardedXP] = useState(0)

  const allAnswered = quiz ? quiz.questions.every(q => answers[q.id]) : false
  const score = getScore()

  const handleSubmit = () => {
    const { correct, total } = getScore()
    const xp = calculateQuizXP(correct, total, state.streak)
    setAwardedXP(xp)
    submitQuiz()
    recordQuizComplete(article.id, correct, total)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="card w-full max-w-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[var(--accent-gold)]" />
                <span className="font-bold">Market Impact Quiz</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {quizState === 'idle' && (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <p className="text-[var(--text-secondary)] text-sm max-w-xs">
                    Test your understanding of this article with 3 AI-generated questions about market impact, economic context, and predictions.
                  </p>
                  <button onClick={startQuiz} className="btn-primary flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Start Quiz
                  </button>
                </div>
              )}

              {quizState === 'loading' && (
                <div className="flex flex-col items-center gap-3 py-8 text-[var(--text-muted)]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-sm">Generating questions with Claude AI...</p>
                </div>
              )}

              {(quizState === 'active' || quizState === 'submitted') && quiz && (
                <div className="flex flex-col gap-6">
                  <div className="flex gap-2">
                    {quiz.questions.map((q, i) => (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQ(i)}
                        className={`flex-1 h-1.5 rounded-full transition-all ${
                          i === currentQ ? 'bg-[var(--accent-gold)]' : answers[q.id] ? 'bg-[var(--accent-xp)]' : 'bg-[var(--border)]'
                        }`}
                      />
                    ))}
                  </div>

                  <QuizQuestion
                    question={quiz.questions[currentQ]}
                    questionNumber={currentQ + 1}
                    selectedOptionId={answers[quiz.questions[currentQ].id]}
                    submitted={submitted}
                    onSelect={(optId) => selectAnswer(quiz.questions[currentQ].id, optId)}
                  />

                  <div className="flex justify-between gap-3 pt-2 border-t border-[var(--border)]">
                    <button
                      onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                      disabled={currentQ === 0}
                      className="btn-ghost text-sm disabled:opacity-30"
                    >
                      ← Previous
                    </button>

                    {currentQ < quiz.questions.length - 1 ? (
                      <button onClick={() => setCurrentQ(q => q + 1)} className="btn-primary text-sm">
                        Next →
                      </button>
                    ) : !submitted ? (
                      <button
                        onClick={handleSubmit}
                        disabled={!allAnswered}
                        className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Submit Quiz ✓
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {quizState === 'submitted' && submitted && (
                <div className="mt-4 border-t border-[var(--border)] pt-4">
                  <QuizResults
                    correct={score.correct}
                    total={score.total}
                    xpGained={awardedXP}
                    onClose={onClose}
                  />
                </div>
              )}

              {quizState === 'error' && (
                <div className="text-center py-6">
                  <p className="text-red-400 text-sm">Failed to generate quiz. Try again.</p>
                  <button onClick={startQuiz} className="btn-ghost mt-3 text-sm">Retry</button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
