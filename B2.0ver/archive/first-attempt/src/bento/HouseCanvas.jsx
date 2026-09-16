import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { lightingTarget } from './houseLighting.js'

// ── 畫廊級渲染可調常數(集中放,方便上線微調)──────────────────────────────────
const HDRI_URL = `${import.meta.env.BASE_URL}hdr/studio.hdr`      // 室內 HDRI(Poly Haven CC0);載不到則退回 RoomEnvironment
const ENV_INTENSITY = 0.18              // 環境光(HDRI)強度:壓低 → 夜晚畫廊基調 + 減少冷色反射汙染
const EXPOSURE = 0.72                   // ACES 曝光
const AMBIENT_SCALE = 0.45              // 把 persona 的均勻環境光壓低(白牆才不會被打平/過曝)
const BG_COLOR = 0x141009               // 純深色背景(暖黑,不偏藍 → 縫隙/景深也維持暖調)
const USE_SSAO = false                  // SSAO 會把整個場景再重畫 2~3 遍(深度/法線),重模型很吃 FPS → 預設關。順順的話再開。
const SSAO_RADIUS = 0.18                // 環境光遮蔽半徑(模型正規化到 ~3 單位,故用小值)
const BLOOM_STRENGTH = 0.12             // 燈具發光(收斂,避免白牆糊成一片)
const BLOOM_THRESHOLD = 1.35            // 只讓「真的很亮」的自發光起 bloom(白牆不要 bloom)
const CEILING = true                    // 程式補天花板(模型本身缺頂)→ 封閉空間、藏燈帶有地方放
const CEILING_COLOR = 0xe9e2d3          // 暖白天花(略降明度,留曝光餘裕)
const COVE_COLOR = 0xffce86             // 藏燈帶暖光色
const COVE_EMISSIVE = 1.5               // 燈帶自發光強度(> BLOOM_THRESHOLD → 會發光)
const COVE_LIGHT = 0.9                  // 藏燈帶實際點光強度(間接照亮牆/天花)
const DOWNSPOT_INT = 4.0                // 室內投射燈(天花下打光池)強度

// ── 房子 3D cell(全專案唯一的 three.js)─────────────────────────────────────
// bento 牆裡的一格:自動旋轉的房子,燈光隨情境(persona)與當前維度(dimKey)變化。
// 模型:優先載入 public/house.glb(客戶之後提供);載不到則用程序化 placeholder house,
// 旋轉與燈光邏輯一模一樣,屆時把 .glb 丟到 public/ 即自動接上。
//
// props:
//   persona  — { id, accent }(決定基礎燈光與窗戶/點光顏色)
//   dimKey   — 'light'|'air'|'temp'|'sound'|null(scene 解方展演中的當前維度,微調燈光)
const MODEL_URL = `${import.meta.env.BASE_URL}house.glb`

// 模型只載入/解析一次(public/house.glb 可達 40MB+),之後每次掛載 clone 重用。

// ── 豪宅素模材質分層 ──────────────────────────────────────────────────────────
// 模型本身「無任何貼圖」,只有 31 顆純色材質(SketchUp 匯出)。我們不做假貼圖,
// 而是依「原始材質名 + 原始顏色明度」把每個 mesh 分流到一組精選的高級材質:
//   建築(米白 clay,依面向分牆/地/天花) · 皮革 · 布料 · 暖金 · 鋼 · 玻璃(真透射)
//   · 燈具(自發光) · 深色飾面 · 彩色飾條(structural tube,降彩度成雅緻金屬)。
// 全靠 PBR(金屬/粗糙度)+ 環境光 + 方向光陰影做出層次 —— 乾淨但有豪宅質感。

