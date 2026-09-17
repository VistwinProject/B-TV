// 2.0 playback engine. Pure state transitions; no React, DOM or legacy imports.
export const PEOPLE = ['anti-aging', 'child', 'elder', 'pregnancy', 'nomad']
export const DIMENSIONS = ['light', 'air', 'temp', 'sound']
export const DURATION = { dimension: 5000, tour: 20000, farewell: 9000, audioLimit: 120000 }

export function begin(now = 0, revision = 0) {
  return { screen: 'welcome', person: null, seen: [], dimension: 0, loop: 0,
    started: now, revision, held: null, confirmation: null, deadline: null }
}

function screen(state, name, now, extra = {}) {
  return { ...state, screen: name, started: now, revision: state.revision + 1,
    deadline: null, confirmation: null, ...extra }
}

export function advancePlayback(state, event) {
  const now = event.now ?? state.started
  if (event.action === 'pause') return state.pausedAt != null ? state : { ...state, pausedAt: now }
  if (event.action === 'resume') {
    if (state.pausedAt == null) return state
    const duration = Math.max(0, now - state.pausedAt)
    return { ...state, pausedAt: null, started: state.started + duration,
      deadline: state.deadline == null ? null : state.deadline + duration,
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
        deadline: now + (event.hasAudio ? DURATION.audioLimit : DURATION.tour),
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
      if (state.screen === 'narration') return screen(state, 'choose', now)
      return state.screen === 'overview' ? screen(state, 'choose', now) : state
    case 'intro': return screen(begin(now, state.revision), 'narration', now)
    case 'outro': return screen(state, 'farewell', now, { held: null })
    case 'audio-waiting':
      return event.revision===state.revision && ['farewell','experience'].includes(state.screen) ? (state.screen==='farewell'?{...state,awaitingAudio:true}:{...state,sceneAudioPending:true}) : state
    case 'audio-ended':
      if(event.revision===state.revision && state.screen==='experience')return {...state,sceneAudioPending:false,sceneAudioFinishedAt:now}
      if(event.revision===state.revision && state.screen==='farewell')return begin(now,state.revision+1)
      return event.revision === state.revision && ['overview', 'narration'].includes(state.screen)
        ? screen(state, 'choose', now) : state
    case 'audio-failed':
      if(event.revision===state.revision && state.screen==='experience')return {...state,sceneAudioPending:false}
      if(event.revision===state.revision && state.screen==='farewell')return {...state,awaitingAudio:false,started:now}
      return event.revision === state.revision && state.screen === 'overview'
        ? { ...state, deadline: now + DURATION.tour } : state
    case 'clock': {
      let next = state.confirmation && now - state.confirmation.at >= 1800
        ? { ...state, confirmation: null } : state
      if (state.screen === 'overview' && now >= state.deadline) return screen(next, 'choose', now)
      if (state.screen === 'farewell' && !state.awaitingAudio && now - state.started >= DURATION.farewell) return begin(now, state.revision + 1)
      if (state.screen !== 'experience') return next
      const elapsed = Math.max(0, now - state.started)
      if (elapsed >= DURATION.tour && state.seen.length === PEOPLE.length && !state.sceneAudioPending && (state.sceneAudioFinishedAt==null || now-state.sceneAudioFinishedAt>=4000)) return screen(next, 'farewell', now, { held: null })
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

