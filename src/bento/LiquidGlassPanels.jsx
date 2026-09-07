import { useEffect } from 'react'
// 第三方(MIT, © 2026 Deepika Rao)—— 原檔未修改,授權見 src/vendor/liquid-glass.LICENSE
// 它是 IIFE、掛在 window.liquidGlass 上,所以這裡 import 只為了執行它。
import '../vendor/liquid-glass.js'

// ── 真折射:把 vendor/liquid-glass.js 掛到情境牆的六張面板上 ──────────────────
// 那個套件是「一個元素一個 handle」的命令式 API,而這面牆的卡片會一直生滅:
//   · 換情境(1-5)→ 六張全部重掛載
//   · 左欄與右下解方卡每 5 秒換一次維度 → reel 換頁,舊卡被移除、新卡插入
// 所以不能只在掛載時掃一次 —— 用 MutationObserver 追 DOM,新卡補掛、舊卡 destroy。
// 不 destroy 的話每 5 秒會殘留一組 <filter> 與 canvas,展場連續跑幾小時會積成記憶體問題。
export default function LiquidGlassPanels({ enabled, scale, chroma, blur, saturate }) {
  useEffect(() => {
    if (!enabled) return
    const lg = window.liquidGlass
    const wall = document.querySelector('.scene-cols')
    if (!lg || !wall) return

    const handles = new Map()
    const sync = () => {
      wall.querySelectorAll('.tile').forEach((el) => {
        if (handles.has(el)) return
        handles.set(el, lg(el, { scale, chroma, blur, saturate }))
      })
      for (const [el, h] of handles) {
        if (!el.isConnected) { h.destroy(); handles.delete(el) }
      }
    }

    sync()
    const mo = new MutationObserver(sync)
    mo.observe(wall, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      handles.forEach((h) => h.destroy())
      handles.clear()
    }
  }, [enabled, scale, chroma, blur, saturate])

  return null
}
