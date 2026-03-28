import Anthropic from '@anthropic-ai/sdk'
import { NormalizedArticle, ArticleQuiz, QuizQuestion } from '@/lib/types'
import { generateId } from '@/lib/news/utils'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SYSTEM_PROMPT = `You are a financial and geopolitical education expert.
Given a news article, generate exactly 3 multiple choice quiz questions to help readers
understand the market and economic implications. Each question must have exactly 4 options (a, b, c, d)
with exactly one correct answer.

Question types:
1. "market-impact": How does this event affect financial markets, stocks, or specific sectors?
2. "macro-micro-context": What is the broader macroeconomic or microeconomic context/significance?
3. "prediction": Based on historical precedent, what is the most likely next development?

Return ONLY valid JSON matching this exact structure:
{
  "questions": [
    {
      "type": "market-impact",
      "question": "...",
      "options": [
        { "id": "a", "text": "...", "isCorrect": false },
        { "id": "b", "text": "...", "isCorrect": true },
        { "id": "c", "text": "...", "isCorrect": false },
        { "id": "d", "text": "...", "isCorrect": false }
      ],
      "explanation": "Brief explanation of why the correct answer is right (2-3 sentences)"
    }
  ]
}`

export async function generateQuiz(article: NormalizedArticle): Promise<ArticleQuiz> {
  const articleText = [
    `Title: ${article.title}`,
    `Source: ${article.source}`,
    `Description: ${article.description}`,
    article.content ? `Content: ${article.content.slice(0, 1500)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate 3 quiz questions for this article:\n\n${articleText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  const parsed = JSON.parse(content.text)

  const questions: QuizQuestion[] = parsed.questions.map((q: any, i: number) => ({
    id: `${article.id}-q${i}`,
    type: q.type,
    question: q.question,
    options: q.options,
    explanation: q.explanation,
  }))

  return {
    articleId: article.id,
    questions,
    generatedAt: new Date().toISOString(),
  }
}
