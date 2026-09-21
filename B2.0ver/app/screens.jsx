import {overviewCaptionAt} from './overviewCaptions.js'
import {houseCardColor} from './editor/model.js'
import {useEffect,useState} from 'react'
import { sceneCaptionAt } from './sceneCaptions.js'
import { outroCaptionAt } from './outroCaptions.js'
import HomeScene from './HomeScene.jsx'
import { DIMENSIONS } from './playback.js'
import { BrandFooter, Film, mediaURL, NumberText, PersonSymbol, Symbol, VerticalReel, Voice } from './visuals.jsx'

import { useDesign } from './editor/DesignContext.jsx'
import Guides from './editor/Guides.jsx'

export const DIMENSION_LABELS = ['光照', '空氣', '溫濕度', '聲音']
const CIRCLES = ['①', '②', '③', '④']

export function Welcome() {
  const {design,editing,patch}=useDesign(),settings=design.welcome
  const textProps=key=>({
    className:editing?'welcome-editable':undefined,
    style:{'--text-scale':settings[key].size/100,'--text-spacing':`${settings[key].spacing}em`,transform:`translate(${settings[key].x}vw,${settings[key].y}vh)`},
    onPointerDown:editing?e=>{
      e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId)
      const startX=e.clientX,startY=e.clientY,original=settings[key],element=e.currentTarget
      element.onpointermove=event=>patch(['welcome',key],{...original,x:original.x+(event.clientX-startX)/window.innerWidth*100,y:original.y+(event.clientY-startY)/window.innerHeight*100})
      element.onpointerup=element.onpointercancel=()=>{element.onpointermove=null}
    }:undefined
  })
  return <section className="welcome screen-center" style={{'--welcome-line-gap':settings.lineGap,'--subtitle-scale':settings.subtitle.size/100}}>
    <div className="welcome-type"><div className="welcome-heading"><h1 {...textProps('title')} aria-label="感應光寓">{Array.from('感應光寓').map(letter=><span key={letter} aria-hidden="true">{letter}</span>)}</h1><p {...textProps('subtitle')} aria-label="SENSING RESIDENCE">{Array.from('SENSING RESIDENCE').map((letter,index)=><span key={index} aria-hidden="true">{letter===' '? '\u00a0':letter}</span>)}</p></div><span {...textProps('hint')}>請入座，將邀請卡放上感應區</span></div>
    <i className="brand-logo welcome-logo" role="img" aria-label="ANLB inside" />
  </section>
}

export function Choose({ people, choose }) {
  const {design}=useDesign(),material=design.material
  return <section className="choices screen-center" data-panel="glass" data-background={material.background==='white'?'white':'key'} style={{'--person-color':'#7ba9df','--card-alpha':material.alpha,'--paint-alpha':material.alpha,'--card-wash':`${material.wash*100}%`,'--card-blur':`${material.blur}px`,'--card-gloss':Math.min(1,material.gloss/3),'--card-filter':material.refract==='off'?'none':'url(#choices-glass-distortion)'}}>
    <svg width="0" height="0" aria-hidden="true" style={{position:'absolute'}}><defs><filter id="choices-glass-distortion"><feTurbulence type="fractalNoise" baseFrequency=".015" numOctaves="2" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale={material.refract==='strong'?25:8} xChannelSelector="R" yChannelSelector="G"/></filter></defs></svg>
    <div className="experience-light" /><div className="choices-content">
    <p className="choices-eyebrow">你的痛點，寶舖有解方</p>
    <h1>選一個情境鑰匙圈，放上感應區</h1>
    <ol>{people.map((person, i) => <li key={person.id} style={{ '--delay': `${.15 + i * .09}s` }}>
      <button className="surface" style={{ '--person-color': person.color, '--paint': design.scenes[person.id].colors[0] || 'transparent', '--paint-alpha': design.scenes[person.id].colors[0] === null ? 0 : material.alpha }} onClick={() => choose(person.id)}>
        <b>{String(i + 1).padStart(2, '0')}</b><span>{person.question}</span><small>{person.shortName}</small>
      </button></li>)}</ol>
    <p className="choices-caption">房子會調整光、空氣、溫濕度與聲音來照顧你</p>
  </div></section>
}

