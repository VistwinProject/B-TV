import {useEffect, useRef} from 'react'

// A post-commit report: socket connection alone is never display readiness.
export function useDisplayReport(socket, state, command) {
  const latest = useRef(null)
  const key = JSON.stringify({state, reqId:command?.reqId, command})
  useEffect(() => {
    latest.current = {type:'b-display-state', protocol:'b-display-v1', ...state,
      appliedReqId: command?.reqId && !command.replay && matchesCommand(command,state) ? command.reqId : null}
    const publish = () => {
      if(socket.current?.readyState === 1 && latest.current) socket.current.send(JSON.stringify(latest.current))
    }
    publish()
    const timer = setInterval(publish, 1000)
    return () => clearInterval(timer)
  }, [socket,key])
  useEffect(() => () => {
    if(socket.current?.readyState === 1) socket.current.send(JSON.stringify({type:'b-display-detach',displayId:state.displayId}))
  }, [socket,state.displayId])
}

export function matchesCommand(command,state) {
  if(!state.ready) return false
  const table=state.displayId==='table'
  switch(command.type) {
    case 'reset': return state.screen===(table?'place-card':'welcome') && state.activity==='idle'
    case 'intro': return state.screen===(table?'place-character':'choose')
    case 'outro': return state.screen==='farewell'
    case 'tag-remove': return state.held==null
    case 'tag-present':
      return command.data?.kind==='card'
        ? state.screen===(table?'connected':'overview')
        : state.screen===(table?'scene':'experience') && state.person===command.data?.id
    default: return false
  }
}
