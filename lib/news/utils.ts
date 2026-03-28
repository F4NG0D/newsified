// Server-side only — this file runs in Next.js API routes, never the browser.
// Uses Node.js built-in crypto for collision-resistant article IDs.
import { createHash } from 'crypto'

export function generateId(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16)
}
