'use client'
import { useState } from 'react'
import { NormalizedArticle, ArticleQuiz } from '@/lib/types'

type QuizState = 'idle' | 'loading' | 'active' | 'submitted' | 'error'

export function useQuiz(article: NormalizedArticle | null) {
  const [quizState, setQuizState] = useState<QuizState>('idle')
  const [quiz, setQuiz] = useState<ArticleQuiz | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const startQuiz = async () => {
    if (!article) return
    setQuizState('loading')
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article }),
      })
      const data = await res.json()
      setQuiz(data.quiz)
      setQuizState('active')
    } catch {
      setQuizState('error')
    }
  }

  const selectAnswer = (questionId: string, optionId: string) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  const submitQuiz = () => {
    if (!quiz || submitted) return
    setSubmitted(true)
    setQuizState('submitted')
  }

  const getScore = (): { correct: number; total: number } => {
    if (!quiz) return { correct: 0, total: 0 }
    const correct = quiz.questions.filter(q => {
      const selected = answers[q.id]
      return selected === q.options.find(o => o.isCorrect)?.id
    }).length
    return { correct, total: quiz.questions.length }
  }

  const reset = () => {
    setQuizState('idle')
    setQuiz(null)
    setAnswers({})
    setSubmitted(false)
  }

  return { quizState, quiz, answers, submitted, startQuiz, selectAnswer, submitQuiz, getScore, reset }
}
