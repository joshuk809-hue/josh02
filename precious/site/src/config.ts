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
  instagram: 'https://www.instagram.com/reel/CvX5zGPtrrW/', // a reel of hers; swap for the profile URL when known
  tiktok: 'https://vm.tiktok.com/ZGdCaPuCt/',
  // Until her Google Business Profile gives a review link ("Ask for reviews" → g.page/r/...), send people to her Maps listing.
  reviewUrl: '',
}

export const waLink = (text: string, phone = BUSINESS.whatsapp) =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${BUSINESS.name}, ${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.city}`)}`

if (!BUSINESS.reviewUrl) BUSINESS.reviewUrl = mapsUrl
