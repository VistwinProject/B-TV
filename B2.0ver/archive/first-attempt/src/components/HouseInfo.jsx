import { motion } from 'framer-motion'
import Icon from './icons.jsx'
import { HOUSE_INFO } from '../houseInfo.js'
import { useCountUp } from '../useCountUp.js'

// 房屋即時資訊 — 官方分鏡 step3:卡片放感應區後,電視顯示小圖標 + 數字:
// 室內外空氣品質、天氣預報、溫濕度、光照、聲音(連動寶舖 Sensor / 數位孿生平台)。
// 數字 count-up 製造即時感測感。資料源詳見 houseInfo.js(接 WELLTEK 後替換)。
export default function HouseInfo() {
  return (
    <div className="house">
      <div className="house__head">
        <p className="house__eyebrow">寶舖 Sensor · 數位孿生平台</p>
        <h1 className="house__title">這間房子的即時健康資訊</h1>
        <p className="house__live"><span className="house__livedot" />LIVE · 12-in-1 Sensor</p>
      </div>

      <motion.div
        className="house__grid"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      >
        {HOUSE_INFO.map((m) => <StatCard key={m.key} m={m} />)}
      </motion.div>
    </div>
  )
}

function StatCard({ m }) {
  const n = useCountUp(m.value, { decimals: m.decimals || 0, duration: 1200 })
  return (
    <motion.div
      className={`stat stat--${m.status}`}
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="stat__icon"><Icon name={m.icon} /></span>
      <span className="stat__label">{m.label}</span>
      <span className="stat__value">
        {m.text ? <span className="stat__text">{m.text}</span> : n}
        {m.text ? <span className="stat__unit"> {n}{m.unit}</span> : <span className="stat__unit">{m.unit}</span>}
      </span>
    </motion.div>
  )
}
