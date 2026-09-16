import { asset } from './assetUrl.js'

// ── AI 口吻語音(前導 / 五情境 / 結語)— 可自定義 ──────────────────────────────
// 三種來源,優先序:① 預錄配音檔(最佳音質)② 指定/自動挑選的瀏覽器語音 ③ 關閉。
//
// ▍最推薦:放預錄配音檔(任何 TTS 都行,音質完勝內建語音)
//   把音檔放 public/voice/intro.mp3 與 public/voice/outro.mp3 → 自動改播音檔。
//   (見 public/voice/README.md;載不到會自動 fallback 成下方的瀏覽器語音。)
//
// ▍次選:用瀏覽器語音,但挑「自然/線上」那顆 + 調語速語調
//   改下面 SPEECH 設定即可。VOICE_NAME 留空 = 自動挑最自然的中文語音;
//   想指定某顆,先在瀏覽器 console 看 speechVoices() 列出的名字,填進 VOICE_NAME。
//
// ▍想直接關掉語音(只留字幕 + 聲紋動畫):把 ENABLED 設 false。

export const SPEECH = {
  ENABLED:    false,  // 先關閉語音(等客戶配音檔);八個檔位已接好,放 public/voice/*.mp3 後設 true 即可恢復
  VOICE_NAME: '',     // 例:'Microsoft HsiaoChen Online (Natural) - Chinese (Taiwan)' 或 'Google 國語(臺灣)';留空=自動
  RATE:       0.95,   // 語速 0.1–10(越小越慢)
  PITCH:      1.0,    // 音調 0–2(越小越低沉,1=正常)
}

// 預錄配音檔(放 public/voice/ 即生效;沒有就 fallback 瀏覽器語音)。
// 路徑走 asset() 在執行期解成絕對 URL → 子路徑部署(--base=./)也不會歪。
// cue 對照:
//   lead        房屋資訊牆的 B 區前導語音(主流程:刷邀請卡後播,播完自動進情境選項)
//   scene-<id>  五個情境牆各自的語音(刷該情境鑰匙圈時播)
//   intro       前言頁(AI 聲紋,已移出主流程,展務員按 i 才播)
//   outro       結語
const VOICE_FILES = {
  lead:  'voice/lead.mp3',
  intro: 'voice/intro.mp3',
  outro: 'voice/outro.mp3',
  'scene-anti-aging': 'voice/scene-anti-aging.mp3',
  'scene-child':      'voice/scene-child.mp3',
  'scene-elder':      'voice/scene-elder.mp3',
  'scene-pregnancy':  'voice/scene-pregnancy.mp3',
  'scene-nomad':      'voice/scene-nomad.mp3',
}

let currentAudio = null

// ── Web Audio 即時分析(讓聲紋真的隨音檔起伏)───────────────────────────────
// 只在「播 mp3 配音檔」時可用:把 <audio> 接到 AnalyserNode 抓頻譜。
// 瀏覽器 TTS(speechSynthesis)沒有可分析的音訊串流 → 拿不到,聲紋退回擬真動畫。
let audioCtx = null
let activeAnalyser = null
let analyserData = null

function ensureCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (AC) audioCtx = new AC()
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  return audioCtx
}

function attachAnalyser(audioEl) {
  try {
    const ctx = ensureCtx()
    if (!ctx) return
    const src = ctx.createMediaElementSource(audioEl)   // 每個 <audio> 只能建一次,新元素沒問題
    const an = ctx.createAnalyser()
    an.fftSize = 256
    an.smoothingTimeConstant = 0.75
    src.connect(an)
    an.connect(ctx.destination)                          // 仍要連到喇叭才有聲音
    activeAnalyser = an
    analyserData = new Uint8Array(an.frequencyBinCount)
  } catch { /* 不支援就維持擬真聲紋 */ }
}

function clearAnalyser() { activeAnalyser = null; analyserData = null }

// 聲紋元件每幀呼叫:回傳 count 條的 0–1 振幅(真實音檔頻譜);沒在播音檔時回 null。
export function getVoiceLevels(count) {
  if (!activeAnalyser || !analyserData) return null
  activeAnalyser.getByteFrequencyData(analyserData)
  const bins = analyserData.length
  const out = new Array(count)
  // 只取較有內容的中低頻段(語音能量集中處),拉開動態
  const usable = Math.floor(bins * 0.7)
  for (let i = 0; i < count; i++) {
    const idx = Math.min(usable - 1, Math.floor((i / count) * usable))
    out[i] = analyserData[idx] / 255
  }
  return out
}

