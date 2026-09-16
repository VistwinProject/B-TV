import { useEffect, useRef } from 'react'
import { getVoiceLevels } from '../speech.js'

// AI 聲紋視覺。播配音檔時用 Web Audio AnalyserNode **即時讀音檔振幅**驅動條高
//(真的隨聲音起伏);沒在播音檔時(語音關閉 / 用瀏覽器 TTS — 無法分析)退回擬真動畫。
// 用 rAF + ref 直接寫 transform,不走 framer,效能穩、跟得上音訊。
const BARS = 48

export default function Voiceprint({ accent = 'var(--scene-accent)' }) {
  const barsRef = useRef([])

  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const t = (now - t0) / 1000
      const levels = getVoiceLevels(BARS) // 真實音檔頻譜,或 null
      for (let i = 0; i < BARS; i++) {
        const el = barsRef.current[i]
        if (!el) continue
        const env = Math.sin((i / (BARS - 1)) * Math.PI) // 中央高、兩側低
        let h
        if (levels) {
          // 真實:頻譜振幅 × 中央包絡,加底噪讓靜音段不會全塌
          h = 0.06 + levels[i] * (0.45 + env * 0.55)
        } else {
          // 擬真 fallback(無音檔時的環境動態)
          const wob = 0.6 + 0.4 * Math.sin(t * 2.2 + i * 0.5)
          h = 0.10 + (0.12 + env * 0.20) * wob
        }
        el.style.transform = `scaleY(${Math.max(0.05, Math.min(1, h))})`
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="voiceprint" style={{ '--vp-accent': accent }}>
      {Array.from({ length: BARS }, (_, i) => (
        <span key={i} className="voiceprint__bar" ref={(el) => { barsRef.current[i] = el }} />
      ))}
    </div>
  )
}
