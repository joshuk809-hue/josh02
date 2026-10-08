import { useEffect, useRef, useState } from 'react'
import { GALLERY } from '../data'

const women = GALLERY.filter((g) => g.for === 'women').slice(0, 11)
const men = GALLERY.filter((g) => g.for === 'men').slice(0, 10)

function Row({ items, x }: { items: typeof GALLERY; x: number }) {
  const tripled = [...items, ...items, ...items]
  return (
    <div className="flex gap-3" style={{ transform: `translateX(${x}px)`, willChange: 'transform' }}>
      {tripled.map((g, i) => (
        <img key={i} src={g.src} alt={g.title} loading="lazy" className="h-[270px] w-[420px] shrink-0 rounded-2xl object-cover" />
      ))}
    </div>
  )
}

export default function Marquee() {
  const ref = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const top = ref.current?.offsetTop ?? 0
      setOffset((window.scrollY - top + window.innerHeight) * 0.3)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <section ref={ref} className="flex flex-col gap-3 overflow-hidden bg-[#0C0C0C] pt-24 sm:pt-32 md:pt-40 pb-10">
      <Row items={women} x={offset - 200 - 420 * 4} />
      <Row items={men} x={-(offset - 200) - 420 * 3} />
    </section>
  )
}