const homePhotos=['0909-3.png','0909-4.png','0909-5.png','孕婦1.png']
function HomePhotoCarousel(){
  const {editing}=useDesign(),[index,setIndex]=useState(0)
  useEffect(()=>{
    // Preload the following images to avoid a blank frame during the upward wipe.
    const images=homePhotos.map(file=>{const image=new Image();image.src=mediaURL(`scenes/${file}`);return image})
    return ()=>{images.forEach(image=>{image.onload=null})}
  },[])
  useEffect(()=>{if(editing)return;const timer=setInterval(()=>setIndex(i=>(i+1)%homePhotos.length),4500);return ()=>clearInterval(timer)},[editing])
  return <VerticalReel identity={index}><img className="overview-photo" src={mediaURL(`scenes/${homePhotos[index]}`)} alt={`未來居家場景 ${index+1}`} /></VerticalReel>
}

function HouseScanIcon(){
  return <svg className="overview-house-scan" viewBox="0 0 100 90" fill="none" aria-hidden="true">
    <g className="house-scan-building" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path className="house-scan-fill" d="M22 40 50 16 78 40V76H22Z" />
      <path d="M14 43 50 12 86 43M43 76V55H57V76M30 44H40V54H30ZM60 44H70V54H60ZM17 77H83" />
    </g>
    <path className="house-scan-line" d="M8 10H92" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
}

export function Overview({ metrics, audioTime=0, audioStatus='idle', onPlay }) {
  const { design } = useDesign()
  const material=design.material
  const panel = key => ({ '--paint':houseCardColor(design.house,key),'--paint-alpha':design.house.alpha })
  return <section className="overview" data-background={material.background==='white'?'white':'key'} data-panel="glass" style={{ '--wall-title':design.house.textColors.title,'--wall-number':design.house.textColors.number,'--wall-caption':design.house.textColors.caption,'--person-color':'#7ba9df','--card-alpha':design.house.alpha,'--card-wash':`${material.wash*100}%`,'--card-blur':`${material.blur}px`,'--card-gloss':Math.min(1,material.gloss/3),'--card-filter':material.refract === 'off' ? 'none' : 'url(#overview-glass-distortion)',gridTemplateColumns: design.house.columns.map(v => `minmax(0, ${v}fr)`).join(' '), gridTemplateRows: design.house.rows.map(v => `minmax(0, ${v}fr)`).join(' ') }} aria-label="房屋即時健康資訊牆">
    <svg width="0" height="0" aria-hidden="true" style={{position:'absolute'}}><defs><filter id="overview-glass-distortion"><feTurbulence type="fractalNoise" baseFrequency=".015" numOctaves="2" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale={material.refract==='strong'?25:8} xChannelSelector="R" yChannelSelector="G"/></filter></defs></svg>
    <div className="experience-light" />
    <Guides tracks={design.house.columns} path={['house','columns']} /><Guides axis="y" tracks={design.house.rows} path={['house','rows']} />
    <article className="overview-intro surface" style={panel("intro")}><p className="caption">寶舖 SENSOR · 數位孿生平台</p><div className="overview-house-content"><HouseScanIcon /><h1>房子的健康<br />就是你的健康</h1></div><p className="caption">選一個情境鑰匙圈，看寶舖怎麼解</p></article>
    {metrics.map((metric, index) => <article key={metric.key} className={`overview-stat surface overview-${metric.key}`} style={{ ...panel(metric.key), '--delay': `${index * .05}s` }}>
      <header><h2 className="caption">{metric.label}</h2>{metric.key==='weather'?<span className="weather-degrees overview-number"><NumberText value={metric.value}/><small>{metric.unit}</small></span>:<Symbol name={metric.key.startsWith('pm25')?'dust':metric.icon} animated />}</header>
      <div className={`overview-number ${['co2', 'temp', 'light'].includes(metric.key) ? 'overview-number--stack' : ''}`}>
        {metric.text ? <><Symbol name="weather" className="weather-feature" animated /><strong className="weather-description">{metric.text}</strong></>
          : <><NumberText value={metric.value} /><small>{metric.unit}</small></>}
      </div>
    </article>)}
    <div className="overview-image surface" aria-label="未來居家照片輪播"><HomePhotoCarousel /></div>
    <article className="overview-claim surface" style={panel("claim")}><p className="caption">12-IN-1 SENSOR</p><div className="overview-voice-content"><Voice /><div className={`overview-spoken${audioStatus==='ended'?' overview-spoken--finished':''}`} aria-live="polite">{['idle','error'].includes(audioStatus)?<h2>房屋的即時健康資訊</h2>:<><p className="overview-live-caption" aria-hidden={audioStatus==='ended'}>{overviewCaptionAt(audioTime)}</p><h2 className="overview-final-caption" aria-hidden={audioStatus!=='ended'}>房屋的即時健康資訊</h2></>}</div></div>{['blocked','error'].includes(audioStatus)&&<button className="narration-play" onClick={onPlay}>播放資訊牆語音</button>}</article>
  </section>
}

