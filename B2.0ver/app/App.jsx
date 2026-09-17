import { VoiceOrbProvider } from './VoiceOrb.jsx'
import { Component, useState, useEffect } from 'react'
import content from './exhibition.json'
import { useExhibition, useNarration, flags } from './useExhibition.js'
import { Choose, Experience, Farewell, Narration, Overview, Welcome } from './screens.jsx'

import { useDesign } from './editor/DesignContext.jsx'
import Editor from './editor/Editor.jsx'

const names = { welcome: '待機', overview: '房屋資訊', choose: '等待角色', experience: '解方展演', narration: '前言', farewell: '結語' }

function Operator({ state, operate }) {
  const [expanded, setExpanded] = useState(false)
  if (flags.kiosk) return null
  return <aside className="operator" aria-label="展演操作">
    {expanded && <section className="operator-panel" id="operator-panel">
      <header><strong>感應光寓 2.0</strong><span>{state.seen.length} / 5 已體驗</span></header>
      <button className="operator-invite" onClick={() => operate('invite')}>感應邀請卡 <kbd>C</kbd></button>
      <div className="operator-people">{content.people.map((person, i) => <button key={person.id} style={{ '--person-color': person.color }} aria-pressed={state.person === person.id} onClick={() => operate('person', person.id)}>
        <kbd>{i + 1}</kbd><span>{person.title}</span><span aria-label={state.seen.includes(person.id) ? '已體驗' : '未體驗'}>{state.seen.includes(person.id) ? '✓' : '○'}</span>
      </button>)}</div>
      <div className="operator-actions">
        <button onClick={() => operate('next')} disabled={!['overview', 'narration'].includes(state.screen)}>下一步 <kbd>N</kbd></button>
        <button onClick={() => operate('remove')}>拿起卡片 <kbd>X</kbd></button>
        <button onClick={() => operate('intro')}>前言 <kbd>I</kbd></button>
        <button onClick={() => operate('outro')}>結語 <kbd>O</kbd></button>
        <button onClick={() => operate('reset')}>回到待機 <kbd>R</kbd></button>
        <button onClick={() => setExpanded(false)}>收合面板</button>
      </div><p>每個維度展示 5 秒。五種情境體驗後，最後一輪播放完畢會自動進入結語。</p>
    </section>}
    <button className="operator-toggle" aria-expanded={expanded} aria-controls="operator-panel" onClick={() => setExpanded(value => !value)}>替代 NFC 卡片 <span aria-hidden="true">{expanded ? '−' : '＋'}</span></button>
  </aside>
}

export default function App() {
  const { design, editing, setEditing } = useDesign()
  const { state: playback, connection, reader, operate, issue } = useExhibition(content.people, editing)
  const [preview, setPreview] = useState({ screen: 'welcome', person: content.people[0].id, dimension: 0, started: 0 })
  useEffect(() => { if (editing) setPreview({ ...playback, person: playback.person || content.people[0].id }) }, [editing])
  const state = editing ? preview : playback
  const { analyser, audioStatus, audioTime, play } = useNarration(playback, issue, editing)
  const theme = Object.fromEntries(Object.entries(design.theme).map(([key,value]) => [`--edit-${key}`,value]))
  let view
  switch (state.screen) {
    case 'overview': view = <Overview metrics={content.house} />; break
    case 'choose': view = <Choose people={content.people} choose={id => editing ? setPreview(v => ({ ...v, screen: 'experience', person: id, dimension: 0 })) : operate('person', id)} />; break
    case 'experience': view = <Experience person={content.people.find(p => p.id === state.person)} dimension={state.dimension} audioTime={audioTime} audioStatus={editing ? 'idle' : audioStatus} onPlay={play} />; break
    case 'narration': view = <Narration analyser={analyser} audioStatus={editing ? "idle" : audioStatus} onPlay={play} />; break
    case 'farewell': view = <Farewell analyser={analyser} audioTime={audioTime} audioStatus={audioStatus} onPlay={play} />; break
    default: view = <Welcome />
  }
  const connectionLabel = connection === 'local' ? '本機預覽' : connection === 'connected' ? (reader ? '讀卡機就緒' : '等待讀卡機') : '連線中'
  return <VoiceOrbProvider analyser={analyser} active={playback.screen !== 'welcome'} paused={editing}><main className="exhibition" data-screen={state.screen} data-editing={editing} style={theme}>
    <div className="stage-screen" key={state.screen === 'experience' ? 'experience' : `${state.screen}-${state.revision}`}>{view}</div>
    {!editing && state.confirmation && <div key={state.confirmation.at} className="confirmation" style={{ '--confirm-color': state.confirmation.color }} aria-hidden="true"><i /><i /><span>✓</span></div>}
    <div className="device-status" data-connected={connection === 'connected' && reader}><i /><span>{connectionLabel}</span><span>{state.screen === 'experience' && state.loop > 0 ? '情境體驗' : names[state.screen]}</span></div>
    {!editing && <Operator state={state} operate={operate} />}
    {!editing && !flags.kiosk && <button className="editor-launch" onClick={() => setEditing(true)}>E · 編輯畫面</button>}
    {editing && <Editor preview={preview} setPreview={setPreview} />}
  </main></VoiceOrbProvider>
}

export class PlaybackBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <section className="screen-center"><h1>畫面暫時無法顯示</h1><button onClick={() => window.location.reload()}>重新啟動展演</button></section> : this.props.children
  }
}
