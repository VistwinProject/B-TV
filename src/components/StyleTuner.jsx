import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { getBeam, subscribeBeam, setBeam, resetBeam, setEditing, BEAM_DEFAULT } from '../beamStore.js'
import { getLayout, subscribeLayout, setLayout, resetLayout } from '../layoutStore.js'
import { getSceneColors, getEditContext, subscribeSceneColors, setSceneColor, resetSceneColors, SLOTS, slotColor,
  BENTO_PANELS, getBentoColors, setBentoColor, resetBentoColors,
  getBentoBeam, toggleBentoBeam, resetBentoBeam } from '../sceneColorStore.js'
import { PERSONAS } from '../personas.js'

// ── 待機頁配色編輯器(開發/佈展調色用,按 E 開關)──────────────────────────────
// 面板直接改 :root 的 CSS 變數 → 畫面即時變;值存 localStorage,重整不會掉。
// 調到滿意按「複製 CSS」,把整段貼回 src/style.css 的 :root 就固化了。
// kiosk 正常播放時面板關閉、游標維持隱藏,完全不影響展場。
const VARS = [
  { key: '--idle-bg-1',  label: '背景 · 深端(左上)',  def: '#121263' },
  { key: '--idle-bg-2',  label: '背景 · 主色',         def: '#121c49' },
  { key: '--idle-bg-3',  label: '背景 · 亮端(右下)',  def: '#000019' },
  { key: '--idle-haze',  label: '背景 · 中央藍霧',     def: '#308acf' },
  { key: '--beam-core',  label: '光束 · 核心',         def: '#ffffff' },
  { key: '--beam-inner', label: '光束 · 內暈',         def: '#ade5ff' },
  { key: '--beam-glow',  label: '光束 · 中暈',         def: '#8ad2ff' },
  { key: '--beam-edge',  label: '光束 · 外暈',         def: '#2e9aff' },
  { key: '--idle-title', label: '大標 感應光寓',       def: '#7ac3ff' },
  { key: '--idle-sub',   label: '英文 SENSING…',       def: '#7ac3ff' },
  { key: '--idle-hint',  label: '小標 請入座…',        def: '#7ac3ff' },
]
// white 版用獨立的 key:舊的深色版調色值存在 localStorage,會在掛載時被寫回 :root 的
// inline style,權重高過樣式表 → 換主題後畫面看起來「沒改」。分開存,兩版互不干擾。
const LS_KEY = 'idleStyleTuner-white'

// ── 光束幾何:形狀靠畫面上三個點直接拖,這裡只調寬度與光暈 ────────────────────
const GEO = [
  { key: 'w0',   label: '尾寬(左下)', min: 2,   max: 90, step: 1,    unit: 'px' },
  { key: 'w1',   label: '中寬',        min: 2,   max: 90, step: 1,    unit: 'px' },
  { key: 'w2',   label: '頭寬(右上)', min: 2,   max: 90, step: 1,    unit: 'px' },
  { key: 'glow', label: '上緣光暈',    min: 0.2, max: 3,  step: 0.05, unit: '×' },
  { key: 'edge', label: '下緣收邊',    min: 0.2, max: 3,  step: 0.05, unit: '×' },
]

// 情境牆(1-5)欄位版面;畫面上也可直接拖分隔線
const LAY = [
  { key: 'colL',   label: '左欄寬',   min: 0.4, max: 2.5, step: 0.05, unit: '' },
  { key: 'colM',   label: '中欄寬',   min: 0.4, max: 2.5, step: 0.05, unit: '' },
  { key: 'colR',   label: '右欄寬',   min: 0.4, max: 2.5, step: 0.05, unit: '' },
  { key: 'heroH',  label: '痛點卡高', min: 10,  max: 70,  step: 1,    unit: '%' },
]