function Reading({ metric, dimension, lighting }) {
  const icon = metric.icon || DIMENSIONS[dimension]
  const kelvin = metric.kelvin || lighting.kelvin
  const lightMode = metric.lightMode || lighting.lightMode
  const lightRange = dimension === 0 && /^(lux|k)$/i.test(metric.unit) ? String(metric.value).match(/^(\d+)\s*([–—-])\s*(\d+)$/) : null
  return <article className={`reading surface${metric.kind === 'note' ? ' reading--note' : ''}`}>
    <header><p className="caption">{CIRCLES[dimension]} {metric.icon === 'humid' ? '濕度' : DIMENSION_LABELS[dimension]}</p><Symbol name={icon} animated kelvin={kelvin} lightMode={lightMode} /></header>
    {metric.kind === 'note' ? <div className="note-content"><h3>{metric.note}</h3><p>{metric.detail}</p></div> : <>
      <div className={`reading-number ${dimension === 2 || String(metric.value).length >= 6 || metric.operator ? 'reading-number--range' : ''}`}>
        {metric.operator && <span className="reading-operator">{metric.operator}</span>}{lightRange ? <><span><NumberText value={lightRange[1]} />{lightRange[2]}</span><span className="reading-value-unit"><NumberText value={lightRange[3]} /><small>{metric.unit}</small></span></> : <><NumberText value={metric.value} /><small>{metric.unit}</small></>}
      </div><p className="reading-note">{metric.note}</p>
    </>}
  </article>
}

function DimensionReadings({ person, dimension }) {
  const data = person.dimensions[DIMENSIONS[dimension]]
  return <>{data.metrics.map((metric, index) => <Reading key={`${dimension}-${index}`} metric={metric} dimension={dimension} lighting={data} />)}</>
}

function GoalCaption({person,audioTime,audioStatus}) {
  const finished=audioStatus==='ended'
  const staticGoal=!audioStatus || ['idle','error'].includes(audioStatus)
  return <p key={`${person.id}-${finished}`} className={`goal-copy${finished?' goal-copy--finished':''}`} aria-live="polite">
    {staticGoal ? person.goal : <>
      <span className="goal-spoken" aria-hidden={finished}>{sceneCaptionAt(person.id,audioTime)}</span>
      <span className="goal-final" aria-hidden={!finished}>{person.goal}</span>
    </>}
  </p>
}

