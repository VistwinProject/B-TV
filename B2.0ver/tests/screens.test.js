import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DIMENSIONS } from '../app/playback.js'

let output, views, content
before(async () => {
  content = JSON.parse(await readFile(new URL('../app/exhibition.json', import.meta.url)))
  output = await mkdtemp(resolve('tests/.render-'))
  const entry = resolve(output, 'screens.mjs')
  await build({entryPoints:['app/screens.jsx'], outfile:entry, bundle:true, format:'esm', platform:'node', jsx:'automatic', external:['react','react-dom'], define:{'import.meta.env.BASE_URL':JSON.stringify('/')}})
  views = await import(pathToFileURL(entry))
})
after(async () => { if(output) await rm(output,{recursive:true,force:true}) })

test('all six screen types render actual content without browser dependencies', () => {
  const screens = [
    ['Welcome',{},'感應光寓'],['Choose',{people:content.people,choose:()=>{}},'選一個情境鑰匙圈'],
    ['Overview',{metrics:content.house},'即時健康資訊'],['Experience',{person:content.people[0],dimension:0},'居家抗老'],
    ['Narration',{state:{started:0}},'AI 聲紋'],['Farewell',{},'依照您不同的生活型態，'],
  ]
  for(const [name,props,text] of screens) assert.ok(renderToStaticMarkup(createElement(views[name],props)).includes(text),name)
})

test('intro has no countdown overlay', () => {
  assert.ok(!renderToStaticMarkup(createElement(views.Narration,{})).includes('countdown'))
})

test('each of 20 dimensions renders its own solution and accessible 3D scene', () => {
  for(const person of content.people) for(const [index,dimension] of DIMENSIONS.entries()) {
    const html = renderToStaticMarkup(createElement(views.Experience,{person,dimension:index}))
    assert.ok(html.includes(person.title))
    assert.ok(html.includes(person.dimensions[dimension].headline))
    assert.ok(html.includes(`${person.title}的 3D 客廳`))
    assert.ok(html.includes('實際模型黑底白線與情境燈光'))
    assert.ok(!html.includes('放大 3D 場景'))
    assert.ok(!html.includes('<dialog'))
    assert.ok(!html.includes('<img'))
    assert.ok(html.includes(person.goal))
    assert.ok(!html.includes('WELL Building Standard'))
    assert.equal((html.match(/class="symbol animated-symbol /g) || []).length, 5)
    assert.ok(html.includes('person-symbol--animated'))
  }
})

test('the build entry cannot import first-attempt source', async () => {
  const bundle=await build({entryPoints:['app/main.jsx'],bundle:true,format:'esm',write:false,metafile:true,loader:{'.otf':'file','.ttf':'file'},outdir:resolve(output,'bundle'),external:['/fonts/*','/icons/*','/bg/*'],jsx:'automatic'})
  for(const name of Object.keys(bundle.metafile.inputs)) assert.ok(!name.startsWith('src/') && !name.startsWith('archive/'),name)
  assert.ok(bundle.metafile.inputs['app/playback.js'])
  assert.ok(bundle.metafile.inputs['app/interface.css'])
})