// 建築主體:依面朝向給牆/地/天花不同暖白,單顆共用。
let TRIMAT = null
function triplanarMaterial() {
  if (TRIMAT) return TRIMAT
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0 })
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFloorCol = { value: new THREE.Color(0xcabfad) }  // 地板 暖石灰(降明度,留曝光餘裕)
    shader.uniforms.uWallCol = { value: new THREE.Color(0xdcd4c2) }   // 牆 米白(略降明度,白牆不過曝)
    shader.uniforms.uCeilCol = { value: new THREE.Color(0xe7e0d1) }   // 天花 暖白
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTriWN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vTriWN = normalize(mat3(modelMatrix) * objectNormal);')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uFloorCol;\nuniform vec3 uWallCol;\nuniform vec3 uCeilCol;\nvarying vec3 vTriWN;')
      .replace('#include <map_fragment>', `
        float up = normalize(vTriWN).y;
        vec3 col = uWallCol;
        col = mix(col, uFloorCol, smoothstep(0.4, 0.85, up));    // 朝上 → 地板
        col = mix(col, uCeilCol, smoothstep(-0.4, -0.85, up));   // 朝下 → 天花
        diffuseColor.rgb = col;
      `)
      // 地板更光滑 → 微微反射環境光與燈帶,有畫廊「拋光地坪」的高級感;牆/天花維持霧面。
      .replace('#include <roughnessmap_fragment>', `
        #include <roughnessmap_fragment>
        float upR = normalize(vTriWN).y;
        roughnessFactor = mix(roughnessFactor, 0.34, smoothstep(0.5, 0.92, upR));
      `)
  }
  mat.customProgramCacheKey = () => 'house-clay'
  TRIMAT = mat
  return mat
}

// 其餘材質類別(各一顆,clone 共用 reference)。
const MAT_CACHE = {}
const once = (k, make) => (MAT_CACHE[k] || (MAT_CACHE[k] = make()))
// 全暖色系(無冷藍/冷灰),與米白外殼一致 → 室內外協調、有豪宅暖意。
const leatherMat = () => once('leather', () => new THREE.MeshStandardMaterial({ color: 0xb29877, roughness: 0.5,  metalness: 0.0 })) // 駝色皮革
const fabricMat  = () => once('fabric',  () => new THREE.MeshStandardMaterial({ color: 0xcdc6b6, roughness: 0.96, metalness: 0.0 })) // 米灰布
const goldMat    = () => once('gold',    () => new THREE.MeshStandardMaterial({ color: 0xc8a868, roughness: 0.3,  metalness: 1.0 })) // 暖香檳金
const steelMat   = () => once('steel',   () => new THREE.MeshStandardMaterial({ color: 0xc2bbb0, roughness: 0.38, metalness: 0.9 })) // 暖調金屬(微香檳,不冷)
const darkMat    = () => once('dark',    () => new THREE.MeshStandardMaterial({ color: 0x6f6151, roughness: 0.62, metalness: 0.0 }))// 暖胡桃木飾面(取代冷espresso)
const lampMat    = () => once('lamp',    () => new THREE.MeshStandardMaterial({ color: 0xfff3d8, emissive: 0xffce86, emissiveIntensity: 1.6, roughness: 0.4 })) // 燈具自發光
// 玻璃:半透明 + 環境反射仿透射(避免 transmission 每幀重渲整場,894 mesh 會卡)。色偏暖中性。
const glassMat   = () => once('glass',   () => { const m = new THREE.MeshStandardMaterial({ color: 0xe6e3da, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.3 }); m.envMapIntensity = 1.4; return m })
// 結構導管(原本純綠/純藍)→ 收成同一種柔和暖青銅飾條,當作金屬點綴,不再有刺眼冷色。
const accentMat  = () => once('accent',  () => new THREE.MeshStandardMaterial({ color: 0xa08a63, roughness: 0.45, metalness: 0.4 }))

// 依原始材質,挑選對應的豪宅材質。
function pickMaterial(orig) {
  const name = orig?.name || ''
  const n = name.toLowerCase()
  if (n.includes('glass') || n.includes('translucent')) return glassMat()
  if (name === '吊燈') return lampMat()
  if (n.includes('leather')) return leatherMat()
  if (n.includes('clothes') || name.includes('淺灰')) return fabricMat()
  if (n.includes('gold') || n.includes('khaki') || name === 'Color_D04') return goldMat()               // 金 / 卡其 / 橙構件 → 暖金
  if (n.includes('silver') || n.includes('metal') || name === 'Material_11' || name === 'Material_15' || name === 'Color_M02') return steelMat()
  if (name === 'Color_G04_2' || name === 'Color_I04_2' || name === 'Color_J03') return accentMat() // 綠/藍導管 → 暖青銅飾條
  // 其餘:依原色明度 —— 近黑→深飾面;灰/白→建築 clay。
  const c = orig?.color
  if (c) { const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; if (lum < 0.12) return darkMat() }
  return triplanarMaterial()
}

