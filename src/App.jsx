import { useEffect, useReducer, useCallback, useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { PERSONAS, PERSONA_ORDER } from './personas.js'
import { useNfcSocket } from './useNfcSocket.js'
import { getSceneColors, subscribeSceneColors, setEditContext, slotColor, fillColor } from './sceneColorStore.js'

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

// ── 畫面節奏(ms)──────────────────────────────────────────────────────────────
// 前言 / 房屋資訊 / 結語為「導覽人員操控 + 自動續播」雙保險:展務員可手動 advance,
// 不操作則於下列時間自動推進,避免現場卡住。
const OUTRO_MS = 9000    // 結語播放時間,之後自動回待機
const CONFIRM_MS = 1800

const initial = {
  phase:       'idle',   // idle | intro | card | house | character | scene | loop | outro
  wsStatus:    'connecting',
  connected:   false,    // reader 在線
  cardScanned: false,
  character:   null,     // persona id 驅動場景
  onReader:    null,     // 'card' | 'character' | null
  confirm:     null,     // { kind, id, seq } 感應成功漣漪
  seq:         0,
  sceneRun:    0,        // 每次進入 scene 遞增 → 強制 SceneSequence 重播
  activity:    0,        // 每次 NFC 事件遞增 → 重置「無人活動」倒數
}

function reducer(state, a) {
  switch (a.type) {
    case 'ws-status':          return { ...state, wsStatus: a.status }
    case 'reader-connected':   return { ...state, connected: true }
    case 'reader-disconnected':return { ...state, connected: false, onReader: null }

    case 'tag-present': {
      const kind = a.data?.kind
      const seq  = state.seq + 1
      const activity = state.activity + 1
      if (kind === 'card') {
        // 邀請卡 = 直接顯示房屋即時資訊(停著等選角色,不自動續播)。
        // 任何階段刷卡都回到 house = 新訪客重新開始。前言/結語改由展務員(按鍵/server)觸發。
        return {
          ...state, cardScanned: true, onReader: 'card',
          phase: 'house', character: null,
          confirm: { kind: 'card', id: 'invite', seq }, seq, activity,
        }
      }
      if (kind === 'character' && PERSONAS[a.data.id]) {
        // 同一個角色已在播放中(scene/loop)→ 視為 reader 重複讀取,忽略,不重置場景/節奏。
        if (state.character === a.data.id && (state.phase === 'scene' || state.phase === 'loop')) {
          return { ...state, onReader: 'character' }
        }
        // 換角色(或從其他階段)→ 進入該情境,重置場景節奏
        return {
          ...state, cardScanned: true, character: a.data.id, onReader: 'character',
          phase: 'scene', sceneRun: state.sceneRun + 1,
          confirm: { kind: 'character', id: a.data.id, seq }, seq, activity,
        }
      }
      return state // 未註冊 / 未知 tag → 忽略
    }

    case 'tag-remove':
      // 拿起卡 / 鑰匙圈:只清 onReader(單一感應點要拿起卡才能放鑰匙圈),
      // 場景 / loop 保留當前 persona;bump activity 重置無人倒數。
      return { ...state, onReader: null, activity: state.activity + 1 }

    case 'confirm-clear':
      return state.confirm?.seq === a.seq ? { ...state, confirm: null } : state

    // ── 展務員 / 流程控制(前言・結語・下一步・重置:皆手動或 server 觸發,不自動續播)──
    case 'op-intro':   // 待機 → 前言(展務員 / server)
      return { ...initial, wsStatus: state.wsStatus, connected: state.connected, phase: 'intro' }
    case 'op-advance': // 下一步(展務員 n):前言→房屋資訊→選角色
      if (state.phase === 'intro') return { ...state, phase: 'house' }
      if (state.phase === 'house') return { ...state, phase: 'character' }
      return state
    case 'scene-done':
      return state.phase === 'scene' ? { ...state, phase: 'loop' } : state
    case 'op-outro':   // 播結語(展務員 / server),OUTRO_MS 後自動回待機
      return { ...state, phase: 'outro', onReader: null }
    case 'outro-done':
      return state.phase === 'outro'
        ? { ...initial, wsStatus: state.wsStatus, connected: state.connected }
        : state
    case 'op-reset':
      return { ...initial, wsStatus: state.wsStatus, connected: state.connected }

    default: return state
  }
}

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
    const relay = (obj) => { if (!send(obj)) onMessage(obj) }
    const onKey = (e) => {
      // 在配色面板(E)的輸入框裡打字時,不要觸發流程快捷鍵
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return
      const k = e.key
      if (k === 'i' || k === 'I' || k === 'Enter')      relay({ type: 'intro' })
      else if (k === 'n' || k === 'N' || k === 'ArrowRight') dispatch({ type: 'op-advance' })
      else if (k === 'o' || k === 'O')                  relay({ type: 'outro' })
      else if (k === 'r' || k === 'R' || k === 'Escape') relay({ type: 'reset' })
      else if (k === 'c' || k === 'C')                  relay({ type: 'tag-present', data: { id: 'invite', kind: 'card' } })
      else if (k >= '1' && k <= '5')                    relay({ type: 'tag-present', data: { id: PERSONA_ORDER[Number(k) - 1], kind: 'character' } })
      else if (k === 'x' || k === 'X' || k === ' ')     relay({ type: 'tag-remove' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onMessage, send])

  // 編輯模式挑過的參考配色(沒挑過就用 personas.js 的預設)
  const sceneSel = useSyncExternalStore(subscribeSceneColors, getSceneColors)
  const persona = s.character ? PERSONAS[s.character] : null
  const inScene = s.phase === 'scene' || s.phase === 'loop'
  // 告訴編輯面板現在在哪一頁 → 面板只顯示該頁能編輯的項目
  useEffect(() => { setEditContext(s.phase, inScene ? s.character : null) }, [s.phase, inScene, s.character])
  // 場景 / loop 用 persona 主色;其餘畫面回到品牌 teal。
  const accent = (s.phase === 'scene' || s.phase === 'loop') && persona ? persona.accent : null

  const screen = renderScreen(s, persona, dispatch)

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
    </div>
  )
}

function renderScreen(s, persona, dispatch) {
  switch (s.phase) {
    case 'idle':      return <Idle />
    case 'intro':     return <Intro />
    case 'card':      return <PlacePrompt kind="card" />
    case 'house':     return <HouseInfoBento />
    case 'character': return <PlacePrompt kind="character" />
    case 'scene':     return <SceneBento persona={persona} mode="play" onComplete={() => dispatch({ type: 'scene-done' })} />
    case 'loop':      return <SceneBento persona={persona} mode="settled" />
    case 'outro':     return <Outro />
    default:          return <Idle />
  }
}
