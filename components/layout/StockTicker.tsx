'use client'
import { useEffect, useState } from 'react'
import type { StockQuote } from '@/app/api/stocks/route'
import clsx from 'clsx'

function TickerItem({ quote }: { quote: StockQuote }) {
  const up = quote.changePct >= 0
  return (
    <span className="flex items-center gap-1.5 px-4 shrink-0">
      <span className="text-xs font-bold text-[var(--text-primary)]">{quote.label}</span>
      <span className="text-xs text-[var(--text-secondary)]">
        ${quote.price.toFixed(2)}
      </span>
      <span className={clsx(
        'text-[11px] font-semibold',
        up ? 'text-green-400' : 'text-red-400'
      )}>
        {up ? '▲' : '▼'} {Math.abs(quote.changePct).toFixed(2)}%
      </span>
      <span className="text-[var(--border)] select-none">·</span>
    </span>
  )
}

export default function StockTicker() {
  const [quotes, setQuotes] = useState<StockQuote[]>([])

  useEffect(() => {
    fetch('/api/stocks')
      .then(r => r.json())
      .then(d => setQuotes(d.quotes ?? []))
      .catch(() => {})
  }, [])

  if (quotes.length === 0) return null

  return (
    <div className="flex-1 min-w-0 overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap">
        {/* Duplicate for seamless loop */}
        {[...quotes, ...quotes].map((q, i) => (
          <TickerItem key={`${q.symbol}-${i}`} quote={q} />
        ))}
      </div>
    </div>
  )
}
