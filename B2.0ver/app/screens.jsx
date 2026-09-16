import HomeScene from './HomeScene.jsx'
import { DIMENSIONS } from './playback.js'
import { BrandFooter, Film, LightRibbon, NumberText, PersonSymbol, Symbol, VerticalReel, Voice } from './visuals.jsx'

import { useDesign } from './editor/DesignContext.jsx'
import Guides from './editor/Guides.jsx'

export const DIMENSION_LABELS = ['光照', '空氣', '溫濕度', '聲音']
const CIRCLES = ['①', '②', '③', '④']

export function Welcome() {
  return <section className="welcome screen-center">
    <LightRibbon />
    <div className="welcome-type"><h1>感應光寓</h1><p>SENSING RESIDENCE</p><span>請入座，將邀請卡放上感應區</span></div>
    <i className="brand-logo welcome-logo" role="img" aria-label="ANLB inside" />
  </section>
}

export function Choose({ people, choose }) {
  return <section className="choices screen-center"><div className="choices-content">
    <p className="choices-eyebrow">你的痛點，寶舖有解方</p>
    <h1>選一個情境鑰匙圈，放上感應區</h1>
    <ol>{people.map((person, i) => <li key={person.id} style={{ '--delay': `${.15 + i * .09}s` }}>
      <button style={{ '--person-color': person.color }} onClick={() => choose(person.id)}>
        <b>{String(i + 1).padStart(2, '0')}</b><span>{person.question}</span><small>{person.shortName}</small>
      </button></li>)}</ol>
    <p className="choices-caption">房子會調整光、空氣、溫濕度與聲音來照顧你</p>
  </div></section>
}

export function Overview({ metrics }) {
  const { design } = useDesign()
  const panel = key => ({ background: design.house.panels[key].color || 'transparent', border: design.house.panels[key].rim ? '1px solid #5ca0ff' : '1px solid transparent', boxShadow: design.house.panels[key].rim ? undefined : 'none' })
  return <section className="overview" style={{ gridTemplateColumns: design.house.columns.map(v => `minmax(0, ${v}fr)`).join(' '), gridTemplateRows: design.house.rows.map(v => `minmax(0, ${v}fr)`).join(' ') }} aria-label="房屋即時健康資訊牆">
    <Guides tracks={design.house.columns} path={['house','columns']} /><Guides axis="y" tracks={design.house.rows} path={['house','rows']} />
    <article className="overview-intro surface" style={panel("intro")}><p className="caption">寶舖 SENSOR · 數位孿生平台</p><h1>這間房子的<br />即時健康資訊</h1></article>
    {metrics.map((metric, index) => <article key={metric.key} className={`overview-stat surface overview-${metric.key}`} style={{ ...panel(metric.key), '--delay': `${index * .05}s` }}>
      <header><h2 className="caption">{metric.label}</h2><Symbol name={metric.icon} /></header>
      <div className={`overview-number ${['co2', 'temp', 'light'].includes(metric.key) ? 'overview-number--stack' : ''}`}>
        {metric.text ? <><strong className="weather-description">{metric.text}</strong><span className="weather-degrees"><NumberText value={metric.value} />{metric.unit}</span></>
          : <><NumberText value={metric.value} /><small>{metric.unit}</small></>}
      </div>
    </article>)}
    <div className="overview-film surface"><Film /></div>
    <article className="overview-claim surface" style={panel("claim")}><p className="caption">12-IN-1 SENSOR · 24/7</p><h2>房子的健康<br />就是你的健康</h2><p className="caption">選一個情境鑰匙圈，看寶舖怎麼解</p></article>
  </section>
}

function Reading({ metric, dimension, lighting }) {
  const icon = metric.icon || DIMENSIONS[dimension]
  const kelvin = metric.kelvin || lighting.kelvin
  const lightMode = metric.lightMode || lighting.lightMode
  return <article className={`reading surface${metric.kind === 'note' ? ' reading--note' : ''}`}>
    <header><p className="caption">{CIRCLES[dimension]} {metric.icon === 'humid' ? '濕度' : DIMENSION_LABELS[dimension]}</p><Symbol name={icon} animated kelvin={kelvin} lightMode={lightMode} /></header>
    {metric.kind === 'note' ? <div className="note-content"><h3>{metric.note}</h3><p>{metric.detail}</p></div> : <>
      <div className={`reading-number ${dimension === 2 || String(metric.value).length >= 6 || metric.operator ? 'reading-number--range' : ''}`}>
        {metric.operator && <span className="reading-operator">{metric.operator}</span>}<NumberText value={metric.value} /><small>{metric.unit}</small>
      </div><p className="reading-note">{metric.note}</p>
    </>}
  </article>
}

function DimensionReadings({ person, dimension }) {
  const data = person.dimensions[DIMENSIONS[dimension]]
  return <>{data.metrics.map((metric, index) => <Reading key={`${dimension}-${index}`} metric={metric} dimension={dimension} lighting={data} />)}</>
}

export function Experience({ person, dimension }) {
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
        <article className="goal-card surface enter-panel" style={{ '--delay': '.2s' }}><header><h2 className="caption">核心目標</h2><Symbol name="goal" animated /></header><p className="goal-copy">{person.goal}</p><p className="goal-label">{person.shortName}</p></article>
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

export function Farewell({ analyser }) {
  return <section className="farewell screen-center"><p className="narration-eyebrow">結語 · OUTRO</p><Voice analyser={analyser} /><h1>房子的健康，就是你的健康</h1><p className="farewell-caption">房子的健康，我有解方　·　請往下個展區體驗</p></section>
}
