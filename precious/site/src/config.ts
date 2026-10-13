// Precious's business details. Replace the placeholders before going live.
export const BUSINESS = {
  name: 'Precious Beauty',
  legalName: 'Precious Beauty di Omoruyi Precious', // ditta individuale, as on the receipt
  vat: '04902180167', // Partita IVA (checksum valid, Bergamo office 016)
  street: 'Via Paleocapa 8/B',
  postalCode: '24122',
  city: 'Bergamo',
  province: 'BG',
  phoneDisplay: '+39 371 578 0893',
  whatsapp: '393715780893', // +39 371 578 0893, international format, digits only
  instagram: 'https://instagram.com/', // her profile URL
  tiktok: 'https://tiktok.com/', // her profile URL
  reviewUrl: 'https://g.page/r/', // her Google review link ("Ask for reviews" in Google Business Profile)
}

export const waLink = (text: string, phone = BUSINESS.whatsapp) =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${BUSINESS.name}, ${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.city}`)}`
