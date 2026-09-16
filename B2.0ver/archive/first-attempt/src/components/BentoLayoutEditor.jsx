import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'
import { getEditing, subscribeBeam } from '../beamStore.js'
import { getLayout, setLayout, subscribeLayout } from '../layoutStore.js'

// ── 房屋資訊牆(6×4 grid)欄寬 / 列高編輯(按 E 進入)──────────────────────────
// 在 5 條直格線與 3 條橫格線上疊可拖的把手。
// 尺寸直接讀 grid-template-columns/rows 的「已解析像素值」→ 不必自己重算 gap 與 padding。
const MIN_PX = 60

const usedTracks = (el, axis) => {
  const v = getComputedStyle(el)[axis === 'x' ? 'gridTemplateColumns' : 'gridTemplateRows']
  return v.split(' ').map(parseFloat).filter((n) => !Number.isNaN(n))
}

export default function BentoLayoutEditor() {
  const editing = useSyncExternalStore(subscribeBeam, getEditing)
  const layout = useSyncExternalStore(subscribeLayout, getLayout)
  const [bars, setBars] = useState([])

  const measure = () => {
    const grid = document.querySelector('.bento')
    if (!grid) return setBars([])
    const box = grid.getBoundingClientRect()
    const cs = getComputedStyle(grid)
    const padL = parseFloat(cs.paddingLeft), padT = parseFloat(cs.paddingTop)
    const gapX = parseFloat(cs.columnGap) || 0, gapY = parseFloat(cs.rowGap) || 0
    const cols = usedTracks(grid, 'x'), rows = usedTracks(grid, 'y')

    const next = []
    let x = padL
    for (let i = 0; i < cols.length - 1; i++) {
      x += cols[i]
      next.push({ key: `c${i}`, dir: 'v', pos: x + gapX / 2, from: 0, to: box.height, label: `欄 ${i + 1}|${i + 2}` })
      x += gapX
    }
    let y = padT
    for (let i = 0; i < rows.length - 1; i++) {
      y += rows[i]
      next.push({ key: `r${i}`, dir: 'h', pos: y + gapY / 2, from: 0, to: box.width, label: `列 ${i + 1}|${i + 2}` })
      y += gapY
    }
    setBars(next)
  }

  useLayoutEffect(() => { if (editing) measure() }, [editing, layout])
  useEffect(() => {
    if (!editing) return
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [editing])

  if (!editing) return null

  const onDown = (key) => (ev) => {
    ev.preventDefault(); ev.stopPropagation()
    const axis = key[0] === 'c' ? 'x' : 'y'
    const idx = +key.slice(1)
    const move = (e) => {
      const grid = document.querySelector('.bento')
      if (!grid) return
      const box = grid.getBoundingClientRect()
      const cs = getComputedStyle(grid)
      const pad = parseFloat(axis === 'x' ? cs.paddingLeft : cs.paddingTop)
      const gap = parseFloat(axis === 'x' ? cs.columnGap : cs.rowGap) || 0
      const used = usedTracks(grid, axis)
      const cur = getLayout()
      const fr = [...(axis === 'x' ? cur.bentoCols : cur.bentoRows)]

      // 這條格線左(上)側所有軌道 + gap 的總長 → 換算指標位置對應的新軌道長度
      let start = (axis === 'x' ? box.left : box.top) + pad
      for (let i = 0; i < idx; i++) start += used[i] + gap
      const sumPx = used[idx] + used[idx + 1]
      const sumFr = fr[idx] + fr[idx + 1]
      const p = axis === 'x' ? e.clientX : e.clientY
      const first = Math.min(Math.max(p - start, MIN_PX), sumPx - MIN_PX)
      fr[idx] = +(sumFr * (first / sumPx)).toFixed(3)
      fr[idx + 1] = +(sumFr - fr[idx]).toFixed(3)
      setLayout(axis === 'x' ? { bentoCols: fr } : { bentoRows: fr })
    }
    const up = () => {
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
            ? { left: b.pos, top: b.from, height: b.to - b.from }
            : { top: b.pos, left: b.from, width: b.to - b.from }}
        >
          <span className="ledit__tag">{b.label}</span>
        </div>
      ))}
    </div>
  )
}
