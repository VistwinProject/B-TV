export const STORAGE_KEY = 'b2:editor:v1:preset-20260922-1436'
export const THEME_FIELDS = {bgStart:'背景起點',bgMid:'背景中段',bgEnd:'背景終點',haze:'中央柔光',title:'主標文字',subtitle:'英文副標',hint:'提示文字',core:'光束核心',inner:'光束內暈',glow:'光束外暈'}
export const COLOR_FIELDS = ['痛點卡','解方卡','核心目標卡','左欄第一張','左欄第二張','左欄第三張','數據強調']
export function makeDefaults(people, house) {
  return {schema:1,welcome:{title:{size:100,spacing:0,x:0,y:0},subtitle:{size:100,spacing:0,x:0,y:0},hint:{size:100,spacing:0,x:0,y:0},lineGap:1},theme:{bgStart:'#ffffff',bgMid:'#eef5ff',bgEnd:'#d7e6fa',haze:'#ffffff',title:'#1b3f8f',subtitle:'#6a8cc8',hint:'#2a56a8',core:'#ffffff',inner:'#57a8ff',glow:'#2d9afb'},beam:{points:[[-11,98],[59.5,83.5],[108,-24]],widths:[28,9,7],glow:1,edge:1},house:{alpha:.72,textColors:{title:'#1b3f8f',number:'#1b3f8f',caption:'#6a8cc8'},colorMode:'uniform',uniformColor:'#bbdcf5',palette:['#dcecf9','#bdd9f0','#96bfe2','#6c9dcc','#477fb4'],colorOrder:[3,0,2,4,1,3,1,2,0,4],columns:[.873,.467,.947,.878,1.553,1.282],rows:[1,.904,1.096,1],panels:Object.fromEntries(['intro',...house.map(m=>m.key),'claim'].map(key=>[key,{color:['intro','claim'].includes(key)?'#a2d0f8':'#ffffff'}]))},scenes:Object.fromEntries(people.map(p=>[p.id,{columns:[...p.columns],painHeight:p.painHeight,homeView:{zoom:1,x:0,y:0},colors:[...p.colors]}])),material:{background:'key',panel:'glass',alpha:.72,wash:0,blur:0,gloss:.5,refract:'off'}}
}
const record = value => value && typeof value === 'object' && !Array.isArray(value)
export function normalizeDesign(value, defaults) {
  const walk=(v,b,path=[])=>{
    const key=path.at(-1)
    if(path[0]==='material'&&key==='background')return 'key'
    if(path[0]==='material'&&key==='panel')return 'glass'
    if(path.length===2&&path[0]==='house'&&key==='alpha'&&v===undefined)v=value?.material?.alpha
    if(Array.isArray(b)) return b.map((item,i)=>walk(Array.isArray(v)?v[i]:undefined,item,[...path,i]))
    if(record(b))return Object.fromEntries(Object.entries(b).map(([k,item])=>[k,walk(record(v)&&Object.hasOwn(v,k)?v[k]:undefined,item,[...path,k])]))
    if(typeof b==='boolean')return typeof v==='boolean'?v:b
    if(typeof b==='number'){
      if(!Number.isFinite(v))return b
      let lo=0,hi=100
      if(path.includes('colorOrder'))return Math.round(Math.max(0,Math.min(4,v)))
      else if(path.includes('welcome'))[lo,hi]=key==='size'?[40,200]:key==='spacing'?[-.1,1]:key==='lineGap'?[0,4]:[-80,80]
      else if(path.includes('columns')||path.includes('rows'))[lo,hi]=[.15,5]
      else if(path.includes('points'))[lo,hi]=[-40,140]
      else if(path.includes('widths'))[lo,hi]=[1,90]
      else if(path.includes('homeView'))[lo,hi]=key==='zoom'?[.5,2.5]:[-100,100]
      else if(key==='painHeight')[lo,hi]=[15,70]
      else if(['alpha','wash'].includes(key))[lo,hi]=[0,1]
      else if(['glow','edge','gloss'].includes(key))[lo,hi]=[0,3]
      else if(key==='blur')[lo,hi]=[0,40]
      else if(key==='schema')return 1
      return Math.min(hi,Math.max(lo,v))
    }
    if(b.startsWith('#')){
      if(v===null&&(path.includes('colors')||path.includes('panels')))return null
      return typeof v==='string'&&/^#[a-f\d]{6}$/i.test(v)?v.toLowerCase():b
    }
    const options={colorMode:['uniform','palette'],background:['key','white','video'],panel:['flat','glass'],refract:['off','soft','strong']}
    return options[key]?.includes(v)?v:b
  }
  return walk(value,defaults)
}
export function changeAt(design,path,value){
  const copy=structuredClone(design)
  let parent=copy
  for(const key of path.slice(0,-1)){if(!Object.hasOwn(parent,key))throw new Error('Unknown setting');parent=parent[key]}
  if(!Object.hasOwn(parent,path.at(-1)))throw new Error('Unknown setting')
  parent[path.at(-1)]=value
  return copy
}
export function importDesign(text,defaults){const parsed=JSON.parse(text);if(parsed?.schema!==1)throw new Error('請匯入 2.0 編輯器匯出的設定檔');return normalizeDesign(parsed,defaults)}
export function resizeTracks(tracks,index,delta){const next=[...tracks],total=tracks[index]+tracks[index+1];next[index]=Math.max(.15,total-5,Math.min(5,total-.15,tracks[index]+delta));next[index+1]=total-next[index];return next}

export const HOUSE_CARD_KEYS=['intro','pm25','pm25_out','co2','temp','rh','weather','light','sound','claim']
export function houseCardColor(house,key){
  const index=HOUSE_CARD_KEYS.indexOf(key)
  return house.colorMode==='palette'?house.palette[house.colorOrder[Math.max(0,index)]]:house.uniformColor
}
export function shuffleHouseColors(random=Math.random){
  const order=HOUSE_CARD_KEYS.map((_,i)=>i%5)
  for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
  return order
}
