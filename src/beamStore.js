// ── 待機頁光束幾何(三點曲線 + 頭中尾寬度)────────────────────────────────────
// 極簡外部 store:IdleBeam(畫)與 StyleTuner(調)共用同一份狀態。
// 座標用畫面百分比 → 任何解析度都成立;寬度用 1920 寬為基準的 px,繪製時等比縮放。
const KEY = 'idleBeamGeo'

export const BEAM_DEFAULT = {
  // 三個造型點:尾(左下)· 中(曲線實際會通過這裡)· 頭(右上)
  // 取自原本那條圓弧上的三個點(都落在畫面內才拖得到;曲線本身會自動延伸出畫面)
  p0: { x: 5.83, y: 95.59 },
  p1: { x: 64.43, y: 67.64 },
  p2: { x: 99.29, y: -2.28 },
  w0: 28,      // 尾寬(px @1920)—— 尾粗頭細,光束由左下往右上收
  w1: 9,       // 中寬
  w2: 7,       // 頭寬
  glow: 0.75,  // 上緣光暈倍率
  edge: 0.95,  // 下緣收邊倍率
}

const load = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    return raw ? { ...BEAM_DEFAULT, ...raw } : { ...BEAM_DEFAULT }
  } catch { return { ...BEAM_DEFAULT } }
}

let state = load()
let editing = false
const subs = new Set()
const emit = () => subs.forEach((f) => f())

export const getBeam = () => state
export const getEditing = () => editing
export const subscribeBeam = (f) => { subs.add(f); return () => subs.delete(f) }

export function setBeam(patch) {
  state = { ...state, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* 無痕模式 */ }
  emit()
}
export function resetBeam() {
  state = { ...BEAM_DEFAULT }
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  emit()
}
export function setEditing(on) { editing = on; emit() }
