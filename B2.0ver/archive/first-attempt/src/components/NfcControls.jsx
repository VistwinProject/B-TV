import { useState } from 'react'
import { PERSONAS, PERSONA_ORDER } from '../personas.js'

export default function NfcControls({ state, onEvent, onAdvance }) {
  const [open, setOpen] = useState(false)
  if (new URLSearchParams(window.location.search).get('kiosk') === '1') return null
  return (
    <aside className="nfc-controls" aria-label="替代 NFC 卡片">
      {open && <section className="nfc-panel" id="nfc-panel" aria-label="展演控制">
        <header><strong>感應光寓 <small>2.0</small></strong><span>{state.visited.length} / 5 已體驗</span></header>
        <button className="nfc-invite" onClick={() => onEvent({ type: 'tag-present', data: { kind: 'card', id: 'invite' } })}>
          <span>感應邀請卡</span><kbd>C</kbd>
        </button>
        <div className="nfc-personas">
          {PERSONA_ORDER.map((id, index) => <button key={id}
            style={{ '--card-color': PERSONAS[id].accent }}
            aria-pressed={state.character === id}
            onClick={() => onEvent({ type: 'tag-present', data: { kind: 'character', id } })}>
            <kbd>{index + 1}</kbd><span>{PERSONAS[id].label}</span>
            <span aria-label={state.visited.includes(id) ? '已體驗' : '未體驗'}>{state.visited.includes(id) ? '✓' : '○'}</span>
          </button>)}
        </div>
        <div className="nfc-actions">
          <button onClick={onAdvance} disabled={!['intro', 'house'].includes(state.phase)}>下一步 <kbd>N</kbd></button>
          <button onClick={() => onEvent({ type: 'tag-remove' })}>拿起卡片 <kbd>X</kbd></button>
          <button onClick={() => onEvent({ type: 'intro' })}>前言 <kbd>I</kbd></button>
          <button onClick={() => onEvent({ type: 'outro' })}>結語 <kbd>O</kbd></button>
          <button onClick={() => onEvent({ type: 'reset' })}>回到待機 <kbd>R</kbd></button>
          <button onClick={() => { setOpen(false); document.activeElement?.blur() }}>收合面板</button>
        </div>
        <p>情境每 5 秒切換一個維度，五種體驗完成後自動進入結語。</p>
      </section>}
      <button className="nfc-toggle" aria-expanded={open} aria-controls="nfc-panel" onClick={() => setOpen(!open)}>
        替代 NFC 卡片 <span aria-hidden="true">{open ? '−' : '＋'}</span>
      </button>
    </aside>
  )
}
