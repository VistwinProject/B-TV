import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

// ── 機位編輯工具(獨立分頁 /camera-tool.html)──────────────────────────────────
// 在模型裡自由移動 → 擷取機位 → 預覽串接動畫 → 存到 localStorage(電視端自動讀取)。
// 自動偵測相鄰機位之間的直線是否穿牆並標警告。模型載入/正規化方式與 HouseCanvas 一致,
// 所以擷取的座標在電視端完全對得上。
const MODEL_URL = `${import.meta.env.BASE_URL}house.glb`
const LS_KEY = 'b2:houseViewpoints'
const r3 = (n) => Math.round(n * 1000) / 1000

export default function CameraTool() {
  const mountRef = useRef(null)
  const api = useRef({})
  const [vps, setVps] = useState(() => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch { return [] } })
  const [status, setStatus] = useState('載入模型中…')
  const [warns, setWarns] = useState([])
  const [playing, setPlaying] = useState(false)
  const [fov, setFov] = useState(60)
  const vpsRef = useRef(vps); vpsRef.current = vps
  const playRef = useRef(playing); playRef.current = playing

  useEffect(() => {
    const mount = mountRef.current
    const W = mount.clientWidth, H = mount.clientHeight
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x10141a)
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 1.2
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(4, 6, 5); scene.add(key)

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.02, 200)
    camera.position.set(3, 2, 4)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08

    new GLTFLoader().load(MODEL_URL, (g) => {
      const obj = g.scene
      obj.traverse((o) => {
        if (!o.isMesh || !o.material) return
        const ms = Array.isArray(o.material) ? o.material : [o.material]
        ms.forEach((m) => { if (m && 'roughness' in m) { m.roughness = m.roughness < 0.15 ? 0.72 : m.roughness; m.metalness = 0; m.envMapIntensity = 1.15; m.needsUpdate = true } })
      })
      // 正規化(與 HouseCanvas.setModel 完全一致)
      const box = new THREE.Box3().setFromObject(obj)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z) || 1
      const scale = 3.0 / maxDim
      obj.scale.setScalar(scale)
      obj.position.sub(center.multiplyScalar(scale))
      obj.position.y += (size.y * scale) / 2 - 0.2
      scene.add(obj)
      api.current.model = obj
      const wb = new THREE.Box3().setFromObject(obj)
      const c = wb.getCenter(new THREE.Vector3())
      controls.target.copy(c)
      camera.position.set(c.x + 3, c.y + 1.5, c.z + 3)
      controls.update()
      setStatus('就緒 — 左鍵旋轉 / 滾輪縮放 / 右鍵平移;喬好角度按「＋ 擷取機位」')
      setVps((x) => [...x]) // 觸發 wall check
    }, undefined, () => setStatus('找不到 /house.glb — 請先把模型放進 public/'))

    api.current = { ...api.current, renderer, scene, camera, controls }

    const TRANS = 2.4, DWELL = 2.6
    const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
    const pv = { idx: 0, t0: 0, active: false }
    const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3()
    const clock = new THREE.Clock()
    let lastT = 0, raf

    // WASD 飛行:W/S 前後、A/D 左右、Q/E 下上、Shift 加速(移動相機+目標,仍可拖曳轉視角)
    const keys = new Set()
    const onKeyDown = (e) => { if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return; keys.add(e.key.toLowerCase()) }
    const onKeyUp = (e) => keys.delete(e.key.toLowerCase())
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    const fwd = new THREE.Vector3(), right = new THREE.Vector3(), mv = new THREE.Vector3()

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()
      const dt = Math.min(0.05, t - lastT); lastT = t
      const list = vpsRef.current
      if (playRef.current && list.length >= 2) {
        controls.enabled = false
        if (!pv.active) { pv.active = true; pv.idx = 0; pv.t0 = t }
        const cur = list[pv.idx % list.length], nxt = list[(pv.idx + 1) % list.length]
        const cf = cur.fov || 60, nf = nxt.fov || 60
        const seg = t - pv.t0
        if (seg < TRANS) {
          const e = ease(seg / TRANS)
          camera.position.lerpVectors(tmpA.fromArray(cur.pos), tmpB.fromArray(nxt.pos), e)
          controls.target.lerpVectors(new THREE.Vector3().fromArray(cur.tgt), new THREE.Vector3().fromArray(nxt.tgt), e)
          camera.fov = cf + (nf - cf) * e; camera.updateProjectionMatrix()
        } else if (seg > TRANS + DWELL) {
          pv.idx = (pv.idx + 1) % list.length; pv.t0 = t
        } else {
          camera.position.fromArray(nxt.pos); controls.target.fromArray(nxt.tgt)
          if (Math.abs(camera.fov - nf) > 0.01) { camera.fov = nf; camera.updateProjectionMatrix() }
        }
      } else {
        if (pv.active) { pv.active = false; controls.enabled = true }
        // WASD 飛行
        if (keys.size) {
          camera.getWorldDirection(fwd)
          right.crossVectors(fwd, camera.up).normalize()
          mv.set(0, 0, 0)
          if (keys.has('w')) mv.add(fwd)
          if (keys.has('s')) mv.sub(fwd)
          if (keys.has('d')) mv.add(right)
          if (keys.has('a')) mv.sub(right)
          if (keys.has('e')) mv.y += 1
          if (keys.has('q')) mv.y -= 1
          if (mv.lengthSq() > 0) {
            mv.normalize().multiplyScalar(dt * 1.6 * (keys.has('shift') ? 3 : 1))
            camera.position.add(mv); controls.target.add(mv)
          }
        }
      }
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    const ro = new ResizeObserver(() => { const w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h) })
    ro.observe(mount)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); controls.dispose(); renderer.dispose(); pmrem.dispose(); if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement) }
  }, [])

  // 穿牆偵測:相鄰機位直線是否被幾何擋住
  useEffect(() => {
    const model = api.current.model
    if (!model) { setWarns([]); return }
    const ray = new THREE.Raycaster()
    const w = []
    for (let i = 0; i < vps.length - 1; i++) {
      const a = new THREE.Vector3().fromArray(vps[i].pos)
      const b = new THREE.Vector3().fromArray(vps[i + 1].pos)
      const dir = b.clone().sub(a); const len = dir.length()
      if (len < 1e-4) { w.push(false); continue }
      dir.normalize(); ray.set(a, dir); ray.far = len
      const hit = ray.intersectObject(model, true)
      w.push(hit.length > 0 && hit[0].distance < len - 0.06)
    }
    setWarns(w)
  }, [vps])

  const capture = () => { const { camera, controls } = api.current; setVps((x) => [...x, { pos: camera.position.toArray().map(r3), tgt: controls.target.toArray().map(r3), fov: Math.round(camera.fov) }]) }
  const goTo = (i) => { const { camera, controls } = api.current; const v = vps[i]; camera.position.fromArray(v.pos); controls.target.fromArray(v.tgt); if (v.fov) { camera.fov = v.fov; camera.updateProjectionMatrix(); setFov(v.fov) } controls.update() }
  const setFovLive = (v) => { setFov(v); const c = api.current.camera; if (c) { c.fov = v; c.updateProjectionMatrix() } }
  const remove = (i) => setVps((x) => x.filter((_, j) => j !== i))
  const move = (i, d) => setVps((x) => { const n = [...x]; const j = i + d; if (j < 0 || j >= n.length) return x;[n[i], n[j]] = [n[j], n[i]]; return n })
  const save = () => { localStorage.setItem(LS_KEY, JSON.stringify(vps)); setStatus(`已儲存 ${vps.length} 個機位 → 電視端會自動讀取(重新整理電視頁即可)`) }
  const clearAll = () => { if (confirm('清空所有機位?')) setVps([]) }
  const copyJSON = () => { navigator.clipboard?.writeText(JSON.stringify(vps)); setStatus('已複製 JSON 到剪貼簿') }

  return (
    <div className="ct">
      <div className="ct__stage" ref={mountRef} />
      <div className="ct__panel">
        <div className="ct__title">機位編輯工具</div>
        <div className="ct__hint">
          移動:<b>WASD</b> 前後左右、<b>Q/E</b> 下/上、<b>Shift</b> 加速;<b>左鍵</b>轉視角、<b>滾輪</b>縮放、<b>右鍵</b>平移。
          喬好角度與 FOV 按「擷取機位」。機位依序串接成運鏡;⚠ 代表該段直線會穿牆,請在中間補一個機位。
        </div>
        <div className="ct__fov">
          <label>視角 FOV：<b>{fov}°</b></label>
          <input type="range" min="20" max="100" value={fov} onChange={(e) => setFovLive(+e.target.value)} />
        </div>
        <div className="ct__btns">
          <button className="primary" onClick={capture}>＋ 擷取機位</button>
          <button onClick={() => setPlaying((p) => !p)} disabled={vps.length < 2}>{playing ? '⏹ 停止預覽' : '▶ 預覽路徑'}</button>
        </div>
        <div className="ct__btns">
          <button className="primary" onClick={save} disabled={!vps.length}>💾 儲存</button>
          <button onClick={copyJSON} disabled={!vps.length}>⧉ 複製 JSON</button>
          <button className="danger" onClick={clearAll} disabled={!vps.length}>清空</button>
        </div>
        <div className="ct__status">{status}</div>
        <div className="ct__list">
          {!vps.length && <div className="ct__empty">尚無機位 — 按「＋ 擷取機位」新增。</div>}
          {vps.map((v, i) => (
            <div className="ct__item" key={i}>
              <b>#{i + 1}</b>
              <span className="seg">{v.pos.map((n) => n.toFixed(1)).join(', ')} · {v.fov || 60}°</span>
              {warns[i] && <span className="warn" title="此段路徑會穿牆">⚠ 穿牆</span>}
              <button onClick={() => goTo(i)}>跳到</button>
              <button onClick={() => move(i, -1)}>↑</button>
              <button onClick={() => move(i, 1)}>↓</button>
              <button className="danger" onClick={() => remove(i)}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
