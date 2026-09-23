// Shared verbatim with B-Table/src/browserSync.js. Pages share one HTTPS origin.
const CHANNEL = 'b-zone-preview-v1'
const KEY = CHANNEL + ':state'
const roles = ['anti-aging','child','elder','pregnancy','nomad']
export function isBrowserPreview(location) {
  const query = new URLSearchParams(location.search)
  return query.get('sync') === 'browser' || (location.protocol === 'https:' && query.get('hardware') !== '1')
}
export function createBrowserSync(accept, env = window) {
  const channel = new env.BroadcastChannel(CHANNEL)
  let snapshot = null
  const seen = new Set()
  const read = () => {
    try { return JSON.parse(env.localStorage.getItem(KEY)) } catch { return snapshot }
  }
  const save = value => {
    snapshot = value
    try { env.localStorage.setItem(KEY, JSON.stringify(value)) } catch { /* live channel still works */ }
  }
  const valid = m => m && (['reset','intro','outro','tag-remove'].includes(m.type)
    || (m.type === 'tag-present' && (m.data?.kind === 'card' || (m.data?.kind === 'character' && roles.includes(m.data.id))))
    || (m.type === 'tv-phase' && ['overview','choose','farewell'].includes(m.screen)))
  function deliver(packet) {
    if (!packet || !valid(packet.message) || seen.has(packet.id)) return
    seen.add(packet.id)
    if (seen.size > 200) seen.delete(seen.values().next().value)
    snapshot = packet.snapshot
    accept(packet.message)
  }
  channel.onmessage = e => deliver(e.data)
  const stored = read()
  if (stored?.command && valid(stored.command)) {
    snapshot = stored
    accept(stored.command, { replay: true })
    if (stored.removed) accept({type:'tag-remove'}, { replay: true })
    if (stored.phase && valid(stored.phase)) accept(stored.phase, { replay: true })
  }
  return {
    send(input) {
      if (!valid(input)) return
      let current = read() || snapshot
      let message = input
      if (input.type === 'tv-phase') {
        if (!current || input.flowId !== current.command?.flowId) return
        current = {...current,phase:input}
      } else if (input.type === 'tag-remove') {
        current = current ? {...current,removed:true} : null
      } else {
        message = {...input,flowId:env.crypto.randomUUID()}
        current = {command:message,removed:false,phase:null}
      }
      save(current)
      const packet = {id:env.crypto.randomUUID(),message,snapshot:current}
      deliver(packet)
      channel.postMessage(packet)
    },
    close() { channel.close() },
  }
}
