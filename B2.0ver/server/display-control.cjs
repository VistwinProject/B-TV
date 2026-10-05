const {randomUUID}=require('node:crypto');
const ids=['table','tv'];
const screens={table:['place-card','connected','place-character','scene','farewell'],tv:['welcome','overview','choose','experience','farewell']};
function matches(command,state){
 const table=state.displayId==='table';
 switch(command.type){
  case 'reset':return state.screen===(table?'place-card':'welcome')&&state.activity==='idle';
  case 'intro':return state.screen===(table?'place-character':'choose');
  case 'outro':return state.screen==='farewell';
  case 'tag-remove':return state.held==null;
  case 'tag-present':return command.data?.kind==='card'?state.screen===(table?'connected':'overview'):state.screen===(table?'scene':'experience')&&state.person===command.data?.id;
  default:return false;
 }
}
function createDisplayControl({publish,send,broadcast,now=Date.now,epoch=randomUUID(),freshMs=4500,timeoutMs=5000}){
 const displays=new Map(),history=new Map();let pending=null;
 function snapshot(){
  const time=now();
  const outputs=ids.map(id=>{
   const all=[...displays.values()].filter(d=>d.displayId===id&&time-d.at<=freshMs);
   const live=all.length===1?all[0]:null;
   return {id,ready:!!live?.ready,clients:all.length,screen:live?.screen??null,person:live?.person??null,
    held:live?.held??null,activity:live?.activity??'unknown',completionEvidence:live?.completionEvidence??null,
    visible:live?.visible??false,receivedAt:live?.at??null};
  });
  const ready=outputs.every(d=>d.ready);
  const [table,tv]=outputs;
  const activity=!ready?'unknown':table.screen==='place-card'&&tv.screen==='welcome'?'idle':
   table.screen==='farewell'&&tv.screen==='farewell'&&tv.activity==='complete'&&tv.completionEvidence==='narration-ended'?'complete':'active';
  return {type:'b-status',protocol:'b-display-v1',epoch,ready,activity,outputs,pendingReqId:pending?.reqId??null};
 }
 function finish(ok,error){
  if(!pending)return;
  const request=pending;pending=null;
  const ack={type:'b-ack',protocol:'b-display-v1',epoch,reqId:request.reqId,ok,state:ok?'applied':'failed',error:error||null,status:snapshot()};
  history.set(request.reqId,{fingerprint:request.fingerprint,ack});
  if(history.size>128)history.delete(history.keys().next().value);
  send(request.client,ack);
 }
 function check(){
  if(!pending)return;
  const status=snapshot();
  if(!status.ready)return finish(false,'display-not-ready');
  if(now()-pending.at>=timeoutMs)return finish(false,'display-ack-timeout');
  const applied=ids.every(id=>[...displays.values()].some(d=>d.displayId===id&&now()-d.at<=freshMs&&d.at>=pending.at&&d.appliedReqId===pending.reqId&&matches(pending.command,d)));
  if(applied)finish(true);
 }
 function reject(client,reqId,error){send(client,{type:'b-ack',protocol:'b-display-v1',epoch,reqId,ok:false,state:'failed',error,status:snapshot()});}
 function receive(client,message){
  if(message?.type==='b-display-state'){
   if(message.protocol!=='b-display-v1'||!ids.includes(message.displayId)||!screens[message.displayId].includes(message.screen)||typeof message.ready!=='boolean'||!['idle','active','complete'].includes(message.activity))return true;
   displays.set(client,{displayId:message.displayId,screen:message.screen,person:message.person??null,held:message.held??null,
    ready:message.ready,activity:message.activity,completionEvidence:message.completionEvidence==='narration-ended'?'narration-ended':null,
    visible:message.visible===true,appliedReqId:typeof message.appliedReqId==='string'?message.appliedReqId:null,at:now()});
   check();broadcast(snapshot());return true;
  }
  if(message?.type==='b-display-detach'){displays.delete(client);check();broadcast(snapshot());return true;}
  if(message?.type!=='b-command')return false;
  const {reqId,command}=message;
  if(typeof reqId!=='string'||!reqId.length||reqId.length>128)return true;
  if(!command||typeof command!=='object'||!['reset','intro','outro','tag-remove','tag-present'].includes(command.type)){reject(client,reqId,'invalid-command');return true;}
  const fingerprint=JSON.stringify(command),previous=history.get(reqId);
  if(previous){send(client,previous.fingerprint===fingerprint?previous.ack:{type:'b-ack',epoch,reqId,ok:false,error:'reqId-reused'});return true;}
  if(pending){reject(client,reqId,'command-in-progress');return true;}
  if(!snapshot().ready){reject(client,reqId,'display-not-ready');return true;}
  pending={client,reqId,command,fingerprint,at:now()};
  if(!publish({...command,reqId}))finish(false,'invalid-command');
  broadcast(snapshot());return true;
 }
 function close(client){displays.delete(client);if(pending?.client===client)pending=null;check();broadcast(snapshot());}
 function onEvent(message){if(pending&&['reset','intro','outro','tag-present','tag-remove'].includes(message.type)&&message.reqId!==pending.reqId)finish(false,'superseded-by-another-input');}
 function tick(){check();broadcast(snapshot());}
 return {receive,close,tick,onEvent,snapshot};
}
module.exports={createDisplayControl,matches};
