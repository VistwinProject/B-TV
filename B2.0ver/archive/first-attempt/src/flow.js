import { PERSONAS, PERSONA_ORDER } from './personas.js'

export const initial = {
  phase:       'idle',   // idle | intro | card | house | character | scene | loop | outro
  wsStatus:    'local',
  connected:   false,    // reader 在線
  cardScanned: false,
  character:   null,     // persona id 驅動場景
  onReader:    null,     // 'card' | 'character' | null
  confirm:     null,     // { kind, id, seq } 感應成功漣漪
  seq:         0,
  sceneRun:    0,        // 每次進入 scene 遞增 → 強制 SceneSequence 重播
  activity:    0,        // 每次 NFC 事件遞增 → 重置「無人活動」倒數
  visited:     [],       // 這一輪已經感應過的情境 id(不重複);集滿五種 → 播完就進結語
}

export function reducer(state, a) {
  switch (a.type) {
    case 'ws-status':          return { ...state, wsStatus: a.status }
    case 'reader-connected':   return { ...state, connected: true }
    case 'reader-disconnected':return { ...state, connected: false, onReader: null }

    case 'tag-present': {
      const kind = a.data?.kind
      const seq  = state.seq + 1
      const activity = state.activity + 1
      if (kind === 'card') {
        // Continuous hardware reads must not restart the same invitation.
        if (state.onReader === 'card') return state
        // 邀請卡 = 新訪客，資訊牆完成前導後自動進入選項。
        // 任何階段刷卡都回到 house = 新訪客重新開始。前言/結語改由展務員(按鍵/server)觸發。
        return {
          ...state, cardScanned: true, onReader: 'card',
          phase: 'house', character: null, visited: [],
          confirm: { kind: 'card', id: 'invite', seq }, seq, activity,
        }
      }
      if (kind === 'character' && Object.hasOwn(PERSONAS, a.data.id)) {
        // 同一個角色已在播放中(scene/loop)→ 視為 reader 重複讀取,忽略,不重置場景/節奏。
        if (state.character === a.data.id && (state.phase === 'scene' || state.phase === 'loop')) {
          return { ...state, onReader: 'character' }
        }
        // 換角色(或從其他階段)→ 進入該情境,重置場景節奏。
        // visited 累積「這一輪感應過哪些情境」(不重複、不分順序)→ 集滿五種就準備收尾。
        const visited = state.visited.includes(a.data.id) ? state.visited : [...state.visited, a.data.id]
        return {
          ...state, cardScanned: true, character: a.data.id, onReader: 'character',
          phase: 'scene', sceneRun: state.sceneRun + 1, visited,
          confirm: { kind: 'character', id: a.data.id, seq }, seq, activity,
        }
      }
      return state // 未註冊 / 未知 tag → 忽略
    }

    case 'tag-remove':
      // 拿起卡 / 鑰匙圈:只清 onReader(單一感應點要拿起卡才能放鑰匙圈),
      // 場景 / loop 保留當前 persona;bump activity 重置無人倒數。
      return { ...state, onReader: null, activity: state.activity + 1 }

    case 'confirm-clear':
      return state.confirm?.seq === a.seq ? { ...state, confirm: null } : state

    // ── 展務員 / 流程控制(前言・結語・下一步・重置:皆手動或 server 觸發,不自動續播)──
    case 'op-intro':   // 待機 → 前言(展務員 / server)
      return { ...initial, wsStatus: state.wsStatus, connected: state.connected, phase: 'intro' }
    case 'op-advance': // 下一步(展務員 n):前言→房屋資訊→選角色
      if (state.phase === 'intro') return { ...state, phase: 'house' }
      if (state.phase === 'house') return { ...state, phase: 'character' }
      return state
    case 'scene-done':
      if (a.run !== state.sceneRun || state.phase !== 'scene') return state
      // 五種情境都感應過 → 最後這一輪播完直接進結語(不停在 loop)
      return state.visited.length >= PERSONA_ORDER.length
        ? { ...state, phase: 'outro', onReader: null }
        : { ...state, phase: 'loop' }
    case 'op-outro':   // 播結語(展務員 / server),OUTRO_MS 後自動回待機
      return { ...state, phase: 'outro', onReader: null }
    case 'outro-done':
      return state.phase === 'outro'
        ? { ...initial, wsStatus: state.wsStatus, connected: state.connected }
        : state
    case 'op-reset':
      return { ...initial, wsStatus: state.wsStatus, connected: state.connected }

    default: return state
  }
}
