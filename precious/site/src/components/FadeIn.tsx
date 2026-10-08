import { motion } from 'framer-motion'
import type { ElementType, ReactNode } from 'react'

type Props = {
  children: ReactNode
  as?: ElementType
  delay?: number
  duration?: number
  x?: number
  y?: number
  className?: string
  style?: React.CSSProperties
}

// motion.create returns a new component each call, so cache one per tag
const cache = new Map<ElementType, typeof motion.div>()

export default function FadeIn({ children, as = 'div', delay = 0, duration = 0.7, x = 0, y = 30, className, style }: Props) {
  if (!cache.has(as)) cache.set(as, motion.create(as) as unknown as typeof motion.div)
  const M = cache.get(as)!
  return (
    <M
      className={className}
      style={style}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </M>
  )
}
