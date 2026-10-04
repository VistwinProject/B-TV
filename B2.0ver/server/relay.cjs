// One event stream for the NFC reader, table simulation and TV display.
const people=new Set(['anti-aging','child','elder','pregnancy','nomad']);
function createRelay(emit){
 let held=null,flowId=0,phase=null,anchor=null;
 function publish(message){
  if(message.type==='tag-present'){
   if(message.data?.kind==='card'){
    if(held?.data?.kind!=='card'){flowId++;phase=null;}
    message={...message,flowId};
   }else {flowId++;phase=null;}
   message={...message,flowId};
   held=message;
   anchor=message;
  }
  if(['reset','intro','outro'].includes(message.type)){flowId++;phase=null;message={...message,flowId};anchor=message;}

  if(['tag-remove','reset','reader-disconnected','intro','outro'].includes(message.type))held=null;
  emit(message);
 }
 function receive(message){
  if(!message||typeof message!=='object')return false;
  if(['reset','tag-remove','intro','outro'].includes(message.type)){
   publish({type:message.type,...(typeof message.reqId==='string'?{reqId:message.reqId}:{})});return true;
  }
  if(message.type==='tv-phase'){
   if(message.flowId!==flowId||!['overview','choose','farewell'].includes(message.screen))return false;
   phase={type:'tv-phase',flowId,screen:message.screen};emit(phase);return true;
  }
  if(message.type!=='tag-present')return false;
  const data=message.data;
  const request=typeof message.reqId==='string'?{reqId:message.reqId}:{};
  if(data?.kind==='card')publish({type:'tag-present',data:{kind:'card',id:'invite'},...request});
  else if(data?.kind==='character'&&people.has(data.id))publish({type:'tag-present',data:{kind:'character',id:data.id},...request});
  else return false;
  return true;
 }
 function snapshot(){
  const messages=[];
  if(anchor)messages.push({...anchor,replay:true});
  if(anchor?.type==='tag-present'&&!held)messages.push({type:'tag-remove',replay:true});
  if(phase)messages.push({...phase,replay:true});
  return messages;
 }
 return {publish,receive,current:()=>held,phase:()=>phase,snapshot};
}
module.exports={createRelay};
