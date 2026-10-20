import { createContext, useContext } from 'react'

export const LANGS = ['it', 'en', 'de', 'fr', 'es'] as const
export type Lang = (typeof LANGS)[number]

const en = {
  nav: { about: 'About', prices: 'Prices', styles: 'Styles', contact: 'Contact' },
  hero: { tagline: 'Hair salon & African braider. Braids, cornrows, locs, cuts and lashes.', cta: 'Book on WhatsApp' },
  about: {
    title: 'About me',
    text: "I'm Precious, a hairstylist and African braider. From knotless braids and twists to cornrows, locs, fades and lashes, every style is done by hand, with care for your hair and scalp. Tell me the look you want and let's create it together!",
  },
  prices: {
    title: 'Prices', women: 'Women', men: 'Men', from: 'from',
    note: 'Final price depends on length, size and style. Send a photo on WhatsApp for an exact quote. All prices are final prices.',
    styles: 'Styles I do',
  },
  styles: {
    title: 'Styles',
    cards: [
      { cat: 'Women', name: 'Braids & twists' },
      { cat: 'Men', name: 'Braids & cornrows' },
      { cat: 'Cuts · Locs · Lashes', name: 'Finishing touches' },
    ],
    book: 'Book this style',
    sample: 'Sample photo',
  },
  work: { title: "My work", text: "Real clients, real styles, straight from my chair in Bergamo." },
  social: {
    title: 'Love your look?',
    text: 'Your review helps other people find me, and every follow keeps you first in line for new styles and openings.',
    review: 'Leave a review', insta: 'Follow on Instagram', tiktok: 'Follow on TikTok',
  },
  visit: { title: 'Visit the salon', directions: 'Get directions', call: 'Call or WhatsApp', hours: 'Mon–Sat 9:00–20:00 · Sun 10:00–20:00' },
  legal: { vat: 'VAT no.', privacy: 'Privacy' },
  footer: { book: 'Book now', rights: 'All rights reserved.' },
  bookMsg: (s: string) => `Hi Precious! I'd like to book: ${s}.`,
  bookGeneric: "Hi Precious! I'd like to book an appointment.",
  services: {
    haircut: 'Haircut', 'kids-haircut': "Children's haircut", 'colour-cut': 'Colouring & haircut', braids: 'Braids',
    lashes: 'Eyelash extensions', shave: 'Shave', wash: 'Hair wash', retouch: 'Hair retouch',
  } as Record<string, string>,
}
export type Dict = typeof en

const it: Dict = {
  nav: { about: 'Chi sono', prices: 'Prezzi', styles: 'Stili', contact: 'Contatti' },
  hero: { tagline: 'Parrucchiera e treccine africane. Trecce, cornrows, locs, tagli e ciglia.', cta: 'Prenota su WhatsApp' },
  about: {
    title: 'Chi sono',
    text: 'Sono Precious, parrucchiera e specialista di trecce africane. Dalle knotless braids e twist alle cornrows, locs, sfumature e ciglia, ogni acconciatura è fatta a mano, con cura per i tuoi capelli e la cute. Dimmi il look che desideri e creiamolo insieme!',
  },
  prices: {
    title: 'Prezzi', women: 'Donna', men: 'Uomo', from: 'da',
    note: 'Il prezzo finale dipende da lunghezza, misura e stile. Mandami una foto su WhatsApp per un preventivo. Tutti i prezzi sono prezzi finali.',
    styles: 'Stili che faccio',
  },
  styles: {
    title: 'Stili',
    cards: [
      { cat: 'Donna', name: 'Trecce e twist' },
      { cat: 'Uomo', name: 'Trecce e cornrows' },
      { cat: 'Tagli · Locs · Ciglia', name: 'Il tocco finale' },
    ],
    book: 'Prenota questo stile',
    sample: 'Foto di esempio',
  },
  work: { title: "I miei lavori", text: "Clienti veri, acconciature vere, direttamente dalla mia poltrona a Bergamo." },
  social: {
    title: 'Ti piace il tuo look?',
    text: 'La tua recensione aiuta altre persone a trovarmi, e seguendomi sarai la prima a vedere nuovi stili e disponibilità.',
    review: 'Lascia una recensione', insta: 'Seguimi su Instagram', tiktok: 'Seguimi su TikTok',
  },
  visit: { title: 'Vieni in salone', directions: 'Indicazioni stradali', call: 'Chiama o scrivi su WhatsApp', hours: 'Lun–Sab 9:00–20:00 · Dom 10:00–20:00' },
  legal: { vat: 'P.IVA', privacy: 'Privacy' },
  footer: { book: 'Prenota ora', rights: 'Tutti i diritti riservati.' },
  bookMsg: (s) => `Ciao Precious! Vorrei prenotare: ${s}.`,
  bookGeneric: 'Ciao Precious! Vorrei prenotare un appuntamento.',
  services: {
    haircut: 'Taglio', 'kids-haircut': 'Taglio bambini', 'colour-cut': 'Colore e taglio', braids: 'Trecce',
    lashes: 'Extension ciglia', shave: 'Rasatura', wash: 'Lavaggio', retouch: 'Ritocco',
  },
}

