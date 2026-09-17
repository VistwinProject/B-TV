import * as T from 'three'
import figures from './homePeopleGeometry.json' with {type:'json'}

// Continuous low-poly surfaces baked by scripts/build-home-people.mjs.
export function createHomePeople(scene) {
  const root=new T.Group();root.name='people-anti-aging';root.visible=false;scene.add(root)
  const childRoot=new T.Group();childRoot.name='people-child';childRoot.visible=false;scene.add(childRoot)
  const elderRoot=new T.Group();elderRoot.name='people-elder';elderRoot.visible=false;scene.add(elderRoot)
  const geometries=[]
  const ink=new T.LineBasicMaterial({color:'#dfe7ec',transparent:true,opacity:.8,depthWrite:false})
  const fill=new T.MeshBasicMaterial({color:'#73838e',transparent:true,opacity:.4,side:T.FrontSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1})
  for(const figure of figures){
    const geometry=new T.BufferGeometry()
    geometry.setAttribute('position',new T.Float32BufferAttribute(figure.positions,3));geometry.setIndex(figure.indices)
    const wireGeometry=new T.WireframeGeometry(geometry);geometries.push(geometry,wireGeometry)
    const mesh=new T.Mesh(geometry,fill);mesh.name=figure.name;mesh.position.set(...figure.position);mesh.rotation.y=figure.rotation
    const wire=new T.LineSegments(wireGeometry,ink);wire.renderOrder=2;mesh.add(wire);(figure.scene==='elder'?elderRoot:figure.scene==='child'?childRoot:root).add(mesh)
  }
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
      const visibility=T.MathUtils.clamp(state.brightness/(id==='child'?.75:.85),0,1)
      root.visible=id==='anti-aging'&&visibility>0
      childRoot.visible=id==='child'&&visibility>0
      elderRoot.visible=id==='elder'&&visibility>0
      pages.opacity=.85*visibility
      ink.color.copy(nightInk).lerp(dayInk,state.daylight)
      ink.opacity=(.62+state.brightness*.24)*visibility
      fill.opacity=(.24+state.daylight*.17)*visibility
    },
    dispose(){scene.remove(root,childRoot,elderRoot);pages.dispose();geometries.forEach(g=>g.dispose());ink.dispose();fill.dispose()}
  }
}
