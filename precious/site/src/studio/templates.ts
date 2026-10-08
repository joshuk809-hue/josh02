import type { Lang } from '../i18n'
import type { FollowKind } from './store'
import { BUSINESS } from '../config'

type T = (name: string, service: string) => string

// Short, personal, one clear ask each, with an easy way to opt out. No spammy emoji walls.
export const FOLLOW: Record<Lang, Record<FollowKind, T>> = {
  en: {
    thanks: (n) => `Hi ${n}, thank you for coming in! I hope you love your new look. If you have a minute, a quick review would mean a lot to me: ${BUSINESS.reviewUrl}\nAnd tag me on Instagram if you post it: ${BUSINESS.instagram} 💛\n— Precious`,
    rebook: (n, s) => `Hi ${n}! It's been a few weeks since your ${s}. Want me to save you a spot this week or next? Just reply with a day that suits you.\n— Precious\n(Reply STOP if you'd rather not get reminders.)`,
    winback: (n) => `Hi ${n}, it's Precious! It's been a while and I'd love to see you again. I've got new styles to show you; reply anytime if you'd like to book.\n(Reply STOP to stop these messages.)`,
  },
  it: {
    thanks: (n) => `Ciao ${n}, grazie per la visita! Spero che il tuo nuovo look ti piaccia. Se hai un minuto, una recensione per me vale tantissimo: ${BUSINESS.reviewUrl}\nE taggami su Instagram se pubblichi una foto: ${BUSINESS.instagram} 💛\n— Precious`,
    rebook: (n, s) => `Ciao ${n}! Sono passate alcune settimane dal tuo ${s}. Vuoi che ti tenga un posto questa settimana o la prossima? Rispondi con il giorno che preferisci.\n— Precious\n(Rispondi STOP se non vuoi più promemoria.)`,
    winback: (n) => `Ciao ${n}, sono Precious! È passato un po' di tempo e mi farebbe piacere rivederti. Ho nuovi stili da mostrarti; scrivimi quando vuoi prenotare.\n(Rispondi STOP per non ricevere più messaggi.)`,
  },
  de: {
    thanks: (n) => `Hallo ${n}, danke für deinen Besuch! Ich hoffe, du liebst deinen neuen Look. Wenn du eine Minute hast, würde mir eine kurze Bewertung sehr helfen: ${BUSINESS.reviewUrl}\nUnd markier mich auf Instagram, wenn du ein Foto postest: ${BUSINESS.instagram} 💛\n— Precious`,
    rebook: (n, s) => `Hallo ${n}! Dein ${s} ist schon ein paar Wochen her. Soll ich dir diese oder nächste Woche einen Termin freihalten? Antworte einfach mit einem passenden Tag.\n— Precious\n(Antworte STOP, wenn du keine Erinnerungen möchtest.)`,
    winback: (n) => `Hallo ${n}, hier ist Precious! Es ist eine Weile her und ich würde mich freuen, dich wiederzusehen. Ich habe neue Styles; schreib mir jederzeit für einen Termin.\n(Antworte STOP, um keine Nachrichten mehr zu bekommen.)`,
  },
  fr: {
    thanks: (n) => `Bonjour ${n}, merci pour votre visite ! J'espère que vous adorez votre nouveau look. Si vous avez une minute, un petit avis m'aiderait beaucoup : ${BUSINESS.reviewUrl}\nEt identifiez-moi sur Instagram si vous publiez une photo : ${BUSINESS.instagram} 💛\n— Precious`,
    rebook: (n, s) => `Bonjour ${n} ! Cela fait quelques semaines depuis votre ${s}. Voulez-vous que je vous réserve une place cette semaine ou la prochaine ? Répondez simplement avec le jour qui vous convient.\n— Precious\n(Répondez STOP si vous ne souhaitez plus de rappels.)`,
    winback: (n) => `Bonjour ${n}, c'est Precious ! Cela fait un moment et j'aimerais beaucoup vous revoir. J'ai de nouveaux styles à vous montrer ; écrivez-moi quand vous voulez réserver.\n(Répondez STOP pour ne plus recevoir de messages.)`,
  },
  es: {
    thanks: (n) => `¡Hola ${n}, gracias por venir! Espero que te encante tu nuevo look. Si tienes un minuto, una reseña me ayudaría muchísimo: ${BUSINESS.reviewUrl}\nY etiquétame en Instagram si subes una foto: ${BUSINESS.instagram} 💛\n— Precious`,
    rebook: (n, s) => `¡Hola ${n}! Han pasado unas semanas desde tu ${s}. ¿Quieres que te guarde un hueco esta semana o la próxima? Respóndeme con el día que mejor te venga.\n— Precious\n(Responde STOP si prefieres no recibir recordatorios.)`,
    winback: (n) => `¡Hola ${n}, soy Precious! Hace tiempo que no te veo y me encantaría verte de nuevo. Tengo estilos nuevos; escríbeme cuando quieras reservar.\n(Responde STOP para no recibir más mensajes.)`,
  },
}

// For WhatsApp Business: Settings → Business tools → Greeting message / Away message.
export const AUTO_REPLIES: { title: string; text: string }[] = [
  {
    title: 'Away message (when you are busy or closed)',
    text: [
      "Hi! 🇬🇧 I'm with a client right now and will reply as soon as I can. To book, send the style, a photo and your preferred day.",
      'Ciao! 🇮🇹 Sono con una cliente e ti rispondo appena possibile. Per prenotare manda lo stile, una foto e il giorno che preferisci.',
      'Hallo! 🇩🇪 Ich bin gerade bei einer Kundin und antworte so schnell wie möglich. Zum Buchen schick den Style, ein Foto und deinen Wunschtag.',
      'Bonjour ! 🇫🇷 Je suis avec une cliente et je réponds dès que possible. Pour réserver, envoyez le style, une photo et le jour souhaité.',
      '¡Hola! 🇪🇸 Estoy con una clienta y te respondo lo antes posible. Para reservar envía el estilo, una foto y el día que prefieras.',
    ].join('\n\n'),
  },
  {
    title: 'Greeting message (first message from a new contact)',
    text: [
      'Welcome to Precious Beauty 💛 Braids, cornrows, locs, cuts & lashes.',
      'Prices: haircut 15€ · kids 10€ · braids from 25€ · colour & cut from 25€ · lashes from 20€ · shave 7€ · wash 7€ · retouch 15€.',
      'Send me a photo of the style you want and your preferred day, and I will confirm your appointment.',
    ].join('\n'),
  },
]

export const CONFIRM: Record<Lang, (name: string, when: string, service: string) => string> = {
  en: (n, w, s) => `Hi ${n}, your appointment for ${s} is confirmed: ${w}. See you soon!\n— Precious`,
  it: (n, w, s) => `Ciao ${n}, il tuo appuntamento per ${s} è confermato: ${w}. A presto!\n— Precious`,
  de: (n, w, s) => `Hallo ${n}, dein Termin für ${s} ist bestätigt: ${w}. Bis bald!\n— Precious`,
  fr: (n, w, s) => `Bonjour ${n}, votre rendez-vous pour ${s} est confirmé : ${w}. À bientôt !\n— Precious`,
  es: (n, w, s) => `¡Hola ${n}! Tu cita para ${s} está confirmada: ${w}. ¡Hasta pronto!\n— Precious`,
}
