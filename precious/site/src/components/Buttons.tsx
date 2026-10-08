import type { ReactNode } from 'react'

export function ContactButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded-full px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm md:text-base font-medium uppercase tracking-widest text-[#1A1206] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
      style={{
        background: 'linear-gradient(123deg, #6B4A16 7%, #D4A857 37%, #F2DBA6 72%, #A9772E 100%)',
        boxShadow: '0px 4px 4px rgba(212, 168, 87, 0.25), 4px 4px 12px #8A6224 inset',
        outline: '2px solid #F3EBDD',
        outlineOffset: '-3px',
      }}
    >
      {children}
    </a>
  )
}

export function GhostButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded-full border-2 border-[#E9D6B0] px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base font-medium uppercase tracking-widest text-[#E9D6B0] transition-colors duration-200 hover:bg-[#E9D6B0]/10"
    >
      {children}
    </a>
  )
}
