import { NextRequest, NextResponse } from 'next/server'
import { generateQuiz } from '@/lib/quiz/generator'
import { getCachedQuiz, setCachedQuiz } from '@/lib/cache/redis'
import { NormalizedArticle } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const article = body.article as NormalizedArticle

  if (!article?.id || !article?.title) {
    return NextResponse.json({ error: 'Invalid article data' }, { status: 400 })
  }

  const cached = await getCachedQuiz(article.id)
  if (cached) {
    return NextResponse.json({ quiz: cached, cached: true })
  }

  const quiz = await generateQuiz(article)
  await setCachedQuiz(article.id, quiz)

  return NextResponse.json({ quiz, cached: false })
}
