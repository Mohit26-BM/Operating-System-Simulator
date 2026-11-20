import { useEffect, useState } from 'react'
import { HERO_PHOTOS } from '../heroPhotos'

const INTERVAL_MS = 7000

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// A banner of photographs (in a green duotone) that slowly cross-fade behind the hero content.
// - the first photo loads straight away; the others are added a moment later so they never delay the page
// - it stops while the tab is hidden, and shows a single still photo when the system asks for reduced motion
// - a dark gradient keeps the text readable and scanlines give it a console feel
export default function PhotoHero({ children }) {
  const [active, setActive] = useState(0)
  const [more, setMore] = useState(false)
  const [still] = useState(prefersReducedMotion)

  useEffect(() => {
    if (still) return undefined
    const warm = setTimeout(() => setMore(true), 1200)
    return () => clearTimeout(warm)
  }, [still])

  useEffect(() => {
    if (still || !more) return undefined
    const id = setInterval(() => {
      if (!document.hidden) setActive((i) => (i + 1) % HERO_PHOTOS.length)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [still, more])

  const photos = more ? HERO_PHOTOS : HERO_PHOTOS.slice(0, 1)
  const credit = HERO_PHOTOS[active]

  return (
    <section className="scanlines relative overflow-hidden rounded-3xl border border-os-border min-h-[440px] flex items-center bg-os-bg">
      <div className="absolute inset-0" aria-hidden="true">
        {photos.map((p, i) => (
          <img
            key={p.name}
            src={`/images/hero-${p.name}.webp`}
            srcSet={`/images/hero-${p.name}-sm.webp 800w, /images/hero-${p.name}.webp 1600w`}
            sizes="(min-width: 1280px) 1280px, 100vw"
            alt=""
            width="1600"
            height="1066"
            decoding="async"
            fetchpriority={i === 0 ? 'high' : 'low'}
            className={`absolute inset-0 w-full h-full object-cover transition-[opacity,transform] ease-out ${i === active ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
            style={{ transitionDuration: i === active ? '1600ms, 9000ms' : '1600ms, 1600ms' }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-os-bg via-os-bg/80 to-os-bg/25" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-os-bg/90 to-transparent" />
      </div>

      <div className="relative z-10 w-full px-6 sm:px-10 py-10">{children}</div>

      <a
        href={credit.page}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute z-10 right-4 bottom-3 font-mono text-[11px] text-gray-300/80 hover:text-white"
      >
        Photo: {credit.photographer} · Pexels
      </a>
    </section>
  )
}
