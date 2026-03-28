import clsx from 'clsx'

interface Props {
  source: string
  apiSource: string
  className?: string
}

const SOURCE_COLORS: Record<string, string> = {
  newsapi: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  gnews: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  alphavantage: 'bg-green-500/10 text-green-400 border-green-500/20',
  mediastack: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

export default function SourceChip({ source, apiSource, className }: Props) {
  return (
    <span className={clsx(
      'tag border text-[11px]',
      SOURCE_COLORS[apiSource] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      className
    )}>
      {source}
    </span>
  )
}
