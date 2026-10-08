import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import FadeIn from '../components/FadeIn'
import { STYLES, servicesFor, type Gender } from '../data'
import { useT } from '../i18n'
import { waLink } from '../config'

export default function Prices() {
  const { t } = useT()
  const [g, setG] = useState<Gender>('women')
  const list = servicesFor(g)
  return (
    <section id="prices" className="rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] bg-[#F3EBDD] px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32 text-[#0C0C0C]">
      <FadeIn as="h2" className="mb-10 sm:mb-12 text-center font-black uppercase leading-none tracking-tight" style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}>
        {t.prices.title}
      </FadeIn>

      <div className="mx-auto mb-14 sm:mb-20 flex w-fit rounded-full bg-[#0C0C0C]/[0.06] p-1">
        {(['women', 'men'] as Gender[]).map((k) => (
          <button
            key={k}
            onClick={() => setG(k)}
            aria-pressed={g === k}
            className="relative rounded-full px-7 py-2.5 text-sm sm:text-base font-medium uppercase tracking-widest"
          >
            {g === k && <motion.span layoutId="gender-pill" className="absolute inset-0 rounded-full bg-[#0C0C0C]" transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }} />}
            <span className={`relative transition-colors duration-200 ${g === k ? 'text-[#F2DBA6]' : ''}`}>{t.prices[k]}</span>
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-5xl">
        <AnimatePresence mode="wait">
          <motion.div key={g} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}>
            {list.map((s, i) => {
              const name = t.services[s.id] ?? s.name
              return (
                <a
                  key={s.id}
                  href={waLink(t.bookMsg(name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-5 sm:gap-8 border-b py-6 sm:py-8 md:py-10"
                  style={{ borderColor: 'rgba(12, 12, 12, 0.15)' }}
                >
                  <span className="w-[1.35em] shrink-0 font-black leading-none" style={{ fontSize: 'clamp(2.5rem, 8vw, 110px)' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 font-medium uppercase transition-transform duration-300 group-hover:translate-x-1" style={{ fontSize: 'clamp(1rem, 2.2vw, 2.1rem)' }}>{name}</span>
                  <span className="whitespace-nowrap font-light" style={{ fontSize: 'clamp(1rem, 2.2vw, 2.1rem)' }}>
                    {s.from && <span className="mr-1 text-[0.6em] uppercase opacity-60">{t.prices.from}</span>}
                    {s.price}€
                  </span>
                </a>
              )
            })}
            <h3 className="mt-14 mb-5 font-medium uppercase tracking-widest opacity-60">{t.prices.styles}</h3>
            <div className="flex flex-wrap gap-2">
              {STYLES[g].map((s) => (
                <span key={s} className="rounded-full border border-[#0C0C0C]/20 px-4 py-2 text-sm font-light">{s}</span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        <p className="mt-10 max-w-2xl font-light leading-relaxed opacity-60" style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1.1rem)' }}>{t.prices.note}</p>
      </div>
    </section>
  )
}
