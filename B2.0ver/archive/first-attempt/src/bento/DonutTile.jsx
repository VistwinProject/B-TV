import { motion } from 'framer-motion'

// 甜甜圈圖磚 — 各段依序淡入(staggered),圖例隨後出現,呼應 GIF 右上的 donut chart。
// segments:[{ value, color, label }]。value 為相對比重。
// 用 currentColor + 不同濃淡畫各段 → 自動適應卡片底色,單色乾淨。
export default function DonutTile({ segments = [], centerTop, centerSub }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const R = 52, C = 2 * Math.PI * R
  const op = (i) => 0.9 - i * 0.14
  let acc = 0

  return (
    <div className="donut">
      <svg className="donut__svg" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={R} className="donut__track" />
        {segments.map((s, i) => {
          const frac = s.value / total
          const dash = Math.max(0, frac * C - 3) // 3px 間隙
          const offset = -acc * C
          acc += frac
          return (
            <motion.circle
              key={i} cx="70" cy="70" r={R} fill="none" stroke="currentColor" strokeOpacity={op(i)} strokeWidth="16"
              strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.3 + i * 0.16, ease: 'easeOut' }}
            />
          )
        })}
        {centerTop && <text x="70" y="68" className="donut__c-top">{centerTop}</text>}
        {centerSub && <text x="70" y="88" className="donut__c-sub">{centerSub}</text>}
      </svg>
      <ul className="donut__legend">
        {segments.map((s, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.12 }}>
            <span className="donut__sw" style={{ background: 'currentColor', opacity: op(i) }} />{s.label}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
