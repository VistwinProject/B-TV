import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createOrbAudioDriver} from '../app/orbAudio.js'
test('approved orb and shader are copied without changes',()=>{
 for(const file of ['orb.js','restored-orb.js','LICENSE','UPSTREAM.txt'])assert.deepEqual(readFileSync(new URL(`../public/anlb-orb/${file}`,import.meta.url)),readFileSync(new URL(`../ANLB語音球-v1/${file}`,import.meta.url)))
})
test('speech, silence, pause and cue changes keep thinking until the whole show ends',()=>{
 const calls=[];const drive=createOrbAudioDriver({start:()=>calls.push('start'),end:()=>calls.push('end'),setLevel:v=>calls.push(v)})
 const analyser={fftSize:1024,getFloatTimeDomainData:a=>a.fill(.1)}
 drive({running:false});drive({running:true,analyser});assert.ok(calls.at(-1)>.4)
 drive({running:true,paused:true,analyser});assert.equal(calls.at(-1),0)
 drive({running:true,analyser:null});assert.equal(calls.at(-1),0)
 drive({running:true,analyser:{...analyser}});assert.equal(calls.filter(x=>x==='start').length,1)
 assert.equal(calls.filter(x=>x==='end').length,1)
 drive({running:false});assert.equal(calls.filter(x=>x==='end').length,2)
})
