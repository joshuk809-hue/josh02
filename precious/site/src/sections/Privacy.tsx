import { BUSINESS } from '../config'
import { useT } from '../i18n'

// Privacy notice (GDPR art. 13). Italian is the legal text; English for international visitors.
const IT = [
  ['Titolare del trattamento', `${BUSINESS.legalName}, ${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.city} (${BUSINESS.province}), P.IVA ${BUSINESS.vat}, tel. ${BUSINESS.phoneDisplay}.`],
  ['Quali dati', 'Questo sito non usa cookie di profilazione, analytics né moduli di contatto e non raccoglie dati personali. Salva solo la lingua scelta nel tuo browser (localStorage), un dato tecnico che non lascia il tuo dispositivo. I caratteri tipografici sono ospitati su questo sito.'],
  ['WhatsApp', 'Se scrivi tramite i pulsanti WhatsApp, il messaggio passa da WhatsApp (Meta), secondo la sua informativa. Usiamo il tuo numero e i tuoi messaggi solo per gestire appuntamenti e richieste (base giuridica: misure precontrattuali e contratto, art. 6.1.b GDPR). Ricevi promemoria o richieste di recensione solo se hai dato il consenso, e puoi revocarlo in ogni momento rispondendo STOP.'],
  ['Conservazione', 'I dati dei clienti (nome, telefono, appuntamenti, note) sono conservati solo sul dispositivo del salone, per il tempo necessario a gestire i tuoi appuntamenti, e cancellati quando lo chiedi.'],
  ['I tuoi diritti', 'Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità o opporti al trattamento scrivendo al numero sopra. Puoi anche presentare reclamo al Garante per la protezione dei dati personali (garanteprivacy.it).'],
]
const EN = [
  ['Data controller', `${BUSINESS.legalName}, ${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.city} (${BUSINESS.province}), Italy. VAT no. ${BUSINESS.vat}, phone ${BUSINESS.phoneDisplay}.`],
  ['What data', 'This site uses no tracking cookies, analytics or contact forms, and collects no personal data. It only remembers your language choice in your browser (localStorage), which never leaves your device. Fonts are hosted on this site.'],
  ['WhatsApp', "If you message us through the WhatsApp buttons, the message goes through WhatsApp (Meta) under its own privacy policy. We use your number and messages only to handle appointments and questions (legal basis: pre-contract steps and contract, GDPR art. 6.1.b). You only get reminders or review requests if you agreed, and you can stop them at any time by replying STOP."],
  ['How long', "Client details (name, phone, appointments, notes) are kept only on the salon's own device for as long as needed to handle your appointments, and deleted when you ask."],
  ['Your rights', 'You can ask for access, correction, deletion, restriction or portability, or object, by messaging the number above. You can also complain to the Italian data protection authority (garanteprivacy.it).'],
]

export default function Privacy() {
  const { lang } = useT()
  const [title, rows] = lang === 'it' ? ['Informativa privacy', IT] : ['Privacy notice', EN]
  return (
    <div className="min-h-screen bg-[#0C0C0C] px-5 py-16 text-[#E9D6B0]">
      <article className="mx-auto max-w-2xl">
        <a href="#top" className="text-sm text-[#D4A857] hover:underline">← {BUSINESS.name}</a>
        <h1 className="hero-heading mt-6 text-4xl font-black uppercase tracking-tight sm:text-5xl">{title}</h1>
        <div className="mt-10 grid gap-8">
          {rows.map(([h, p]) => (
            <section key={h}>
              <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-[#D4A857]">{h}</h2>
              <p className="font-light leading-relaxed text-[#F3EBDD]/85">{p}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  )
}
