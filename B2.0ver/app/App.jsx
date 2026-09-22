import { DURATION } from './playback.js'
import { VoiceOrbProvider } from './VoiceOrb.jsx'
import { Component, useState, useEffect, useLayoutEffect, useRef } from 'react'
import content from './exhibition.json'
import { useExhibition, useNarration, flags } from './useExhibition.js'
import { Choose, Experience, Farewell, Overview, Welcome } from './screens.jsx'

import { useDesign } from './editor/DesignContext.jsx'
import Editor from './editor/Editor.jsx'


function Operator({ state, operate }) {
  const [expanded, setExpanded] = useState(false)
  if (flags.kiosk) return null
  return <aside className="operator" aria-label="展演操作">
    {expanded && <section className="operator-panel" id="operator-panel">
      <header><strong>感光公寓 2.0</strong><span>{state.seen.length} / 5 已體驗</span></header>
      <button className="operator-invite" onClick={() => operate('invite')}>感應邀請卡 <kbd>C</kbd></button>
      <div className="operator-people">{content.people.map((person, i) => <button key={person.id} style={{ '--person-color': person.color }} aria-pressed={state.person === person.id} onClick={() => operate('person', person.id)}>
        <kbd>{i + 1}</kbd><span>{person.title}</span><span aria-label={state.seen.includes(person.id) ? '已體驗' : '未體驗'}>{state.seen.includes(person.id) ? '✓' : '○'}</span>
      </button>)}</div>
      <div className="operator-actions">
        <button onClick={() => operate('next')} disabled={state.screen !== 'overview'}>下一步 <kbd>N</kbd></button>
        <button onClick={() => operate('remove')}>拿起卡片 <kbd>X</kbd></button>
        <button onClick={() => operate('intro')}>前言 <kbd>I</kbd></button>
        <button onClick={() => operate('outro')}>結語 <kbd>O</kbd></button>
        <button onClick={() => operate('reset')}>回到待機 <kbd>R</kbd></button>
        <button onClick={() => setExpanded(false)}>收合面板</button>
      </div><p>每個維度展示 5 秒。五種情境體驗後，最後一個情境播完後停留 2 秒，再淡出並淡入結語。</p>
    </section>}
    <button className="operator-toggle" aria-expanded={expanded} aria-controls="operator-panel" onClick={() => setExpanded(value => !value)}>替代 NFC 卡片 <span aria-hidden="true">{expanded ? '−' : '＋'}</span></button>
  </aside>
}

export default function App() {
  const { design, editing, setEditing } = useDesign()
  const { state: playback, operate, issue } = useExhibition(content.people, editing)
  const [preview, setPreview] = useState({ screen: 'welcome', person: content.people[0].id, dimension: 0, started: 0 })
  useLayoutEffect(() => { if (editing) setPreview({ ...playback, person: playback.person || content.people[0].id }) }, [editing])
  const state = editing ? preview : playback
  const stage=useRef(null)
  useEffect(()=>{
    if(editing || state.screen!=='experience' || window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
    const fade=stage.current?.animate([{opacity:0},{opacity:1}],{duration:500,easing:'ease-out'})
    return ()=>fade?.cancel()
  },[state.person,state.screen,editing])
  const { analyser, audioStatus, audioTime, play } = useNarration(playback, issue, editing||playback.pausedAt!=null)
  const theme = Object.fromEntries(Object.entries(design.theme).map(([key,value]) => [`--edit-${key}`,value]))
  let view
  switch (state.screen) {
    case 'overview': view = <Overview onTourStart={()=>issue({action:'overview-tour-started',revision:playback.revision})} onTourComplete={()=>issue({action:'overview-tour-ended',revision:playback.revision})} metrics={content.house} audioTime={audioTime} audioStatus={editing?'idle':audioStatus} onPlay={play} />; break
    case 'choose': view = <Choose people={content.people} audioTime={audioTime} audioStatus={editing?'idle':audioStatus} onPlay={play} choose={id => editing ? setPreview(v => ({ ...v, screen: 'experience', person: id, dimension: 0 })) : operate('person', id)} />; break
    case 'experience': view = <Experience person={content.people.find(p => p.id === state.person)} dimension={state.dimension} audioTime={audioTime} audioStatus={editing ? 'idle' : audioStatus} onPlay={play} />; break
    case 'farewell': view = <Farewell analyser={analyser} audioTime={audioTime} audioStatus={audioStatus} onPlay={play} />; break
    default: view = <Welcome />
  }
  return <VoiceOrbProvider enabled={['choose','overview','experience','farewell'].includes(state.screen)} analyser={analyser} active={playback.screen !== 'welcome'} paused={editing}><main className="exhibition" data-screen={state.screen} data-editing={editing} style={theme}>
    <div ref={stage} className={`stage-screen${state.exitStartedAt!=null||state.transition?' stage-screen--exit':state.fadeIn?' stage-screen--enter':''}`} style={{'--screen-fade':`${DURATION.fade}ms`,animationPlayState:editing?'paused':'running'}} key={state.screen === 'experience' ? `experience-${state.restartEpoch||0}` : `${state.screen}-${state.revision}`}>{view}</div>
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