const de: Dict = {
  nav: { about: 'Über mich', prices: 'Preise', styles: 'Styles', contact: 'Kontakt' },
  hero: { tagline: 'Friseursalon & afrikanische Flechtkunst. Braids, Cornrows, Locs, Schnitte und Wimpern.', cta: 'Per WhatsApp buchen' },
  about: {
    title: 'Über mich',
    text: 'Ich bin Precious, Friseurin und Spezialistin für afrikanische Flechtfrisuren. Von Knotless Braids und Twists bis zu Cornrows, Locs, Fades und Wimpern: Jeder Style wird von Hand gemacht, mit Sorgfalt für Haar und Kopfhaut. Sag mir, welchen Look du willst, und wir kreieren ihn zusammen!',
  },
  prices: {
    title: 'Preise', women: 'Damen', men: 'Herren', from: 'ab',
    note: 'Der Endpreis hängt von Länge, Größe und Style ab. Schick mir ein Foto per WhatsApp für ein genaues Angebot. Alle Preise sind Endpreise.',
    styles: 'Meine Styles',
  },
  styles: {
    title: 'Styles',
    cards: [
      { cat: 'Damen', name: 'Braids & Twists' },
      { cat: 'Herren', name: 'Braids & Cornrows' },
      { cat: 'Schnitte · Locs · Wimpern', name: 'Der letzte Schliff' },
    ],
    book: 'Diesen Style buchen',
    sample: 'Beispielfoto',
  },
  work: { title: "Meine Arbeiten", text: "Echte Kundinnen und Kunden, echte Styles, direkt aus meinem Salon in Bergamo." },
  social: {
    title: 'Liebst du deinen Look?',
    text: 'Deine Bewertung hilft anderen, mich zu finden, und als Follower siehst du neue Styles und freie Termine zuerst.',
    review: 'Bewertung schreiben', insta: 'Auf Instagram folgen', tiktok: 'Auf TikTok folgen',
  },
  visit: { title: 'Besuche den Salon', directions: 'Route planen', call: 'Anrufen oder WhatsApp', hours: 'Mo–Sa 9:00–20:00 · So 10:00–20:00' },
  legal: { vat: 'USt-IdNr.', privacy: 'Datenschutz' },
  footer: { book: 'Jetzt buchen', rights: 'Alle Rechte vorbehalten.' },
  bookMsg: (s) => `Hallo Precious! Ich möchte buchen: ${s}.`,
  bookGeneric: 'Hallo Precious! Ich möchte einen Termin buchen.',
  services: {
    haircut: 'Haarschnitt', 'kids-haircut': 'Kinderhaarschnitt', 'colour-cut': 'Färben & Schnitt', braids: 'Braids',
    lashes: 'Wimpernverlängerung', shave: 'Rasur', wash: 'Haarwäsche', retouch: 'Nachbesserung',
  },
}

