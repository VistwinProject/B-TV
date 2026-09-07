import { useState } from 'react'
import { PERSONAS, PERSONA_ORDER } from '../personas.js'
import './NfcControls.css'

const PHASES = { idle: '待機', intro: '前言', card: '等待邀請卡', house: '房屋資訊', character: '選擇角色', scene: '情境播放', loop: '情境體驗中', outro: '結語' }

export default function NfcControls({ state, relay, onAdvance, demo }) {
  const [open, setOpen] = useState(true)
  const persona = PERSONAS[state.character]
  const inScene = state.phase === 'scene' || state.phase === 'loop'
  const reader = state.onReader === 'card' ? '邀請卡' : state.onReader === 'character' ? persona?.label : '無卡片'
  return (
    <aside className="nfc-controls" aria-label="體驗操作">
      {open && <div id="nfc-controls-panel" className="nfc-controls__panel">
        <p className="nfc-controls__mode">{demo ? '本機模擬 · 僅此畫面' : state.wsStatus === 'connected' ? '已連線 · 操作同步至 NFC 系統' : '離線模擬 · 僅此畫面'}</p>
        <p className="nfc-controls__status" role="status">目前：{PHASES[state.phase]}{inScene && persona ? ` · ${persona.label}` : ''}<br />感應區：{reader}</p>
        <fieldset>
          <legend>替代 NFC 卡片</legend>
          <div className="nfc-controls__grid">
            <button type="button" aria-pressed={state.onReader === 'card'} onClick={() => relay({ type: 'tag-present', data: { id: 'invite', kind: 'card' } })}>邀請卡</button>
            {PERSONA_ORDER.map(id => <button type="button" key={id} aria-pressed={inScene && state.character === id} onClick={() => relay({ type: 'tag-present', data: { id, kind: 'character' } })}>{PERSONAS[id].label}{inScene && state.character === id ? ' ✓' : ''}</button>)}
            <button type="button" disabled={!state.onReader} onClick={() => relay({ type: 'tag-remove' })}>拿起卡片</button>
          </div>
        </fieldset>
        <fieldset>
          <legend>體驗流程</legend>
          <div className="nfc-controls__grid">
            <button type="button" aria-pressed={state.phase === 'intro'} onClick={() => relay({ type: 'intro' })}>播放前言</button>
            <button type="button" disabled={!['intro', 'house'].includes(state.phase)} onClick={onAdvance}>下一步</button>
            <button type="button" aria-pressed={state.phase === 'outro'} onClick={() => relay({ type: 'outro' })}>播放結語</button>
            <button type="button" onClick={() => relay({ type: 'reset' })}>重置體驗</button>
          </div>
        </fieldset>
      </div>}
      <button type="button" className="nfc-controls__toggle" aria-expanded={open} aria-controls="nfc-controls-panel" onClick={() => setOpen(value => !value)}>
        替代 NFC 卡片 <span aria-hidden="true">{open ? '−' : '＋'}</span>
      </button>
    </aside>
  )
}
