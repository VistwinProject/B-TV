// Rebuild the static figures with: node scripts/build-home-people.mjs
import * as T from 'three'
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js'
import {SimplifyModifier} from 'three/addons/modifiers/SimplifyModifier.js'
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js'
import {writeFileSync} from 'node:fs'

const root=new T.Group(), fields=new Map()
function add(parent,field){if(!fields.has(parent))fields.set(parent,[]);fields.get(parent).push(field)}
// Rounded tapered capsules overlap inside a smooth union, without internal caps.
function limb(parent,name,a,b,r1,r2){
  const delta=b.map((v,i)=>v-a[i]),len2=delta.reduce((s,v)=>s+v*v,0)
  add(parent,(x,y,z)=>{const q=[x-a[0],y-a[1],z-a[2]],t=T.MathUtils.clamp(q.reduce((s,v,i)=>s+v*delta[i],0)/len2,0,1)
    return Math.hypot(...q.map((v,i)=>v-t*delta[i]))-T.MathUtils.lerp(r1,r2,t)})
}
function oval(parent,name,p,size){add(parent,(x,y,z)=>(Math.hypot((x-p[0])/size[0],(y-p[1])/size[1],(z-p[2])/size[2])-1)*Math.min(...size))}
function torso(parent,rings){
  add(parent,(x,y,z)=>{
    const cy=T.MathUtils.clamp(y,rings[0][0],rings.at(-1)[0]);let j=0
    while(j<rings.length-2&&cy>rings[j+1][0])j++
    const a=rings[j],b=rings[j+1],t=(cy-a[0])/(b[0]-a[0]),w=T.MathUtils.lerp(a[1],b[1],t),d=T.MathUtils.lerp(a[2],b[2],t),cz=T.MathUtils.lerp(a[3]||0,b[3]||0,t)
    const radial=(Math.hypot(x/w,(z-cz)/d)-1)*Math.min(w,d),vertical=Math.max(rings[0][0]-y,y-rings.at(-1)[0])
    return Math.hypot(Math.max(radial,0),Math.max(vertical,0))+Math.min(Math.max(radial,vertical),0)
  })
}
  const man=new T.Group();man.name='husband-overhead-stretch';man.position.set(.7,0,-3.85);man.rotation.y=-.15;root.add(man)
  torso(man,[[.86,.17,.115],[1.01,.18,.12],[1.18,.155,.105],[1.4,.235,.135],[1.49,.205,.105]])
  limb(man,'neck',[0,1.46,0],[0,1.58,0],.072,.065)
  oval(man,'head',[0,1.7,-.005],[.115,.155,.105])
  for(const side of [-1,1]) {
    const s=side
    limb(man,'thigh',[s*.105,.91,0],[s*.17,.51,.005],.105,.077)
    limb(man,'calf',[s*.17,.51,.005],[s*.21,.12,0],.077,.047)
    oval(man,'foot',[s*.21,.065,-.075],[.075,.065,.15])
    limb(man,'raised-upper-arm',[s*.21,1.43,0],[s*.38,1.73,0],.085,.061)
    limb(man,'raised-forearm',[s*.38,1.73,0],[s*.29,2.04,-.015],.063,.038)
    oval(man,'raised-hand',[s*.265,2.115,-.018],[.048,.105,.033])
  }
  // Sofa's screen-right cushion: top at y=.46; hips contact the seat, feet the floor.
  const woman=new T.Group();woman.name='wife-sofa-rest';woman.position.set(-1.46,0,-1.57);root.add(woman)
  torso(woman,[[.49,.18,.13],[.64,.155,.12,.015],[.8,.135,.1,.055],[1.02,.19,.12,.075],[1.1,.165,.095,.085]])
  limb(woman,'neck',[0,1.08,.085],[0,1.2,.075],.059,.055)
  oval(woman,'head',[0,1.32,.075],[.103,.145,.10])
  oval(woman,'short-hair',[0,1.365,.105],[.112,.11,.102])
  for(const side of [-1,1]) {
    const s=side
    limb(woman,'seated-thigh',[s*.10,.54,-.015],[s*.13,.48,-.47],.105,.079)
    limb(woman,'calf',[s*.13,.48,-.47],[s*.14,.1,-.56],.075,.043)
    oval(woman,'foot',[s*.14,.055,-.64],[.065,.055,.13])
    const elbow=s<0?[s*.29,.67,0]:[s*.23,.75,-.13]
    const wrist=s<0?[s*.30,.61,-.29]:[s*.1,.63,-.32]
    limb(woman,'relaxed-upper-arm',[s*.17,1.04,.075],elbow,.069,.05)
    limb(woman,'resting-forearm',elbow,wrist,.052,.032)
    oval(woman,'resting-hand',[wrist[0],wrist[1]-.015,wrist[2]-.055],[.045,.029,.077])
  }

