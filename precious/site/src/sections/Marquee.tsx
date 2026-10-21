import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { GALLERY } from '../data'

const women = GALLERY.filter((g) => g.for === 'women').slice(0, 11)
const men = GALLERY.filter((g) => g.for === 'men').slice(0, 10)

function Row({ items, x }: { items: typeof GALLERY; x: MotionValue<number> }) {
  const tripled = [...items, ...items, ...items]
  return (
    <motion.div className="flex gap-3" style={{ x }}>
      {tripled.map((g, i) => (
        <img key={i} src={g.src} alt={g.title} loading="lazy" className="h-[270px] w-[200px] shrink-0 rounded-2xl object-cover sm:w-[240px]" />
      ))}
    </motion.div>
  )
}

export default function Marquee() {
  const ref = useRef<HTMLElement>(null)
  const still = useReducedMotion()
  // Rows drift in opposite directions while the section crosses the viewport.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const a = useTransform(scrollYProgress, [0, 1], still ? [-400, -400] : [-200, -700])
  const b = useTransform(scrollYProgress, [0, 1], still ? [-400, -400] : [-700, -200])
  if (!GALLERY.length) return null
  return (
    <section ref={ref} className="flex flex-col gap-3 overflow-hidden bg-ink pt-24 sm:pt-32 md:pt-40 pb-10">
      <Row items={women} x={a} />
      <Row items={men.length ? men : women} x={b} />
    </section>
  )
}
