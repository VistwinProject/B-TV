import { motion } from 'framer-motion'
import SensorRing from './SensorRing.jsx'
import { DIMENSION_ORDER, DIMENSION_META, SCENES } from '../scenes.js'
import Icon from './icons.jsx'

// 解方展演走完後的情境體驗狀態(輕量動畫)。整個客廳已切換成該情境環境;
// TV 顯示「房子正在為你照顧」+ 四維度目標摘要,並提示可換下一個角色。
// 刷新角色鑰匙圈 → App 直接切回 scene(重播)。
export default function SceneLoop({ persona }) {
  if (!persona) return null
  const data = SCENES[persona.id]
  return (
    <div className="loop">
      <p className="loop__status"><span className="loop__dot" />房子正在為你照顧</p>

      <SensorRing accent={persona.accent} pulse={false}>
        <span className="loop__name" style={{ textShadow: `0 0 24px ${persona.accent}` }}>{persona.name}</span>
      </SensorRing>

      <h1 className="loop__title">{persona.title}</h1>
      <p className="loop__line" style={{ color: `color-mix(in srgb, ${persona.accent} 55%, var(--c-text))` }}>{persona.line}</p>

      <motion.div
        className="loop__summary"
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
      >
        {DIMENSION_ORDER.map((k) => {
          const m = DIMENSION_META[k]
          const top = data[k].metrics[0]
          return (
            <motion.div
              key={k} className="loop__chip" style={{ '--chip-tint': m.tint }}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <Icon name={k} className="loop__chip-icon" />
              <span className="loop__chip-label">{m.label}</span>
              <span className="loop__chip-val">{top.value}<i>{top.unit}</i></span>
            </motion.div>
          )
        })}
      </motion.div>

      <p className="loop__hint">拿起鑰匙圈，換下一個情境</p>
    </div>
  )
}
