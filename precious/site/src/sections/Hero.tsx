import FadeIn from '../components/FadeIn'
import Magnet from '../components/Magnet'
import GlossyLogo from '../components/GlossyLogo'
import { ContactButton } from '../components/Buttons'
import { LANGS, useT } from '../i18n'
import { waLink } from '../config'

export default function Hero() {
  const { t, lang, setLang } = useT()
  const links = [
    ['#about', t.nav.about], ['#prices', t.nav.prices], ['#styles', t.nav.styles], ['#contact', t.nav.contact],
  ]
  return (
    <section className="relative flex h-screen min-h-[600px] flex-col" style={{ overflowX: 'clip' }}>
      <FadeIn as="nav" delay={0} y={-20} className="flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8">
        {links.map(([href, label]) => (
          <a key={href} href={href} className="text-sm md:text-lg lg:text-[1.4rem] font-medium uppercase tracking-wider text-[#E9D6B0] transition-opacity duration-200 hover:opacity-70">
            {label}
          </a>
        ))}
      </FadeIn>

      <FadeIn delay={0.05} y={-10} className="flex justify-end gap-1 px-6 md:px-10 pt-3">
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`rounded-full px-2.5 py-1 text-[11px] sm:text-xs uppercase tracking-widest transition-colors duration-200 ${lang === l ? 'bg-[#D4A857] text-[#1A1206]' : 'text-[#E9D6B0]/70 hover:text-[#E9D6B0]'}`}
          >
            {l}
          </button>
        ))}
      </FadeIn>

      <div className="overflow-hidden">
        <FadeIn as="h1" delay={0.15} y={40} className="hero-heading w-full whitespace-nowrap text-center font-black uppercase leading-none tracking-tight text-[19vw] sm:text-[19.5vw] md:text-[20vw] mt-4 sm:mt-2 md:-mt-3">
          Precious
        </FadeIn>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 px-6 md:px-10 pb-7 sm:pb-8 md:pb-10">
        <FadeIn delay={0.35} y={20}>
          <p className="max-w-[160px] sm:max-w-[220px] md:max-w-[280px] font-light uppercase leading-snug tracking-wide text-[#E9D6B0]" style={{ fontSize: 'clamp(0.75rem, 1.4vw, 1.4rem)' }}>
            {t.hero.tagline}
          </p>
        </FadeIn>
        <FadeIn delay={0.5} y={20} className="relative z-20">
          <ContactButton href={waLink(t.bookGeneric)}>{t.hero.cta}</ContactButton>
        </FadeIn>
      </div>

      {/* Positioning lives on a plain div: FadeIn's transform would override the centring translate */}
      <div className="absolute left-1/2 top-1/2 z-10 w-[260px] -translate-x-1/2 -translate-y-1/2 sm:top-auto sm:bottom-6 sm:translate-y-0 sm:w-[320px] md:w-[380px] lg:w-[440px]">
        <FadeIn delay={0.6} y={30}>
          <Magnet padding={150} strength={3}>
            <GlossyLogo />
          </Magnet>
        </FadeIn>
      </div>
    </section>
  )
}
