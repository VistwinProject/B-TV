import { motion } from 'framer-motion'

// 面積/折線圖磚 — 線條 left→right 描繪 + 面積淡入,呼應 GIF「Access to work from home」。
// values:0–1 的 y 陣列(底→頂)。
// 線/面積用 currentColor 繪製 → 自動適應卡片底色(深色字底→深線),不再吃固定 accent。
export default function LineChartTile({ values = [], title }) {
  const accent = 'currentColor'
  const W = 320, H = 150, pad = 6
  const n = values.length
  const x = (i) => pad + (i / (n - 1)) * (W - pad * 2)
  const y = (v) => H - pad - v * (H - pad * 2)
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L ${x(n - 1).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`

  return (
    <div className="chart">
      {title && <p className="chart__title">{title}</p>}
      <svg className="chart__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} className="chart__grid" />
        ))}
        <motion.path
          d={area} fill={accent} opacity={0.16}
          initial={{ opacity: 0 }} animate={{ opacity: 0.16 }} transition={{ duration: 0.8, delay: 0.5 }}
        />
        <motion.path
          d={line} fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: 'easeInOut' }}
        />
        {values.map((v, i) => (
          <motion.circle
            key={i} cx={x(i)} cy={y(v)} r={3.2} fill={accent}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 + (i / n) * 1.1 }} style={{ transformOrigin: `${x(i)}px ${y(v)}px` }}
          />
        ))}
      </svg>
    </div>
  )
}
