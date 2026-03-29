import { NextResponse } from 'next/server'
import { redis } from '@/lib/cache/redis'

const CACHE_KEY = 'stocks:quotes'
const CACHE_TTL = 900 // 15 minutes

const SYMBOLS = [
  { symbol: 'SPY',  label: 'S&P 500' },
  { symbol: 'QQQ',  label: 'NASDAQ' },
  { symbol: 'DIA',  label: 'DOW' },
  { symbol: 'IWM',  label: 'Russell 2k' },
  { symbol: 'AAPL', label: 'AAPL' },
  { symbol: 'MSFT', label: 'MSFT' },
  { symbol: 'NVDA', label: 'NVDA' },
  { symbol: 'TSLA', label: 'TSLA' },
  { symbol: 'AMZN', label: 'AMZN' },
  { symbol: 'META', label: 'META' },
  { symbol: 'GOOGL',label: 'GOOGL' },
]

export interface StockQuote {
  symbol: string
  label: string
  price: number
  change: number
  changePct: number
}

async function fetchQuote(symbol: string): Promise<number[] | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price: number = meta.regularMarketPrice ?? 0
    const prevClose: number = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change = price - prevClose
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0
    return [price, change, changePct]
  } catch {
    return null
  }
}

export async function GET() {
  // Try Redis cache first
  try {
    const cached = await redis.get<StockQuote[]>(CACHE_KEY)
    if (cached) return NextResponse.json({ quotes: cached, cached: true })
  } catch {
    // Redis unavailable — proceed to fetch
  }

  // Fetch all symbols in parallel
  const results = await Promise.allSettled(
    SYMBOLS.map(s => fetchQuote(s.symbol))
  )

  const quotes: StockQuote[] = SYMBOLS
    .map((s, i) => {
      const r = results[i]
      if (r.status !== 'fulfilled' || !r.value) return null
      const [price, change, changePct] = r.value
      return { symbol: s.symbol, label: s.label, price, change, changePct }
    })
    .filter((q): q is StockQuote => q !== null)

  // Cache result (fire and forget)
  try {
    redis.set(CACHE_KEY, quotes, { ex: CACHE_TTL })
  } catch {
    // non-fatal
  }

  return NextResponse.json({ quotes, cached: false })
}
