import { motion } from 'framer-motion'

// 四維度的解方視覺。官方分鏡「解方動畫表現法」:
//   ①燈泡/燈具(顏色變化)②風扇/空氣微粒(結合聲音)③水滴/溫度計 ④聲音 Bar。
// 簡易圖像 + 動態 + 顏色,搭配維度主色 (--dim-tint) 與情境主色 (persona.accent)。
export default function DimensionVisual({ dimKey, persona, data }) {
  if (dimKey === 'light')  return <LightViz />
  if (dimKey === 'air')    return <AirViz />
  if (dimKey === 'temp')   return <TempViz />
  if (dimKey === 'sound')  return <SoundViz label={data?.sound} />
  return null
}

// ① 光照 — 燈泡光暈,色溫呼吸 + 放射光線
function LightViz() {
  return (
    <div className="viz viz--light">
      <motion.div
        className="viz-light__glow"
        animate={{ opacity: [0.45, 1, 0.6], scale: [0.9, 1.12, 0.98] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {Array.from({ length: 12 }, (_, i) => (
        <motion.span
          key={i}
          className="viz-light__ray"
          style={{ rotate: `${i * 30}deg` }}
          animate={{ opacity: [0.15, 0.7, 0.15], scaleY: [0.7, 1, 0.7] }}
          transition={{ duration: 2.4, delay: (i % 6) * 0.18, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <motion.div
        className="viz-light__bulb"
        animate={{ boxShadow: [
          '0 0 40px 10px var(--dim-tint)',
          '0 0 90px 30px var(--dim-tint)',
          '0 0 50px 14px var(--dim-tint)',
        ] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ② 空氣 — 上升微粒 + 旋轉風扇環
function AirViz() {
  return (
    <div className="viz viz--air">
      <motion.div
        className="viz-air__fan"
        animate={{ rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      >
        {[0, 1, 2].map((i) => <span key={i} className="viz-air__blade" style={{ rotate: `${i * 120}deg` }} />)}
      </motion.div>
      {Array.from({ length: 18 }, (_, i) => {
        const x = (i * 53) % 100
        const dur = 3 + (i % 5) * 0.6
        const delay = (i % 9) * 0.4
        const size = 4 + (i % 4) * 2
        return (
          <motion.span
            key={i}
            className="viz-air__particle"
            style={{ left: `${x}%`, width: size, height: size }}
            animate={{ y: ['115%', '-15%'], opacity: [0, 0.85, 0] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}

// ③ 溫濕度 — 溫度計水銀升降 + 水滴
function TempViz() {
  return (
    <div className="viz viz--temp">
      <div className="viz-temp__thermo">
        <motion.span
          className="viz-temp__mercury"
          animate={{ height: ['28%', '74%', '60%'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="viz-temp__bulb" />
      </div>
      <div className="viz-temp__drops">
        {Array.from({ length: 6 }, (_, i) => (
          <motion.span
            key={i}
            className="viz-temp__drop"
            style={{ left: `${12 + i * 15}%` }}
            animate={{ y: ['-10%', '120%'], opacity: [0, 1, 0] }}
            transition={{ duration: 2.4 + (i % 3) * 0.5, delay: (i % 4) * 0.5, repeat: Infinity, ease: 'easeIn' }}
          />
        ))}
      </div>
    </div>
  )
}

// ④ 聲音 — 聲音 Bar(EQ)+ 白噪音 / Pink Noise 標籤
function SoundViz({ label }) {
  const BARS = 22
  return (
    <div className="viz viz--sound">
      <div className="viz-sound__eq">
        {Array.from({ length: BARS }, (_, i) => {
          const env = 0.3 + Math.sin((i / (BARS - 1)) * Math.PI) * 0.7
          return (
            <motion.span
              key={i}
              className="viz-sound__bar"
              animate={{ scaleY: [env * 0.3, env, env * 0.45, env * 0.85, env * 0.3] }}
              transition={{ duration: 0.8 + (i % 6) * 0.12, delay: (i % 7) * 0.06, repeat: Infinity, ease: 'easeInOut' }}
            />
          )
        })}
      </div>
      {label && <span className="viz-sound__label">{label}</span>}
    </div>
  )
}
