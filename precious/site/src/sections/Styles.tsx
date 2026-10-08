import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import FadeIn from '../components/FadeIn'
import { GhostButton } from '../components/Buttons'
import { byFile, type GalleryItem } from '../data'
import { useT } from '../i18n'
import { waLink } from '../config'

const CARDS = [
  ['knotless-copper', 'boho-bob-braids', 'jumbo-knotless-beads'],
  ['triangle-plaits-beads', 'cornrow-man-bun', 'stitch-cornrows'],
  ['tapered-cut-design', 'lashes', 'interlocked-locs'],
].map((c) => c.map(byFile))

function Img({ g, h, sample }: { g: GalleryItem; h?: string; sample: string }) {
  return (
    <div className="relative overflow-hidden rounded-[40px] sm:rounded-[50px] md:rounded-[60px]" style={h ? { height: h } : { height: '100%' }}>
      <img src={g.src} alt={g.title} loading="lazy" className="h-full w-full object-cover" />
      {!g.own && <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3 py-1 text-[10px] uppercase tracking-widest text-white/80">{sample}</span>}
    </div>
  )
}

function Card({ i, total, progress }: { i: number; total: number; progress: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const { t } = useT()
  const meta = t.styles.cards[i]
  const [a, b, c] = CARDS[i]
  const target = 1 - (total - 1 - i) * 0.03
  const scale = useTransform(progress, [i / total, 1], [1, target])
  return (
    <div className="sticky top-24 md:top-32 flex h-[85vh] items-start justify-center">
      <motion.div
        className="w-full rounded-[40px] sm:rounded-[50px] md:rounded-[60px] border-2 border-[#E9D6B0] bg-[#0C0C0C] p-4 sm:p-6 md:p-8"
        style={{ scale, top: `${i * 28}px`, position: 'relative', transformOrigin: 'top center' }}
      >
        <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="hero-heading font-black leading-none" style={{ fontSize: 'clamp(2.5rem, 8vw, 110px)' }}>{String(i + 1).padStart(2, '0')}</span>
          <div className="flex-1">
            <p className="text-xs sm:text-sm uppercase tracking-widest text-[#D4A857]">{meta.cat}</p>
            <h3 className="font-medium uppercase text-[#F3EBDD]" style={{ fontSize: 'clamp(1rem, 2.2vw, 2.1rem)' }}>{meta.name}</h3>
          </div>
          <GhostButton href={waLink(t.bookMsg(meta.name))}>{t.styles.book}</GhostButton>
        </div>
        <div className="flex gap-3 sm:gap-4">
          <div className="flex w-[40%] flex-col gap-3 sm:gap-4">
            <Img g={a} h="clamp(130px, 16vw, 230px)" sample={t.styles.sample} />
            <Img g={b} h="clamp(160px, 22vw, 340px)" sample={t.styles.sample} />
          </div>
          <div className="w-[60%]"><Img g={c} sample={t.styles.sample} /></div>
        </div>
      </motion.div>
    </div>
  )
}

export default function Styles() {
  const { t } = useT()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  return (
    <section id="styles" className="relative z-10 -mt-10 sm:-mt-12 md:-mt-14 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] bg-[#0C0C0C] px-4 sm:px-8 md:px-10 pt-20 sm:pt-24 md:pt-32 pb-32 sm:pb-40">
      <FadeIn as="h2" className="hero-heading mb-10 text-center font-black uppercase leading-none tracking-tight" style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}>
        {t.styles.title}
      </FadeIn>
      <div ref={ref} className="mx-auto max-w-6xl">
        {CARDS.map((_, i) => <Card key={i} i={i} total={CARDS.length} progress={scrollYProgress} />)}
      </div>
    </section>
  )
}
