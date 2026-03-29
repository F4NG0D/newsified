'use client'
import { X, Swords, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function QuestsModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal card */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="card p-6 w-full max-w-sm mx-4 pointer-events-auto"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-full bg-[var(--accent-gold)]/10 flex items-center justify-center">
                  <Swords className="w-7 h-7 text-[var(--accent-gold)]" />
                </div>

                <div className="text-center">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Quests</h2>
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] px-2.5 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-[var(--text-secondary)] text-center mb-5 leading-relaxed">
                Complete daily challenges to earn bonus XP. Example: Read 3 articles on geopolitics today.
              </p>

              {/* Example quest card (locked/dimmed) */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 mb-5 opacity-50 select-none">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[var(--text-muted)]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">
                      Curious Citizen
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      Read 3 articles in any category
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-[var(--accent-xp)] whitespace-nowrap">
                    +50 XP
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div className="h-full w-1/3 rounded-full bg-[var(--accent-xp)] opacity-60" />
                </div>
                <div className="mt-1.5 text-right text-[10px] text-[var(--text-muted)]">1 / 3</div>
              </div>

              {/* Got it button */}
              <button
                onClick={onClose}
                className="btn-primary w-full py-2.5 rounded-lg text-sm font-semibold"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
