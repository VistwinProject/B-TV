import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Voiceprint from './Voiceprint.jsx'
import { speak, cancelSpeech } from '../speech.js'

// 結語 — 官方分鏡 step5:闔書後,電視以聲音 Bar + AI 口吻播放結語(導覽人員操控)。
// 文案逐字對齊客戶分鏡。播完後 App 自動回到待機(前往下個展區 C 區)。
const LINE = '房子的健康，就是你的健康。房子的健康，我有解方。請往下個展區體驗。'

export default function Outro() {
  useEffect(() => {
    speak(LINE, { cue: 'outro' })
    return () => cancelSpeech()
  }, [])

  return (
    <div className="outro" style={{ '--scene-accent': 'var(--accent)' }}>
      <p className="outro__eyebrow">結語 · OUTRO</p>

      <Voiceprint accent="var(--idle-title)" />

      <motion.h1
        className="outro__line"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        房子的健康，就是你的健康
      </motion.h1>
      <motion.p
        className="outro__sub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        房子的健康，我有解方　·　請往下個展區體驗
      </motion.p>
    </div>
  )
}
