import { motion } from 'framer-motion'
import SensorRing from './SensorRing.jsx'
import Icon from './icons.jsx'
import { PERSONAS, PERSONA_ORDER } from '../personas.js'

// TV 主顯示的放置提示。卡片 / 角色兩種。
// 官方分鏡:卡片 →「打開邀請卡,將卡片移置感應區,同步房子的即時資訊」;
// 角色 →「可選擇右上方的問題情境鑰匙圈,於下方感應範圍。你的痛點,寶舖有解方!」
// TV 端把 5 個情境痛點以文宣疑問句列出,引導訪客選擇(實體鑰匙圈仍在桌面右上方)。
export default function PlacePrompt({ kind, onSelect }) {
  if (kind === 'card') {
    return (
      <div className="prompt">
        <p className="prompt__eyebrow">感應光寓 · SENSING RESIDENCE</p>
        <SensorRing>
          <Icon name="card" className="prompt__glyph" />
        </SensorRing>
        <div className="prompt__text">
          <h1 className="prompt__title">打開邀請卡，放上感應區</h1>
          <p className="prompt__sub">同步這間房子的即時健康資訊</p>
        </div>
      </div>
    )
  }

  // character
  return (
    <div className="prompt prompt--character">
      <p className="prompt__eyebrow">你的痛點，寶舖有解方</p>
      <h1 className="prompt__title prompt__title--top">選一個情境鑰匙圈，放上感應區</h1>

      <motion.ul
        className="persona-list"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }}
      >
        {PERSONA_ORDER.map((id, i) => {
          const p = PERSONAS[id]
          return (
            <motion.li
              key={id}
              className="persona-list__item"
              style={{ '--p-accent': p.accent }}
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <button className="persona-list__button" onClick={() => onSelect?.(id)} aria-label={`選擇${p.label}`} >
              <span className="persona-list__no">{String(i + 1).padStart(2, '0')}</span>
              <span className="persona-list__q">{p.prompt}</span>
              <span className="persona-list__name">{p.name}</span>
              </button>
            </motion.li>
          )
        })}
      </motion.ul>

      <p className="prompt__sub prompt__sub--bottom">房子會調整光、空氣、溫濕度與聲音來照顧你</p>
    </div>
  )
}
