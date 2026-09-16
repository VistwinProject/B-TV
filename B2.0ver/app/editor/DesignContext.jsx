import { createContext, useContext, useEffect, useReducer, useState } from 'react'
import content from '../exhibition.json'
import preset from '../../B2.0-design.json'
import { makeDefaults, normalizeDesign, changeAt, importDesign, STORAGE_KEY } from './model.js'
export const DEFAULT_DESIGN = normalizeDesign(preset, makeDefaults(content.people, content.house))
const Context = createContext({ design: DEFAULT_DESIGN, editing: false })
export const useDesign = () => useContext(Context)
function reduceEditor(state, action) {
  if (action.type === 'undo') return state.history.length ? { design: state.history.at(-1), history: state.history.slice(0,-1) } : state
  const next = action.type === 'patch' ? changeAt(state.design, action.path, action.value) : action.value
  return { design: normalizeDesign(next, DEFAULT_DESIGN), history: [...state.history.slice(-29),state.design] }
}
export function DesignProvider({ children }) {
  const [{ design, history }, dispatch] = useReducer(reduceEditor, null, () => {
    let design
    try { design = importDesign(localStorage.getItem(STORAGE_KEY) || '', DEFAULT_DESIGN) }
    catch { design = structuredClone(DEFAULT_DESIGN) }
    return { design, history: [] }
  })
  const [editing,setEditing] = useState(false), [notice,setNotice] = useState(''), [saved,setSaved] = useState(true)
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(design)); setSaved(true) } catch { setSaved(false) } }, [design])
  function replace(value) { dispatch({ type:'replace', value }); setNotice('') }
  function patch(path,value) { dispatch({ type:'patch',path,value }); setNotice('') }
  function undo() { dispatch({ type:'undo' }); setNotice('') }
  useEffect(() => {
    const key = e => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Escape' && editing) { e.preventDefault(); e.stopImmediatePropagation(); setEditing(false); return }
      if (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return
      if (e.key.toLowerCase() === 'e') { e.preventDefault(); e.stopImmediatePropagation(); setEditing(v => !v) }
    }
    window.addEventListener('keydown',key,true)
    return () => window.removeEventListener('keydown',key,true)
  },[editing])
  return <Context.Provider value={{ design,editing,setEditing,patch,replace,undo,canUndo:history.length>0,notice,setNotice,saved }}>{children}</Context.Provider>
}
