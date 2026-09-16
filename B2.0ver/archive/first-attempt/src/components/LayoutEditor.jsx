import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getEditing, subscribeBeam } from '../beamStore.js'
import { getLayout, setLayout, subscribeLayout } from '../layoutStore.js'

// ── 欄位版面編輯(按 E 進入)──────────────────────────────────────────────────
// 在情境牆上疊三條可拖的分隔線:
//   ┃ 左|中 · ┃ 中|右  → 改三欄寬度比例
//   ━ 痛點|解方 → 改痛點卡高度
// (影片格沒有高度線:它固定 16:9,高度由欄寬推導 → 拖欄寬就能改大小)
// 拖曳時用「相鄰兩欄的實際寬度」反推 flex(兩者總和固定)→ 不會影響第三欄。
const MIN_PX = 90

export default function LayoutEditor() {
  const editing = useSyncExternalStore(subscribeBeam, getEditing)
  const layout = useSyncExternalStore(subscribeLayout, getLayout)
  const [bars, setBars] = useState([])
  const dragRef = useRef(null)

  // 量目前欄位位置 → 換算成分隔線座標
  const measure = () => {
    const wrap = document.querySelector('.scene-cols')
    const L = document.querySelector('.scene-col--l')
    const M = document.querySelector('.scene-col--m')
    const R = document.querySelector('.scene-col--r')
    const hero = document.querySelector('.col-anchor--hero')
    if (!wrap || !L || !M || !R) return setBars([])
    const w = wrap.getBoundingClientRect()
    const rects = { L: L.getBoundingClientRect(), M: M.getBoundingClientRect(), R: R.getBoundingClientRect() }
    const next = [
      { key: 'vLM', dir: 'v', x: (rects.L.right + rects.M.left) / 2 - w.left, y0: 0, y1: w.height, label: '左 / 中' },
      { key: 'vMR', dir: 'v', x: (rects.M.right + rects.R.left) / 2 - w.left, y0: 0, y1: w.height, label: '中 / 右' },
    ]
    if (hero) {
      const h = hero.getBoundingClientRect()
      next.push({ key: 'hHero', dir: 'h', y: h.bottom - w.top, x0: h.left - w.left, x1: h.right - w.left, label: '痛點卡高' })
    }
    setBars(next)
  }

  useLayoutEffect(() => { if (editing) measure() }, [editing, layout])
  useEffect(() => {
    if (!editing) return
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    const id = setInterval(measure, 600)   // 欄內容會輪播換高度 → 定期校正分隔線位置
    return () => { window.removeEventListener('resize', onResize); clearInterval(id) }
  }, [editing])

  if (!editing) return null

  const onDown = (key) => (ev) => {
    ev.preventDefault(); ev.stopPropagation()
    dragRef.current = key
    const move = (e) => {
      const L = document.querySelector('.scene-col--l')?.getBoundingClientRect()
      const M = document.querySelector('.scene-col--m')?.getBoundingClientRect()
      const R = document.querySelector('.scene-col--r')?.getBoundingClientRect()
      const cur = getLayout()
      if (key === 'vLM' && L && M) {
        const sumW = L.width + M.width, sumF = cur.colL + cur.colM
        const lw = Math.min(Math.max(e.clientX - L.left, MIN_PX), sumW - MIN_PX)
        const colL = +(sumF * (lw / sumW)).toFixed(3)
        setLayout({ colL, colM: +(sumF - colL).toFixed(3) })
      } else if (key === 'vMR' && M && R) {
        const sumW = M.width + R.width, sumF = cur.colM + cur.colR
        const mw = Math.min(Math.max(e.clientX - M.left, MIN_PX), sumW - MIN_PX)
        const colM = +(sumF * (mw / sumW)).toFixed(3)
        setLayout({ colM, colR: +(sumF - colM).toFixed(3) })
      } else if (key === 'hHero' && R) {
        const pct = ((e.clientY - R.top) / R.height) * 100
        setLayout({ heroH: +Math.min(Math.max(pct, 10), 70).toFixed(1) })
      }
    }
    const up = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div className="ledit">
      {bars.map((b) => (
        <div
          key={b.key}
          className={`ledit__bar ledit__bar--${b.dir}`}
          onPointerDown={onDown(b.key)}
          style={b.dir === 'v'
            ? { left: b.x, top: b.y0, height: b.y1 - b.y0 }
            : { top: b.y, left: b.x0, width: b.x1 - b.x0 }}
        >
          <span className="ledit__tag">{b.label}</span>
        </div>
      ))}
    </div>
  )
}
