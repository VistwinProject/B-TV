// 2.0 playback engine. Pure state transitions; no React, DOM or legacy imports.
export const PEOPLE = ['anti-aging', 'child', 'elder', 'pregnancy', 'nomad']
export const DIMENSIONS = ['light', 'air', 'temp', 'sound']
export const DURATION = { dimension: 5000, tour: 20000, overview:18000, scene:25000, endingHold:2000, fade:250, farewell: 9000, audioLimit: 120000 }

export function begin(now = 0, revision = 0) {
  return { screen: 'welcome', person: null, seen: [], dimension: 0, loop: 0,
    started: now, revision, held: null, confirmation: null, deadline: null }
}

function screen(state, name, now, extra = {}) {
  return { ...state, screen: name, started: now, revision: state.revision + 1,
    deadline: null, confirmation: null, exitStartedAt:null, ...extra }
}

export function advancePlayback(state, event) {
  const now = event.now ?? state.started
  if (event.action === 'pause') return state.pausedAt != null ? state : { ...state, pausedAt: now }
  if (event.action === 'resume') {
    if (state.pausedAt == null) return state
    if(event.restart){
      return {...state,pausedAt:null,started:now,revision:state.revision+1,restartEpoch:(state.restartEpoch||0)+1,
        dimension:0,loop:0,transition:null,exitStartedAt:null,fadeIn:false,confirmation:null,
        sceneAudioPending:false,sceneAudioFinishedAt:null,awaitingAudio:false,overviewTourPending:false,
        deadline:state.screen==='overview'?now+DURATION.overview:null}
    }
    const duration = Math.max(0, now - state.pausedAt)
    return { ...state, pausedAt: null, started: state.started + duration,
      deadline: state.deadline == null ? null : state.deadline + duration,
      sceneAudioFinishedAt: state.sceneAudioFinishedAt == null ? null : state.sceneAudioFinishedAt + duration,
      exitStartedAt: state.exitStartedAt == null ? null : state.exitStartedAt + duration,
      confirmation: state.confirmation ? { ...state.confirmation, at: state.confirmation.at + duration } : null }
  }
  if (state.pausedAt != null) return event.action === 'remove' ? { ...state, held: null } : state
  switch (event.action) {
    case 'reset': return begin(now, state.revision + 1)
    case 'remove': return state.held === null ? state : { ...state, held: null }
    case 'invite': {
      if (state.held === 'invite') return state
      return screen(begin(now, state.revision), 'overview', now, {
        held: 'invite', confirmation: { at: now, color: '#2f7bff' },
        deadline: now + (event.hasAudio ? DURATION.audioLimit : DURATION.overview),
      })
    }
    case 'person': {
      if (!PEOPLE.includes(event.id)) return state
      if (state.screen === 'experience' && state.person === event.id) {
        return state.held === event.id ? state : { ...state, held: event.id }
      }
      return screen(state, 'experience', now, {
        person: event.id, held: event.id, dimension: 0, loop: 0, sceneAudioPending:false, sceneAudioFinishedAt:null,
        seen: state.seen.includes(event.id) ? state.seen : [...state.seen, event.id],
        confirmation: { at: now, color: event.color || '#2f7bff' },
      })
    }
    case 'next':
      return state.screen === 'overview' ? screen(state, 'choose', now) : state
    case 'intro': return screen(begin(now, state.revision), 'choose', now)
    case 'outro': return screen(state, 'farewell', now, { held: null })
    case 'overview-tour-started':
      return event.revision===state.revision&&state.screen==='overview'?{...state,overviewTourPending:true}:state
    case 'overview-tour-ended':
      return event.revision===state.revision&&state.screen==='overview'?{...state,overviewTourPending:false}:state
    case 'audio-waiting':
      if(event.revision===state.revision && state.screen==='overview')return {...state,deadline:now+DURATION.audioLimit}
      return event.revision===state.revision && ['farewell','experience'].includes(state.screen) ? (state.screen==='farewell'?{...state,awaitingAudio:true}:{...state,sceneAudioPending:true}) : state
    case 'audio-ended':
      if(event.revision===state.revision && state.screen==='overview')return {...state,deadline:now,overviewTourPending:false}
      if(event.revision===state.revision && state.screen==='experience')return {...state,sceneAudioPending:false,sceneAudioFinishedAt:now}
      if(event.revision===state.revision && state.screen==='farewell')return {...state,awaitingAudio:false}
      return state
    case 'audio-failed':
      if(event.revision===state.revision && state.screen==='experience')return {...state,sceneAudioPending:false}
      if(event.revision===state.revision && state.screen==='farewell')return {...state,awaitingAudio:false,started:now}
      return event.revision === state.revision && state.screen === 'overview'
        ? { ...state, deadline: Math.max(state.started+DURATION.overview,now) } : state
    case 'clock': {
      let next = state.confirmation && now - state.confirmation.at >= 1800
        ? { ...state, confirmation: null } : state
      if (state.screen === 'overview' && now >= state.deadline && (!state.overviewTourPending || now-state.started>=DURATION.audioLimit)) return screen(next, 'choose', now)
      if (state.screen !== 'experience') return next
      const elapsed = Math.max(0, now - state.started)
      if(state.exitStartedAt!=null){
        return now-state.exitStartedAt>=DURATION.fade?screen(next,'farewell',now,{held:null}):next
      }
      const finishedAt=Math.max(state.started+DURATION.scene,state.sceneAudioFinishedAt??0)
      if(state.seen.length===PEOPLE.length&&!state.sceneAudioPending&&now>=finishedAt+DURATION.endingHold){
        return {...next,exitStartedAt:now}
      }
      const dimension = Math.floor(elapsed / DURATION.dimension) % DIMENSIONS.length
      const loop = Math.floor(elapsed / DURATION.tour)
      return dimension === state.dimension && loop === state.loop ? next : { ...next, dimension, loop }
    }
    default: return state
  }
}

export function nfcAction(message) {
  if (!message || typeof message !== 'object') return null
  if (message.type === 'tag-remove') return { action: 'remove' }
  if (['reset', 'intro', 'outro'].includes(message.type)) return { action: message.type }
  if (message.type !== 'tag-present') return null
  if (message.data?.kind === 'card') return { action: 'invite' }
  if (message.data?.kind === 'character' && PEOPLE.includes(message.data.id)) return { action: 'person', id: message.data.id }
  return null
}

