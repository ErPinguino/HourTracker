import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export function PageTransition({ pageKey, children }: { pageKey: string; children: ReactNode }) {
  return <AnimatePresence mode="wait" initial={false}>
    <motion.div key={pageKey} className="flex min-h-full flex-1 flex-col" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
      {children}
    </motion.div>
  </AnimatePresence>
}
