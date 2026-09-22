import {pregnancyFrame} from './homePregnancy.js'
import {nomadFrame} from './homeNomad.js'
import * as T from 'three'
import figures from './homePeopleGeometry.json' with {type:'json'}

// Continuous low-poly surfaces baked by scripts/build-home-people.mjs.
export function createHomePeople(scene) {
  const root=new T.Group();root.name='people-anti-aging';root.visible=false;scene.add(root)
  const childRoot=new T.Group();childRoot.name='people-child';childRoot.visible=false;scene.add(childRoot)
  const elderRoot=new T.Group();elderRoot.name='people-elder';elderRoot.visible=false;scene.add(elderRoot)
  const nomadRoot=new T.Group();nomadRoot.name='people-nomad';nomadRoot.visible=false;scene.add(nomadRoot)
  const pregnancyRoot=new T.Group();pregnancyRoot.name='people-pregnancy';pregnancyRoot.visible=false;scene.add(pregnancyRoot)
  const animated=[]
  const geometries=[]
  const ink=new T.LineBasicMaterial({color:'#dfe7ec',transparent:true,opacity:.8,depthWrite:false})
  const fill=new T.MeshBasicMaterial({color:'#73838e',transparent:true,opacity:.4,side:T.FrontSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1})
  for(const figure of figures){
    const geometry=new T.BufferGeometry()
    geometry.setAttribute('position',new T.Float32BufferAttribute(figure.positions,3));geometry.setIndex(figure.indices)
    const wireGeometry=new T.WireframeGeometry(geometry);geometries.push(geometry,wireGeometry)
    const mesh=new T.Mesh(geometry,fill);mesh.name=figure.name;mesh.position.set(...figure.position);mesh.rotation.y=figure.rotation
    const wire=new T.LineSegments(wireGeometry,ink);wire.renderOrder=2;mesh.add(wire);(figure.scene==='pregnancy'?pregnancyRoot:figure.scene==='nomad'?nomadRoot:figure.scene==='elder'?elderRoot:figure.scene==='child'?childRoot:root).add(mesh)
  }
  const careAnimated=[]
  for(const name of ['pregnancy-mother-hand--1','pregnancy-mother-hand-1','pregnancy-feeding-father','pregnancy-cradle-baby']){
    const actor=pregnancyRoot.getObjectByName(name)
    for(const object of [actor,...actor.children]){const attr=object.geometry.attributes.position;careAnimated.push({name,attr,base:attr.array.slice()})}
  }
  const bottle=new T.Group();bottle.name='pregnancy-feeding-bottle';pregnancyRoot.add(bottle)
  const bottleAxis=new T.Vector3(-.045,-.11,0).normalize();bottle.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bottleAxis)
  function bottlePart(geometry,y){const mesh=new T.Mesh(geometry,fill),edge=new T.WireframeGeometry(geometry);mesh.position.y=y;mesh.add(new T.LineSegments(edge,ink));bottle.add(mesh);geometries.push(geometry,edge)}
  bottlePart(new T.CylinderGeometry(.033,.033,.105,8),0)
  bottlePart(new T.CylinderGeometry(.029,.034,.018,8),.061)
  bottlePart(new T.ConeGeometry(.016,.033,8),.086)
  const worker=nomadRoot.getObjectByName('nomad-desk-worker')
  for(const object of [worker,...worker.children]){const attr=object.geometry.attributes.position;animated.push({attr,base:attr.array.slice()})}
  const elder=elderRoot.getObjectByName('elder-stooped-with-cane')
  const canePath=new T.CatmullRomCurve3([
    new T.Vector3(.27,.025,-.45),new T.Vector3(.27,.65,-.45),
    new T.Vector3(.27,.79,-.45),new T.Vector3(.27,.82,-.49),new T.Vector3(.27,.82,-.56),
  ])
  const caneGeometry=new T.TubeGeometry(canePath,18,.015,6,false),caneEdges=new T.EdgesGeometry(caneGeometry,25)
  const cane=new T.Mesh(caneGeometry,fill);cane.name='elder-walking-cane';cane.add(new T.LineSegments(caneEdges,ink));elder.add(cane)
  geometries.push(caneGeometry,caneEdges)
  // Two slightly folded pages, held between the child's hands above the lap.
  const bookGeometry=new T.BufferGeometry()
  bookGeometry.setAttribute('position',new T.Float32BufferAttribute([
    -1.64,.735,-1.84, -1.46,.705,-1.84, -1.46,.635,-2.07,
    -1.64,.735,-1.84, -1.46,.635,-2.07, -1.64,.665,-2.07,
    -1.46,.705,-1.84, -1.28,.735,-1.84, -1.28,.665,-2.07,
    -1.46,.705,-1.84, -1.28,.665,-2.07, -1.46,.635,-2.07,
  ],3));bookGeometry.computeVertexNormals()
  const pages=new T.MeshBasicMaterial({color:'#e5e9df',side:T.DoubleSide,transparent:true,opacity:.8,depthWrite:false})
  const book=new T.Mesh(bookGeometry,pages);book.name='child-open-book';childRoot.add(book)
  const bookEdges=new T.EdgesGeometry(bookGeometry);book.add(new T.LineSegments(bookEdges,ink));geometries.push(bookGeometry,bookEdges)
  const dayInk=new T.Color('#394750'),nightInk=new T.Color('#dfe7ec')
  return {
    tick(id,state) {
      const visibility=T.MathUtils.clamp(state.brightness/(id==='pregnancy'?.3:id==='child'?.75:.85),0,1)
      root.visible=id==='anti-aging'&&visibility>0
      childRoot.visible=id==='child'&&visibility>0
      elderRoot.visible=id==='elder'&&visibility>0
      pregnancyRoot.visible=id==='pregnancy'&&visibility>0
      if(pregnancyRoot.visible){
      const care=pregnancyFrame(state.cycleSeconds)
      bottle.position.set(.82,.775-care.feed*.045,-2.5)
      for(const {name,attr,base} of careAnimated){
        for(let i=0;i<attr.count;i++){
          const x=base[i*3],y=base[i*3+1],z=base[i*3+2];let dx=0,dy=0,dz=0
          if(name==='pregnancy-feeding-father'){
            const w=T.MathUtils.smoothstep(-z,.40,.53)*(1-T.MathUtils.smoothstep(y,.83,1.03));dy=-care.feed*.045*w
          }else if(name.startsWith('pregnancy-mother-hand')){
            const angle=care.stroke*.12,cy=y-.80,cz=z+.13;dy=cy*Math.cos(angle)-cz*Math.sin(angle)-cy;dz=cy*Math.sin(angle)+cz*Math.cos(angle)-cz
          }else{
            const w=Math.max(T.MathUtils.smoothstep(Math.abs(z),.075,.13),1-T.MathUtils.smoothstep(x,-.27,-.14));dy=care.baby*.017*w*(z<0?-1:1);dz=care.baby*.009*w
          }
          attr.array[i*3]=x+dx;attr.array[i*3+1]=y+dy;attr.array[i*3+2]=z+dz
        }
        attr.needsUpdate=true
      }
      }
      nomadRoot.visible=id==='nomad'&&visibility>0
      if(nomadRoot.visible){
      const motion=nomadFrame(state.cycleSeconds).mouse
      for(const {attr,base} of animated){for(let i=0;i<attr.count;i++){const x=base[i*3],y=base[i*3+1],z=base[i*3+2];const weight=T.MathUtils.smoothstep(x,.22,.38)*T.MathUtils.smoothstep(-z,.10,.21)*T.MathUtils.smoothstep(y,.66,.78);attr.array[i*3]=x-motion*weight}attr.needsUpdate=true}
      }
      pages.opacity=.85*visibility
      ink.color.copy(nightInk).lerp(dayInk,state.daylight)
      ink.opacity=(.62+state.brightness*.24)*visibility
      fill.opacity=(.24+state.daylight*.17)*visibility
    },
    dispose(){scene.remove(root,childRoot,elderRoot,nomadRoot,pregnancyRoot);pages.dispose();geometries.forEach(g=>g.dispose());ink.dispose();fill.dispose()}
  }
}
