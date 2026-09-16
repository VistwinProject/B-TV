import { useEffect, useReducer, useCallback, useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { PERSONAS, PERSONA_ORDER } from './personas.js'
import { useNfcSocket } from './useNfcSocket.js'
import { getSceneColors, subscribeSceneColors, setEditContext, slotColor, fillColor, glassFill, getGlass } from './sceneColorStore.js'
import { setLayoutTarget } from './layoutStore.js'

import Idle from './components/Idle.jsx'
import Intro from './components/Intro.jsx'
import PlacePrompt from './components/PlacePrompt.jsx'
import Outro from './components/Outro.jsx'
import ConfirmRipple from './components/ConfirmRipple.jsx'
import StatusDot from './components/StatusDot.jsx'
import StyleTuner from './components/StyleTuner.jsx'
import IdleBeam from './components/IdleBeam.jsx'
// 情境展演(房屋即時資訊 + 5 情境解方)改為 bento 動態資料牆;房子那格為 three.js。
import HouseInfoBento from './bento/HouseInfoBento.jsx'
import SceneBento from './bento/SceneBento.jsx'
import './bento/bento.css'
import { initial, reducer } from './flow.js'
import NfcControls from './components/NfcControls.jsx'
import './v2.css'

// ── 主流程(2026-09-08 定案)────────────────────────────────────────────────────
//   待機(感應光寓)
//     ① 刷 NFC 邀請卡 → 房屋資訊牆 + B 區前導語音
//     ② 前導語音播完(或逾時)→ 五種情境選項介面
//     ③ 刷情境鑰匙圈 → 對應情境牆 + 該情境語音(可重複,五種任意順序)
//     ④ 五種都感應過、且最後一個情境播完一輪 → 結語頁 → 自動回待機
//   前言頁(AI 聲紋)已移出主流程,展務員按 i / server 送 intro 仍可手動播。
//
// ── 畫面節奏(ms)──────────────────────────────────────────────────────────────
// 結語為「自動觸發 + 展務員可手動」雙保險;不操作也會自己走完,避免現場卡住。
import { OUTRO_MS, CONFIRM_MS } from './timing.js'

export default function App() {
  const [s, dispatch] = useReducer(reducer, initial)

  // ── NFC WebSocket(path A:直接連 8788,自行推導狀態)─────────────────────────
  const onMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'reader-connected':    dispatch({ type: 'reader-connected' }); break
      case 'reader-disconnected': dispatch({ type: 'reader-disconnected' }); break
      case 'tag-present':         dispatch({ type: 'tag-present', data: msg.data }); break
      case 'tag-remove':          dispatch({ type: 'tag-remove' }); break
      case 'reset':               dispatch({ type: 'op-reset' }); break       // server override
      case 'intro':               dispatch({ type: 'op-intro' }); break        // server override
      case 'outro':               dispatch({ type: 'op-outro' }); break        // server override
      default: break
    }
  }, [])
  const onStatus = useCallback((status) => dispatch({ type: 'ws-status', status }), [])
  const { send } = useNfcSocket(onMessage, onStatus)
  const relay = useCallback((obj) => { if (!send(obj)) onMessage(obj) }, [send, onMessage])
  const simulate = useCallback((obj) => {
    // Separate placements include removing the prior card, even without hardware.
    if (obj.type === 'tag-present') relay({ type: 'tag-remove' })
    relay(obj)
  }, [relay])

  // ── 結語播完自動回待機(結語為展務員觸發;前言/房屋資訊不自動續播、無無人逾時)──────
  useEffect(() => {
    if (s.phase === 'outro') { const t = setTimeout(() => dispatch({ type: 'outro-done' }), OUTRO_MS); return () => clearTimeout(t) }
  }, [s.phase])

  // ── 感應成功漣漪自動消失 ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!s.confirm) return
    const seq = s.confirm.seq
    const t = setTimeout(() => dispatch({ type: 'confirm-clear', seq }), CONFIRM_MS)
    return () => clearTimeout(t)
  }, [s.confirm])

  // ── 鍵盤:展務員流程控制 + 無硬體開發模擬 ────────────────────────────────────
  //   操作:i/Enter 開始(前言) · n/→ 下一步 · o 結語 · r/Esc 重置
  //   模擬:c 刷邀請卡 · 1-5 刷角色鑰匙圈 · x/Space 拿起 · (對齊 B-Table)
  //   NFC 模擬與 reset/intro/outro 走 server 廣播(`send`),讓桌面 + 電視同步;
  //   未連線時 fallback 成本機處理(純電視測試)。n/advance 為電視本機流程,不廣播。
  useEffect(() => {
    const onKey = (e) => {
      // 在配色面板(E)的輸入框裡打字時,不要觸發流程快捷鍵
      if (e.repeat || e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return
      const k = e.key
      if (e.target.tagName === 'BUTTON' && (k === 'Enter' || k === ' ')) return
      if ([' ', 'ArrowRight'].includes(k)) e.preventDefault()
      if (k === 'i' || k === 'I' || k === 'Enter')      relay({ type: 'intro' })
      else if (k === 'n' || k === 'N' || k === 'ArrowRight') dispatch({ type: 'op-advance' })
      else if (k === 'o' || k === 'O')                  relay({ type: 'outro' })
      else if (k === 'r' || k === 'R' || k === 'Escape') relay({ type: 'reset' })
      else if (k === 'c' || k === 'C')                  simulate({ type: 'tag-present', data: { id: 'invite', kind: 'card' } })
      else if (k >= '1' && k <= '5')                    simulate({ type: 'tag-present', data: { id: PERSONA_ORDER[Number(k) - 1], kind: 'character' } })
      else if (k === 'x' || k === 'X' || k === ' ')     relay({ type: 'tag-remove' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [relay, simulate])

  // 編輯模式挑過的參考配色(沒挑過就用 personas.js 的預設)
  const sceneSel = useSyncExternalStore(subscribeSceneColors, getSceneColors)
  const glass = useSyncExternalStore(subscribeSceneColors, getGlass)
  const persona = s.character ? PERSONAS[s.character] : null
  const inScene = s.phase === 'scene' || s.phase === 'loop'
  // 告訴編輯面板現在在哪一頁 → 面板只顯示該頁能編輯的項目
  // 同時把版面切到該情境:五個情境各有自己的欄寬 / 痛點卡高(展演中也生效,不只編輯模式)
  useEffect(() => {
    setEditContext(s.phase, inScene ? s.character : null)
    setLayoutTarget(inScene ? s.character : null)
  }, [s.phase, inScene, s.character])
  // 場景 / loop 用 persona 主色;其餘畫面回到品牌 teal。
  const accent = (s.phase === 'scene' || s.phase === 'loop') && persona ? persona.accent : null

  const screen = renderScreen(s, persona, dispatch, simulate)

  return (
    <div
      className={`stage stage--${s.phase}`}
      style={accent ? {
        '--scene-accent': accent,
        // 數據強調色 + 六塊面板各自的平塗色(null → 半透明白)
        '--scene-accent-2': slotColor(persona, 'data') || persona.accent2,
        '--fill-pain':     fillColor(slotColor(persona, 'pain')),
        '--fill-solution': fillColor(slotColor(persona, 'solution')),
        '--fill-score':    fillColor(slotColor(persona, 'score')),
        '--fill-l1':       fillColor(slotColor(persona, 'l1')),
        '--fill-l2':       fillColor(slotColor(persona, 'l2')),
        '--fill-l3':       fillColor(slotColor(persona, 'l3')),
        // 同一組選色的「淺色玻璃」版本,只有 panel:'glass' 的 CSS 會去讀
        '--glass-pain':     glassFill(slotColor(persona, 'pain'), glass.alpha),
        '--glass-solution': glassFill(slotColor(persona, 'solution'), glass.alpha),
        '--glass-score':    glassFill(slotColor(persona, 'score'), glass.alpha),
        '--glass-l1':       glassFill(slotColor(persona, 'l1'), glass.alpha),
        '--glass-l2':       glassFill(slotColor(persona, 'l2'), glass.alpha),
        '--glass-l3':       glassFill(slotColor(persona, 'l3'), glass.alpha),
        '--scene-bg-wash':  glass.wash,
        '--glass-blur':     `${glass.blur}px`,
        '--glass-gloss':    glass.gloss,
      } : undefined}
    >
      <div className="stage__vignette" />

      {/* 待機頁光束:SVG 帶狀路徑(編輯模式可直接拖三個造型點)*/}
      {s.phase === 'idle' && <IdleBeam />}

      {/* 不用 AnimatePresence:待機 / 前言 / 聲音 EQ 等畫面含 repeat:Infinity 動畫,
          會讓 AnimatePresence 的 exit 永遠不 settle → 卡在舊畫面(SensorRing 註解的雷)。
          改成單一 keyed 畫面 + 進場淡入;key 變即由 React 直接換掉(kiosk 切換俐落、不卡)。
          scene/loop 共用「固定」key:換角色時 SceneBento(及裡面的 three.js 房子)不 remount
          → 房子不重新初始化(免 clone/PMREM/raycast 卡頓),只更新 persona prop 平滑換燈;
            進場動畫改由 SceneBento 內各卡片以 persona.id 為 key 重掛載播放。 */}
      <motion.div
        key={(s.phase === 'scene' || s.phase === 'loop') ? 'scene' : s.phase}
        className="screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {screen}
      </motion.div>

      {s.confirm && (
        <ConfirmRipple
          key={s.confirm.seq}
          accent={s.confirm.kind === 'character' ? PERSONAS[s.confirm.id]?.accent : null}
        />
      )}

      <StatusDot wsStatus={s.wsStatus} connected={s.connected} phase={s.phase} />

      {/* 佈展調色用:按 E 開關(關閉時完全不渲染,不影響 kiosk)*/}
      <StyleTuner />
      <NfcControls state={s} onEvent={simulate} onAdvance={() => dispatch({ type: 'op-advance' })} />
    </div>
  )
}

function renderScreen(s, persona, dispatch, simulate) {
  switch (s.phase) {
    case 'idle':      return <Idle />
    case 'intro':     return <Intro />
    case 'card':      return <PlacePrompt kind="card" />
    case 'house':     return <HouseInfoBento key={`house-${s.seq}`} onDone={() => dispatch({ type: 'op-advance' })} />
    case 'character': return <PlacePrompt kind="character" onSelect={(id) => simulate({ type: 'tag-present', data: { kind: 'character', id } })} />
    case 'scene':     return <SceneBento persona={persona} mode="play" onComplete={() => dispatch({ type: 'scene-done', run: s.sceneRun })} />
    case 'loop':      return <SceneBento persona={persona} mode="settled" />
    case 'outro':     return <Outro />
    default:          return <Idle />
  }
}
