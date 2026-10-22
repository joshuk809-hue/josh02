import { useEffect, useRef } from 'react'
import FadeIn from '../components/FadeIn'
import { useT } from '../i18n'

// Her own clips (captions removed), served from public/videos. Each plays only while on screen.
const CLIPS = ['cornrows-men', 'cornrows-men-2', 'twists', 'cornrows-design', 'knotless-braids', 'two-strand-twists']

function Clip({ name }: { name: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.4 })
    io.observe(v)
    return () => io.disconnect()
  }, [])
  return (
    <video
      ref={ref}
      src={`videos/${name}.mp4`}
      poster={`videos/${name}.jpg`}
      muted loop playsInline preload="none"
      aria-hidden
      className="aspect-9/16 w-[62vw] max-w-[260px] shrink-0 snap-center rounded-[28px] object-cover ring-1 ring-[#D4A857]/40 sm:w-[240px]"
    />
  )
}

export default function Work() {
  const { t } = useT()
  return (
    <section id="work" className="py-20 sm:py-28">
      <FadeIn as="h2" className="hero-heading px-5 text-center font-black uppercase leading-none tracking-tight" style={{ fontSize: 'clamp(2.6rem, 10vw, 140px)' }}>
        {t.work.title}
      </FadeIn>
      <FadeIn delay={0.1}><p className="mx-auto mt-6 max-w-xl px-6 text-center font-light leading-relaxed text-sand/80" style={{ fontSize: 'clamp(0.95rem, 1.6vw, 1.2rem)' }}>{t.work.text}</p></FadeIn>
      <div className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 sm:justify-center-safe scrollbar-none">
        {CLIPS.map((c) => <Clip key={c} name={c} />)}
      </div>
    </section>
  )
}
