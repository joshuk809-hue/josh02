import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useRef } from 'react'

function Char({ ch, progress, range }: { ch: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.2, 1])
  return (
    <span className="relative">
      <span className="invisible">{ch}</span>
      <motion.span className="absolute left-0 top-0" style={{ opacity }}>{ch}</motion.span>
    </span>
  )
}

export default function AnimatedText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.2'] })
  const chars = [...text]
  return (
    <p ref={ref} className={className} style={style} aria-label={text}>
      {chars.map((ch, i) => (
        <Char key={i} ch={ch} progress={scrollYProgress} range={[i / chars.length, (i + 1) / chars.length]} />
      ))}
    </p>
  )
}
