// ── 情境牆(1-5)欄位版面 ─────────────────────────────────────────────────────
// 三欄的寬度比例 + 兩張錨定卡的高度百分比。值以 CSS 變數套用,編輯模式可直接拖分隔線。
//
// 版面分兩層(顏色是「每情境各自選」,版面同理):
//   共用底版 LAYOUT_DEFAULT  → 五個情境的起點,也是房屋資訊牆(c)唯一的一份
//   每情境覆寫 SCENE_LAYOUTS → 只蓋 colL/colM/colR/heroH,沒設的欄位沿用共用底版
// 目前顯示中的情境由 App 以 setLayoutTarget() 告知 → 換角色即換版面(展演時也生效,
// 不只編輯模式)。拖分隔線 / 拉滑桿時只會寫進「當前這個情境」,不會動到其他四個。
const KEY  = 'sceneLayout'           // 共用底版 + 房屋資訊牆(既有 key,不動)
const PKEY = 'sceneLayoutByPersona'  // 每情境覆寫

// 可以「分情境」的欄位;其餘(bentoCols/bentoRows)永遠是共用的
export const SCENE_KEYS = ['colL', 'colM', 'colR', 'heroH']

export const LAYOUT_DEFAULT = {
  // 情境牆(1-5)共用底版 —— 沒有各自覆寫的情境就用這組
  colL: 0.92,    // 左欄 flex
  colM: 1.251,   // 中欄 flex
  colR: 1.179,   // 右欄 flex
  heroH: 58,     // 右欄「痛點卡」高度(% of 欄高)
  // 房屋資訊牆(c):6 欄 × 4 列的 grid 比例(現場以編輯模式拖出來的版面)。
  // 欄寬在原始拖曳結果上再做等比重分配,讓影片格(欄 5-6 × 列 1-2)回到 16:9:
  // 欄 1-4 之間、欄 5 與 6 之間的相對關係都保持不變,只是整體把 5-6 擴、1-4 縮。
  // 列高維持拖曳結果不動。
  bentoCols: [0.873, 0.467, 0.947, 0.878, 1.553, 1.282],
  bentoRows: [1, 0.904, 1.096, 1],
}

// ── 每情境版面(佈展調好後,按編輯面板的「複製 CSS」把這段貼回來就固化)──────────
// key = persona id;只列出要跟共用底版不一樣的情境,沒列到的就沿用 LAYOUT_DEFAULT。
// 現場以編輯模式(E)逐一拖出來的版面(2026-09-07 固化)。
// 'pregnancy' 與共用底版完全相同 → 那一頁沒有個別調過,是直接沿用底版的結果。
export const SCENE_LAYOUTS = {
  'anti-aging': { colL: 0.62,  colM: 1.063, colR: 1.069, heroH: 46 },  // 居家抗老
  'child':      { colL: 0.91,  colM: 1.36,  colR: 1.08,  heroH: 34 },  // 兒童免疫
  'elder':      { colL: 0.86,  colM: 1.287, colR: 1.203, heroH: 58 },  // 在宅樂齡
  'pregnancy':  { colL: 0.82,  colM: 1.35,  colR: 1.18,  heroH: 40 },  // 孕婦照護
  'nomad':      { colL: 0.969, colM: 1.381, colR: 1,     heroH: 28 },  // 數位遊牧
}

const read = (k, fallback) => {
  try {
    const raw = JSON.parse(localStorage.getItem(k) || 'null')
    return raw && typeof raw === 'object' ? raw : fallback
  } catch { return fallback }
}
const write = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* 無痕模式 */ }
}

let base   = { ...LAYOUT_DEFAULT, ...read(KEY, null) }  // 共用底版(+ bento)
let per    = read(PKEY, {})                             // { [personaId]: 部分 SCENE_KEYS }
let target = null                                       // 目前顯示/編輯中的情境 id

// 疊法:共用底版 → 程式碼固化的該情境版面 → localStorage 的該情境調整
const compose = () => (target
  ? { ...base, ...SCENE_LAYOUTS[target], ...per[target] }
  : { ...base })

