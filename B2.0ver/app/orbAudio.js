// Drive the approved API from the existing narrator analyser; never create a second audio source.
export function createOrbAudioDriver(orb){
  let active=null,lastSource=null,samples=null
  return ({running,paused,analyser})=>{
    if(active!==running){running?orb.start():orb.end();active=running}
    let level=0
    if(running&&!paused&&analyser){
      if(lastSource!==analyser){samples=new Float32Array(analyser.fftSize);lastSource=analyser}
      analyser.getFloatTimeDomainData(samples)
      const rms=Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length)
      level=Math.min(1,Math.max(0,rms-.008)*5)
    }
    orb.setLevel(level)
    return level
  }
}
