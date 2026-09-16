import * as THREE from 'three'

// ── 每情境 × 每維度的房子燈光預設 ─────────────────────────────────────────────
// 「隨著每個情境變換燈光」:persona 決定基礎光氛(對應 OTA120 情境調性),
// scene 解方依序展演時,當前維度再微調(光照→提亮暖冷、聲音→脈動…)。
// HouseCanvas 每幀把當前燈光 lerp 到此處算出的 target,過場平滑。
//
// 欄位:key(主光色/強度)、accent(情境主色點光)、ambient、bg(畫布底色)、
//       fill(補光強度)、emissive(窗戶自發光強度 0-1)。

// 全部收斂成「舒服暖白、柔和、高補光」的範圍;各情境只做極輕微的冷暖/明暗區別,
// 不再有強烈藍/粉色光去汙染米白素模。
// 主光強、環境光低 → 明暗對比明顯、有立體感;顏色仍保持舒服暖白,各情境只微調冷暖
const PRESET = {
  'anti-aging': { keyColor: 0xfdf2e2, keyInt: 2.7, ambient: 0.38, fill: 0.32, emissive: 0.2, bg: 0x14161c }, // 中性偏暖
  child:        { keyColor: 0xfff8ef, keyInt: 2.9, ambient: 0.42, fill: 0.34, emissive: 0.2, bg: 0x14161c }, // 明亮中性
  elder:        { keyColor: 0xffedd2, keyInt: 2.7, ambient: 0.38, fill: 0.32, emissive: 0.2, bg: 0x14161c }, // 暖白
  pregnancy:    { keyColor: 0xfdebd6, keyInt: 2.45, ambient: 0.36, fill: 0.3, emissive: 0.2, bg: 0x14161c }, // 柔和暖
  nomad:        { keyColor: 0xf1f5fb, keyInt: 2.9, ambient: 0.4,  fill: 0.34, emissive: 0.2, bg: 0x14161c }, // 微涼日光
}

// 當前維度的微調(很輕,維持舒服)。
const DIM_MOD = {
  light: { keyMul: 1.12, ambientMul: 1.08 },  // 光照展演:略提亮
  air:   { keyTint: 0xeef4fb, keyMul: 1.0 },   // 空氣:極微冷
  temp:  { keyTint: 0xfff0e0, keyMul: 1.0 },   // 溫濕度:極微暖
  sound: { keyMul: 1.0, pulse: true },         // 聲音:輕脈動
}

const FALLBACK = { keyColor: 0xfdf2e2, keyInt: 2.7, ambient: 0.38, fill: 0.32, emissive: 0.2, bg: 0x14161c }

// 回傳該 persona + dimension 的 target 燈光物件(色用 THREE.Color)。
export function lightingTarget(personaId, dimKey, accentHex) {
  const base = PRESET[personaId] || FALLBACK
  const mod  = dimKey ? DIM_MOD[dimKey] : null

  const keyColor = new THREE.Color(mod?.keyTint ?? base.keyColor)
  const accent   = new THREE.Color(accentHex || '#4dbaba')

  return {
    keyColor,
    keyInt:    base.keyInt * (mod?.keyMul ?? 1),
    accent,
    accentInt: 0.4,   // 情境色點光收很弱,只輕點氣氛,不汙染米白
    ambient:   base.ambient * (mod?.ambientMul ?? 1),
    fill:      base.fill,
    emissive:  Math.min(1, base.emissive + (mod?.emissiveAdd ?? 0)),
    bg:        new THREE.Color(base.bg),
    pulse:     !!mod?.pulse,
  }
}