// Adult companion and a smaller seated child holding an open book.
const adult=new T.Group();adult.name='adult-reading-companion';adult.position.set(-.78,0,-1.57);root.add(adult)
fields.set(adult,[...fields.get(woman)])
const child=new T.Group();child.name='child-holding-book';child.position.set(-1.46,0,-1.62);root.add(child)
torso(child,[[.5,.125,.09],[.61,.12,.09],[.74,.10,.08],[.9,.145,.09],[.95,.12,.075]])
limb(child,'neck',[0,.93,0],[0,1.01,-.015],.047,.045)
oval(child,'head',[0,1.11,-.035],[.092,.12,.09])
for(const s of [-1,1]){
  limb(child,'thigh',[s*.075,.53,0],[s*.09,.48,-.30],.076,.059)
  limb(child,'shin',[s*.09,.48,-.30],[s*.10,.22,-.37],.058,.035)
  oval(child,'foot',[s*.10,.185,-.43],[.052,.045,.10])
  limb(child,'upper-arm',[s*.13,.9,0],[s*.18,.73,-.12],.052,.038)
  limb(child,'forearm',[s*.18,.73,-.12],[s*.135,.70,-.29],.039,.027)
  oval(child,'hand',[s*.135,.70,-.31],[.034,.025,.052])
}

const elder=new T.Group();elder.name='elder-stooped-with-cane';elder.position.set(2.62,0,-2.05);elder.rotation.y=1.9;root.add(elder)
torso(elder,[[.79,.16,.11,.015],[.94,.165,.12,-.015],[1.08,.18,.12,-.10],[1.22,.195,.12,-.23],[1.29,.16,.09,-.29]])
limb(elder,'neck',[0,1.25,-.27],[0,1.35,-.34],.061,.055)
oval(elder,'head',[0,1.43,-.39],[.105,.135,.10])
for(const side of [-1,1]){
  limb(elder,'thigh',[side*.10,.85,.015],[side*.14,.46,-.10],.092,.071)
  limb(elder,'calf',[side*.14,.46,-.10],[side*.16,.11,.025],.068,.043)
  oval(elder,'shoe',[side*.16,.06,-.045],[.067,.06,.14])
}
limb(elder,'support-upper-arm',[.18,1.22,-.23],[.25,.99,-.24],.067,.047)
limb(elder,'support-forearm',[.25,.99,-.24],[.27,.85,-.43],.048,.033)
oval(elder,'cane-hand',[.27,.825,-.45],[.045,.039,.053])
limb(elder,'rest-upper-arm',[-.18,1.22,-.23],[-.24,.98,-.17],.067,.047)
limb(elder,'rest-forearm',[-.24,.98,-.17],[-.19,.82,-.21],.048,.031)
oval(elder,'rest-hand',[-.19,.785,-.22],[.039,.059,.034])

