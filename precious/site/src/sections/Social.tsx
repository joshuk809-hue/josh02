import { Instagram, MapPin, MessageCircle, Music2, Star } from 'lucide-react'
import FadeIn from '../components/FadeIn'
import { ContactButton } from '../components/Buttons'
import { useT } from '../i18n'
import { BUSINESS, mapsUrl, waLink } from '../config'

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
      <FadeIn className="mx-auto mt-6 grid max-w-5xl gap-4 sm:grid-cols-2">
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 rounded-[32px] border border-[#D4A857]/30 p-6 transition-colors hover:bg-[#D4A857]/[0.06]">
          <MapPin className="mt-1 shrink-0 text-[#D4A857]" size={22} aria-hidden />
          <span>
            <span className="block text-xs uppercase tracking-widest text-[#D4A857]">{t.visit.title}</span>
            <address className="mt-1 not-italic text-lg text-[#F3EBDD]">{BUSINESS.street}<br />{BUSINESS.postalCode} {BUSINESS.city} ({BUSINESS.province})</address>
            <span className="mt-2 inline-block text-sm text-[#E9D6B0]/70 underline-offset-4 group-hover:underline">{t.visit.directions} →</span>
          </span>
        </a>
        <a href={waLink(t.bookGeneric)} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 rounded-[32px] border border-[#D4A857]/30 p-6 transition-colors hover:bg-[#D4A857]/[0.06]">
          <MessageCircle className="mt-1 shrink-0 text-[#D4A857]" size={22} aria-hidden />
          <span>
            <span className="block text-xs uppercase tracking-widest text-[#D4A857]">{t.visit.call}</span>
            <span className="mt-1 block text-lg tabular-nums text-[#F3EBDD]">{BUSINESS.phoneDisplay}</span>
            <span className="mt-2 inline-block text-sm text-[#E9D6B0]/70 underline-offset-4 group-hover:underline">{t.footer.book} →</span>
          </span>
        </a>
      </FadeIn>
      <footer className="mx-auto mt-16 flex max-w-5xl flex-col items-center gap-8">
        <img src="brand/logo-extended.webp" alt="Precious Beauty" loading="lazy" className="w-[260px] sm:w-[320px] rounded-3xl" />
        <ContactButton href={waLink(t.bookGeneric)}>{t.footer.book}</ContactButton>
        {/* Business identity required on Italian business websites (art. 35 DPR 633/72): name, seat, P.IVA */}
        <p className="max-w-xl text-center text-xs leading-relaxed text-[#E9D6B0]/55">
          © {new Date().getFullYear()} {BUSINESS.legalName} · {BUSINESS.street}, {BUSINESS.postalCode} {BUSINESS.city} ({BUSINESS.province}) · {t.legal.vat} {BUSINESS.vat} ·{' '}
          <span className="tabular-nums">{BUSINESS.phoneDisplay}</span> · <a href="#privacy" className="underline underline-offset-2 hover:text-[#E9D6B0]">{t.legal.privacy}</a> · {t.footer.rights}
        </p>
      </footer>
    </section>
  )
}
