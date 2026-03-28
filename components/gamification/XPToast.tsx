'use client'
import { useEffect } from 'react'
import { Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  amount: number
  reason: string
  onDone: () => void
}

export default function XPToast({ amount, reason, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl
                   bg-[var(--bg-card)] border border-[var(--accent-xp)]/40 shadow-2xl shadow-green-500/20"
      >
        <div className="w-9 h-9 rounded-xl bg-[var(--accent-xp)]/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-[var(--accent-xp)]" fill="currentColor" />
        </div>
        <div>
          <p className="font-black text-[var(--accent-xp)] text-lg leading-none">+{amount} XP</p>
          <p className="text-xs text-[var(--text-muted)] leading-none mt-0.5">{reason}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