// Nomad workers use the same continuous surface construction as the other figures.
for(const desk of [false,true]){
  const person=new T.Group();person.name=desk?'nomad-desk-worker':'nomad-sofa-worker';person.userData.scene='nomad';person.position.set(...(desk?[3.025,0,-3.70]:[-.25,0,-1.57]));person.rotation.y=desk?Math.PI:0;root.add(person)
  torso(person,[[.49,.18,.13],[.68,.16,.12],[.87,.17,.12,-.02],[1.09,.22,.13,-.04],[1.16,.18,.095,-.045]])
  limb(person,'neck',[0,1.13,-.045],[0,1.25,-.065],.062,.055)
  oval(person,'head',[0,1.37,-.09],[.108,.145,.105])
  for(const side of [-1,1]){
    limb(person,'thigh',[side*.10,.54,0],[side*.14,.47,-.43],.10,.075)
    limb(person,'shin',[side*.14,.47,-.43],[side*.15,.10,-.51],.074,.043)
    oval(person,'shoe',[side*.15,.055,-.59],[.07,.055,.13])
    const mouse=desk&&side===1,elbow=[side*(mouse?.30:.25),.84,-.13],wrist=[mouse?.425:desk?-.06:side*.16,desk?.84:.72,desk?-.20:-.34]
    limb(person,'upper-arm',[side*.20,1.09,-.04],elbow,.075,.052)
    limb(person,'forearm',elbow,wrist,.052,.032)
    oval(person,'hand',[wrist[0],wrist[1]-.01,wrist[2]-.035],[.048,.031,.07])
  }
}

// Pregnancy care: seated mother, a father leaning over the right end, and a supine baby.
const mother=new T.Group();mother.name='pregnancy-mother';mother.userData.scene='pregnancy';mother.position.set(-1.05,0,-1.57);root.add(mother)
torso(mother,[[.49,.19,.14],[.68,.19,.18,-.07],[.86,.18,.18,-.06],[1.04,.19,.12,.035],[1.11,.16,.095,.04]])
oval(mother,'belly',[0,.77,-.18],[.205,.22,.205])
limb(mother,'neck',[0,1.08,.04],[0,1.20,.02],.06,.055)
oval(mother,'head',[0,1.32,.015],[.105,.145,.10])
oval(mother,'hair',[0,1.36,.06],[.114,.12,.11])
// Gathered ponytail, extending behind the head then tapering toward the shoulders.
limb(mother,'ponytail-tie',[0,1.39,.135],[0,1.38,.205],.045,.038)
limb(mother,'ponytail-upper',[0,1.38,.205],[.015,1.27,.26],.061,.054)
limb(mother,'ponytail-tip',[.015,1.27,.26],[.04,1.08,.255],.054,.019)
for(const side of [-1,1]){
  limb(mother,'thigh',[side*.11,.54,0],[side*.15,.48,-.43],.11,.08)
  limb(mother,'shin',[side*.15,.48,-.43],[side*.16,.10,-.54],.075,.045)
  oval(mother,'foot',[side*.16,.055,-.61],[.065,.055,.13])
  limb(mother,'arm',[side*.18,1.04,.03],[side*.27,.80,-.13],.068,.05)
  const hand=new T.Group();hand.name=`pregnancy-mother-hand-${side}`;hand.userData.scene='pregnancy';hand.position.copy(mother.position);root.add(hand)
  limb(hand,'forearm',[side*.27,.80,-.13],[side*.10,.79,-.355],.05,.031)
  oval(hand,'hand',[side*.085,.78,-.365],[.064,.03,.042])
}
const father=new T.Group();father.name='pregnancy-feeding-father';father.userData.scene='pregnancy';father.position.set(1.38,0,-2.50);father.rotation.y=Math.PI/2;root.add(father)
torso(father,[[.82,.17,.12,.02],[.96,.17,.12,-.04],[1.12,.20,.13,-.18],[1.27,.23,.12,-.31],[1.32,.18,.10,-.35]])
limb(father,'neck',[0,1.29,-.34],[0,1.39,-.41],.064,.058)
oval(father,'head',[0,1.47,-.47],[.108,.14,.105])
for(const side of [-1,1]){
  limb(father,'thigh',[side*.10,.86,.02],[side*.15,.46,-.06],.10,.072)
  limb(father,'shin',[side*.15,.46,-.06],[side*.17,.10,.035],.071,.046)
  oval(father,'foot',[side*.17,.055,-.035],[.07,.055,.14])
  limb(father,'arm',[side*.21,1.26,-.30],[side*.25,.98,-.40],.074,.05)
  limb(father,'forearm',[side*.25,.98,-.40],[side===1?.025:-.10,.72,-.53],.05,.032)
  oval(father,'hand',[side===1?.025:-.10,.70,-.55],[.042,.045,.06])
}
const baby=new T.Group();baby.name='pregnancy-cradle-baby';baby.userData.scene='pregnancy';baby.userData.bounds=[[-.40,-.12,-.24],[.40,.26,.24]];baby.position.set(.55,.50,-2.50);root.add(baby)
oval(baby,'body',[-.025,.025,0],[.15,.073,.085])
limb(baby,'neck',[.10,.04,0],[.15,.055,0],.045,.043)
oval(baby,'head',[.225,.06,0],[.09,.085,.079])
for(const side of [-1,1]){
  limb(baby,'arm',[.065,.045,side*.064],[.02,.07,side*.14],.035,.028)
  limb(baby,'forearm',[.02,.07,side*.14],[.105,.12,side*.15],.028,.022)
  oval(baby,'hand',[.12,.125,side*.15],[.03,.025,.025])
  limb(baby,'thigh',[-.12,.025,side*.04],[-.22,.09,side*.073],.042,.032)
  limb(baby,'shin',[-.22,.09,side*.073],[-.30,.035,side*.09],.031,.024)
  oval(baby,'foot',[-.30,.055,side*.095],[.036,.044,.027])
}

