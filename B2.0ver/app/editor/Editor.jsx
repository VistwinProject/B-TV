import { useRef, useState, useEffect } from 'react'
import content from '../exhibition.json'
import { useDesign, DEFAULT_DESIGN } from './DesignContext.jsx'
import { COLOR_FIELDS, importDesign, shuffleHouseColors } from './model.js'

const pages = { welcome: '首頁文字', overview: '房屋資訊牆', choose: '角色選擇', experience: '五種情境', narration: '前言', farewell: '結語' }
export function Range({ label, value, min = 0, max = 1, step = .01, onChange, numeric = false }) {
  const [draft,setDraft]=useState(String(value))
  useEffect(()=>setDraft(String(value)),[value])
  function commit(){
    const next=draft.trim()===''?NaN:Number(draft)
    if(!Number.isFinite(next)){setDraft(String(value));return}
    const bounded=Math.max(min,Math.min(max,next));setDraft(String(bounded));onChange(bounded)
  }
  return <div className="editor-range"><span>{label}{numeric?<input className="editor-number" aria-label={`${label}數值`} type="number" min={min} max={max} step={step} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur()}}}/>:<output>{Number(value).toFixed(step < 1 ? 2 : 0)}</output>}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></div>
}

function Color({ label, value, onChange, transparent = false }) {
  return <div className="editor-color"><label><span>{label}</span><input aria-label={`${label}色彩`} type="color" value={value || '#ffffff'} onChange={e => onChange(e.target.value)} /></label><input aria-label={`${label} HEX`} key={value} defaultValue={value || ''} placeholder="透明" maxLength={7} onBlur={e => { if (/^#[\da-f]{6}$/i.test(e.target.value)) onChange(e.target.value); else e.target.value = value || '' }} onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }} />{transparent && <button title="設為透明" aria-label={`${label}設為透明`} onClick={() => onChange(null)}>∅</button>}</div>
}
function Select({ label, value, options, onChange }) {
  return <label className="editor-select"><span>{label}</span><select value={value} onChange={e => onChange(e.target.value)}>{Object.entries(options).map(([key, title]) => <option value={key} key={key}>{title}</option>)}</select></label>
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export default function Editor({ preview, setPreview }) {
  const { design, patch, replace, undo, canUndo, setEditing, saved, notice, setNotice } = useDesign()
  const [position, setPosition] = useState(null), [collapsed, setCollapsed] = useState(false)
  const panel = useRef(null), upload = useRef(null)
  const person = content.people.find(p => p.id === preview.person) || content.people[0]
  const path = ['scenes', person.id], scene = design.scenes[person.id]
  const range = (label, p, value, min, max, step) => <Range numeric={preview.screen === 'welcome'} key={label} label={label} value={value} min={min} max={max} step={step} onChange={v => patch(p, v)} />
  function drag(e) {
    if (e.target.closest('button')) return
    const box = panel.current.getBoundingClientRect(), x = e.clientX, y = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.onpointermove = event => setPosition({ left: Math.max(0, Math.min(window.innerWidth - box.width, box.left + event.clientX - x)), top: Math.max(0, Math.min(window.innerHeight - 48, box.top + event.clientY - y)) })
    e.currentTarget.onpointerup = e.currentTarget.onpointercancel = event => { event.currentTarget.onpointermove = null }
  }
  function resetCurrent() {
    if (preview.screen === 'experience') patch(path, DEFAULT_DESIGN.scenes[person.id])
    else if (preview.screen === 'overview') patch(['house'], DEFAULT_DESIGN.house)
    else if (preview.screen === 'welcome') patch(['welcome'], DEFAULT_DESIGN.welcome)
    else patch(['theme'], DEFAULT_DESIGN.theme)
  }
  return <aside className="design-editor" ref={panel} style={position || { right: 18, top: 18 }} aria-label="2.0 E 編輯面板">
    <header onPointerDown={drag}><strong>E · 2.0 畫面編輯</strong><button aria-label={collapsed ? '展開編輯面板' : '收合編輯面板'} onClick={() => setCollapsed(v => !v)}>{collapsed ? '＋' : '−'}</button><button aria-label="結束編輯" onClick={() => setEditing(false)}>×</button></header>
    {!collapsed && <div className="editor-body"><p className="editor-status">{saved ? '設定已自動儲存在此瀏覽器' : '無法儲存，請匯出設定備份'}<br />展演已暫停 · E / Esc 結束編輯</p>
      <Select label="預覽介面" value={preview.screen} options={pages} onChange={screen => setPreview(v => ({ ...v, screen, started: performance.now() }))} />
      {preview.screen === 'experience' && <><Select label="情境" value={person.id} options={Object.fromEntries(content.people.map(p => [p.id, p.title]))} onChange={person => setPreview(v => ({ ...v, person }))} /><Select label="資訊維度" value={preview.dimension} options={{ 0: '光照', 1: '空氣', 2: '溫濕度', 3: '聲音' }} onChange={dimension => setPreview(v => ({ ...v, dimension: Number(dimension) }))} /></>}
      {preview.screen === 'experience' ? <>
        <details open><summary>情境版面 · {person.title}</summary>{scene.columns.map((v, i) => range(['資訊欄寬','影像欄寬','解方欄寬'][i], [...path, 'columns', i], v, .15, 5, .01))}{range('痛點卡高度 %', [...path, 'painHeight'], scene.painHeight, 15, 70, 1)}<button className="editor-wide" onClick={() => { const next = structuredClone(design); Object.values(next.scenes).forEach(s => { s.columns = [...scene.columns]; s.painHeight = scene.painHeight }); replace(next); setNotice('欄寬與痛點卡高度已套用到五種情境') }}>版面比例套用到全部情境</button><p>也可以拖曳畫面上的分隔線。</p></details>
        <details open><summary>客廳線框構圖</summary>{range('線框縮放', [...path,'homeView','zoom'],scene.homeView.zoom,.5,2.5,.01)}{range('水平位置（右 +）%', [...path,'homeView','x'],scene.homeView.x,-100,100,1)}{range('垂直位置（下 +）%', [...path,'homeView','y'],scene.homeView.y,-100,100,1)}<button onClick={() => patch([...path,'homeView'],{zoom:1,x:0,y:0})}>重設線框構圖</button><button className="editor-wide" onClick={() => { const next=structuredClone(design);Object.values(next.scenes).forEach(s=>{s.homeView={...scene.homeView}});replace(next);setNotice('客廳構圖已套用到五種情境') }}>構圖套用到全部情境</button></details>
        <details open><summary>資訊卡配色</summary>{COLOR_FIELDS.map((label, i) => <Color key={label} label={label} value={scene.colors[i]} transparent={i < 6} onChange={v => patch([...path, 'colors', i], v)} />)}</details>
        <details><summary>共用背景與玻璃材質</summary>{range('卡片不透明度', ['material','alpha'], design.material.alpha, 0, 1, .01)}{range('白色覆層', ['material','wash'], design.material.wash, 0, 1, .01)}{range('背景模糊', ['material','blur'], design.material.blur, 0, 40, 1)}{range('表面反光', ['material','gloss'], design.material.gloss, 0, 3, .01)}<Select label="玻璃折射" value={design.material.refract} options={{ off: '關閉', soft: '輕微折射', strong: '加強折射' }} onChange={v => patch(['material','refract'], v)} /><p>材質設定會套用到全部五種情境。</p></details>
      </> : preview.screen === 'overview' ? <>
        <details open><summary>資訊牆文字顏色</summary>{Object.entries({title:'標題與天氣內文',number:'數字與溫度',caption:'卡片標籤與單位'}).map(([key,label])=><Color key={key} label={label} value={design.house.textColors[key]} onChange={v=>patch(['house','textColors',key],v)}/>)}</details>
        <details open><summary>資訊牆卡片配色</summary>
          <Select label="配色模式" value={design.house.colorMode} options={{uniform:'統一顏色',palette:'五色隨機配置'}} onChange={v=>patch(['house','colorMode'],v)} />
          {design.house.colorMode==='uniform'?<Color label="統一卡片顏色" value={design.house.uniformColor} onChange={v=>patch(['house','uniformColor'],v)}/>:<>{design.house.palette.map((color,i)=><Color key={i} label={`顏色 ${i+1}`} value={color} onChange={v=>patch(['house','palette',i],v)}/>)}<button className="editor-wide" onClick={()=>patch(['house','colorOrder'],shuffleHouseColors())}>重新隨機配置</button></>}
          {range('資訊牆卡片不透明度',['house','alpha'],design.house.alpha,0,1,.01)}
          <p>透明度僅套用於資訊牆；五色會平均分配並自動儲存。照片維持原色。</p>
        </details>
        <details open><summary>資訊牆格線比例</summary>{design.house.columns.map((v,i) => range(`第 ${i+1} 欄`, ['house','columns',i],v,.15,5,.01))}{design.house.rows.map((v,i) => range(`第 ${i+1} 列`, ['house','rows',i],v,.15,5,.01))}</details>
      </> : null}
      {preview.screen === 'welcome' && <><p>首頁固定使用 A 字漸層背景。可直接拖曳文字，或使用下方位置滑桿。</p>{Object.entries({title:'中文標題',subtitle:'英文小標',hint:'請入座提示'}).map(([key,label])=><details open key={key}><summary>{label}</summary>{range('字級比例 %',['welcome',key,'size'],design.welcome[key].size,40,200,1)}{range('字距微調 em',['welcome',key,'spacing'],design.welcome[key].spacing,-.1,1,.01)}{range('水平位置（右 +）%',['welcome',key,'x'],design.welcome[key].x,-80,80,.1)}{range('垂直位置（下 +）%',['welcome',key,'y'],design.welcome[key].y,-80,80,.1)}</details>)}<details open><summary>中英文間距</summary>{range('間距（英文字級倍數）',['welcome','lineGap'],design.welcome.lineGap,0,4,.05)}</details></>}

      <div className="editor-actions"><button disabled={!canUndo} onClick={undo}>復原上一步</button><button onClick={resetCurrent}>重設目前畫面</button><button onClick={() => download('B2.0-design.json', JSON.stringify(design,null,2), 'application/json')}>匯出設定 JSON</button><button onClick={() => upload.current.click()}>匯入設定 JSON</button><button onClick={() => { replace(DEFAULT_DESIGN); setNotice('已還原全部預設值，可按復原上一步撤銷') }}>還原全部預設</button><button onClick={() => setEditing(false)}>完成編輯</button></div>
      <input hidden ref={upload} type="file" accept="application/json,.json" onChange={async e => { const file=e.target.files?.[0]; e.target.value=''; if(!file)return; try { if(file.size>100000)throw new Error('設定檔過大'); replace(importDesign(await file.text(),DEFAULT_DESIGN)); setNotice('設定已匯入') } catch(error){setNotice(`匯入失敗：${error.message}`)} }} />
      <p className="editor-notice" role="status">{notice}</p>
    </div>}
  </aside>
}
