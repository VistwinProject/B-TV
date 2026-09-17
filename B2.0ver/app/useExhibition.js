import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { advancePlayback, begin, nfcAction, PEOPLE } from './playback.js'

const query = new URLSearchParams(window.location.search)
export const flags = {
  hardware: query.get('hardware') === '1' || import.meta.env.VITE_NFC_ENABLED === 'true',
  audio: import.meta.env.VITE_AUDIO_ENABLED === 'true',
  kiosk: query.get('kiosk') === '1',
}

export function useExhibition(people, suspended = false) {
  const [state, dispatch] = useReducer(advancePlayback, null, () => begin(performance.now()))
  const [connection, setConnection] = useState(flags.hardware ? 'connecting' : 'local')
  const [reader, setReader] = useState(false)
  const socket = useRef(null)
  const issue = useCallback((event) => dispatch({ ...event, now: performance.now(), hasAudio: flags.audio }), [])
  useEffect(() => { issue({ action: suspended ? 'pause' : 'resume' }) }, [suspended, issue])
  const accept = useCallback((message) => {
    if (message?.type === 'reader-connected') setReader(true)
    if (message?.type === 'reader-disconnected') { setReader(false); issue({ action: 'remove' }) }
    const event = nfcAction(message)
    if (event) issue({ ...event, color: people.find(p => p.id === event.id)?.color })
  }, [issue, people])

  useEffect(() => {
    const clock = setInterval(() => issue({ action: 'clock' }), 100)
    return () => clearInterval(clock)
  }, [issue])

  useEffect(() => {
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
    const ws = socket.current
    if (ws?.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify(message)); return } catch { /* local fallback */ }
    }
    accept(message)
  }, [accept])
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
    if (suspended || (!flags.audio && !['narration','farewell','experience'].includes(state.screen))) return
    const cue = { overview: 'lead', narration: 'intro', farewell: 'outro' }[state.screen]
      || (state.screen === 'experience' ? `scene-${state.person}` : null)
    if (!cue) return
    let active = true, context, source, settled = false, captionFrame=0, lastCaptionTime=-1
    const player = new Audio(`${import.meta.env.BASE_URL}voice/${cue}.${(cue.startsWith('scene-')||['intro','outro'].includes(cue)) ? 'wav' : 'mp3'}`)
    if(['farewell','experience'].includes(state.screen))issue({action:'audio-waiting',revision:state.revision})
    const syncCaption=()=>{
      if(!active)return
      const time=player.currentTime
      if(Math.abs(time-lastCaptionTime)>=1/30){setAudioTime(time);lastCaptionTime=time}
      captionFrame=requestAnimationFrame(syncCaption)
    }
    captionFrame=requestAnimationFrame(syncCaption)
    player.ontimeupdate=()=>{if(active){setAudioTime(player.currentTime);lastCaptionTime=player.currentTime}}

    function fail() {
      if (!active || settled) return
      settled = true
      setAudioStatus('error')
      issue({ action: 'audio-failed', revision: state.revision })
    }
    player.onerror = fail
    player.onended = () => {
      if (active && !settled) { settled = true; setAudioTime(player.duration);setAudioStatus('ended');issue({ action: 'audio-ended', revision: state.revision }) }
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
        setAudioStatus('loading')
        context?.resume().catch(() => {})
        player.play().then(() => { if (active) setAudioStatus(context?.state === 'suspended' ? 'blocked' : 'playing') }).catch(error => {
          if (!active) return
          if (error.name === 'NotAllowedError') setAudioStatus('blocked')
          else fail()
        })
      }
      retry.current = () => { player.load(); play() }
      play()
    } catch { fail() }
    return () => {
      active = false; cancelAnimationFrame(captionFrame);retry.current = null; player.pause(); player.onerror = null; player.onended = null; player.ontimeupdate=null
      player.removeAttribute('src'); player.load()
      source?.disconnect(); analyser.current?.disconnect(); analyser.current = null
      context?.close().catch(() => {})
    }
  }, [state.revision, state.screen, state.person, issue, suspended])
  return { analyser, audioStatus, audioTime, play: () => retry.current?.() }
}
