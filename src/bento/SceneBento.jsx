import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CountUp from './CountUp.jsx'
import VideoTile from './VideoTile.jsx'
import LineChartTile from './LineChartTile.jsx'
import DonutTile from './DonutTile.jsx'
import Icon from '../components/icons.jsx'
import PersonaIcon from '../components/PersonaIcon.jsx'
import LayoutEditor from '../components/LayoutEditor.jsx'
import { DIMENSION_ORDER, DIMENSION_META, SCENES } from '../scenes.js'
import { PERSONA_ORDER } from '../personas.js'

// 情境解方牆 — 3 欄,以「當前維度」主時鐘同步:
//   ▍左欄 = 當前維度的「3 張相關卡」(同一維度、不同呈現:大數字 / 圖表 / 視覺化)
//   ▍右欄 = 痛點(上,L1 極短 + L2 一句話)+ 解方長句論述(下,當前維度)
//   ▍中欄 = 3D 房子(燈光跟維度)+ 趨勢/數據(獨立慢輪)
//   ▍左 3 卡 ↔ 右解方字幕 ↔ 房子燈光,全跟維度 ①→②→③→④ 同步,
//     右下講某維度時,左邊三張都是該維度的相關資訊。
//   ▍捲軸內不放無限動畫(會卡住 AnimatePresence exit)→ 波形等用靜態。
//   ▍L3 詳細長句不在 TV(給桌面;見 personas.js painLong / zone md)。
// 節奏:一「拍」= 一次鏡位移動;一個維度 = BEATS_PER_DIM 拍(卡片每維度換一次)。
// 維度停留時間 = BEAT_MS × BEATS_PER_DIM。現在 5000×1 = 5 秒/維度(每維度 1 次鏡位移動)。
const BEAT_MS = 5000
const BEATS_PER_DIM = 1
const SPIN_MS = 7000

const isNum = (v) => /^[\d.]+$/.test(String(v))
const dec = (v) => (String(v).includes('.') ? 1 : 0)

const TREND = {
  'anti-aging': [0.35, 0.4, 0.46, 0.52, 0.6, 0.66, 0.74, 0.82],
  child:        [0.4, 0.48, 0.52, 0.58, 0.63, 0.71, 0.78, 0.85],
  elder:        [0.3, 0.36, 0.45, 0.5, 0.55, 0.62, 0.7, 0.76],
  pregnancy:    [0.45, 0.5, 0.55, 0.6, 0.66, 0.72, 0.8, 0.88],
  nomad:        [0.38, 0.46, 0.5, 0.57, 0.64, 0.69, 0.77, 0.84],
}
const SCORE   = { 'anti-aging': 94, child: 92, elder: 88, pregnancy: 96, nomad: 90 }
const SAVE    = { 'anti-aging': 26, child: 22, elder: 20, pregnancy: 24, nomad: 30 }
const COMFORT = { 'anti-aging': 95, child: 93, elder: 90, pregnancy: 97, nomad: 92 }
const SAT     = { 'anti-aging': 98, child: 97, elder: 96, pregnancy: 99, nomad: 96 }
const DIM_COLOR = { light: 'yellow', air: 'green', temp: 'sky', sound: 'purple' }
const DIM_BADGE = { light: '①', air: '②', temp: '③', sound: '④' }
// 擴充色票(全飽和、皆深色字,無白無黑)。每維度輪轉、同畫面取連續 6 色不重複。
const COLORS = ['yellow', 'orange', 'coral', 'pink', 'purple', 'indigo', 'sky', 'teal', 'green', 'lime']

// 靜態波形高度(無動畫,避免卡 exit)
const WAVE = Array.from({ length: 22 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 0.7)) * 0.7)

