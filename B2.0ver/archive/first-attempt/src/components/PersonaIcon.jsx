// ── 情境角色圖標 ──────────────────────────────────────────────────────────────
import { asset } from '../assetUrl.js'
// 直接用設計端提供的 CI 圖檔(白色線稿、透明底),不再手繪 SVG。
// 五個 icon 在同一張長條圖裡(public/icons/personas.png,2051×173),
// 下面的 box 是用 canvas 掃 alpha 通道實測出來的每個 icon 邊界,再換算成 CSS sprite。
const SPRITE = { url: asset('icons/personas.png'), w: 2051, h: 173 }
const BOX = {
  pregnancy:    { x: 0,    y: 1, w: 165, h: 169 },   // 孕婦照護
  'anti-aging': { x: 470,  y: 0, w: 172, h: 169 },   // 居家抗老
  child:        { x: 929,  y: 3, w: 179, h: 170 },   // 兒童免疫
  elder:        { x: 1405, y: 4, w: 181, h: 168 },   // 在宅樂齡
  nomad:        { x: 1873, y: 0, w: 178, h: 168 },   // 數位遊牧
}

export default function PersonaIcon({ id, className = '', style }) {
  const b = BOX[id]
  if (!b) return null
  return (
    <span
      className={`picon ${className}`}
      style={{
        aspectRatio: `${b.w} / ${b.h}`,
        backgroundImage: `url(${SPRITE.url})`,
        // 讓這個 icon 的原始寬度剛好等於元素寬度
        backgroundSize: `${(SPRITE.w / b.w) * 100}% auto`,
        backgroundPosition: `${(b.x / (SPRITE.w - b.w)) * 100}% ${(b.y / (SPRITE.h - b.h)) * 100}%`,
        ...style,
      }}
    />
  )
}
