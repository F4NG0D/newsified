import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import Header from '@/components/layout/Header'
import { GameStateProvider } from '@/context/GameStateContext'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Newsified — Gamified News Intelligence',
  description: 'Understand the real-world market impact of global news. Read, learn, level up.',
  openGraph: {
    title: 'Newsified',
    description: 'Gamified news for the financially curious',
    type: 'website',
  },
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--bg-primary)]">
        <GameStateProvider>
          <Header />
          <main className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-16">
            <Suspense fallback={<PageLoader />}>
              {children}
            </Suspense>
          </main>
        </GameStateProvider>
        <Analytics />
      </body>
    </html>
  )
}
