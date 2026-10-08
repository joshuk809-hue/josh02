import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  padding?: number
  strength?: number
  activeTransition?: string
  inactiveTransition?: string
  className?: string
}

export default function Magnet({
  children, padding = 150, strength = 3,
  activeTransition = 'transform 0.3s ease-out', inactiveTransition = 'transform 0.6s ease-in-out', className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0, active: false })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const inside = Math.abs(e.clientX - cx) < r.width / 2 + padding && Math.abs(e.clientY - cy) < r.height / 2 + padding
      setPos(inside ? { x: (e.clientX - cx) / strength, y: (e.clientY - cy) / strength, active: true } : { x: 0, y: 0, active: false })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [padding, strength])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: pos.active ? activeTransition : inactiveTransition,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}
