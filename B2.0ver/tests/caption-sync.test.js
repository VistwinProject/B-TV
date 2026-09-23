import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createCaptionSync} from '../app/captionSync.js'
test('caption polling stops after narration and restarts without duplicate loops',()=>{
 const pending=new Map(),times=[];let id=0
 const player={currentTime:0},sync=createCaptionSync(player,t=>times.push(t),{request:cb=>{pending.set(++id,cb);return id},cancel:id=>pending.delete(id)})
 const tick=()=>{const [id,cb]=pending.entries().next().value;pending.delete(id);cb()}
 assert.equal(pending.size,0)
 sync.start();tick();assert.deepEqual(times,[0]);assert.equal(pending.size,1)
 player.currentTime=1;tick();assert.deepEqual(times,[0,1])
 sync.stop();assert.equal(pending.size,0)
 player.currentTime=0;sync.start();sync.start();assert.equal(pending.size,1)
 tick();assert.deepEqual(times,[0,1,0]);sync.stop();assert.equal(pending.size,0)
})
