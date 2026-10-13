// Precious's business details. Replace the placeholders before going live.
export const BUSINESS = {
  name: 'Precious Beauty',
  whatsapp: '393715780893', // +39 371 578 0893, international format, digits only
  instagram: 'https://instagram.com/', // her profile URL
  tiktok: 'https://tiktok.com/', // her profile URL
  reviewUrl: 'https://g.page/r/', // her Google review link ("Ask for reviews" in Google Business Profile)
  address: '',
}

export const waLink = (text: string, phone = BUSINESS.whatsapp) =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
