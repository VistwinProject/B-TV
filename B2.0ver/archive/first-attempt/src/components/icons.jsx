// 線性圖標集 — 繼承 currentColor,stroke 風格與 B-Table 對齊。
// 用法:<Icon name="light" /> 或直接 import 個別元件。
const S = {
  viewBox: '0 0 48 48', fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round', strokeLinejoin: 'round',
}

export function CardIcon(p) {
  return (
    <svg {...S} {...p}>
      <rect x="7" y="13" width="34" height="22" rx="3" />
      <line x1="7" y1="20" x2="41" y2="20" />
      <line x1="13" y1="28" x2="22" y2="28" />
      <circle cx="33" cy="29" r="2.5" />
    </svg>
  )
}

export function KeyringIcon(p) {
  return (
    <svg {...S} {...p}>
      <circle cx="18" cy="18" r="9" />
      <circle cx="18" cy="18" r="3" />
      <path d="M24.4 24.4 L37 37" />
      <path d="M33 33 l4 -4 3 3 -4 4 z" />
    </svg>
  )
}

export function NfcWaves(p) {
  return (
    <svg {...S} {...p}>
      <path d="M18 14 a14 14 0 0 1 0 20" />
      <path d="M24 18 a8 8 0 0 1 0 12" />
      <circle cx="29" cy="24" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CheckIcon(p) {
  return (
    <svg {...S} {...p}>
      <path d="M12 25 l8 8 16 -18" />
    </svg>
  )
}

// ── 四維度 + 房屋資訊圖標 ────────────────────────────────────────────────────
function Light(p)  { return (<svg {...S} {...p}><path d="M24 7 a11 11 0 0 0 -7 19 c1.5 1.4 2 2.6 2 4 h10 c0-1.4 .5-2.6 2-4 a11 11 0 0 0 -7 -19z"/><line x1="19" y1="38" x2="29" y2="38"/><line x1="21" y1="42" x2="27" y2="42"/></svg>) }
function Air(p)    { return (<svg {...S} {...p}><path d="M6 18 h22 a5 5 0 1 0 -5 -5"/><path d="M6 26 h28 a5 5 0 1 1 -5 5"/><path d="M6 34 h16 a4 4 0 1 0 -4 4"/></svg>) }
function Temp(p)   { return (<svg {...S} {...p}><path d="M28 27 V11 a4 4 0 0 0 -8 0 v16 a7 7 0 1 0 8 0z"/><line x1="24" y1="15" x2="24" y2="29"/></svg>) }
function Sound(p)  { return (<svg {...S} {...p}><line x1="10" y1="20" x2="10" y2="28"/><line x1="17" y1="14" x2="17" y2="34"/><line x1="24" y1="9" x2="24" y2="39"/><line x1="31" y1="16" x2="31" y2="32"/><line x1="38" y1="21" x2="38" y2="27"/></svg>) }
function Cloud(p)  { return (<svg {...S} {...p}><path d="M16 34 a8 8 0 0 1 0 -16 a10 10 0 0 1 19 3 a6 6 0 0 1 -1 13z"/></svg>) }
function Co2(p)    { return (<svg {...S} {...p}><circle cx="24" cy="24" r="15"/><path d="M27 19 a5 5 0 1 0 0 10"/><circle cx="18" cy="24" r="2" fill="currentColor" stroke="none"/></svg>) }
function Humid(p)  { return (<svg {...S} {...p}><path d="M24 8 c7 9 11 14 11 20 a11 11 0 0 1 -22 0 c0-6 4-11 11-20z"/></svg>) }
function Weather(p){ return (<svg {...S} {...p}><circle cx="20" cy="20" r="6"/><path d="M20 8 v3 M20 29 v3 M8 20 h3 M29 20 h3 M11 11 l2 2 M27 27 l2 2 M29 11 l-2 2 M13 27 l-2 2"/><path d="M22 38 a6 6 0 0 1 0 -12 a8 8 0 0 1 15 2 a5 5 0 0 1 -1 10z" opacity="0.55"/></svg>) }

// 額外圖標(數據卡用)
function Bolt(p)   { return (<svg {...S} {...p}><path d="M26 5 L12 27 h9 l-2 16 14 -22 h-9 z"/></svg>) }
function Heart(p)  { return (<svg {...S} {...p}><path d="M24 40 C9 30 9 16 18 15 c4 -0.5 6 2 6 4 c0 -2 2 -4.5 6 -4 c9 1 9 15 -6 25z"/></svg>) }
function Shield(p) { return (<svg {...S} {...p}><path d="M24 6 l15 6 v11 c0 10 -7 16 -15 19 c-8 -3 -15 -9 -15 -19 V12 z"/><path d="M18 23 l4 4 8 -9"/></svg>) }
function Gauge(p)  { return (<svg {...S} {...p}><path d="M9 35 a16 16 0 1 1 30 0"/><path d="M24 33 l8 -10"/><circle cx="24" cy="33" r="2.5" fill="currentColor" stroke="none"/></svg>) }
function Leaf(p)   { return (<svg {...S} {...p}><path d="M14 34 C14 18 30 11 39 11 C39 28 27 37 14 34 z"/><path d="M14 35 C19 30 25 26 33 22"/></svg>) }

const MAP = {
  light: Light, air: Air, temp: Temp, sound: Sound,
  cloud: Cloud, co2: Co2, humid: Humid, weather: Weather,
  card: CardIcon, keyring: KeyringIcon, nfc: NfcWaves, check: CheckIcon,
  bolt: Bolt, heart: Heart, shield: Shield, gauge: Gauge, leaf: Leaf,
}
// 五個情境角色的圖標不在這裡:改用設計端的 CI 圖檔,見 components/PersonaIcon.jsx

export default function Icon({ name, ...p }) {
  const C = MAP[name] || Light
  return <C {...p} />
}
