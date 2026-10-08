import FadeIn from '../components/FadeIn'
import AnimatedText from '../components/AnimatedText'
import { ContactButton } from '../components/Buttons'
import { byFile } from '../data'
import { useT } from '../i18n'
import { waLink } from '../config'

const corners = [
  { f: 'knotless-copper', cls: 'top-[4%] left-[1%] sm:left-[2%] md:left-[4%] w-[110px] sm:w-[150px] md:w-[190px]', d: 0.1, x: -80 },
  { f: 'cornrow-man-bun', cls: 'bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%] w-[95px] sm:w-[130px] md:w-[165px]', d: 0.25, x: -80 },
  { f: 'boho-bob-braids', cls: 'top-[4%] right-[1%] sm:right-[2%] md:right-[4%] w-[110px] sm:w-[150px] md:w-[190px]', d: 0.15, x: 80 },
  { f: 'star-cornrows', cls: 'bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%] w-[120px] sm:w-[155px] md:w-[200px]', d: 0.3, x: 80 },
]

export default function About() {
  const { t } = useT()
  return (
    <section id="about" className="relative flex min-h-screen flex-col items-center justify-center gap-16 sm:gap-20 md:gap-24 overflow-hidden px-5 sm:px-8 md:px-10 py-20">
      {corners.map((c) => {
        const g = byFile(c.f)
        return (
          <FadeIn key={c.f} delay={c.d} x={c.x} y={0} duration={0.9} className={`absolute ${c.cls} opacity-70 md:opacity-100`}>
            <img src={g.src} alt={g.title} loading="lazy" className="aspect-square w-full rounded-full object-cover ring-2 ring-[#D4A857]/60" />
          </FadeIn>
        )
      })}
      <div className="relative z-10 flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
        <FadeIn as="h2" delay={0} y={40} className="hero-heading text-center font-black uppercase leading-none tracking-tight" style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}>
          {t.about.title}
        </FadeIn>
        <AnimatedText text={t.about.text} className="max-w-[560px] text-center font-medium leading-relaxed text-[#E9D6B0]" style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }} />
      </div>
      <FadeIn className="relative z-10"><ContactButton href={waLink(t.bookGeneric)}>{t.hero.cta}</ContactButton></FadeIn>
    </section>
  )
}