// 內建語音挑選:優先「自然/線上/Google」等高品質神經語音,再退而求其次。
function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return null
  const voices = speechSynthesis.getVoices()
  if (!voices.length) return null

  if (SPEECH.VOICE_NAME) {
    const exact = voices.find(v => v.name === SPEECH.VOICE_NAME)
    if (exact) return exact
  }
  const zh = voices.filter(v => /^zh|zh[-_]/i.test(v.lang))
  const pool = zh.length ? zh : voices
  const score = (v) => {
    let s = 0
    if (/natural|neural|online|enhanced|premium/i.test(v.name)) s += 5
    if (/google/i.test(v.name)) s += 4
    if (/yating|hsiaochen|hanhan|zhiwei|mengmeng|xiaoxiao|hiu|sinji/i.test(v.name)) s += 2
    if (/zh[-_]TW|zh[-_]HK/i.test(v.lang)) s += 3
    else if (/^zh/i.test(v.lang)) s += 1
    return s
  }
  return [...pool].sort((a, b) => score(b) - score(a))[0] || null
}

function ttsSpeak(text) {
  if (!SPEECH.ENABLED || typeof speechSynthesis === 'undefined' || !text) return
  try {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const v = pickVoice()
    if (v) { u.voice = v; u.lang = v.lang } else { u.lang = 'zh-TW' }
    u.rate = SPEECH.RATE
    u.pitch = SPEECH.PITCH
    speechSynthesis.speak(u)
  } catch { /* 不支援就靜默 */ }
}

// speak(text, { cue, onEnd, onFail })
//   cue 有對應配音檔時優先播音檔,載不到才用瀏覽器語音。
//   onEnd  — 配音檔「自然播完」時呼叫(呼叫端用來自動推進畫面)。
//   onFail — 語音關閉 / 沒有音檔 / 播不出來時呼叫(呼叫端改用固定秒數的退路)。
//   回傳 true = 有音檔開始播(可以等 onEnd);false = 沒有可等待的語音。
// ⚠ onEnd 只有音檔會觸發;瀏覽器 TTS 不保證有結束事件,一律當成 onFail 走退路。
export function speak(text, { cue, onEnd, onFail } = {}) {
  if (!SPEECH.ENABLED) { onFail?.(); return false }
  cancelSpeech()
  const file = cue && VOICE_FILES[cue]
  if (file) {
    let settled = false
    const fail = () => {
      if (settled) return
      settled = true
      clearAnalyser()
      ttsSpeak(text)      // 沒有音檔(404)/ 自動播放被擋 → 退回瀏覽器語音
      onFail?.()
    }
    try {
      const a = new Audio(asset(file))
      currentAudio = a
      attachAnalyser(a)                                        // 接 Web Audio → 聲紋讀真實振幅
      a.addEventListener('error', fail, { once: true })
      a.addEventListener('ended', () => {
        clearAnalyser()
        if (!settled) { settled = true; onEnd?.() }
      }, { once: true })
      a.play().catch(fail)
      return true
    } catch { ttsSpeak(text); onFail?.(); return false }
  }
  ttsSpeak(text)
  onFail?.()
  return false
}

export function cancelSpeech() {
  if (currentAudio) { try { currentAudio.pause(); currentAudio.currentTime = 0 } catch { /* noop */ } currentAudio = null }
  clearAnalyser()
  if (typeof speechSynthesis !== 'undefined') {
    try { speechSynthesis.cancel() } catch { /* noop */ }
  }
}

// 除錯用:在瀏覽器 console 打 speechVoices() 看有哪些語音可選(填進 SPEECH.VOICE_NAME)。
export function speechVoices() {
  if (typeof speechSynthesis === 'undefined') return []
  const list = speechSynthesis.getVoices().map(v => `${v.name}  ·  ${v.lang}`)
  // eslint-disable-next-line no-console
  console.table(list)
  return list
}
if (typeof window !== 'undefined') window.speechVoices = speechVoices

// 部分瀏覽器首批 getVoices() 為空,需等 voiceschanged。提早觸發載入。
if (typeof speechSynthesis !== 'undefined') {
  try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices() } catch { /* noop */ }
}
