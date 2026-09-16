import { useEffect, useRef, useState } from 'react'

// 數字 count-up — 房屋即時資訊 / 解方數值「跳動到位」的即時感。
// easeOutCubic;支援小數位。target 變更時自動從目前值補間到新值。
export function useCountUp(target, { duration = 1100, decimals = 0 } = {}) {
  const [val, setVal] = useState(0)
  const fromRef = useRef(0)
  const rafRef  = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    cancelAnimationFrame(rafRef.current)

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const cur = from + (target - from) * eased
      setVal(cur)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  const p = Math.pow(10, decimals)
  return Math.round(val * p) / p
}
