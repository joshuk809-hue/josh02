// Rotating, hovering, glossy logo disc. Motion lives in index.css (.logo-*).
export default function GlossyLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`logo-float ${className}`} style={{ perspective: 900 }}>
      <div className="logo-spin relative">
        <div className="logo-glow relative rounded-full">
          <img src="brand/logo-disc.webp" alt="Precious Beauty logo" className="block w-full rounded-full" draggable={false} />
          <div className="logo-gloss" />
        </div>
      </div>
    </div>
  )
}
