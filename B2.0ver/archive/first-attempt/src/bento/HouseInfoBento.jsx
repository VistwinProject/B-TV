import { useEffect, useRef, useSyncExternalStore } from 'react'
import BentoTile from './BentoTile.jsx'
import CountUp from './CountUp.jsx'
import { LEAD_FALLBACK_MS, LEAD_MAX_MS } from '../timing.js'
import VideoTile from './VideoTile.jsx'
import Icon from '../components/icons.jsx'
import BentoLayoutEditor from '../components/BentoLayoutEditor.jsx'
import { getBentoColors, getBentoBeam, subscribeSceneColors, fillColor } from '../sceneColorStore.js'
import { HOUSE_INFO } from '../houseInfo.js'
import { speak, cancelSpeech } from '../speech.js'

// 房屋即時資訊 bento 版 — 刷邀請卡後顯示,連動寶舖 Sensor,同時播 B 區前導語音。
// 語音播完自動進入「五種情境選項」那一頁(展務員仍可按 n 提前)。
const byKey = Object.fromEntries(HOUSE_INFO.map((m) => [m.key, m]))

// ── 前導語音與自動推進 ────────────────────────────────────────────────────────
// 正常情況等 public/voice/lead.mp3 播完;下面兩個秒數是它不存在或播不出來時的退路。
// TTS 退路唸的字幕(正式配音以客戶錄音檔為準;文字取自畫面上的標題與宣言卡)
const LEAD_LINE = '這是這間房子的即時健康資訊。房子的健康，就是你的健康。'

function Stat({ k, color, area, big = false, fill, beam = false }) {
  const m = byKey[k]
  if (!m) return null
  return (
    <BentoTile color={color} className={beam ? 'tile--beam' : ''} style={{ gridColumn: area.gc, gridRow: area.gr, background: fill }} delay={area.d || 0}>
      <span className="t-row" style={{ justifyContent: 'space-between' }}>
        <span className="t-eyebrow">{m.label}</span>
        <span className="t-icon"><Icon name={m.icon} /></span>
      </span>
      <span className="t-spacer" />
      {m.text ? (
        <>
          <span className={`t-num ${big ? '' : 't-num--sm'}`}>{m.text}</span>
          <p className="t-foot"><CountUp value={m.value} />{m.unit}</p>
        </>
      ) : (
        <span className={`t-num ${big ? '' : 't-num--sm'}`}>
          <CountUp value={m.value} decimals={m.decimals || 0} /><span className="t-unit"> {m.unit}</span>
        </span>
      )}
    </BentoTile>
  )
}

export default function HouseInfoBento({ onDone }) {
  // onDone 每次 render 都是新的箭頭函式 → 用 ref 接,effect 才不會被重跑(語音會重播)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  // 前導語音播完 → 自動進入情境選項頁。掛載時跑一次;離開這頁時停掉語音。
  useEffect(() => {
    let fired = false
    let disposed = false
    let timer = null
    const go = () => { if (!fired) { fired = true; doneRef.current?.() } }
    const arm = (ms) => { if (disposed) return; clearTimeout(timer); timer = setTimeout(go, ms) }

    arm(LEAD_MAX_MS)                                    // 先掛保險,語音就緒後再依情況改
    speak(LEAD_LINE, {
      cue: 'lead',
      onEnd: go,                                        // 配音檔自然播完 → 立刻推進
      onFail: () => arm(LEAD_FALLBACK_MS),              // 沒音檔 / 語音關閉 → 用固定秒數
    })
    return () => { disposed = true; fired = true; clearTimeout(timer); cancelSpeech() }
  }, [])

  // 每格的平塗色(編輯模式直接輸入色碼;沒設就是半透明白)
  const picked = useSyncExternalStore(subscribeSceneColors, getBentoColors)
  const beam = useSyncExternalStore(subscribeSceneColors, getBentoBeam)
  // 沒指定色碼、或開了光邊 → 完全不給 inline background,交給 CSS 決定面板底色。
  // (inline style 權重高過樣式表,之前的 fallback 值會把主題的面板色蓋掉。)
  const fill = (k) => (beam[k] || !picked[k] ? undefined : fillColor(picked[k]))
  return (
    <div className="bento">
      {/* hero(加高成 2 列;標題在格內置中留白,不貼底)*/}
      <BentoTile color="cream" className={`bento-hero${beam.hero ? ' tile--beam' : ''}`} style={{ gridColumn: '1 / 3', gridRow: '1 / 3', background: fill('hero') }}>
        <p className="t-eyebrow">寶舖 Sensor · 數位孿生平台</p>
        <span className="t-spacer" />
        <p className="t-label--lg t-label">這間房子的<br />即時健康資訊</p>
        <span className="t-spacer" />
      </BentoTile>

      <Stat k="pm25" fill={fill('pm25')} beam={beam.pm25}     color="green"  area={{ gc: '3 / 4', gr: '1 / 2', d: 0.05 }} />
      <Stat k="pm25_out" fill={fill('pm25_out')} beam={beam.pm25_out} color="orange" area={{ gc: '4 / 5', gr: '1 / 2', d: 0.1 }} />

      {/* 右上 cols5-6 rows1-2 —— 樣品屋影片循環播放(原保留給 3D 房子的位置)*/}
      <VideoTile style={{ gridColumn: '5 / 7', gridRow: '1 / 3' }} delay={0.15} />

      <Stat k="co2" fill={fill('co2')} beam={beam.co2}   color="sky"    area={{ gc: '3 / 4', gr: '2 / 3', d: 0.2 }} />
      <Stat k="temp" fill={fill('temp')} beam={beam.temp}  color="coral"  area={{ gc: '4 / 5', gr: '2 / 3', d: 0.25 }} />

      {/* 天氣(大)*/}
      <Stat k="weather" fill={fill('weather')} beam={beam.weather} color="sky" area={{ gc: '1 / 3', gr: '3 / 5', d: 0.4 }} big />
      <Stat k="sound" fill={fill('sound')} beam={beam.sound}   color="green" area={{ gc: '3 / 4', gr: '3 / 5', d: 0.45 }} />
      <Stat k="rh" fill={fill('rh')} beam={beam.rh}    color="purple" area={{ gc: '4 / 5', gr: '3 / 4', d: 0.3 }} />
      <Stat k="light" fill={fill('light')} beam={beam.light} color="yellow" area={{ gc: '4 / 5', gr: '4 / 5', d: 0.35 }} />

      {/* 宣言(縮成 2 欄,移到右下)*/}
      <BentoTile color="cream" className={`bento-claim${beam.claim ? ' tile--beam' : ''}`} style={{ gridColumn: '5 / 7', gridRow: '3 / 5', background: fill('claim') }} delay={0.5}>
        <p className="t-eyebrow">12-in-1 Sensor · 24/7</p>
        <span className="t-spacer" />
        <p className="t-label--lg t-label">房子的健康<br />就是你的健康</p>
        <span className="t-spacer" />
        <p className="t-foot">選一個情境鑰匙圈，看寶舖怎麼解</p>
      </BentoTile>

      {/* 按 E 時疊上可拖的格線(非編輯模式不渲染)*/}
      <BentoLayoutEditor />
    </div>
  )
}