// 把所有共用同一材質的 mesh,依材質合併成一顆大 mesh。模型是靜態的(只有相機動),
// 故可放心烘焙世界變換後合併 → draw call 從 ~894 砍到材質數(~12),FPS 大幅提升,
// SSAO/陰影的額外 pass 也跟著便宜。只保留 position+normal(材質不需 uv/vertexColor)。
function mergeByMaterial(root) {
  root.updateMatrixWorld(true)
  const byMat = new Map()
  const remove = []
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry || Array.isArray(o.material)) return
    const src = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry
    const pos = src.getAttribute('position')
    if (!pos) return
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', pos.clone())
    if (src.getAttribute('normal')) g.setAttribute('normal', src.getAttribute('normal').clone())
    else { g.computeVertexNormals() }
    g.applyMatrix4(o.matrixWorld)            // 烘焙世界變換(位置 + 法線)
    const m = o.material
    if (!byMat.has(m)) byMat.set(m, [])
    byMat.get(m).push(g)
    remove.push(o)
  })
  remove.forEach((o) => o.parent && o.parent.remove(o))
  const group = new THREE.Group()
  for (const [mat, geos] of byMat) {
    let merged = null
    try { merged = mergeGeometries(geos, false) } catch { merged = null }
    geos.forEach((g) => g.dispose())
    if (!merged) continue
    const mesh = new THREE.Mesh(merged, mat)
    mesh.castShadow = mat !== glassMat()
    mesh.receiveShadow = true
    group.add(mesh)
  }
  root.add(group)
}

// 依原始材質分層上色 + 開投/受影(玻璃不投實心影)+ 依材質合併幾何(效能)。
function enhanceMaterials(root) {
  root.traverse((o) => {
    if (!o.isMesh) return
    const mat = pickMaterial(o.material)
    o.material = mat
    o.castShadow = mat !== glassMat()
    o.receiveShadow = true
  })
  try { mergeByMaterial(root) } catch (e) { console.warn('[house] 幾何合併失敗,維持未合併', e) }
}

// 室內 HDRI 只載一次(raw RGBE texture);每個 renderer 自行 PMREM。載不到 → null。
let HDRI_CACHE = null
let HDRI_PROMISE = null
function loadEnvHDRI() {
  if (HDRI_CACHE !== null) return Promise.resolve(HDRI_CACHE)
  if (!HDRI_PROMISE) {
    HDRI_PROMISE = new Promise((resolve) => {
      new RGBELoader().load(HDRI_URL,
        (tex) => { tex.mapping = THREE.EquirectangularReflectionMapping; HDRI_CACHE = tex; resolve(tex) },
        undefined,
        () => { console.warn('[house] HDRI 載入失敗,改用 RoomEnvironment'); HDRI_CACHE = null; resolve(null) })
    })
  }
  return HDRI_PROMISE
}

let MODEL_CACHE = null
let MODEL_PROMISE = null
function loadHouseModel() {
  if (MODEL_CACHE) return Promise.resolve(MODEL_CACHE)
  if (!MODEL_PROMISE) {
    MODEL_PROMISE = new Promise((resolve, reject) => {
      new GLTFLoader().load(MODEL_URL, (gltf) => { try { enhanceMaterials(gltf.scene); MODEL_CACHE = gltf.scene; resolve(MODEL_CACHE) } catch (err) { console.error('[house] enhanceMaterials threw:', err); reject(err) } }, undefined, (err) => { console.error('[house] GLTF load error:', err); reject(err) })
    }).catch((e) => { MODEL_PROMISE = null; throw e })
  }
  return MODEL_PROMISE
}

