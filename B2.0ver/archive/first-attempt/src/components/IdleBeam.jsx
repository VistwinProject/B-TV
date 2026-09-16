import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getBeam, getEditing, subscribeBeam, setBeam } from '../beamStore.js'

// ── 待機頁光束(SVG 帶狀路徑)──────────────────────────────────────────────────
// 為什麼不用 CSS 漸層:漸層的光束只能是「等寬的圓弧」,做不到三點自由造型
// (含旋轉)與頭/中/尾不同寬。改成沿二次貝茲曲線鋪一條變寬度的帶子:
//   ① 外光暈(上緣鋪很開、下緣收很快)② 內暈 ③ 亮核
// 三層都是同一條中心線、只有左右偏移量與模糊不同 → 維持「上緣白、下緣俐落」。
const REF_W = 1920          // 寬度以 1920 為基準,其他解析度等比縮放
const SAMPLES = 120
const T_MIN = -0.45, T_MAX = 1.45   // 曲線往兩端延伸出畫面,不會看到端點

// 二次貝茲:控制點反推,讓曲線 t=0.5 時「真的通過」中間那個造型點
const ctrl = (a, m, b) => 2 * m - (a + b) / 2
const q = (a, c, b, t) => { const u = 1 - t; return u * u * a + 2 * u * t * c + t * t * b }
const dq = (a, c, b, t) => 2 * (1 - t) * (c - a) + 2 * t * (b - c)

function ribbon(pts, up, lo) {
  // 上緣往前走、下緣往回走,收成一個封閉多邊形
  const a = pts.map((p, i) => `${i ? 'L' : 'M'}${(p.x + p.nx * up[i]).toFixed(2)} ${(p.y + p.ny * up[i]).toFixed(2)}`)
  const b = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    b.push(`L${(p.x - p.nx * lo[i]).toFixed(2)} ${(p.y - p.ny * lo[i]).toFixed(2)}`)
  }
  return `${a.join('')}${b.join('')}Z`
}

// interactive=false:只畫光,不顯示三個造型點(情境牆當背景用,拖點只該在待機頁做)
export default function IdleBeam({ interactive = true, className = '' }) {
  const beam = useSyncExternalStore(subscribeBeam, getBeam)
  const editingRaw = useSyncExternalStore(subscribeBeam, getEditing)
  const editing = interactive && editingRaw
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const svgRef = useRef(null)
  const dragRef = useRef(null)

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { w: W, h: H } = size
  const k = W / REF_W                                   // 寬度縮放係數
  const P = (p) => ({ x: (p.x / 100) * W, y: (p.y / 100) * H })
  const p0 = P(beam.p0), p1 = P(beam.p1), p2 = P(beam.p2)
  const cx = ctrl(p0.x, p1.x, p2.x), cy = ctrl(p0.y, p1.y, p2.y)
  const cw = ctrl(beam.w0, beam.w1, beam.w2)

  // 取樣中心線:位置、單位法線、該處半寬
  const pts = [], half = []
  for (let i = 0; i <= SAMPLES; i++) {
    const t = T_MIN + (T_MAX - T_MIN) * (i / SAMPLES)
    const x = q(p0.x, cx, p2.x, t), y = q(p0.y, cy, p2.y, t)
    const tx = dq(p0.x, cx, p2.x, t), ty = dq(p0.y, cy, p2.y, t)
    const len = Math.hypot(tx, ty) || 1
    pts.push({ x, y, nx: ty / len, ny: -tx / len })     // 法線指向「上」那側
    const tw = Math.min(1, Math.max(0, t))              // 端點外的寬度維持不變
    half.push(Math.max(0.5, q(beam.w0, cw, beam.w2, tw)) * k / 2)
  }

  const scale = (arr, m) => arr.map((v) => v * m)
  const g = beam.glow, e = beam.edge
  // 四層都貼同一條中心線,只有上/下偏移量與模糊不同 → 上緣鋪很開、下緣收很快
  const layers = [
    { up: scale(half, 24 * g), lo: scale(half, 2.6 * e), blur: 26 * k, fill: 'var(--beam-glow)',  op: 0.20 },
    { up: scale(half, 8.5 * g), lo: scale(half, 1.9 * e), blur: 13 * k, fill: 'var(--beam-edge)',  op: 0.30 },
    { up: scale(half, 3.0 * g), lo: scale(half, 1.25 * e), blur: 5 * k, fill: 'var(--beam-inner)', op: 0.72 },
    { up: half, lo: half, blur: 1.2 * k, fill: 'var(--beam-core)', op: 1 },
  ]

  // ── 拖曳造型點 ──────────────────────────────────────────────────────────────
  // 監聽掛在 window:游標滑出 svg、或被其他圖層擋到時,拖曳都不會中斷。
  const onDown = (key) => (ev) => {
    ev.preventDefault()
    dragRef.current = key
    const move = (e) => {
      const r = svgRef.current.getBoundingClientRect()
      setBeam({ [key]: {
        x: +(((e.clientX - r.left) / r.width) * 100).toFixed(2),
        y: +(((e.clientY - r.top) / r.height) * 100).toFixed(2),
      } })
    }
    const up = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const HANDLES = [
    { key: 'p0', pt: p0, label: '尾' },
    { key: 'p1', pt: p1, label: '中' },
    { key: 'p2', pt: p2, label: '頭' },
  ]

  return (
    <svg
      ref={svgRef}
      className={`idlebeam${editing ? ' idlebeam--edit' : ''}${className ? ` ${className}` : ''}`}
      viewBox={`0 0 ${W} ${H}`} width={W} height={H}
    >
      {layers.map((l, i) => (
        <path key={i} d={ribbon(pts, l.up, l.lo)} fill={l.fill} opacity={l.op}
          style={{ filter: `blur(${l.blur.toFixed(1)}px)` }} />
      ))}

      {editing && (
        <g className="idlebeam__handles">
          <path d={`M${p0.x} ${p0.y}L${p1.x} ${p1.y}L${p2.x} ${p2.y}`} fill="none"
            stroke="#04091c" strokeWidth="3.5" strokeDasharray="6 6" opacity="0.7" />
          <path d={`M${p0.x} ${p0.y}L${p1.x} ${p1.y}L${p2.x} ${p2.y}`} fill="none"
            stroke="#8fdcff" strokeWidth="1.4" strokeDasharray="6 6" />
          {HANDLES.map((h) => (
            <g key={h.key} onPointerDown={onDown(h.key)} style={{ cursor: 'grab' }}>
              <circle cx={h.pt.x} cy={h.pt.y} r="18" fill="#050b1e" fillOpacity="0.9" stroke="#04091c" strokeWidth="4" />
              <circle cx={h.pt.x} cy={h.pt.y} r="18" fill="none" stroke="#8fdcff" strokeWidth="2" />
              <text x={h.pt.x} y={h.pt.y + 6} textAnchor="middle" fontSize="15" fontWeight="700" fill="#e6f5ff">{h.label}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}