// 換角色進場:各圖卡錯開滑入(scene 掛載=換角色時機;scene↔loop 同 key 不重播)。
const ENTER = (delay) => ({
  initial: { opacity: 0, y: 22, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
})

// ── 卡片內容(純元件,只在掛載時 count-up 一次)───────────────────────────────
function CardFace({ card, flex = 1, enter }) {
  if (card.kind === 'line') {
    return <div className={`tile tile--${card.color || 'orange'} col-card`} style={{ flex }}><LineChartTile values={card.values} title={card.title} /></div>
  }
  if (card.kind === 'donut') {
    return <div className={`tile tile--${card.color || 'orange'} col-card`} style={{ flex }}><p className="t-eyebrow">WELL 五維健康</p><DonutTile segments={card.segments} centerTop="WELL" centerSub="balanced" /></div>
  }
  if (card.kind === 'narr') {
    return (
      <div className={`tile tile--${card.color} col-card narr`} style={{ flex }}>
        <span className="narr__tag"><span className="narr__ico"><Icon name={card.icon} /></span><span className="t-eyebrow">{card.eyebrow}</span></span>
        <div className="narr__body">
          <h2 className="narr__head">{card.headline}</h2>
          <p className="narr__detail">{card.detail}</p>
        </div>
      </div>
    )
  }
  if (card.kind === 'swatch') {
    return (
      <div className={`tile tile--${card.color} col-card dviz`} style={{ flex }}>
        <span className="viz__top"><span className="t-eyebrow">{card.eyebrow}</span><span className="viz__ico"><Icon name="light" /></span></span>
        <div className="viz__body">
          <div className="swatch__bar" />
          <div className="viz__labels"><span>暖 2200K</span><span>冷 6500K</span></div>
        </div>
        <p className="t-foot">{card.foot}</p>
      </div>
    )
  }
  if (card.kind === 'bars') {
    return (
      <div className={`tile tile--${card.color} col-card dviz`} style={{ flex }}>
        <span className="viz__top"><span className="t-eyebrow">{card.eyebrow}</span><span className="viz__ico"><Icon name={card.icon} /></span></span>
        <div className="viz__body">
          <div className="cbars">
            {card.items.map((it, i) => (
              <div className="cbar" key={i}>
                <span className="cbar__label">{it.label}</span>
                <div className="cbar__track"><div className={`cbar__fill${it.hi ? ' cbar__fill--hi' : ''}`} style={{ width: `${Math.min(100, (it.value / card.max) * 100)}%` }} /></div>
                <span className="cbar__val">{it.value}{card.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  if (card.kind === 'range') {
    const pct = (v) => `${((v - card.min) / (card.max - card.min)) * 100}%`
    return (
      <div className={`tile tile--${card.color} col-card dviz`} style={{ flex }}>
        <span className="viz__top"><span className="t-eyebrow">{card.eyebrow}</span><span className="viz__ico"><Icon name="temp" /></span></span>
        <div className="viz__body">
          <div className="range__value">{card.value}°C <small>舒適</small></div>
          <div className="range__track">
            <div className="range__zone" style={{ left: pct(card.lo), width: `${((card.hi - card.lo) / (card.max - card.min)) * 100}%` }} />
            <div className="range__mark" style={{ left: pct(card.value) }} />
          </div>
          <div className="viz__labels"><span>{card.min}°C</span><span>{card.max}°C</span></div>
        </div>
      </div>
    )
  }
  if (card.kind === 'wave') {
    return (
      <div className={`tile tile--${card.color} col-card dviz`} style={{ flex }}>
        <span className="viz__top"><span className="t-eyebrow">{card.eyebrow}</span><span className="viz__ico"><Icon name="sound" /></span></span>
        <div className="viz__body"><div className="wave">{WAVE.map((h, i) => <span key={i} style={{ height: `${h * 100}%` }} />)}</div></div>
        <p className="t-foot">{card.label}</p>
      </div>
    )
  }
  // stat:大數字 + icon(長字串如「2200–6500」用較小字級且不換行)
  const longVal = !isNum(card.value) && String(card.value).length > 5
  const Root = enter ? motion.div : 'div'
  return (
    <Root className={`tile tile--${card.color} col-card`} style={{ flex }} {...(enter || {})}>
      <span className="stat__top"><span className="t-eyebrow">{card.eyebrow}</span>{card.icon && <span className="stat__ico"><Icon name={card.icon} /></span>}</span>
      <span className="t-spacer" />
      <span className={`stat__num${longVal ? ' stat__num--long' : ''}`}>{isNum(card.value) ? <CountUp value={card.value} decimals={dec(card.value)} /> : card.value}<span className="stat__unit"> {card.unit}</span></span>
      {card.foot && <p className="t-foot">{card.foot}</p>}
    </Root>
  )
}

function Reel({ pageKey, children, enter }) {
  return (
    <motion.div className="reel" {...(enter || {})}>
      <AnimatePresence initial={false}>
        <motion.div key={pageKey} className="reel-page"
          initial={{ y: '100%' }} animate={{ y: '0%' }} exit={{ y: '-100%' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default function SceneBento({ persona, mode = 'play', onComplete }) {
  const data = SCENES[persona.id]
  // 拍子時鐘:用「經過時間」推導 beat(idempotent,免疫 StrictMode/重複 interval 造成的加倍)。
  // 換角色時 SceneBento 不再 remount(房子要保活),所以 startRef 必須在「render 當下」就重置,
  // 否則第一幀會用到舊角色的 beat → reel 會多滑一下(換角色屬性變化時重置 state 的標準做法)。
  const [, setTick] = useState(0)
  const startRef = useRef(performance.now())
  const personaRef = useRef(persona.id)
  if (personaRef.current !== persona.id) { personaRef.current = persona.id; startRef.current = performance.now() }
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 400) // 只為觸發重算,beat 由時間推導
    return () => clearInterval(id)
  }, [])

  const order = DIMENSION_ORDER
  const beat = Math.max(0, Math.floor((performance.now() - startRef.current) / BEAT_MS)) // 每拍鏡位移動
  const dim = Math.floor(beat / BEATS_PER_DIM) % order.length  // 維度每 2 拍換一次(卡片節奏)
  const curK = order[dim]

  useEffect(() => {
    if (mode === 'play' && beat >= BEATS_PER_DIM * order.length) onComplete?.() // 走完一輪 → loop
  }, [beat, mode, onComplete, order.length])
  const color = DIM_COLOR[curK]
  const tint = DIMENSION_META[curK].tint
  const badge = DIM_BADGE[curK]
  const label = DIMENSION_META[curK].label

  // 左欄:當前維度的 3 張相關卡(同一維度、不同呈現、且「三張顏色都不同」)
  function dimCards(k) {
    const b = DIM_BADGE[k], lab = DIMENSION_META[k].label, dt = DIMENSION_META[k].tint
    const m0 = data[k].metrics[0], m1 = data[k].metrics[1]
    const statC = (key, m, foot, col) => ({ key, kind: 'stat', color: col, icon: k, eyebrow: `${b} ${lab}`, value: m.value, unit: m.unit, foot })
    // 左欄固定配色:位置 0=黃、1=珊瑚、2=天藍(保證同頁不撞色)
    if (k === 'light') return [
      statC('l0', m0, m0.note, 'yellow'),
      statC('l1', m1, m1 ? m1.note : '', 'coral'),
      { key: 'l2', kind: 'swatch', color: 'sky', eyebrow: `${b} 動態色溫`, foot: '晝夜節律照明' },
    ]
    if (k === 'air') return [
      statC('a0', m0, m0.note, 'yellow'),
      { key: 'a1', kind: 'bars', color: 'coral', icon: 'air', eyebrow: `${b} 室外 vs 室內 PM2.5`, unit: '', max: 50, items: [{ label: '室外', value: 42 }, { label: '室內', value: Number(m0.value), hi: true }] },
      statC('a2', m1, m1 ? m1.note : '', 'sky'),
    ]
    if (k === 'temp') return [
      statC('t0', m0, m0.note, 'yellow'),
      statC('t1', m1, m1 ? m1.note : '', 'coral'),
      { key: 't2', kind: 'range', color: 'sky', eyebrow: `${b} 體感舒適區間`, min: 18, max: 30, lo: 22, hi: 26, value: Number(m0.value) },
    ]
    // sound
    return [
      statC('s0', m0, '深層修復聲景', 'yellow'),
      { key: 's1', kind: 'bars', color: 'coral', icon: 'sound', eyebrow: `${b} 噪音對比`, unit: '', max: 80, items: [{ label: '一般住宅', value: 65 }, { label: '全健築', value: Number(m0.value), hi: true }] },
      { key: 's2', kind: 'wave', color: 'sky', eyebrow: `${b} 聲景類型`, label: data.sound.sound },
    ]
  }

  const narrCard = (k) => ({ kind: 'narr', icon: k, color: DIM_COLOR[k], eyebrow: `${DIM_BADGE[k]} ${DIMENSION_META[k].label}解方`, headline: data[k].headline, detail: data[k].detail })

  // ── 配色 ────────────────────────────────────────────────────────────────────
  // 痛點卡(右上)= 白(cream),固定最簡潔(只有換角色內容才變);
  // 全健築指數卡(房子下方)= 綁角色的固定色,當房子的整體分數常駐;
  // 其餘 4 格(左欄 3 + 解方)隨維度從色票輪轉,排除上述固定色 → 同畫面顏色不重複。
  const houseScoreColor = COLORS[PERSONA_ORDER.indexOf(persona.id) % COLORS.length]
  const rest = COLORS.filter((c) => c !== houseScoreColor)
  const off = (dim * 3) % rest.length
  const C = (i) => rest[(off + i) % rest.length]
  const leftFlex = [1.15, 0.95, 0.9]
  const leftCards = dimCards(curK).map((c, i) => ({ ...c, color: C(i) }))
  const narr = { ...narrCard(curK), color: C(3) }
  const scoreCard = { kind: 'stat', icon: 'gauge', color: houseScoreColor, eyebrow: '全健築指數', value: SCORE[persona.id] || 90, unit: '/100', foot: 'WELL Building Standard' }

  return (
    <div className="scene-cols">
      {/* 左欄:當前維度 3 張相關卡。key 帶 persona.id → 換角色重掛載、重播進場 */}
      <div className="scene-col scene-col--l">
        <Reel key={`l-${persona.id}`} pageKey={dim} enter={ENTER(0.16)}>
          {leftCards.map((c, i) => <CardFace key={c.key} card={c} flex={leftFlex[i]} />)}
        </Reel>
      </div>

      {/* 中欄:樣品屋影片(佔原本 3D 房子那格)+ 全健築指數 */}
      <div className="scene-col scene-col--m">
        <VideoTile className="col-anchor col-anchor--house" delay={0.14} />
        <CardFace key={`s-${persona.id}`} card={scoreCard} enter={ENTER(0.2)} />
      </div>

      {/* 右欄:痛點(L1+L2)+ 解方論述。key=persona.id → 換角色重播進場 */}
      <div className="scene-col scene-col--r">
        <motion.div key={`h-${persona.id}`} className="tile tile--cream col-anchor col-anchor--hero" {...ENTER(0.08)}>
          {/* 右上:情境卡正式名稱(大、白)+ 底下痛點短句 */}
          <p className="hero__label">{persona.label}</p>
          <p className="hero__short">{persona.painShort}</p>
          <span className="t-spacer" />
          <div className="hero__row">
            <p className="hero__q">{persona.painMedium}</p>
            <PersonaIcon id={persona.id} className="hero__icon" />
          </div>
        </motion.div>
        <Reel key={`n-${persona.id}`} pageKey={dim} enter={ENTER(0.26)}><CardFace card={narr} /></Reel>
      </div>

      {/* 底部:待機頁的主頁元素(字標 + ANLB 商標),讓情境頁也帶著展區識別 */}
      <motion.div
        className="scene-foot"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="scene-foot__mark">
          <b>感應光寓</b>
          <i>SENSING RESIDENCE</i>
        </span>
        <span
          className="scene-foot__logo"
          role="img"
          aria-label="ANLB inside"
          style={{ '--logo-src': `url(${import.meta.env.BASE_URL}icons/anlb.png)` }}
        />
      </motion.div>

      {/* 按 E 時疊上可拖的欄位分隔線(非編輯模式不渲染)*/}
      <LayoutEditor />
    </div>
  )
}
