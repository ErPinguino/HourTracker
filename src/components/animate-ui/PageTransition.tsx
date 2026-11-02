import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export function PageTransition({ pageKey, children }: { pageKey: string; children: ReactNode }) {
  const reduce = useReducedMotion()
  return <AnimatePresence mode="wait" initial={false}>
    <motion.div key={pageKey} className="flex min-h-full flex-1 flex-col" initial={{ opacity: reduce ? 1 : 0, x: reduce ? 0 : 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: reduce ? 1 : 0, x: reduce ? 0 : -8 }} transition={{ duration: reduce ? 0 : 0.16, ease: 'easeOut' }}>
      {children}
    </motion.div>
  </AnimatePresence>
}
