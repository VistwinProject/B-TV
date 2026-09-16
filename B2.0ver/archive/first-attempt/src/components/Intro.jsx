import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Voiceprint from './Voiceprint.jsx'
import { speak, cancelSpeech } from '../speech.js'

// 前言 — 官方分鏡 step1+2:電視以 AI 聲紋 / AI 口吻開場(導覽人員操控)。
// 文案逐字對齊客戶分鏡。聲紋波形動畫 + 字幕,結尾倒數 3、2、1。
const LINE =
  '歡迎來到「感應光寓」。我們將以你在上個空間留下的資訊，為你打造專屬的居家體驗。準備好了嗎？體驗即將開始。'

export default function Intro() {
  const [count, setCount] = useState(null) // 3 | 2 | 1 | null

  useEffect(() => {
    speak(LINE, { cue: 'intro' })
    // 倒數在最後段落出現(對齊「3、2、1」),時間配合 App 的 INTRO_MS=11000
    const t3 = setTimeout(() => setCount(3), 7200)
    const t2 = setTimeout(() => setCount(2), 8400)
    const t1 = setTimeout(() => setCount(1), 9600)
    const t0 = setTimeout(() => setCount(null), 10800)
    return () => { [t3, t2, t1, t0].forEach(clearTimeout); cancelSpeech() }
  }, [])

  return (
    <div className="intro" style={{ '--scene-accent': 'var(--accent)' }}>
      {/* 倒數 3/2/1 時淡入的深色遮罩,讓背景變暗、數字更聚焦 */}
      <motion.div
        className="intro__dim"
        animate={{ opacity: count !== null ? 1 : 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      />
      <p className="intro__eyebrow">AI 聲紋 · VOICEPRINT</p>

      <Voiceprint accent="var(--idle-title)" />

      <motion.p
        className="intro__line"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {LINE}
      </motion.p>

      <AnimatePresence mode="wait">
        {count !== null && (
          <motion.div
            key={count}
            className="intro__count"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {count}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