const result=[]
for(const actor of root.children){
  const res=48,material=new T.MeshBasicMaterial(),mc=new MarchingCubes(res,material,false,false,20000)
  const min=actor.userData.bounds?actor.userData.bounds[0]:actor===man?[-.55,-.12,-.3]:actor.userData.scene==='nomad'?[-.58,-.12,-.87]:[-.43,-.12,-.87],max=actor.userData.bounds?actor.userData.bounds[1]:actor===man?[.55,2.36,.3]:actor.userData.scene==='nomad'?[.58,1.61,.35]:[.43,1.61,.35]
  const span=max.map((v,i)=>v-min[i]),samples=fields.get(actor);mc.isolation=0
  for(let z=0;z<res;z++)for(let y=0;y<res;y++)for(let x=0;x<res;x++){
    const p=[x,y,z].map((v,i)=>min[i]+v/res*span[i]);let distance=1e3
    for(const sample of samples){const d=sample(...p),k=.045,h=Math.max(k-Math.abs(distance-d),0)/k;distance=Math.min(distance,d)-h*h*k*.25}
    mc.field[x+y*res+z*res*res]=-distance
  }
  mc.update()
  const geometry=new T.BufferGeometry(),positions=mc.positionArray.slice(0,mc.count*3)
  for(let i=0;i<positions.length;i++)positions[i]=min[i%3]+(positions[i]+1)*.5*span[i%3]
  geometry.setAttribute('position',new T.BufferAttribute(positions,3))
  const welded=mergeVertices(geometry,1e-5)
  // Collapse sampling-grid slivers to keep a clean, low-poly exterior.
  const simplified=new SimplifyModifier().modify(welded,Math.floor(welded.attributes.position.count*.93))
  result.push({scene:actor.userData.scene|| (actor===elder?'elder':actor===adult||actor===child?'child':'anti-aging'),name:actor.name,position:actor.position.toArray(),rotation:actor.rotation.y,positions:Array.from(simplified.attributes.position.array,v=>+v.toFixed(5)),indices:Array.from(simplified.index.array)})
  console.log(actor.name, simplified.index.count/3,'triangles')
  geometry.dispose();welded.dispose();simplified.dispose();mc.geometry.dispose();material.dispose()
}
writeFileSync(new URL('../app/homePeopleGeometry.json',import.meta.url),JSON.stringify(result))
