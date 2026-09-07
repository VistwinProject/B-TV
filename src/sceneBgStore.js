// ── 情境牆的背景樣式(佈展比稿用,按 Z / X / C 切換)────────────────────────────
//   beam   Z  待機頁那條弧線,顏色吃當頁主色
//   logo   X  滿版 ANLB,顏色吃當頁主色(淡)
//   invert C  反轉:底鋪當頁主色,ANLB 是白色
//   vlines V  深藍底 + 交錯光束(主視覺那張)
// 只在情境頁(scene / loop)有作用;存 localStorage,重整不會掉。
const KEY = 'sceneBg'
export const SCENE_BG_MODES = ['beam', 'logo', 'invert', 'vlines']
const DEFAULT = 'beam'

let mode = (() => {
  try {
    const v = localStorage.getItem(KEY)
    return SCENE_BG_MODES.includes(v) ? v : DEFAULT
  } catch { return DEFAULT }
})()

const subs = new Set()
export const getSceneBg = () => mode
export const subscribeSceneBg = (f) => { subs.add(f); return () => subs.delete(f) }
export function setSceneBg(next) {
  if (!SCENE_BG_MODES.includes(next) || next === mode) return
  mode = next
  try { localStorage.setItem(KEY, next) } catch { /* 無痕模式 */ }
  subs.forEach((f) => f())
}