export function Experience({ person, dimension, audioTime=0, audioStatus, onPlay }) {
  const { design } = useDesign()
  const layout = design.scenes[person.id], material = design.material
  const solution = person.dimensions[DIMENSIONS[dimension]]
  const colorSlots = ['pain', 'solution', 'score', 'reading1', 'reading2', 'reading3', 'highlight']
  const styles = { '--person-color': person.color, '--columns': layout.columns.map(value => `${value}fr`).join(' '), '--pain-height': `${layout.painHeight}%` }
  colorSlots.forEach((slot, index) => { styles[`--${slot}`] = layout.colors[index] || 'transparent'; if (index < 6) styles[`--${slot}-alpha`] = layout.colors[index] === null ? 0 : material.alpha })
  Object.assign(styles, { '--card-alpha': material.alpha, '--card-wash': `${material.wash*100}%`, '--card-blur': `${material.blur}px`, '--card-gloss': Math.min(1,material.gloss/3), '--card-filter': material.refract === 'off' ? 'none' : 'url(#glass-distortion)' })
  return <section className="experience" data-background={material.background} data-panel={material.panel} style={styles} aria-label={`${person.title}情境`}>
    {material.background === 'video' && <div className="experience-wall-video"><Film /></div>}
    <svg width="0" height="0" aria-hidden="true" style={{position:'absolute'}}><defs><filter id="glass-distortion"><feTurbulence type="fractalNoise" baseFrequency=".015" numOctaves="2" result="noise" /><feDisplacementMap in="SourceGraphic" in2="noise" scale={material.refract === 'strong' ? 25 : 8} xChannelSelector="R" yChannelSelector="G" /></filter></defs></svg>
    <div className="experience-light" />
    <div className="experience-columns">
      <Guides tracks={layout.columns} path={['scenes',person.id,'columns']} />
      <div className="readings-column enter-panel" style={{ '--delay': '.16s' }}><VerticalReel identity={dimension}><DimensionReadings person={person} dimension={dimension} /></VerticalReel></div>
      <div className="media-column">
        <div className="experience-film enter-panel" style={{ '--delay': '.14s' }}><HomeScene person={person} dimension={dimension} /></div>
        <article className="goal-card surface enter-panel" style={{ '--delay': '.2s' }}><header><h2 className="caption">核心目標</h2><Symbol name="goal" animated /></header><div className="goal-content"><Voice /><GoalCaption person={person} audioTime={audioTime} audioStatus={audioStatus} /></div>{['blocked','error'].includes(audioStatus) && <button className="narration-play" onClick={onPlay}>播放情境語音</button>}</article>
      </div>
      <div className="story-column">
        <Guides tracks={[layout.painHeight,100-layout.painHeight]} path={['scenes',person.id,'painHeight']} axis="y" percent />
        <article className="pain surface enter-panel" style={{ '--delay': '.08s' }}><h1>{person.title}</h1><p className="pain-subtitle">{person.subtitle}</p><div className="pain-question"><p>{person.pain}</p><PersonSymbol id={person.id} animated /></div></article>
        <div className="solution-reel enter-panel" style={{ '--delay': '.26s' }}><VerticalReel identity={dimension}><article className="solution surface"><header><Symbol name={DIMENSIONS[dimension]} animated kelvin={solution.kelvin} lightMode={solution.lightMode} /><p className="caption">{CIRCLES[dimension]} {DIMENSION_LABELS[dimension]}解方</p></header><div className="solution-text"><h2>{solution.headline}</h2><p>{solution.detail}</p></div></article></VerticalReel></div>
      </div>
    </div>
    <BrandFooter />
  </section>
}

export function Narration({ analyser, audioStatus, onPlay }) {
  return <section className="narration screen-center"><p className="narration-eyebrow">AI 聲紋 · VOICEPRINT</p><Voice analyser={analyser} /><p className="narration-copy">歡迎來到「感應光寓」。我們將以你在上個空間留下的資訊，為你打造專屬的居家體驗。準備好了嗎？體驗即將開始。</p>{['blocked', 'error'].includes(audioStatus) && <button className="narration-play" onClick={onPlay}>{audioStatus === 'blocked' ? '點此播放前言語音' : '重新播放前言語音'}</button>}</section>
}

export function Farewell({ analyser, audioTime=0, audioStatus, onPlay }) {
  return <section className="farewell screen-center"><p className="narration-eyebrow">結語 · OUTRO</p><Voice analyser={analyser} /><p className="outro-subtitle" aria-live="polite" aria-atomic="true">{outroCaptionAt(audioTime)}</p>{['blocked','error'].includes(audioStatus) && <button className="narration-play" onClick={onPlay}>{audioStatus==='blocked' ? '點此播放結語語音' : '重新播放結語語音'}</button>}<p className="farewell-caption">房子的健康，我有解方　·　請往下個展區體驗</p></section>
}
