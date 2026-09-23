import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { createBrowserSync, isBrowserPreview } from './browserSync.js'
import { createCaptionSync } from './captionSync.js'
import { advancePresentation } from './pageTransitions.js'
import { begin, nfcAction, PEOPLE, DURATION } from './playback.js'

const browserPreview = isBrowserPreview(window.location)
const query = new URLSearchParams(window.location.search)
export const flags = {
  hardware: query.has('hardware') ? query.get('hardware') !== '0' : import.meta.env.VITE_NFC_ENABLED !== 'false',
  audio: import.meta.env.VITE_AUDIO_ENABLED === 'true',
  kiosk: query.get('kiosk') === '1',
}

export function useExhibition(people, suspended = false) {
  const [state, dispatch] = useReducer(advancePresentation, null, () => begin(performance.now()))
  const [connection, setConnection] = useState(flags.hardware ? 'connecting' : 'local')
  const [reader, setReader] = useState(false)
  const socket = useRef(null)
  const preview = useRef(null)
  const flow = useRef(null)
  const issue = useCallback((event) => dispatch({ ...event, now: performance.now(), hasAudio: flags.audio }), [])
  useLayoutEffect(() => { issue({ action: suspended ? 'pause' : 'resume', restart:!suspended }) }, [suspended, issue])
  const accept = useCallback((message, meta) => {
    if (meta?.replay && message.type === 'tv-phase' && ['choose','farewell'].includes(message.screen)) {
      issue({action:message.screen === 'choose' ? 'intro' : 'outro'}); return
    }
    if (message?.type === 'reader-connected') setReader(true)
    if (message?.type === 'reader-disconnected') { setReader(false); issue({ action: 'remove' }) }
    if(message?.type==='tag-present') flow.current=message.flowId
    if(['reset','intro','outro'].includes(message?.type)) flow.current=message.flowId
    const event = nfcAction(message)
    if (event) issue({ ...event, color: people.find(p => p.id === event.id)?.color })
  }, [issue, people])

  useEffect(() => {
    const clock = setInterval(() => issue({ action: 'clock' }), 100)
    return () => clearInterval(clock)
  }, [issue])

  useEffect(() => {
    if (browserPreview) {
      const transport = createBrowserSync(accept)
      preview.current = transport
      setConnection('local')
      return () => { transport.close(); preview.current = null }
    }
    if (!flags.hardware) return
    let closed = false, reconnect
    function connect() {
      if (closed) return
      setConnection('connecting')
      let ws
      try { ws = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:8788') }
      catch { setConnection('disconnected'); reconnect = setTimeout(connect, 3000); return }
      socket.current = ws
      ws.onopen = () => { if (!closed) setConnection('connected') }
      ws.onmessage = e => { if (!closed) { try { accept(JSON.parse(e.data)) } catch { /* invalid message */ } } }
      ws.onerror = () => ws.close()
      ws.onclose = () => {
        if (closed) return
        setConnection('disconnected'); setReader(false); issue({ action: 'remove' })
        reconnect = setTimeout(connect, 3000)
      }
    }
    connect()
    return () => { closed = true; clearTimeout(reconnect); socket.current?.close(); socket.current = null }
  }, [accept])

  const send = useCallback(message => {
    if (preview.current) { preview.current.send(message); return }
    const ws = socket.current
    if (ws?.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify(message)); return } catch { /* local fallback */ }
    }
    accept(message)
  }, [accept])
  // TV owns narration timing; table follows the actual page commit.
  useEffect(() => {
    if(suspended || flow.current == null || !['overview','choose','farewell'].includes(state.screen)) return
    const message={type:'tv-phase',screen:state.screen,flowId:flow.current}
    if(preview.current) { preview.current.send(message); return }
    const ws=socket.current
    if(ws?.readyState===WebSocket.OPEN) ws.send(JSON.stringify({type:'tv-phase',screen:state.screen,flowId:flow.current}))
  }, [state.screen,state.revision,connection,suspended])

  const operate = useCallback((action, id) => {
    if (action === 'next') { issue({ action }); return }
    if (action === 'invite' || action === 'person') {
      send({ type: 'tag-remove' })
      send({ type: 'tag-present', data: { kind: action === 'invite' ? 'card' : 'character', id: id || 'invite' } })
    } else send({ type: action === 'remove' ? 'tag-remove' : action })
  }, [issue, send])

  useEffect(() => {
    const keys = { c: 'invite', n: 'next', ArrowRight: 'next', i: 'intro', Enter: 'intro', o: 'outro', r: 'reset', Escape: 'reset', x: 'remove', ' ': 'remove' }
    const onKey = e => {
      if (suspended || e.repeat || e.target.isContentEditable || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return
      if (e.target.tagName === 'BUTTON' && ['Enter', ' '].includes(e.key)) return
      if (/^[1-5]$/.test(e.key)) { e.preventDefault(); operate('person', PEOPLE[Number(e.key) - 1]); return }
      const action = keys[e.key] || keys[e.key.toLowerCase()]
      if (action) { e.preventDefault(); operate(action) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [operate, suspended])
  return { state, connection, reader, operate, issue }
}

// One sound session per screen revision; cleanup invalidates late promises.
export function useNarration(state, issue, suspended = false) {
  const analyser = useRef(null), retry = useRef(null)
  const [audioStatus, setAudioStatus] = useState('idle')
  const [audioTime,setAudioTime]=useState(0)
  useEffect(() => {
    setAudioStatus('idle');setAudioTime(0)
    if (suspended || (!flags.audio && !['choose','overview','farewell','experience'].includes(state.screen))) return
    const cue = { choose: 'choose', overview: 'lead', farewell: 'outro' }[state.screen]
      || (state.screen === 'experience' ? `scene-${state.person}` : null)
    if (!cue) return
    let active = true, context, source, settled = false, entryTimer
    const player = new Audio(`${import.meta.env.BASE_URL}voice/${cue}.${(cue.startsWith('scene-')||['choose','lead','outro'].includes(cue)) ? 'wav' : 'mp3'}${cue==='scene-elder'?'?v=3':['scene-anti-aging','lead'].includes(cue)?'?v=2':''}`)
    if(['overview','farewell','experience'].includes(state.screen))issue({action:'audio-waiting',revision:state.revision})
    const captions=createCaptionSync(player,setAudioTime)
    player.ontimeupdate=()=>{if(active&&!settled)captions.sync()}

    function fail() {
      if (!active || settled) return
      settled = true
      clearTimeout(entryTimer)
      captions.stop()
      setAudioStatus('error')
      issue({ action: 'audio-failed', revision: state.revision })
    }
    player.onerror = fail
    player.onended = () => {
      if (active && !settled) { settled = true; captions.stop();setAudioTime(player.duration);setAudioStatus('ended');issue({ action: 'audio-ended', revision: state.revision }) }
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        context = new AudioContext()
        analyser.current = context.createAnalyser()
        analyser.current.fftSize = 1024
        source = context.createMediaElementSource(player)
        source.connect(analyser.current); analyser.current.connect(context.destination)
        context.resume().catch(() => {})
      }
      const play = () => {
        if (!active) return
        settled = false
        captions.start()
        if(['overview','farewell','experience'].includes(state.screen))issue({action:'audio-waiting',revision:state.revision})
        setAudioStatus('loading')
        context?.resume().catch(() => {})
        player.play().then(() => { if (active) setAudioStatus(context?.state === 'suspended' ? 'blocked' : 'playing') }).catch(error => {
          if (!active) return
          if (error.name === 'NotAllowedError') {captions.stop();setAudioStatus('blocked')}
          else fail()
        })
      }
      retry.current = () => { clearTimeout(entryTimer); player.load(); play() }
      // Let the role selection settle for 1.2 seconds after the page switches.
      setAudioStatus('loading')
      entryTimer = setTimeout(play, state.screen === 'choose' ? 1200 : state.fadeIn ? DURATION.fade : 1000)
    } catch { fail() }
    return () => {
      active = false; clearTimeout(entryTimer); captions.stop();retry.current = null; player.pause(); player.onerror = null; player.onended = null; player.ontimeupdate=null
      player.removeAttribute('src'); player.load()
      source?.disconnect(); analyser.current?.disconnect(); analyser.current = null
      context?.close().catch(() => {})
    }
  }, [state.revision, state.screen, state.person, issue, suspended])
  return { analyser, audioStatus, audioTime, play: () => retry.current?.() }
}
