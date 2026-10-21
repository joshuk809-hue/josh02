import { BUSINESS } from '../config'
import { useT } from '../i18n'

// Privacy notice (GDPR art. 13). Italian is the legal text; English for international visitors.
// Last updated: shown to visitors so they know which version applies.
const UPDATED = '15/10/2026'
const IT = [
  ['Titolare del trattamento', `${BUSINESS.legalName}, ${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.city} (${BUSINESS.province}), P.IVA ${BUSINESS.vat}, tel. ${BUSINESS.phoneDisplay}.`],
  ['Quali dati', 'Questo sito non usa cookie, analytics, pubblicità né moduli di contatto. Salva solo la lingua scelta nel tuo browser (localStorage), un dato tecnico che non lascia il tuo dispositivo e non richiede consenso. I caratteri tipografici sono ospitati su questo sito.'],
  ['Hosting', 'Il sito è ospitato da Cloudflare, Inc. (USA), che come ogni server registra per motivi di sicurezza dati tecnici delle visite (indirizzo IP, browser, pagina, orario) e li conserva per breve tempo. Cloudflare agisce come responsabile del trattamento in base al proprio Data Processing Addendum ed è certificata EU-US Data Privacy Framework (base giuridica: legittimo interesse alla sicurezza del sito, art. 6.1.f GDPR).'],
  ['Link esterni', 'I pulsanti WhatsApp, Google Maps, Instagram, TikTok e Google Recensioni aprono servizi di terzi solo quando li tocchi; da quel momento valgono le loro informative.'],
  ['WhatsApp', 'Se scrivi tramite i pulsanti WhatsApp, il messaggio passa da WhatsApp (Meta), secondo la sua informativa. Usiamo il tuo numero e i tuoi messaggi solo per gestire appuntamenti e richieste (base giuridica: misure precontrattuali e contratto, art. 6.1.b GDPR). Ricevi promemoria o richieste di recensione solo se hai dato il consenso, e puoi revocarlo in ogni momento rispondendo STOP.'],
  ['Conservazione', 'Foto dei lavori: pubblichiamo foto di clienti solo con il loro consenso scritto, revocabile in ogni momento. I dati dei clienti (nome, telefono, appuntamenti, note) sono conservati solo sul dispositivo del salone, per il tempo necessario a gestire i tuoi appuntamenti, e cancellati quando lo chiedi.'],
  ['I tuoi diritti', 'Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità o opporti al trattamento scrivendo al numero sopra. Puoi anche presentare reclamo al Garante per la protezione dei dati personali (garanteprivacy.it).'],
]
const EN = [
  ['Data controller', `${BUSINESS.legalName}, ${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.city} (${BUSINESS.province}), Italy. VAT no. ${BUSINESS.vat}, phone ${BUSINESS.phoneDisplay}.`],
  ['What data', 'This site uses no cookies, analytics, ads or contact forms. It only remembers your language choice in your browser (localStorage), which never leaves your device and needs no consent. Fonts are hosted on this site.'],
  ['Hosting', "The site is hosted by Cloudflare, Inc. (USA). Like every web server, it logs technical visit data (IP address, browser, page, time) for security and keeps it for a short time. Cloudflare acts as data processor under its Data Processing Addendum and is certified under the EU-US Data Privacy Framework (legal basis: legitimate interest in site security, GDPR art. 6.1.f)."],
  ['External links', 'The WhatsApp, Google Maps, Instagram, TikTok and Google Reviews buttons open third-party services only when you tap them; their own privacy policies apply from then on.'],
  ['WhatsApp', "If you message us through the WhatsApp buttons, the message goes through WhatsApp (Meta) under its own privacy policy. We use your number and messages only to handle appointments and questions (legal basis: pre-contract steps and contract, GDPR art. 6.1.b). You only get reminders or review requests if you agreed, and you can stop them at any time by replying STOP."],
  ['How long', "Photos of our work: we only publish photos of clients with their written consent, which they can withdraw at any time. Client details (name, phone, appointments, notes) are kept only on the salon's own device for as long as needed to handle your appointments, and deleted when you ask."],
  ['Your rights', 'You can ask for access, correction, deletion, restriction or portability, or object, by messaging the number above. You can also complain to the Italian data protection authority (garanteprivacy.it).'],
]

export default function Privacy() {
  const { lang } = useT()
  const [title, rows] = lang === 'it' ? ['Informativa privacy', IT] : ['Privacy notice', EN]
  return (
    <div className="min-h-screen bg-ink px-5 py-16 text-sand">
      <article className="mx-auto max-w-2xl">
        <a href="#top" className="text-sm text-gold hover:underline">← {BUSINESS.name}</a>
        <h1 className="hero-heading mt-6 text-4xl font-black uppercase tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-sand/60">{lang === 'it' ? 'Ultimo aggiornamento' : 'Last updated'}: {UPDATED}</p>
        <div className="mt-10 grid gap-8">
          {rows.map(([h, p]) => (
            <section key={h}>
              <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-gold">{h}</h2>
              <p className="font-light leading-relaxed text-cream/85">{p}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  )
}
