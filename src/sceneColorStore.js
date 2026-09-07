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

// ── 1-5 各格的顏色「正式記錄」──────────────────────────────────────────────────
// 這一份就是隨程式碼走的定案值:任何一台電腦、清空 localStorage、重新 clone 都一樣。
// 編輯模式(E)挑的色只存在該台瀏覽器的 localStorage,是現場微調用的暫時覆寫;
// 要固化就把值抄進這張表(面板的「複製 CSS」會把目前挑的色一起輸出)。
// null = 不平塗(保持半透明,讓背後的光透出來)。
export const SCENE_DEFAULTS = {
  // 每一格都指定了顏色(現場用編輯模式挑完、2026-09-07 匯出固化)
  'anti-aging': { data: '#b6dbe6', pain: '#7394a5', solution: '#b6dbe6', score: '#b6dbe6', l1: '#fa864d', l2: '#17ab54', l3: '#7394a5' },
  child:        { data: '#4b9af7', pain: '#8ba78d', solution: '#cfd785', score: '#549a60', l1: '#cfd785', l2: '#4b9af7', l3: '#cfd785' },
  elder:        { data: '#eff7d6', pain: '#c47f75', solution: '#eff7d6', score: '#eff7d6', l1: '#bfd71b', l2: '#f96224', l3: '#c47f75' },
  pregnancy:    { data: '#628e6b', pain: '#c3b192', solution: '#628e6b', score: '#628e6b', l1: '#5040ee', l2: '#5f0004', l3: '#c0e797' },
  nomad:        { data: '#d5bead', pain: '#3a446f', solution: '#d5bead', score: '#d5bead', l1: '#b19857', l2: '#3cb3a7', l3: '#3a446f' },
}

export const slotDefault = (per, key) => {
  const row = SCENE_DEFAULTS[per.id]
  // 表裡沒有這個角色(新增情境時)→ 退回 personas.js 的 accent2 / accent3
  if (!row) return { data: per.accent2, pain: per.accent2, solution: per.accent2, l2: per.accent3 }[key] ?? null
  return row[key] ?? null
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

// 平塗大面積時混 20% 暖灰:參考配色原值亮度偏高,白字會糊
export function fillColor(hex) {
  if (!hex) return 'rgba(255,255,255,0.13)'
  const n = parseInt(hex.slice(1), 16)
  const mix = (c, d) => Math.round(c * 0.8 + d * 0.2)
  const r = mix((n >> 16) & 255, 0x4a), g = mix((n >> 8) & 255, 0x4a), b = mix(n & 255, 0x30)
  return `rgb(${r}, ${g}, ${b})`
}

// ── 淺色玻璃面板(情境牆疊在樣品屋影片背景上時用這個)────────────────────────
// 參考配色原值飽和度高,直接當半透明膜會把影片壓成濁色 → 先混 62% 白拉明度、降飽和,
// 再留 alpha 讓影片透出來當「玻璃後面的景」。配色仍吃 slotColor()(= SCENE_DEFAULTS
// 與現場挑色),只是呈現方式從實色平塗換成玻璃。null(沒選色)→ 中性白玻璃。
export function glassFill(hex, alpha = glass.alpha) {
  // 沒選色的面板再透一點:它本來就只是襯底,不該比有顏色的卡還搶
  if (!hex) return `rgba(255, 255, 255, ${+(alpha * 0.84).toFixed(3)})`
  const n = parseInt(hex.slice(1), 16)
  const w = (c) => Math.round(c * 0.38 + 255 * 0.62)
  return `rgba(${w((n >> 16) & 255)}, ${w((n >> 8) & 255)}, ${w(n & 255)}, ${alpha})`
}

// ── 情境牆玻璃質感(整面牆共用一組,不分情境)──────────────────────────────────
// 定位是「背景才是主角,玻璃面板只是資訊輔助」→ 三個值都往下調就會越來越像
// 一層薄薄的資訊底。編輯模式(E)在情境牆可即時拉,存 localStorage。
//   alpha 面板不透明度(越低背景越清楚)· wash 背景柔光(越低影片越清楚)
//   blur  玻璃霧化(0 = 完全清透)· gloss 光澤(0 = 完全平面)
//   refract 邊緣折射,三段可比較(Chromium 限定、最耗效能 → 預設關):
//     'off' 關 · 'warp' 自寫 feTurbulence 擾動(尺寸無關、便宜)
//     'real' vendor/liquid-glass.js(MIT),每張面板產一張對應尺寸的位移圖
//   panel 面板樣式:'flat' = main 既有的 72% 平塗色塊(預設,不動現有視覺)
//         'glass' = 淺色玻璃(backdrop-filter + 高光 + 描邊 + 深藍字)。
//     ⚠ main 是刻意把 tile 的 backdrop-filter 拿掉的(見 bento.css 尾段註解:
//       背後那道主色光會被糊成一片均勻的暈)→ 玻璃模式會把那道光糊掉,是取捨。
//   bg 牆面背景:'key' = main 既有的主視覺遮罩光束(預設)
//      'white' 全白 · 'video' 樣品屋影片鋪滿整面牆
const GKEY = 'sceneGlass'
export const REFRACT_MODES = ['off', 'warp', 'real']
export const WALL_BG_MODES = ['key', 'white', 'video']
export const PANEL_MODES = ['flat', 'glass']
export const GLASS_DEFAULT = { alpha: 0.48, wash: 0, blur: 0, gloss: 0.5, refract: 'off', bg: 'key', panel: 'flat' }

let glass = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem(GKEY) || 'null')
    const v = raw ? { ...GLASS_DEFAULT, ...raw } : { ...GLASS_DEFAULT }
    // refract 曾經是 boolean → 舊存檔要接住,否則面板會拿到 true/false
    if (typeof v.refract === 'boolean') v.refract = v.refract ? 'real' : 'off'
    if (!REFRACT_MODES.includes(v.refract)) v.refract = 'off'
    if (!WALL_BG_MODES.includes(v.bg)) v.bg = 'key'
    if (!PANEL_MODES.includes(v.panel)) v.panel = 'flat'
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
export const BENTO_BEAM_DEFAULT = {
  // 現場設定:8 個數據格都開光邊,標題卡與宣言卡不開(2026-09-07 匯出固化)
  hero: false, pm25: true, pm25_out: true, co2: true, temp: true,
  weather: true, sound: true, rh: true, light: true, claim: false,
}

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
