import { motion } from 'framer-motion'
import { asset } from '../assetUrl.js'

// 待機吸引畫面。導覽人員按下開始(i / Enter,或 server override 'intro')→ 進入前言。
// 無互動元件,純氛圍。
export default function Idle() {
  return (
    <div className="idle">
      <motion.div
        className="idle__halo"
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.h1
        className="idle__title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        感應光寓
      </motion.h1>
      <motion.p
        className="idle__sub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.4 }}
      >
        SENSING RESIDENCE
      </motion.p>
      <motion.p
        className="idle__hint"
        animate={{ opacity: [0.35, 0.85, 0.35] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        請入座，將邀請卡放上感應區
      </motion.p>

      {/* 商標:置中靠下。用 PNG 的 alpha 當遮罩、顏色由 CSS 漸層決定
          → 不吃圖檔原本偏青的漸層,可直接對齊 #7ac3ff 色系。 */}
      <motion.div
        className="idle__logo"
        role="img"
        aria-label="ANLB inside"
        style={{ '--logo-src': `url(${asset('icons/anlb.png')})` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.95 }}
        transition={{ duration: 1.2, delay: 0.8 }}
      />
    </div>
  )
}
