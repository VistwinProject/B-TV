import { motion } from 'framer-motion'

// bento 色塊磚 — 飽和平塗底 + 進場滑入/淡入(呼應 GIF 整牆重組的位移感)。
// props:color(palette key)、col/row(grid span)、active(被當前維度點亮時加描邊發光)、
//        flush(內容貼齊,無 padding,給圖表 / 房子 canvas 用)、delay。
export default function BentoTile({
  color = 'cream', col = 1, row = 1, active = false, flush = false, delay = 0, className = '', children, style,
}) {
  return (
    <motion.div
      className={`tile tile--${color}${active ? ' tile--active' : ''}${flush ? ' tile--flush' : ''} ${className}`}
      style={{ gridColumn: `span ${col}`, gridRow: `span ${row}`, ...style }}
      initial={{ opacity: 0, y: 26, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.985 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
