import servicesJson from './services.json'
import galleryJson from './gallery.json'

export type Gender = 'women' | 'men'
export type Service = { id: string; name: string; price: number; from?: boolean; for: string[] }
export type GalleryItem = { src: string; title: string; for: Gender; own: boolean }

export const SERVICES = servicesJson.services as Service[]
export const STYLES = servicesJson.styles as Record<Gender, string[]>
export const GALLERY = galleryJson.items as GalleryItem[]

export const byFile = (name: string) => GALLERY.find((g) => g.src.endsWith(name + '.webp'))!
export const servicesFor = (g: Gender) => SERVICES.filter((s) => s.for.includes(g) || (g === 'women' && s.for.includes('kids')))
