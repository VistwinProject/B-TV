import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './icons.jsx'
import DimensionVisual from './DimensionVisual.jsx'
import { useCountUp } from '../useCountUp.js'
import { DIMENSION_ORDER, DIMENSION_META, SCENES } from '../scenes.js'

// 官方分鏡 step4:選角色後,電視「依序」展演解方動畫 ①光照 ②空氣 ③溫濕度 ④聲音。
// 整個客廳的環境設備(燈/空氣/溫濕/聲)同步切換 → TV 上以「環境同步中」狀態呼應。
// 每維度停留 DIM_MS;走完最後一維 → onComplete() → App 切到 loop。
const DIM_MS = 5000

export default function Scene({ persona, onComplete }) {
  const [step, setStep] = useState(0)
  const data = SCENES[persona.id]

  useEffect(() => {
    setStep(0)
    let i = 0
    const id = setInterval(() => {
      i += 1
      if (i >= DIMENSION_ORDER.length) {
        clearInterval(id)
        // 最後一維展演完再停留片刻,然後進 loop
        setTimeout(onComplete, DIM_MS)
        return
      }
      setStep(i)
    }, DIM_MS)
    return () => clearInterval(id)
  }, [persona.id, onComplete])

  const dimKey = DIMENSION_ORDER[step]
  const meta = DIMENSION_META[dimKey]
  const d = data[dimKey]

  return (
    <div className="scene" style={{ '--dim-tint': meta.tint }}>
      {/* 情境抬頭 */}
      <div className="scene__head">
        <span className="scene__persona" style={{ color: persona.accent }}>{persona.name}</span>
        <span className="scene__persona-title">{persona.title}</span>
      </div>

      {/* 4 維度進度條 */}
      <div className="scene__rail">
        {DIMENSION_ORDER.map((k, i) => {
          const m = DIMENSION_META[k]
          const state = i < step ? 'done' : i === step ? 'active' : 'todo'
          return (
            <div key={k} className={`rail__item rail__item--${state}`} style={{ '--rail-tint': m.tint }}>
              <span className="rail__idx">{m.index}</span>
              <span className="rail__label">{m.label}</span>
            </div>
          )
        })}
      </div>

      {/* 主舞台:當前維度的視覺 + 文案 + 數值 */}
      <div className="scene__stage">
        <AnimatePresence mode="wait">
          <motion.div
            key={dimKey}
            className="dim"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="dim__visual">
              <DimensionVisual dimKey={dimKey} persona={persona} data={d} />
            </div>

            <div className="dim__info">
              <span className="dim__tag">
                <span className="dim__tag-idx">{meta.index}</span>
                <Icon name={dimKey} className="dim__tag-icon" />
                {meta.label} · {meta.en}
              </span>
              <h2 className="dim__headline">{d.headline}</h2>
              <p className="dim__detail">{d.detail}</p>

              <div className="dim__metrics">
                {d.metrics.map((mt, i) => <Metric key={i} mt={mt} />)}
                {d.sound && <div className="dim__sound">{d.sound}</div>}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="scene__sync"><span className="scene__sync-dot" />環境設備同步中 · 燈光 / 空氣 / 溫濕度 / 聲音</p>
    </div>
  )
}

function Metric({ mt }) {
  // 數值若為純數字 → count-up;含區間(如 2200–6500)→ 直接顯示。
  const numeric = /^[\d.]+$/.test(String(mt.value))
  const decimals = String(mt.value).includes('.') ? 1 : 0
  const n = useCountUp(numeric ? Number(mt.value) : 0, { decimals, duration: 1200 })
  return (
    <div className="metric">
      <span className="metric__value">
        {numeric ? n : mt.value}<span className="metric__unit">{mt.unit}</span>
      </span>
      <span className="metric__note">{mt.note}</span>
    </div>
  )
}