// useSyncExternalStore 要求 getSnapshot 回傳穩定參考 → 只在 setter 裡重算並快取
let view = compose()

const subs = new Set()
const emit = () => subs.forEach((f) => f())

export const getLayout = () => view
export const subscribeLayout = (f) => { subs.add(f); return () => subs.delete(f) }

// 目前是哪個情境?(null = 待機/房屋資訊牆等非情境頁 → 編輯的是共用底版)
export const getLayoutTarget = () => target
// 這個情境的版面現在是哪來的(編輯面板用來標示 + 決定「還原」能不能按):
//   'local' = 現場調過、還沒存回檔案   'file' = 檔案裡固化的那組   'base' = 沿用共用底版
export const sceneLayoutSource = (id) => (per[id] ? 'local' : SCENE_LAYOUTS[id] ? 'file' : 'base')
// 這個情境有沒有自己的版面(不論來源)
export const hasSceneLayout = (id) => Boolean(SCENE_LAYOUTS[id] || per[id])
// 五個情境目前生效的完整版面(給「複製 CSS」輸出用)
export const getSceneLayouts = () => {
  const out = {}
  for (const id of new Set([...Object.keys(SCENE_LAYOUTS), ...Object.keys(per)])) {
    const v = { ...base, ...SCENE_LAYOUTS[id], ...per[id] }
    out[id] = Object.fromEntries(SCENE_KEYS.map((k) => [k, v[k]]))
  }
  return out
}

export function applyLayout(v = view) {
  const r = document.documentElement.style
  r.setProperty('--col-l', v.colL)
  r.setProperty('--col-m', v.colM)
  r.setProperty('--col-r', v.colR)
  r.setProperty('--hero-h', `${v.heroH}%`)
  r.setProperty('--bento-cols', (v.bentoCols || LAYOUT_DEFAULT.bentoCols).map((n) => `${n}fr`).join(' '))
  r.setProperty('--bento-rows', (v.bentoRows || LAYOUT_DEFAULT.bentoRows).map((n) => `${n}fr`).join(' '))
}

const refresh = () => { view = compose(); applyLayout(); emit() }

// 換情境 → 換版面(展演中也會呼叫,不是只有編輯模式)
export function setLayoutTarget(id) {
  if (target === id) return
  target = id || null
  refresh()
}

// 在情境頁調 colL/colM/colR/heroH → 只寫進當前情境;
// bentoCols/bentoRows 或非情境頁的調整 → 寫進共用底版。
export function setLayout(patch) {
  const scenePatch = {}, basePatch = {}
  for (const [k, v] of Object.entries(patch)) {
    if (target && SCENE_KEYS.includes(k)) scenePatch[k] = v
    else basePatch[k] = v
  }
  if (Object.keys(basePatch).length) { base = { ...base, ...basePatch }; write(KEY, base) }
  if (Object.keys(scenePatch).length) {
    per = { ...per, [target]: { ...SCENE_LAYOUTS[target], ...per[target], ...scenePatch } }
    write(PKEY, per)
  }
  refresh()
}

// 把目前這個情境的版面套到全部五個情境(調好一個當基準,其餘一鍵對齊)
export function copySceneLayoutToAll(ids) {
  const v = Object.fromEntries(SCENE_KEYS.map((k) => [k, view[k]]))
  per = { ...per }
  for (const id of ids) per[id] = { ...v }
  write(PKEY, per)
  refresh()
}

// 這個情境回到共用底版(清掉它自己的覆寫)
export function resetSceneLayout(id) {
  if (!id || !per[id]) return
  per = { ...per }
  delete per[id]
  write(PKEY, per)
  refresh()
}

export function resetLayout() {
  base = { ...LAYOUT_DEFAULT }
  per = {}
  try { localStorage.removeItem(KEY); localStorage.removeItem(PKEY) } catch { /* ignore */ }
  for (const k of ['--col-l', '--col-m', '--col-r', '--hero-h', '--bento-cols', '--bento-rows']) {
    document.documentElement.style.removeProperty(k)
  }
  view = compose()
  emit()
}
