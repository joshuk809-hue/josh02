import { MapPin, MessageCircle, UserPlus, Sparkles } from 'lucide-react'
import FadeIn from '../components/FadeIn'
import GlossyLogo from '../components/GlossyLogo'
import { BUSINESS, mapsUrl, waLink } from '../config'
import { useT, type Lang } from '../i18n'

// Opened by tapping the NFC business card (or scanning its QR code): save the contact, then ask for info.
const COPY: Record<Lang, { save: string; ask: string; site: string; hint: string; msg: string }> = {
  it: { save: 'Salva contatto', ask: 'Chiedi info su WhatsApp', site: 'Prezzi e stili', hint: 'Salva il contatto, poi scrivimi: il messaggio è già pronto.', msg: 'Ciao Precious! Ho il tuo biglietto da visita e vorrei più informazioni su servizi, prezzi e disponibilità.' },
  en: { save: 'Save contact', ask: 'Ask for info on WhatsApp', site: 'Prices & styles', hint: 'Save my contact, then message me: the text is already written for you.', msg: "Hi Precious! I have your business card and I'd like more info about your services, prices and availability." },
  de: { save: 'Kontakt speichern', ask: 'Infos per WhatsApp', site: 'Preise & Styles', hint: 'Speichere meinen Kontakt und schreib mir: Die Nachricht ist schon fertig.', msg: 'Hallo Precious! Ich habe deine Visitenkarte und hätte gern mehr Infos zu Leistungen, Preisen und freien Terminen.' },
  fr: { save: 'Enregistrer le contact', ask: 'Infos sur WhatsApp', site: 'Tarifs & styles', hint: 'Enregistrez mon contact, puis écrivez-moi : le message est déjà prêt.', msg: "Bonjour Precious ! J'ai votre carte de visite et j'aimerais plus d'infos sur vos services, tarifs et disponibilités." },
  es: { save: 'Guardar contacto', ask: 'Pedir info por WhatsApp', site: 'Precios y estilos', hint: 'Guarda mi contacto y escríbeme: el mensaje ya está listo.', msg: '¡Hola Precious! Tengo tu tarjeta de visita y me gustaría más información sobre servicios, precios y disponibilidad.' },
}

export default function TapCard() {
  const { lang } = useT()
  const c = COPY[lang]
  const pill = 'flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-medium uppercase tracking-widest transition-transform duration-150 active:scale-[0.98]'
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0C0C0C] px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <FadeIn y={20} className="w-56"><GlossyLogo /></FadeIn>
        <FadeIn delay={0.1} y={14}>
          <h1 className="hero-heading text-4xl font-black uppercase tracking-tight">{BUSINESS.name}</h1>
          <p className="mt-2 font-light text-[#E9D6B0]/80">{c.hint}</p>
        </FadeIn>
        <FadeIn delay={0.2} y={14} className="flex w-full flex-col gap-3">
          <a
            href={waLink(c.msg)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${pill} text-[#1A1206]`}
            style={{ background: 'linear-gradient(123deg, #6B4A16 7%, #D4A857 37%, #F2DBA6 72%, #A9772E 100%)', boxShadow: '4px 4px 12px #8A6224 inset' }}
          >
            <MessageCircle size={18} aria-hidden /> {c.ask}
          </a>
          <a href="precious.vcf" download="Precious Beauty.vcf" className={`${pill} border-2 border-[#E9D6B0] text-[#E9D6B0]`}>
            <UserPlus size={18} aria-hidden /> {c.save}
          </a>
          <a href="#top" className={`${pill} text-[#E9D6B0]/80`}>
            <Sparkles size={18} aria-hidden /> {c.site}
          </a>
        </FadeIn>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-light text-[#E9D6B0]/70 hover:text-[#E9D6B0]">
          <MapPin size={15} aria-hidden /> {BUSINESS.street}, {BUSINESS.city}
        </a>
        <p className="-mt-5 select-all font-light tabular-nums tracking-wider text-[#E9D6B0]/60">{BUSINESS.phoneDisplay}</p>
      </div>
    </div>
  )
}
