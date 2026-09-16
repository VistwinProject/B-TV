import { lightingStyle } from './iconLighting.js'

export default function AnimatedIcon({ name, kelvin, lightMode, className = '' }) {
  let drawing
  switch (name) {
    case 'light': drawing = <>
      <circle className="lamp-halo" cx="22" cy="18" r="15" stroke="none" />
      <g className="lamp-rays"><path d="M22 1v4M5 8l4 3M1 21h5M39 8l-4 3M38 21h5" /></g>
      <path className="lamp-bulb" d="M16 31c0-6-5-7-5-14a11 11 0 1 1 22 0c0 7-5 8-5 14Z" />
      <path d="M17 36h10m-8 4h6M19 23l3 3 3-3m-3 3v5" />
    </>; break
    case 'air': case 'co2': drawing = <>
      <g className="air-streams"><path pathLength="100" d="M-3 11h27c10 0 9-9 3-9-4 0-6 3-5 5" /><path pathLength="100" d="M-4 22h34c12 0 12 14 4 14-5 0-7-4-5-7" /><path pathLength="100" d="M-2 32h14c8 0 8 10 2 10-4 0-5-3-4-5" /></g>
      <g className="air-particles"><circle cx="4" cy="16" r="1.3" /><circle cx="9" cy="27" r="1" /><circle cx="2" cy="37" r="1.2" /></g>
    </>; break
    case 'humid': drawing = <>
      <path className="water-drop" d="M22 17c-4 7-11 12-11 17a11 11 0 0 0 22 0c0-5-7-10-11-17Z" />
      <path className="water-surface" d="M13 35q4-3 9 0t9 0" />
      <g className="water-vapor"><path d="M13 22q-3-3 0-6t0-6" /><path d="M22 15q-3-3 0-6t0-6" /><path d="M31 22q-3-3 0-6t0-6" /></g>
    </>; break
    case 'temp': drawing = <>
      <path d="M17 27V7a5 5 0 0 1 10 0v20a9 9 0 1 1-10 0Z" />
      <path d="M31 9h4m-4 6h3m-3 6h4" opacity=".6" />
      <rect className="thermometer-column" x="19.5" y="8" width="5" height="27" rx="2.5" stroke="none" />
      <circle className="thermometer-bulb" cx="22" cy="34" r="5" stroke="none" />
    </>; break
    case 'sound': drawing = <g className="sound-levels">{[10,22,34,26,16,8].map((height,i)=><path key={i} d={`M${4+i*7} ${22-height/2}v${height}`} style={{'--i':i}} />)}</g>; break
    case 'goal': case 'gauge': drawing = <>
      <circle className="goal-orbit" cx="22" cy="22" r="18" strokeDasharray="12 7 3 7" />
      <circle cx="22" cy="22" r="12" opacity=".35" />
      <path className="goal-check" d="m14 22 6 6 11-13" />
    </>; break
    default: drawing = <g className="goal-check"><circle cx="22" cy="22" r="15" /><path d="m14 22 6 6 11-13" /></g>
  }
  return <svg className={`symbol animated-symbol animated-symbol--${name} ${className}`} viewBox="0 0 44 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={lightingStyle({kelvin,lightMode})} data-kelvin={kelvin?.join('–')} aria-hidden="true">{drawing}</svg>
}
