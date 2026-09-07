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
  // 居家抗老:accent2 #fa864d(橘)· accent3 #17ab54(綠)
  'anti-aging': { data: '#fa864d', pain: '#fa864d', solution: '#fa864d', score: null, l1: null, l2: '#17ab54', l3: null },
  // 兒童免疫:accent2 #e04b64(紅)· accent3 #549a60(綠)
  child:        { data: '#e04b64', pain: '#e04b64', solution: '#e04b64', score: null, l1: null, l2: '#549a60', l3: null },
  // 在宅樂齡:accent2 #bfd71b(黃綠)· accent3 #f96224(橘紅)
  elder:        { data: '#bfd71b', pain: '#bfd71b', solution: '#bfd71b', score: null, l1: null, l2: '#f96224', l3: null },
  // 孕婦照護:accent2 #628e6b(墨綠)· accent3 #5040ee(藍紫)
  pregnancy:    { data: '#628e6b', pain: '#628e6b', solution: '#628e6b', score: null, l1: null, l2: '#5040ee', l3: null },
  // 數位遊牧:accent2 #7cc8f0(天藍)· accent3 #3cb3a7(藍綠)
  nomad:        { data: '#7cc8f0', pain: '#7cc8f0', solution: '#7cc8f0', score: null, l1: null, l2: '#3cb3a7', l3: null },
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
