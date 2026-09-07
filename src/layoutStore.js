// ── 情境牆(1-5)欄位版面 ─────────────────────────────────────────────────────
// 三欄的寬度比例 + 兩張錨定卡的高度百分比。值以 CSS 變數套用,編輯模式可直接拖分隔線。
const KEY = 'sceneLayout'

export const LAYOUT_DEFAULT = {
  // 情境牆(1-5)
  colL: 0.92,    // 左欄 flex
  colM: 1.251,   // 中欄 flex
  colR: 1.179,   // 右欄 flex
  heroH: 58,   // 右欄「痛點卡」高度(% of 欄高)
  // 房屋資訊牆(c):6 欄 × 4 列的 grid 比例(現場以編輯模式拖出來的版面)。
  // 欄寬在原始拖曳結果上再做等比重分配,讓影片格(欄 5-6 × 列 1-2)回到 16:9:
  // 欄 1-4 之間、欄 5 與 6 之間的相對關係都保持不變,只是整體把 5-6 擴、1-4 縮。
  // 列高維持拖曳結果不動。
  bentoCols: [0.873, 0.467, 0.947, 0.878, 1.553, 1.282],
  bentoRows: [1, 0.904, 1.096, 1],
}

const load = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    return raw ? { ...LAYOUT_DEFAULT, ...raw } : { ...LAYOUT_DEFAULT }
  } catch { return { ...LAYOUT_DEFAULT } }
}

let state = load()
const subs = new Set()
const emit = () => subs.forEach((f) => f())

export const getLayout = () => state
export const subscribeLayout = (f) => { subs.add(f); return () => subs.delete(f) }

export function applyLayout(v = state) {
  const r = document.documentElement.style
  r.setProperty('--col-l', v.colL)
  r.setProperty('--col-m', v.colM)
  r.setProperty('--col-r', v.colR)
  r.setProperty('--hero-h', `${v.heroH}%`)
  r.setProperty('--bento-cols', (v.bentoCols || LAYOUT_DEFAULT.bentoCols).map((n) => `${n}fr`).join(' '))
  r.setProperty('--bento-rows', (v.bentoRows || LAYOUT_DEFAULT.bentoRows).map((n) => `${n}fr`).join(' '))
}
export function setLayout(patch) {
  state = { ...state, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* 無痕模式 */ }
  applyLayout(); emit()
}
export function resetLayout() {
  state = { ...LAYOUT_DEFAULT }
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  for (const k of ['--col-l', '--col-m', '--col-r', '--hero-h', '--bento-cols', '--bento-rows']) {
    document.documentElement.style.removeProperty(k)
  }
  emit()
}
