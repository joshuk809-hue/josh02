import { Instagram, Music2, Star } from 'lucide-react'
import FadeIn from '../components/FadeIn'
import { ContactButton } from '../components/Buttons'
import { useT } from '../i18n'
import { BUSINESS, waLink } from '../config'

export default function Social() {
  const { t } = useT()
  const links = [
    { href: BUSINESS.reviewUrl, label: t.social.review, Icon: Star },
    { href: BUSINESS.instagram, label: t.social.insta, Icon: Instagram },
    { href: BUSINESS.tiktok, label: t.social.tiktok, Icon: Music2 },
  ]
  return (
    <section id="contact" className="px-5 sm:px-8 md:px-10 pt-10 pb-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 rounded-[40px] md:rounded-[60px] border border-[#D4A857]/30 bg-[radial-gradient(ellipse_at_top,rgba(212,168,87,0.14),transparent_60%)] px-6 py-16 md:py-24 text-center">
        <FadeIn as="h2" className="hero-heading font-black uppercase leading-none tracking-tight" style={{ fontSize: 'clamp(2.4rem, 8vw, 110px)' }}>
          {t.social.title}
        </FadeIn>
        <FadeIn delay={0.1}><p className="max-w-xl font-light leading-relaxed text-[#E9D6B0]/80" style={{ fontSize: 'clamp(0.95rem, 1.6vw, 1.2rem)' }}>{t.social.text}</p></FadeIn>
        <FadeIn delay={0.2} className="flex flex-wrap justify-center gap-3">
          {links.map(({ href, label, Icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-[#E9D6B0] px-6 py-3 text-sm font-medium uppercase tracking-widest text-[#E9D6B0] transition-colors duration-200 hover:bg-[#E9D6B0]/10">
              <Icon size={16} aria-hidden /> {label}
            </a>
          ))}
        </FadeIn>
      </div>
      <footer className="mx-auto mt-16 flex max-w-5xl flex-col items-center gap-8">
        <img src="brand/logo-extended.webp" alt="Precious Beauty" loading="lazy" className="w-[260px] sm:w-[320px] rounded-3xl" />
        <ContactButton href={waLink(t.bookGeneric)}>{t.footer.book}</ContactButton>
        <p className="text-xs text-[#E9D6B0]/50">© {new Date().getFullYear()} {BUSINESS.name}. {t.footer.rights}</p>
      </footer>
    </section>
  )
}