export default function HouseCanvas({ persona, dimKey = null, shotCue = null }) {
  const mountRef = useRef(null)
  // 把會變動的 props 放 ref,避免重建整個 three 場景
  const propsRef = useRef({ persona, dimKey, shotCue })
  propsRef.current = { persona, dimKey, shotCue }

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = mount.clientWidth || 400
    const H = mount.clientHeight || 400

    const dpr = 1  // 小格子 → DPR 鎖 1,大幅降低渲染像素量(SSAO/Bloom/著色全部跟著省)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(dpr)
    renderer.setSize(W, H)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping     // 電影級色調(畫廊高級感根基)
    renderer.toneMappingExposure = EXPOSURE
    renderer.shadowMap.enabled = true                      // 開陰影 → 立體感
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.shadowMap.autoUpdate = false                  // 靜態模型,陰影只算一次(省效能)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(BG_COLOR)            // 純深色背景:夜晚畫廊、聚焦空間

    // 環境光(IBL):優先用室內 HDRI,載不到退回 RoomEnvironment。強度壓低 → 夜晚基調。
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    let envRT = null
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture // 先給 RoomEnv,HDRI 到了再換
    scene.environmentIntensity = ENV_INTENSITY
    loadEnvHDRI().then((tex) => {
      if (disposed || !tex) return
      envRT = pmrem.fromEquirectangular(tex)
      scene.environment = envRT.texture
    })

    const camera = new THREE.PerspectiveCamera(62, W / H, 0.02, 100) // 室內用較廣 FOV,沉浸感
    camera.position.set(0, 1, 0)

    // 室內分鏡運鏡參數(ArchViz 風:定點機位 + 阻尼過場 + 停留;節奏跟維度走)
    const focus = new THREE.Vector3(0, 0.8, 0) // 樓層中心(x,z)
    let span = 3, sizeY = 2, eyeY = 1, safeWall = 2
    let clearance = []   // [{a, d}] 每個方位角到最近牆/物件的距離(室內機位避牆用)
    let viewpoints = []        // [{pos, tgt}] 室內機位
    let vpIndex = 0
    const curPos = new THREE.Vector3(0, 1, 4)   // 目前相機位置(逐幀更新,過場結束後保持=停留)
    const curTgt = new THREE.Vector3(0, 0.8, 0) // 目前看向點
    const fromPos = new THREE.Vector3()
    const fromTgt = new THREE.Vector3()
    const drift = new THREE.Vector3(), driftT = new THREE.Vector3() // 抵達後的慣性飄移
    const _v = new THREE.Vector3()
    let introArm = false        // 進場 dolly:模型就位後沿視線推進到首機位
    let transStart = -100, shotStart = 0
    let prevCue = 0   // 上一拍的 shotCue(換拍才移動鏡位)
    let curFov = 62, fromFov = 62      // 每機位可帶自己的 FOV,過場間平滑內插
    const TRANS_SEC = 2.4      // 過場(阻尼加減速)時間
    const AUTO_SEC = 5.5       // dimKey=null(房屋資訊)時自動換機位的間隔
    function buildViewpoints() {
      viewpoints = []
      // 優先用「機位編輯工具」存到 localStorage 的自訂機位(座標系與本元件一致)
      let saved = null
      try { const a = JSON.parse(localStorage.getItem('b2:houseViewpoints')); if (Array.isArray(a) && a.length) saved = a } catch { /* ignore */ }
      if (saved) {
        viewpoints = saved.map((v) => ({ pos: new THREE.Vector3().fromArray(v.pos), tgt: new THREE.Vector3().fromArray(v.tgt), fov: v.fov || 62 }))
      } else if (clearance.length) {
        // fallback:用 clearance map 自動產生「站在開闊處、望向對側空間」的室內機位。
        const distAt = (ang) => {
          let best = Infinity, d = span
          for (const c of clearance) { const diff = Math.abs(((c.a - ang + Math.PI) % (Math.PI * 2)) - Math.PI); if (diff < best) { best = diff; d = c.d } }
          return d
        }
        const n = 6
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + 0.4
          const camD = Math.max(0.25, distAt(a) * 0.45)
          const lookA = a + Math.PI
          const lookD = Math.min(distAt(lookA) * 0.7, span * 0.9)
          const h = eyeY + sizeY * (0.14 + 0.05 * (i % 2))
          viewpoints.push({
            pos: new THREE.Vector3(focus.x + Math.cos(a) * camD, h, focus.z + Math.sin(a) * camD),
            tgt: new THREE.Vector3(focus.x + Math.cos(lookA) * lookD * 0.5, eyeY - sizeY * 0.06, focus.z + Math.sin(lookA) * lookD * 0.5),
            fov: 60,
          })
        }
      } else {
        // 極端 fallback(無 clearance):單純環繞
        const baseR = Math.min(safeWall * 0.55, Math.max(span, sizeY) * 0.6)
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + 0.5
          viewpoints.push({
            pos: new THREE.Vector3(focus.x + Math.cos(a) * baseR, eyeY + sizeY * 0.1, focus.z + Math.sin(a) * baseR),
            tgt: new THREE.Vector3(focus.x, eyeY - sizeY * 0.03, focus.z), fov: 62,
          })
        }
      }
      vpIndex = 0
      curPos.copy(viewpoints[0].pos); curTgt.copy(viewpoints[0].tgt)
      fromPos.copy(curPos); fromTgt.copy(curTgt)
      curFov = fromFov = viewpoints[0].fov || 62
      camera.fov = curFov; camera.updateProjectionMatrix()
      introArm = true   // 機位就緒 → 下一幀啟動進場 dolly
    }

    // ── 燈光 rig ────────────────────────────────────────────────────────────
    // 填充光全部用「暖色」→ 陰影/暗面/金屬反射不會偏冷藍(畫廊暖調統一)。
    const ambient = new THREE.AmbientLight(0xffd6ac, 0.35)              // 暖色環境補光(取代白色 → 暗面不發藍)
    const hemi    = new THREE.HemisphereLight(0xfff0db, 0x4a3c2e, 0.34) // 暖天光 + 暖地反照(提一點 → 暖化陰影)
    const key     = new THREE.DirectionalLight(0xfff1de, 2.8)          // 暖主光(強,拉明暗對比)
    key.position.set(6, 9, 5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 0.2
    key.shadow.camera.far = 40
    key.shadow.camera.left = -5; key.shadow.camera.right = 5
    key.shadow.camera.top = 5;  key.shadow.camera.bottom = -5
    key.shadow.normalBias = 0.02
    key.shadow.bias = -0.0002
    const fill    = new THREE.DirectionalLight(0xffe2bd, 0.3)   // 暖補光(取代白色)
    fill.position.set(-5, 2, -3)
    const accent  = new THREE.PointLight(0x4dbaba, 0.6, 18, 2)
    accent.position.set(-2, 2.4, 3)
    scene.add(ambient, hemi, key, fill, accent)
    // 室內重點投射燈(投影池)隨天花板一起建(放在天花板下、室內),見 buildCeiling。

    // ── 旋轉容器 ────────────────────────────────────────────────────────────
    const pivot = new THREE.Group()
    scene.add(pivot)

    // 收集會吃 emissive 的窗戶材質,讓窗戶隨情境發光
    const windowMats = []

    function buildPlaceholderHouse() {
      const g = new THREE.Group()
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xeae6df, roughness: 0.85, metalness: 0.0 })
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b3f46, roughness: 0.7 })
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.8 })

      // 牆體
      const walls = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.9), wallMat)
      walls.position.y = 0.8
      g.add(walls)

      // 屋頂(四坡 pyramid)
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.95, 1.1, 4), roofMat)
      roof.position.y = 2.15
      roof.rotation.y = Math.PI / 4
      g.add(roof)

      // 門
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 0.08), doorMat)
      door.position.set(0, 0.42, 0.97)
      g.add(door)

      // 窗戶(發光,吃情境色)
      const winGeo = new THREE.BoxGeometry(0.42, 0.42, 0.08)
      const winMat = () => {
        const m = new THREE.MeshStandardMaterial({ color: 0x9fd0e0, emissive: 0x4dbaba, emissiveIntensity: 0.3, roughness: 0.3 })
        windowMats.push(m)
        return m
      }
      const wPos = [[-0.7, 0.95, 0.97], [0.7, 0.95, 0.97], [-1.21, 0.95, 0], [1.21, 0.95, 0]]
      for (const [x, y, z] of wPos) {
        const w = new THREE.Mesh(winGeo, winMat())
        w.position.set(x, y, z)
        if (Math.abs(x) > 1) w.rotation.y = Math.PI / 2
        g.add(w)
      }

      // 地台
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.6, 0.12, 48),
        new THREE.MeshStandardMaterial({ color: 0x1a2228, roughness: 0.9 })
      )
      base.position.y = -0.06
      g.add(base)

      return g
    }

    // 依模型樓面輪廓(world bbox)程式補一片暖白天花板 + 周圍藏燈帶(發光燈條 + 暖點光)。
    // 天花板「不投影」→ 主光仍能穿透照亮室內(否則室內整片黑)。回傳一個可整組移除的 Group。
    const coveStripMat = () => once('cove', () => new THREE.MeshStandardMaterial({ color: 0xfff2d8, emissive: COVE_COLOR, emissiveIntensity: COVE_EMISSIVE, roughness: 0.5 }))
    const ceilingMat   = () => once('ceiling', () => new THREE.MeshStandardMaterial({ color: CEILING_COLOR, roughness: 0.92, metalness: 0.0, side: THREE.DoubleSide }))
    function buildCeiling(wb) {
      const g = new THREE.Group()
      const sx = wb.max.x - wb.min.x, sz = wb.max.z - wb.min.z
      const cx = (wb.max.x + wb.min.x) / 2, cz = (wb.max.z + wb.min.z) / 2
      const top = wb.max.y - Math.max(0.01, (wb.max.y - wb.min.y) * 0.01)   // 略低於最高牆,坐在牆頂
      // 天花板面(法線朝下)
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(sx * 1.02, sz * 1.02), ceilingMat())
      plane.rotation.x = Math.PI / 2
      plane.position.set(cx, top, cz)
      plane.receiveShadow = true
      plane.castShadow = true            // 擋掉頭頂主光 → 夜晚室內明暗對比(光來自室內燈)
      g.add(plane)
      // 藏燈帶:沿四周內縮一點的細發光條(吃 bloom)+ 暖點光(間接光打牆/天花)
      const inset = Math.min(sx, sz) * 0.06
      const stripY = top - Math.max(0.02, (wb.max.y - wb.min.y) * 0.04)
      const thick = Math.max(0.012, Math.min(sx, sz) * 0.006)
      const strips = [
        [sx - 2 * inset, thick, cx, wb.min.z + inset], [sx - 2 * inset, thick, cx, wb.max.z - inset],
      ]
      for (const [len, t, x, z] of strips) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(len, thick, t), coveStripMat())
        s.position.set(x, stripY, z); g.add(s)
      }
      const stripsZ = [
        [sz - 2 * inset, thick, wb.min.x + inset, cz], [sz - 2 * inset, thick, wb.max.x - inset, cz],
      ]
      for (const [len, t, x, z] of stripsZ) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(t, thick, len), coveStripMat())
        s.position.set(x, stripY, z); g.add(s)
      }
      // 暖點光:沿長軸兩端靠天花,往室內灑柔和間接光(不投影、便宜)= 藏燈帶的漫射光。
      // 只用 2 盞(減少每片素的多光照計算 → 省 FPS),涵蓋範圍拉大補足。
      const lx = sx * 0.34, ly = stripY - 0.04
      for (const x of [cx - lx, cx + lx]) {
        const pl = new THREE.PointLight(COVE_COLOR, COVE_LIGHT, Math.max(sx, sz) * 1.6, 2)
        pl.position.set(x, ly, cz); g.add(pl)
      }
      // 室內投射燈(天花下往地面打光池)= 重點打光、明暗對比;一盞投影、一盞補。
      const downY = top - (wb.max.y - wb.min.y) * 0.08
      const dz = sz * 0.2, dx = sx * 0.2
      const ds1 = new THREE.SpotLight(0xffe0b0, DOWNSPOT_INT, Math.max(sx, sz) * 1.2, 0.7, 0.7, 1.6)
      ds1.position.set(cx - dx, downY, cz - dz)
      ds1.target.position.set(cx - dx, wb.min.y, cz - dz)
      ds1.castShadow = true
      ds1.shadow.mapSize.set(1024, 1024)
      ds1.shadow.camera.near = 0.1; ds1.shadow.camera.far = Math.max(sx, sz, wb.max.y - wb.min.y) * 2
      ds1.shadow.bias = -0.0004; ds1.shadow.normalBias = 0.02
      g.add(ds1, ds1.target)
      const ds2 = new THREE.SpotLight(0xffe0b0, DOWNSPOT_INT * 0.6, Math.max(sx, sz) * 1.2, 0.8, 0.8, 1.6)
      ds2.position.set(cx + dx, downY, cz + dz)
      ds2.target.position.set(cx + dx, wb.min.y, cz + dz)
      g.add(ds2, ds2.target)
      return g
    }
    function disposeGroup(grp) {
      grp.traverse((o) => { if (o.isMesh) { o.geometry?.dispose?.() } })
    }

    let model = null
    let ceiling = null
    function setModel(obj) {
      // 置中 + 正規化大小,讓任何來源的模型都填滿格子
      const box = new THREE.Box3().setFromObject(obj)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z) || 1
      const scale = 3.0 / maxDim
      obj.scale.setScalar(scale)
      obj.position.sub(center.multiplyScalar(scale))
      obj.position.y += (size.y * scale) / 2 - 0.2
      pivot.add(obj)
      model = obj
      renderer.shadowMap.needsUpdate = true   // 模型就位 → 重算一次陰影
      // 更新室內漫遊參數(用縮放後的世界包圍盒)
      const wb = new THREE.Box3().setFromObject(obj)
      // 程式補天花板 + 藏燈帶(換模型時重建)
      if (ceiling) { pivot.remove(ceiling); disposeGroup(ceiling); ceiling = null }
      if (CEILING) { ceiling = buildCeiling(wb); pivot.add(ceiling) }
      wb.getCenter(focus)
      const ws = wb.getSize(new THREE.Vector3())
      span = Math.max(ws.x, ws.z, ws.y * 0.8) || 3
      sizeY = ws.y || 2
      eyeY = wb.min.y + ws.y * 0.34          // 人眼高度
      // clearance 只給「自動機位」用;若已有存檔機位(機位工具設好的)就跳過,
      // 省掉對 45 萬面打 36 條 raycast(≈1600 萬次三角測試)的同步大卡頓。
      clearance = []
      safeWall = Math.min(ws.x, ws.z) * 0.5
      let hasSaved = false
      try { const a = JSON.parse(localStorage.getItem('b2:houseViewpoints')); hasSaved = Array.isArray(a) && a.length > 0 } catch { /* ignore */ }
      if (!hasSaved) {
        const ray = new THREE.Raycaster()
        const o0 = new THREE.Vector3(focus.x, eyeY, focus.z)
        const N = 36
        let minD = Infinity
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2
          ray.set(o0, new THREE.Vector3(Math.cos(a), 0, Math.sin(a)))
          const hit = ray.intersectObject(obj, true)
          const d = hit.length ? hit[0].distance : Math.max(ws.x, ws.z)
          clearance.push({ a, d })
          if (hit.length) minD = Math.min(minD, d)
        }
        if (isFinite(minD) && minD > 0.1) safeWall = minD
      }
      buildViewpoints()
    }

    // 載入期間不顯示 placeholder(那顆假房子會讓人困惑)→ 維持純深色,等真模型到再淡入。
    // placeholder 只在「glb 載入失敗」時當保底。
    const placeholder = buildPlaceholderHouse()

    let disposed = false
    loadHouseModel()
      .then((scene) => {
        if (disposed) return
        const obj = scene.clone(true)       // clone 重用快取(共享 geometry/material)
        windowMats.length = 0
        obj.traverse((o) => {
          if (!o.isMesh || !o.material) return
          const ms = Array.isArray(o.material) ? o.material : [o.material]
          ms.forEach((m) => { // 只把「本來就會發光」的材質(燈/螢幕)納入情境光,不讓整棟發光
            if (m && 'emissive' in m && (m.emissiveIntensity > 0 || (m.emissive && m.emissive.r + m.emissive.g + m.emissive.b > 0.05))) windowMats.push(m)
          })
        })
        setModel(obj)
      })
      .catch(() => { if (!disposed) setModel(placeholder) /* glb 載入失敗 → 才顯示保底 placeholder */ })

    // ── 後處理:Bloom(燈具/藏燈帶發光)+ ACES 輸出。SSAO 預設關(太吃 FPS)。────
    const composer = new EffectComposer(renderer)
    composer.setPixelRatio(dpr)
    composer.setSize(W, H)
    composer.addPass(new RenderPass(scene, camera))
    let ssao = null
    if (USE_SSAO) {
      ssao = new SSAOPass(scene, camera, W, H)
      ssao.kernelRadius = SSAO_RADIUS
      ssao.minDistance = 0.001
      ssao.maxDistance = 0.06
      composer.addPass(ssao)
    }
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), BLOOM_STRENGTH, 0.4, BLOOM_THRESHOLD)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())   // ACES tone map + sRGB(放最後)

    // ── 當前燈光狀態(每幀 lerp 到 target)────────────────────────────────────
    const cur = {
      keyColor: new THREE.Color(0xffffff), keyInt: 2.2,
      accent: new THREE.Color(0x4dbaba), accentInt: 1.4,
      ambient: 0.5, fill: 0.6, emissive: 0.3, bg: new THREE.Color(0x0a1416),
    }

    let raf = 0
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = clock.getDelta()
      const t = clock.elapsedTime

      // 進場 dolly:模型就位後,鏡頭沿視線從後方推進到首機位(略廣 FOV → 收窄)。
      if (introArm && viewpoints.length) {
        introArm = false
        const v0 = viewpoints[0]
        _v.subVectors(v0.pos, v0.tgt)
        const len = _v.length() || 1; _v.multiplyScalar(1 / len)
        fromPos.copy(v0.pos).addScaledVector(_v, Math.min(span * 0.6, 2.0))
        fromPos.y += sizeY * 0.05
        fromTgt.copy(v0.tgt)
        curPos.copy(fromPos); curTgt.copy(fromTgt)
        fromFov = curFov = (v0.fov || 62) + 6
        transStart = t; shotStart = t; vpIndex = 0
      }

      // 室內分鏡運鏡:阻尼加減速移到下一機位 → coast → 下一拍再移。
      if (model && viewpoints.length) {
        const cue = propsRef.current.shotCue
        // 觸發換機位:scene 每「拍」換一次(shotCue 變);房屋資訊(無 cue)則定時換。
        const cueChanged = cue != null && cue !== prevCue
        if (cueChanged || (cue == null && (t - shotStart) > AUTO_SEC)) {
          prevCue = cue
          shotStart = t
          transStart = t
          vpIndex = (vpIndex + 1) % viewpoints.length
          fromPos.copy(curPos); fromTgt.copy(curTgt); fromFov = curFov
        }
        const p = Math.min(1, (t - transStart) / TRANS_SEC)
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2 // easeInOutCubic 阻尼
        const vp = viewpoints[vpIndex]
        curPos.lerpVectors(fromPos, vp.pos, e)
        curTgt.lerpVectors(fromTgt, vp.tgt, e)
        const tf = vp.fov || 62
        curFov = fromFov + (tf - fromFov) * e
        if (Math.abs(camera.fov - curFov) > 0.02) { camera.fov = curFov; camera.updateProjectionMatrix() }
        // 慣性飄移:抵達後沿行進方向繼續滑一小段,緩緩減速但不完全停(不硬停)
        if (p >= 1) {
          const coast = 1 - Math.pow(1 - Math.min(1, (t - transStart - TRANS_SEC) / 3.2), 2) // easeOut 滑行
          drift.subVectors(vp.pos, fromPos)
          if (drift.lengthSq() > 1e-6) { drift.normalize().multiplyScalar(span * 0.1 * coast); curPos.add(drift) }
          driftT.subVectors(vp.tgt, fromTgt)
          if (driftT.lengthSq() > 1e-6) { driftT.normalize().multiplyScalar(span * 0.06 * coast); curTgt.add(driftT) }
        }
        const bob = p >= 1 ? Math.sin(t * 0.5) * sizeY * 0.01 : 0
        camera.position.set(curPos.x, curPos.y + bob, curPos.z)
        camera.lookAt(curTgt)
      }

      // 目標燈光(依當前 props)
      const { persona, dimKey } = propsRef.current
      const tgt = lightingTarget(persona?.id, dimKey, persona?.accent)
      const k = Math.min(1, dt * 2.5) // lerp 速度
      cur.keyColor.lerp(tgt.keyColor, k)
      cur.accent.lerp(tgt.accent, k)
      cur.bg.lerp(tgt.bg, k)
      cur.keyInt  += (tgt.keyInt  - cur.keyInt)  * k
      cur.accentInt += (tgt.accentInt - cur.accentInt) * k
      cur.ambient += (tgt.ambient - cur.ambient) * k
      cur.fill    += (tgt.fill    - cur.fill)    * k
      cur.emissive += (tgt.emissive - cur.emissive) * k

      // 聲音維度:點光脈動
      const pulse = tgt.pulse ? 1 + Math.sin(t * 6) * 0.35 : 1

      key.color.copy(cur.keyColor); key.intensity = cur.keyInt
      accent.color.copy(cur.accent); accent.intensity = cur.accentInt * pulse
      ambient.intensity = cur.ambient * AMBIENT_SCALE   // 壓低均勻填充光 → 夜晚對比、不過曝
      fill.intensity = cur.fill * AMBIENT_SCALE
      for (const m of windowMats) {
        m.emissive.copy(cur.accent)
        m.emissiveIntensity = cur.emissive * pulse
      }

      composer.render()
    }
    animate()

    // ── resize ───────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth, h = mount.clientHeight
      if (!w || !h) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      composer.setSize(w, h)
    })
    ro.observe(mount)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      // 只釋放 placeholder 的 geometry(程序化、非共享);glb 模型的 geometry/material
      // 與 MODEL_CACHE 共享,不可在此 dispose(否則下次 clone 會壞)。
      placeholder.traverse((o) => {
        if (o.isMesh) { o.geometry?.dispose?.(); const m = o.material; if (Array.isArray(m)) m.forEach(x => x.dispose?.()); else m?.dispose?.() }
      })
      scene.environment?.dispose?.()
      envRT?.dispose?.()
      composer.dispose?.()
      ssao?.dispose?.()
      bloom.dispose?.()
      pmrem.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="house-canvas" />
}
