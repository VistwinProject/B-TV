// ── 情境牆的參考配色「選擇」(不是調色)────────────────────────────────────────
// 每一塊面板一個欄位,值只能是該情境卡 palette 裡的色,或 null(= 不平塗,維持半透明)。
// 編輯模式(E)點色票即換,存 localStorage;沒選過就用下面的 DEFAULTS。
// 另外記錄目前的 phase / persona,讓編輯面板只顯示該頁能編輯的項目。
const KEY = 'sceneColors'

// 可上色的面板(順序 = 面板列出的順序)
export const SLOTS = [
  { key: 'data',     label: '數據強調(長條/區間/波形)', kind: 'accent' },
  { key: 'pain',     label: '痛點卡 · 右上',             kind: 'fill' },
  { key: 'solution', label: '解方卡 · 右下',             kind: 'fill' },
  { key: 'score',    label: '全健築指數 · 中欄',         kind: 'fill' },
  { key: 'l1',       label: '左欄第 1 張',               kind: 'fill' },
  { key: 'l2',       label: '左欄第 2 張',               kind: 'fill' },
  { key: 'l3',       label: '左欄第 3 張',               kind: 'fill' },
]

// ── 每情境的面板配色(佈展調好後,把「複製 CSS」輸出的這段貼回來就固化)──────────
// 與版面的 SCENE_LAYOUTS 同一套疊法:出廠預設 → 這裡固化的值 → localStorage 的現場調整。
// 沒列到的情境 / 沒列到的面板,就走下面 FACTORY 的規則。null = 不平塗。
export const SCENE_COLORS = {
  'anti-aging': { data: '#17ab54', pain: '#fa864d', solution: '#02cdab', score: '#7394a5', l1: '#02cdab', l2: '#17ab54', l3: '#b6dbe6' },  // 居家抗老
  'child':      { data: '#e04b64', pain: '#4b9af7', solution: '#e04b64', score: '#cfd785', l1: '#8ba78d', l2: '#549a60', l3: '#e04b64' },  // 兒童免疫
  'elder':      { data: '#bfd71b', pain: '#bfd71b', solution: '#f96224', score: '#bfd71b', l1: '#c47f75', l2: '#f96224', l3: '#eff7d6' },  // 在宅樂齡
  'pregnancy':  { data: '#628e6b', pain: '#5f0004', solution: '#5f0004', score: '#628e6b', l1: '#c0e797', l2: '#5040ee', l3: '#5040ee' },  // 孕婦照護
  'nomad':      { data: '#7cc8f0', pain: '#7cc8f0', solution: '#7cc8f0', score: '#3a446f', l1: '#3a446f', l2: '#3cb3a7', l3: '#3a446f' },  // 數位遊牧
}

// 出廠規則:數據強調與右欄兩張用 accent2、左欄第二張用 accent3,其餘不平塗
const FACTORY = (per) => ({
  data: per.accent2,
  pain: per.accent2,
  solution: per.accent2,
  score: null,
  l1: null,
  l2: per.accent3,
  l3: null,
})

export const slotDefault = (per, key) => {
  const fixed = SCENE_COLORS[per.id]
  // 用 `key in` 而不是 truthy 判斷 —— null 是「刻意不平塗」的有效值,不能被當成沒設定
  if (fixed && key in fixed) return fixed[key]
  return FACTORY(per)[key]
}

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

let sel = load()          // { [personaId]: { [slot]: hex | null } }
let ctx = { phase: 'idle', persona: null }
const subs = new Set()
const emit = () => subs.forEach((f) => f())

export const getSceneColors = () => sel
export const getEditContext = () => ctx
export const subscribeSceneColors = (f) => { subs.add(f); return () => subs.delete(f) }

export function setEditContext(phase, persona) {
  if (ctx.phase !== phase || ctx.persona !== persona) { ctx = { phase, persona }; emit() }
}
export function setSceneColor(id, slot, hex) {
  sel = { ...sel, [id]: { ...(sel[id] || {}), [slot]: hex } }
  try { localStorage.setItem(KEY, JSON.stringify(sel)) } catch { /* 無痕模式 */ }
  emit()
}
export function resetSceneColors() {
  sel = {}
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  emit()
}

// 取某個面板目前生效的色(undefined = 沒選過 → 用預設)
export function slotColor(per, slot) {
  const v = sel[per.id]?.[slot]
  return v === undefined ? slotDefault(per, slot) : v
}

// ── 淺色玻璃面板(情境牆疊在樣品屋影片背景上時用這個)────────────────────────
// 參考配色原值飽和度高,直接當半透明膜會把影片壓成濁色 → 先混 62% 白拉明度、降飽和,
// 再留 0.62 alpha 讓影片透出來當「玻璃後面的景」。配色仍吃 slotColor() 的選擇,
// 只是呈現方式從實色平塗換成玻璃。null(沒選色)→ 中性白玻璃。
export function glassFill(hex, alpha = glass.alpha) {
  // 沒選色的面板再透一點:它本來就只是襯底,不該比有顏色的卡還搶
  if (!hex) return `rgba(255, 255, 255, ${+(alpha * 0.84).toFixed(3)})`
  const n = parseInt(hex.slice(1), 16)
  const w = (c) => Math.round(c * 0.38 + 255 * 0.62)
  return `rgba(${w((n >> 16) & 255)}, ${w((n >> 8) & 255)}, ${w(n & 255)}, ${alpha})`
}