// ── hex ↔ hsl ────────────────────────────────────────────────────────────────
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  const l = (max + min) / 2
  let h = 0, s = 0
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}
function hslToHex({ h, s, l }) {
  const S = s / 100, L = l / 100
  const c = (1 - Math.abs(2 * L - 1)) * S
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = L - c / 2
  const seg = [[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor((h % 360) / 60)]
  const to = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${to(seg[0])}${to(seg[1])}${to(seg[2])}`
}

// 預設值以 style.css 的 :root 為準(不要在這裡再複製一份,否則會蓋掉 CSS 的值)
const cssValue = (key, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(key).trim() || fallback

// 主題簽章 = 目前 CSS 預設值的組合。存檔時一起寫進去,載入時比對:
// 對不上(= style.css 換過主題)就整包丟掉,讓新的 CSS 預設值生效。
// 沒有這道檢查的話,舊主題調過的顏色會被寫回 :root 的 inline style
// (權重高過樣式表)→ 換了主題但畫面看起來沒變 / 顏色跑掉。
// 只在第一次呼叫時算(那時還沒套用任何 inline 覆寫 → 讀到的就是 CSS 的預設值)。
// 之後存檔時再算的話會讀到「已經被覆寫的值」,簽章就永遠對不上、每次載入都被清掉。
let BASE_SIG = null
const themeSig = () => (BASE_SIG ??= VARS.map((v) => cssValue(v.key, v.def)).join('|'))

const loadSaved = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
    if (!raw || !raw.vals) return {}                    // 舊格式(沒有簽章)→ 不採用
    if (raw.sig !== themeSig()) { localStorage.removeItem(LS_KEY); return {} }
    return raw.vals
  } catch { return {} }
}

export default function StyleTuner() {
  const [open, setOpen] = useState(false)
  const [vals, setVals] = useState(() => {
    const saved = loadSaved()
    return Object.fromEntries(VARS.map((v) => [v.key, saved[v.key] || cssValue(v.key, v.def)]))
  })
  const beam = useSyncExternalStore(subscribeBeam, getBeam)
  const lay = useSyncExternalStore(subscribeLayout, getLayout)
  const sceneSel = useSyncExternalStore(subscribeSceneColors, getSceneColors)
  const ctx = useSyncExternalStore(subscribeSceneColors, getEditContext)
  const curId = ctx.persona
  const isIdle = ctx.phase === 'idle'
  const isHouse = ctx.phase === 'house'
  const bentoSel = useSyncExternalStore(subscribeSceneColors, getBentoColors)
  const bentoBeam = useSyncExternalStore(subscribeSceneColors, getBentoBeam)
  const [copied, setCopied] = useState(false)
  // 面板位置(可拖曳,免得擋住畫面上的造型點)
  const [pos, setPos] = useState({ x: Math.max(16, window.innerWidth - 346), y: 16 })

  // 開站只套用「存過的」覆寫;沒存過的就讓 CSS 的預設值生效
  useEffect(() => {
    const saved = loadSaved()
    for (const { key } of VARS) if (saved[key]) document.documentElement.style.setProperty(key, saved[key])
  }, [])

  // 讓 IdleBeam 知道要不要顯示三個造型點
  useEffect(() => { setEditing(open); return () => setEditing(false) }, [open])

  // E 開關;在輸入框裡打字時不觸發
  useEffect(() => {
    const onKey = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return
      if (e.key === 'e' || e.key === 'E') setOpen((o) => !o)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 編輯模式:body 加 class → 游標顯示(平常 kiosk 是 cursor:none)
  useEffect(() => {
    document.body.classList.toggle('editing', open)
    return () => document.body.classList.remove('editing')
  }, [open])

  const set = useCallback((key, hex) => {
    setVals((prev) => {
      const next = { ...prev, [key]: hex }
      document.documentElement.style.setProperty(key, hex)
      try { localStorage.setItem(LS_KEY, JSON.stringify({ sig: themeSig(), vals: next })) } catch { /* 無痕模式 */ }
      return next
    })
    setCopied(false)
  }, [])

  const setG = useCallback((key, num) => { setBeam({ [key]: num }); setCopied(false) }, [])

  // 重設 = 移除 inline 覆寫,回到 style.css 的 :root 值
  const reset = () => {
    for (const { key } of VARS) document.documentElement.style.removeProperty(key)
    setVals(Object.fromEntries(VARS.map((v) => [v.key, cssValue(v.key, v.def)])))
    resetBeam(); resetLayout(); resetSceneColors(); resetBentoColors(); resetBentoBeam()
    try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
    setCopied(false)
  }

  // 顏色輸出成 CSS;光束幾何輸出成可直接貼回 beamStore.js 的 BEAM_DEFAULT
  const copyCss = async () => {
    const css = VARS.map((v) => `  ${v.key}: ${vals[v.key]};`).join('\n')
    const pt = (p) => `{ x: ${p.x}, y: ${p.y} }`
    const geoJs = `export const BEAM_DEFAULT = {\n` +
      `  p0: ${pt(beam.p0)},\n  p1: ${pt(beam.p1)},\n  p2: ${pt(beam.p2)},\n` +
      `  w0: ${beam.w0}, w1: ${beam.w1}, w2: ${beam.w2},\n` +
      `  glow: ${beam.glow}, edge: ${beam.edge},\n}`
    try {
      const layJs = `export const LAYOUT_DEFAULT = {\n  colL: ${lay.colL}, colM: ${lay.colM}, colR: ${lay.colR},\n  heroH: ${lay.heroH},\n` +
        `  bentoCols: [${lay.bentoCols.join(', ')}],\n  bentoRows: [${lay.bentoRows.join(', ')}],\n}`
      // 情境參考配色的選擇 → 貼回 personas.js 的 accent2 / accent3
      const picked = Object.entries(sceneSel).map(([id, v]) => {
        const per = PERSONAS[id]
        return `  ${/^[a-z]+$/.test(id) ? id : `'${id}'`}: accent2: ${v.a || per.accent2}  accent3: ${v.b || per.accent3}`
      }).join('\n')
      await navigator.clipboard.writeText(
        `/* → src/style.css 的 :root */\n:root {\n${css}\n}\n\n/* → src/beamStore.js */\n${geoJs}\n\n/* → src/layoutStore.js */\n${layJs}\n` +
        (picked ? `\n/* → src/personas.js(情境參考配色的選擇)*/\n${picked}\n` : ''))
      setCopied(true)
    } catch { setCopied(false) }
  }

  if (!open) return null

  return (
    <div
      className="tuner"
      // 面板被拖低時,高度上限要跟著扣掉 y,否則底部的按鈕列會掉到畫面外
      style={{ left: pos.x, top: pos.y, right: 'auto', maxHeight: `calc(100vh - ${pos.y}px - 16px)` }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="tuner__head"
        onPointerDown={(ev) => {
          const sx = ev.clientX - pos.x, sy = ev.clientY - pos.y
          // 夾在畫面內:標題列永遠抓得到,面板也不會整個掉出去
          const move = (e) => setPos({
            x: Math.min(Math.max(0, e.clientX - sx), Math.max(0, window.innerWidth - 340)),
            y: Math.min(Math.max(0, e.clientY - sy), Math.max(0, window.innerHeight - 120)),
          })
          const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
          window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
        }}
      >
        <b>{isIdle ? '待機頁配色' : curId ? '情境牆' : isHouse ? '房屋資訊牆' : '編輯模式'} ⠿</b>
        <span>按 E 關閉</span>
      </div>

      <div className="tuner__list">
        {!isIdle && !isHouse && !curId && (
          <p className="tuner__tip">這一頁沒有可編輯的項目。待機頁可調光束與配色;<b> c </b>房屋資訊牆與<b> 1-5 </b>情境牆可調版面與參考配色。</p>
        )}
        {curId && (() => {
          const per = PERSONAS[curId]
          return (
            <>
              <div className="tuner__group">參考配色 · {per.title}</div>
              <p className="tuner__tip">每一塊面板各自選色;<b> 無 </b>= 不平塗(維持半透明)</p>
              {SLOTS.map((sl) => {
                const cur = slotColor(per, sl.key)
                return (
                  <div className="tuner__sw" key={sl.key}>
                    <i title={sl.label}>{sl.label}</i>
                    <div className="tuner__chips">
                      {sl.kind === 'fill' && (
                        <button
                          className={`tuner__chip tuner__chip--none${cur === null ? ' is-on' : ''}`}
                          title="無(半透明)"
                          onClick={() => { setSceneColor(curId, sl.key, null); setCopied(false) }}
                        >無</button>
                      )}
                      {per.palette.map((hex) => (
                        <button
                          key={hex}
                          className={`tuner__chip${cur === hex ? ' is-on' : ''}`}
                          style={{ background: hex }}
                          title={hex}
                          onClick={() => { setSceneColor(curId, sl.key, hex); setCopied(false) }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )
        })()}

        {isIdle && <div className="tuner__group">光束幾何</div>}
        {isIdle && <p className="tuner__tip">形狀直接拖畫面上的<b> 尾 · 中 · 頭 </b>三個點(拖動即可旋轉/彎曲)</p>}
        {isIdle && GEO.map((g) => (
          <label className="tuner__sl tuner__sl--geo" key={g.key}>
            <i>{g.label}</i>
            <input
              type="range" min={g.min} max={g.max} step={g.step} value={beam[g.key]}
              onChange={(e) => setG(g.key, +e.target.value)}
            />
            <u>{beam[g.key]}{g.unit}</u>
          </label>
        ))}

        {curId && <div className="tuner__group">欄位版面</div>}
        {curId && <p className="tuner__tip">也可以直接拖畫面上的<b> 藍色分隔線 </b>調欄寬與卡片高度</p>}
        {isHouse && <div className="tuner__group">面板顏色 · 直接輸入色碼</div>}
        {isHouse && <p className="tuner__tip">輸入 <b> #rrggbb </b>即套用;<b> 無 </b>= 半透明;<b> 光邊 </b>= 主視覺那道光的邊(白銳邊 + 藍衰減)</p>}
        {isHouse && BENTO_PANELS.map((b) => {
          const hex = bentoSel[b.key] || ''
          return (
            <div className="tuner__sw" key={b.key}>
              <i title={b.label}>{b.label}</i>
              <span className="tuner__prev" style={{ background: hex || 'rgba(255,255,255,0.13)' }} />
              <input
                className="tuner__hex" value={hex} placeholder="#rrggbb" spellCheck={false}
                onChange={(e) => {
                  const t = e.target.value.trim()
                  if (t === '') { setBentoColor(b.key, null); setCopied(false); return }
                  if (/^#[0-9a-fA-F]{6}$/.test(t)) { setBentoColor(b.key, t.toLowerCase()); setCopied(false) }
                }}
              />
              <button
                className="tuner__chip tuner__chip--none"
                title="無(半透明)"
                onClick={() => { setBentoColor(b.key, null); setCopied(false) }}
              >無</button>
              <button
                className={`tuner__chip tuner__chip--beam${bentoBeam[b.key] ? ' is-on' : ''}`}
                title="光邊(主視覺那道光的邊)"
                onClick={() => { toggleBentoBeam(b.key); setCopied(false) }}
              >光邊</button>
            </div>
          )
        })}

        {isHouse && <div className="tuner__group">房屋資訊牆</div>}
        {isHouse && <p className="tuner__tip">直接拖畫面上的<b> 藍色格線 </b>調欄寬與列高</p>}
        {curId && LAY.map((g) => (
          <label className="tuner__sl tuner__sl--geo" key={g.key}>
            <i>{g.label}</i>
            <input
              type="range" min={g.min} max={g.max} step={g.step} value={lay[g.key]}
              onChange={(e) => { setLayout({ [g.key]: +e.target.value }); setCopied(false) }}
            />
            <u>{lay[g.key]}{g.unit}</u>
          </label>
        ))}

        {isIdle && <div className="tuner__group">顏色</div>}
        {isIdle && VARS.map((v) => {
          const hex = vals[v.key]
          const hsl = hexToHsl(hex)
          const put = (patch) => set(v.key, hslToHex({ ...hsl, ...patch }))
          return (
            <div className="tuner__row" key={v.key}>
              <div className="tuner__top">
                <input type="color" value={hex} onChange={(e) => set(v.key, e.target.value)} />
                <span className="tuner__label">{v.label}</span>
                <input
                  className="tuner__hex" value={hex} spellCheck={false}
                  onChange={(e) => { const t = e.target.value.trim(); if (/^#[0-9a-fA-F]{6}$/.test(t)) set(v.key, t.toLowerCase()) }}
                />
              </div>
              <label className="tuner__sl">
                <i>H</i>
                <input type="range" min="0" max="360" value={hsl.h} onChange={(e) => put({ h: +e.target.value })} />
                <u>{hsl.h}</u>
              </label>
              <label className="tuner__sl">
                <i>S</i>
                <input type="range" min="0" max="100" value={hsl.s} onChange={(e) => put({ s: +e.target.value })} />
                <u>{hsl.s}</u>
              </label>
              <label className="tuner__sl">
                <i>L</i>
                <input type="range" min="0" max="100" value={hsl.l} onChange={(e) => put({ l: +e.target.value })} />
                <u>{hsl.l}</u>
              </label>
            </div>
          )
        })}
      </div>

      <div className="tuner__foot">
        <button onClick={copyCss}>{copied ? '✓ 已複製' : '複製 CSS'}</button>
        <button onClick={reset}>重設</button>
      </div>
    </div>
  )
}
