import { useEffect, useState } from 'react'
import Hero from './sections/Hero'
import Marquee from './sections/Marquee'
import About from './sections/About'
import Prices from './sections/Prices'
import Styles from './sections/Styles'
import Social from './sections/Social'
import Studio from './studio/Studio'
import { DICTS, LangCtx, initialLang, type Lang } from './i18n'

export default function App() {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const [route, setRoute] = useState(location.hash)
  useEffect(() => {
    const on = () => setRoute(location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('lang', l) } catch { /* storage blocked */ }
  }

  if (route === '#studio') return <Studio />
  return (
    <LangCtx.Provider value={{ lang, t: DICTS[lang], setLang }}>
      <main style={{ overflowX: 'clip', background: '#0C0C0C' }}>
        <Hero />
        <Marquee />
        <About />
        <Prices />
        <Styles />
        <Social />
      </main>
    </LangCtx.Provider>
  )
}