// ── 情境牆玻璃質感(整牆共用一組,不分情境)──────────────────────────────────
// 定位是「背景影片才是主角,玻璃面板只是資訊輔助」→ 三個值都往下調就會越來越像
// 一層薄薄的資訊底。編輯模式(E)在情境牆可即時拉,存 localStorage。
//   alpha 面板不透明度(越低背景越清楚)· wash 背景柔光(越低影片越清楚)
//   blur  玻璃霧化(0 = 完全清透,背景細節直接穿過來)
//   gloss 光澤(邊緣受光高光 + 斜掠反光的強度;0 = 完全平面)
//   refract 邊緣折射,三段可比較(Chromium 限定、最耗效能 → 預設關):
//     'off'  關 —— 只有 CSS 的模糊玻璃
//     'warp' 擾動 —— feTurbulence 位移,尺寸無關、便宜(本專案自寫,見 GlassFilter.jsx)
//     'real' 真折射 —— vendor/liquid-glass.js(MIT),每張面板產一張對應尺寸的位移圖
const GKEY = 'sceneGlass'
export const REFRACT_MODES = ['off', 'warp', 'real']
//   bg 牆面背景:'white' 全白 · 'video' 樣品屋影片鋪滿整面牆
//     影片改放進中欄的資訊卡之後,整面牆的底預設回全白;想回影像牆就切 'video'
//     (兩者可並存 —— 卡片裡放影片、牆面也放影片)。
export const WALL_BG_MODES = ['white', 'video']
// 現場調定的值(2026-09-07 固化):牆面全白 + 面板約五成不透明 + 光澤收一半。
// wash / blur 都是 0 —— 牆面全白時它們沒有作用,切回 bg:'video' 才需要重新調。
export const GLASS_DEFAULT = { alpha: 0.48, wash: 0, blur: 0, gloss: 0.5, refract: 'off', bg: 'white' }

let glass = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem(GKEY) || 'null')
    const v = raw ? { ...GLASS_DEFAULT, ...raw } : { ...GLASS_DEFAULT }
    // refract 從 boolean 換成三段字串 → 舊的存檔值要接住,否則面板會拿到 true/false
    if (typeof v.refract === 'boolean') v.refract = v.refract ? 'real' : 'off'
    if (!REFRACT_MODES.includes(v.refract)) v.refract = 'off'
    if (!WALL_BG_MODES.includes(v.bg)) v.bg = 'white'
    return v
  } catch { return { ...GLASS_DEFAULT } }
})()

export const getGlass = () => glass
export function setGlass(patch) {
  glass = { ...glass, ...patch }
  try { localStorage.setItem(GKEY, JSON.stringify(glass)) } catch { /* 無痕模式 */ }
  emit()
}
export function resetGlass() {
  glass = { ...GLASS_DEFAULT }
  try { localStorage.removeItem(GKEY) } catch { /* ignore */ }
  emit()
}

// 平塗大面積時混 20% 暖灰:參考配色原值亮度偏高,白字會糊
export function fillColor(hex) {
  if (!hex) return 'rgba(255,255,255,0.13)'
  const n = parseInt(hex.slice(1), 16)
  const mix = (c, d) => Math.round(c * 0.8 + d * 0.2)
  const r = mix((n >> 16) & 255, 0x4a), g = mix((n >> 8) & 255, 0x4a), b = mix(n & 255, 0x30)
  return `rgb(${r}, ${g}, ${b})`
}

// ── 房屋資訊牆(bento)的面板顏色 ─────────────────────────────────────────────
// 這頁還沒有參考色卡 → 編輯模式直接輸入色碼;null / 空 = 不平塗(維持半透明)。
const BKEY = 'bentoColors'

export const BENTO_PANELS = [
  { key: 'hero',     label: '標題卡 · 左上' },
  { key: 'pm25',     label: '室內 PM2.5' },
  { key: 'pm25_out', label: '室外 PM2.5' },
  { key: 'co2',      label: 'CO₂' },
  { key: 'temp',     label: '室內溫度' },
  { key: 'weather',  label: '天氣預報' },
  { key: 'sound',    label: '聲學環境' },
  { key: 'rh',       label: '相對濕度' },
  { key: 'light',    label: '照度' },
  { key: 'claim',    label: '宣言卡 · 右下' },
]

let bento = (() => {
  try { return JSON.parse(localStorage.getItem(BKEY) || '{}') } catch { return {} }
})()

export const getBentoColors = () => bento
export function setBentoColor(key, hex) {
  bento = { ...bento, [key]: hex }
  try { localStorage.setItem(BKEY, JSON.stringify(bento)) } catch { /* 無痕模式 */ }
  emit()
}
export function resetBentoColors() {
  bento = {}
  try { localStorage.removeItem(BKEY) } catch { /* ignore */ }
  emit()
}

// ── 光帶格:讓某幾格的底變成主視覺那道斜光(白色核心 + 藍漸層 + 深藍角落 + 顆粒)──
// 與「輸入色碼」互斥:開了光帶就不吃平塗色(CSS 類別上色,不再給 inline background)。
const BEAMKEY = 'bentoBeam'
export const BENTO_BEAM_DEFAULT = { hero: true, weather: true, claim: true }

let bentoBeam = (() => {
  try {
    const raw = localStorage.getItem(BEAMKEY)
    return raw ? JSON.parse(raw) : { ...BENTO_BEAM_DEFAULT }
  } catch { return { ...BENTO_BEAM_DEFAULT } }
})()

export const getBentoBeam = () => bentoBeam
export function toggleBentoBeam(key) {
  bentoBeam = { ...bentoBeam, [key]: !bentoBeam[key] }
  try { localStorage.setItem(BEAMKEY, JSON.stringify(bentoBeam)) } catch { /* 無痕模式 */ }
  emit()
}
export function resetBentoBeam() {
  bentoBeam = { ...BENTO_BEAM_DEFAULT }
  try { localStorage.removeItem(BEAMKEY) } catch { /* ignore */ }
  emit()
}
