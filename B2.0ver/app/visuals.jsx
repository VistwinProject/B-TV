import { useEffect, useRef, useState } from 'react'
import Beam from './editor/Beam.jsx'
import AnimatedIcon from './AnimatedIcon.jsx'

export const mediaURL = path => `${import.meta.env.BASE_URL}${path}`

export function Symbol({ name, className = '', animated = false, kelvin, lightMode }) {
  if (animated) return <AnimatedIcon name={name} className={className} kelvin={kelvin} lightMode={lightMode} />
  const shapes = {
    air: <><path d="M4 12h20c9 0 7-10 1-10-4 0-6 3-6 6M4 20h29c9 0 9 13 1 13-4 0-6-3-6-6M4 27h12c7 0 7 10 1 10-3 0-5-2-5-5" /></>,
    light: <><path d="M15 29c0-7-7-7-7-15a12 12 0 0 1 24 0c0 8-7 8-7 15zM15 34h10m-8 5h6" /></>,
    temp: <><path d="M17 25V7a5 5 0 0 1 10 0v18a9 9 0 1 1-10 0Z" /><path d="M22 10v20" /><circle cx="22" cy="32" r="3" /></>,
    humid: <path d="M22 2C17 12 7 21 7 29a15 15 0 0 0 30 0c0-8-10-17-15-27Z" />,
    sound: <path d="M5 19v7M12 12v21M19 5v34M26 10v24M33 16v12M40 20v5" />,
    cloud: <path d="M11 33a9 9 0 0 1-2-18A13 13 0 0 1 33 13a10 10 0 0 1 0 20Z" />,
    co2: <><circle cx="22" cy="22" r="17" /><circle cx="16" cy="20" r="1" /><path d="M28 15a8 8 0 0 0 0 14" /></>,
    weather: <><circle cx="17" cy="16" r="7" /><path d="M17 1v4m0 22v4M2 16h4m22 0h4M6 5l3 3m16 16 3 3M6 27l3-3M25 8l3-3M24 38a7 7 0 0 1-2-13 9 9 0 0 1 16 2c8 1 8 11 1 11Z" /></>,
    gauge: <><path d="M4 35a19 19 0 1 1 36 0M22 29l10-13" /><circle cx="22" cy="29" r="2" /></>,
  }
  return <svg className={`symbol ${className}`} viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name] || shapes.light}</svg>
}

export function PersonSymbol({ id, animated = false }) {
  const crop = { 'anti-aging': [470,0,172,169], child: [929,3,179,170], elder: [1405,4,181,168], pregnancy: [0,1,165,169], nomad: [1873,0,178,168] }[id]
  return <svg className={`person-symbol${animated ? ' person-symbol--animated' : ''}`} viewBox={crop.join(' ')} aria-hidden="true"><g><image href={mediaURL('icons/personas.png')} width="2051" height="173" /></g></svg>
}

export function NumberText({ value, duration = 1300 }) {
  const element = useRef(null)
  const numeric = /^\d+(\.\d+)?(?:\s*[–—-]\s*\d+(\.\d+)?)?$/.test(String(value))
  useEffect(() => {
    if (!numeric) return
    let frame, cancelled = false
    const parts = String(value).split(/(\d+(?:\.\d+)?)/).map(part => {
      if (!/^\d/.test(part)) return part
      const digits = part.split('.')[1]?.length || 0
      return { target: Number(part), format: new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false }) }
    })
    const start = performance.now()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || !!element.current?.closest('[aria-hidden="true"]')
    const paint = now => {
      if (cancelled || !element.current) return
      const fraction = reduce ? 1 : Math.min(1, (now - start) / duration)
      element.current.textContent = parts.map(part => typeof part === 'string' ? part : part.format.format(part.target * (1 - (1 - fraction) ** 4))).join('')
      if (fraction < 1) frame = requestAnimationFrame(paint)
    }
    frame = requestAnimationFrame(paint)
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [value, duration, numeric])
  return <span ref={element}>{numeric ? String(value).replace(/\d+(?:\.\d+)?/g, '0') : value}</span>
}

export function Film({ photo, label = '你的未來居家' }) {
  const video = useRef(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const resume = () => { if (document.visibilityState === 'visible') video.current?.play().catch(() => {}) }
    document.addEventListener('visibilitychange', resume)
    return () => document.removeEventListener('visibilitychange', resume)
  }, [])
  return <div className="film">
    {!failed && (photo ? <img src={mediaURL(photo)} alt={label} onError={() => setFailed(true)} />
      : <video ref={video} src={mediaURL('video/house-tour.mp4')} autoPlay muted loop playsInline preload="auto" onError={() => setFailed(true)} />)}
    {failed && <span className="film-error">影像暫時無法播放</span>}
    <div className="film-caption"><b>{label}</b><span>WALKTHROUGH</span></div>
  </div>
}

export function Voice({ analyser }) {
  const wrapper = useRef(null)
  useEffect(() => {
    let frame
    const values = new Uint8Array(128)
    const update = () => {
      const source = analyser?.current
      if (source && wrapper.current) {
        source.getByteFrequencyData(values)
        for (const [index, bar] of [...wrapper.current.children].entries()) {
          bar.style.animation = 'none'
          bar.style.transform = `scaleY(${.08 + values[Math.floor(index * 1.8)] / 280})`
        }
      }
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [analyser])
  return <div className="voice" ref={wrapper} aria-hidden="true">{Array.from({ length: 48 }, (_, i) => <i key={i} style={{ '--height': `${22 + 76 * Math.abs(Math.sin(i * 1.71))}%`, '--delay': `${-i * .17}s`, '--duration': `${.7 + (i % 7) * .13}s` }} />)}</div>
}

export function LightRibbon() { return <Beam /> }

export function BrandFooter() {
  return <footer className="brand-footer"><span>感應光寓 <em>SENSING RESIDENCE</em></span><i className="brand-logo" role="img" aria-label="ANLB inside" /></footer>
}

// Keep both old and new panes during the 0.8 s reel transition.
export function VerticalReel({ identity, children }) {
  const [panes, setPanes] = useState({ identity, current: children, previous: null })
  if (panes.identity !== identity) setPanes({ identity, current: children, previous: panes.current })
  useEffect(() => {
    const release = setTimeout(() => setPanes(value => ({ ...value, previous: null })), 820)
    return () => clearTimeout(release)
  }, [identity])
  return <div className="reel-window">
    {panes.previous && <div className="reel-sheet reel-sheet--out" key={`${identity}-out`} aria-hidden="true">{panes.previous}</div>}
    <div className="reel-sheet reel-sheet--in" key={identity}>{children}</div>
  </div>
}
