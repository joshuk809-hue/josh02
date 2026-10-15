import { lazy, Suspense, useEffect, useState } from 'react'
import Hero from './sections/Hero'
import Marquee from './sections/Marquee'
import About from './sections/About'
import Prices from './sections/Prices'
import Styles from './sections/Styles'
import Social from './sections/Social'
import TapCard from './sections/TapCard'
import Privacy from './sections/Privacy'
import { DICTS, LangCtx, initialLang, type Lang } from './i18n'

// Which app this build is. Unset = the public website only (the studio code is left out of the bundle).
// 'studio' = owner tools only (deployed separately, behind a login). 'all' = both, for local dev and tests.
const APP = import.meta.env.VITE_APP
const Studio = APP === 'studio' || APP === 'all' ? lazy(() => import('./studio/Studio')) : null

export default function App() {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const [route, setRoute] = useState(location.hash)
  useEffect(() => {
    const on = () => setRoute(location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  useEffect(() => { if (['#card', '#privacy', '#studio', '#top'].includes(route)) window.scrollTo(0, 0) }, [route])
  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('lang', l) } catch { /* storage blocked */ }
  }

  if (Studio && (APP === 'studio' || route === '#studio')) return <Suspense fallback={null}><Studio /></Suspense>
  return (
    <LangCtx.Provider value={{ lang, t: DICTS[lang], setLang }}>
      {route === '#card' ? <TapCard /> : route === '#privacy' ? <Privacy /> : (
      <main style={{ overflowX: 'clip', background: '#0C0C0C' }}>
        <Hero />
        <Marquee />
        <About />
        <Prices />
        <Styles />
        <Social />
      </main>
      )}
    </LangCtx.Provider>
  )
}
