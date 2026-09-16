import { useCountUp } from '../useCountUp.js'

// 數字 count-up 文字 — 對齊 GIF 裡持續跳動的大數字(388→389→390…)。
export default function CountUp({ value, decimals = 0, duration = 1300, suffix = '', prefix = '' }) {
  const n = useCountUp(Number(value) || 0, { decimals, duration })
  return <>{prefix}{n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>
}