const fr: Dict = {
  nav: { about: 'À propos', prices: 'Tarifs', styles: 'Styles', contact: 'Contact' },
  hero: { tagline: 'Salon de coiffure & tresseuse africaine. Tresses, nattes collées, locks, coupes et cils.', cta: 'Réserver sur WhatsApp' },
  about: {
    title: 'À propos',
    text: "Je suis Precious, coiffeuse et tresseuse africaine. Des knotless braids et twists aux nattes collées, locks, dégradés et cils, chaque coiffure est faite à la main, avec soin pour vos cheveux et votre cuir chevelu. Dites-moi le look que vous voulez et créons-le ensemble !",
  },
  prices: {
    title: 'Tarifs', women: 'Femme', men: 'Homme', from: 'dès',
    note: 'Le prix final dépend de la longueur, de la taille et du style. Envoyez une photo sur WhatsApp pour un devis précis. Tous les prix sont des prix finaux.',
    styles: 'Mes styles',
  },
  styles: {
    title: 'Styles',
    cards: [
      { cat: 'Femme', name: 'Tresses & twists' },
      { cat: 'Homme', name: 'Tresses & nattes collées' },
      { cat: 'Coupes · Locks · Cils', name: 'La touche finale' },
    ],
    book: 'Réserver ce style',
    sample: "Photo d'exemple",
  },
  work: { title: "Mes réalisations", text: "De vrais clients, de vraies coiffures, tout droit de mon fauteuil à Bergame." },
  social: {
    title: 'Vous aimez votre look ?',
    text: "Votre avis aide d'autres personnes à me trouver, et en me suivant vous découvrez en premier les nouveaux styles et créneaux.",
    review: 'Laisser un avis', insta: 'Suivre sur Instagram', tiktok: 'Suivre sur TikTok',
  },
  visit: { title: 'Venir au salon', directions: 'Itinéraire', call: 'Appeler ou WhatsApp', hours: 'Lun–Sam 9h00–20h00 · Dim 10h00–20h00' },
  legal: { vat: 'N° TVA', privacy: 'Confidentialité' },
  footer: { book: 'Réserver', rights: 'Tous droits réservés.' },
  bookMsg: (s) => `Bonjour Precious ! Je voudrais réserver : ${s}.`,
  bookGeneric: 'Bonjour Precious ! Je voudrais prendre rendez-vous.',
  services: {
    haircut: 'Coupe', 'kids-haircut': 'Coupe enfant', 'colour-cut': 'Couleur & coupe', braids: 'Tresses',
    lashes: 'Extensions de cils', shave: 'Rasage', wash: 'Shampooing', retouch: 'Retouche',
  },
}

const es: Dict = {
  nav: { about: 'Sobre mí', prices: 'Precios', styles: 'Estilos', contact: 'Contacto' },
  hero: { tagline: 'Peluquería y trenzas africanas. Trenzas, cornrows, locs, cortes y pestañas.', cta: 'Reservar por WhatsApp' },
  about: {
    title: 'Sobre mí',
    text: 'Soy Precious, peluquera y trenzadora africana. Desde knotless braids y twists hasta cornrows, locs, degradados y pestañas, cada peinado se hace a mano, cuidando tu cabello y tu cuero cabelludo. ¡Cuéntame el look que quieres y lo creamos juntos!',
  },
  prices: {
    title: 'Precios', women: 'Mujer', men: 'Hombre', from: 'desde',
    note: 'El precio final depende del largo, el tamaño y el estilo. Envíame una foto por WhatsApp para un presupuesto exacto. Todos los precios son precios finales.',
    styles: 'Estilos que hago',
  },
  styles: {
    title: 'Estilos',
    cards: [
      { cat: 'Mujer', name: 'Trenzas y twists' },
      { cat: 'Hombre', name: 'Trenzas y cornrows' },
      { cat: 'Cortes · Locs · Pestañas', name: 'El toque final' },
    ],
    book: 'Reservar este estilo',
    sample: 'Foto de ejemplo',
  },
  work: { title: "Mis trabajos", text: "Clientes reales, peinados reales, directamente desde mi sillón en Bérgamo." },
  social: {
    title: '¿Te encanta tu look?',
    text: 'Tu reseña ayuda a otras personas a encontrarme, y si me sigues verás primero los nuevos estilos y huecos libres.',
    review: 'Dejar una reseña', insta: 'Seguir en Instagram', tiktok: 'Seguir en TikTok',
  },
  visit: { title: 'Visita el salón', directions: 'Cómo llegar', call: 'Llamar o WhatsApp', hours: 'Lun–Sáb 9:00–20:00 · Dom 10:00–20:00' },
  legal: { vat: 'NIF-IVA', privacy: 'Privacidad' },
  footer: { book: 'Reservar', rights: 'Todos los derechos reservados.' },
  bookMsg: (s) => `¡Hola Precious! Quiero reservar: ${s}.`,
  bookGeneric: '¡Hola Precious! Quiero pedir una cita.',
  services: {
    haircut: 'Corte', 'kids-haircut': 'Corte infantil', 'colour-cut': 'Color y corte', braids: 'Trenzas',
    lashes: 'Extensiones de pestañas', shave: 'Afeitado', wash: 'Lavado', retouch: 'Retoque',
  },
}

export const DICTS: Record<Lang, Dict> = { it, en, de, fr, es }

export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved && LANGS.includes(saved)) return saved
  } catch { /* storage blocked */ }
  const nav = navigator.language.slice(0, 2) as Lang
  return LANGS.includes(nav) ? nav : 'it'
}

export const LangCtx = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({
  lang: 'it', t: it, setLang: () => {},
})
export const useT = () => useContext(LangCtx)
