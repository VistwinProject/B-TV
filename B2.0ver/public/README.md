# public/ — 靜態資源

## 房子 3D 模型(house.glb)

把你的房子模型放成 **`public/house.glb`** 即可自動接上(無需改 code)。

- 格式:**glTF 2.0 binary(.glb)**。若是 .gltf + 貼圖,請先合併匯出成單一 .glb。
- 載入位置:`src/bento/HouseCanvas.jsx` 的 `MODEL_URL = '/house.glb'`。
- 沒有檔案時:自動 fallback 成程序化的 placeholder 房子(旋轉 / 燈光邏輯完全一樣),方便先驗證版面。
- 模型會自動置中 + 等比縮放填滿格子(`setModel()`),不必預先調大小;但建議模型「正面朝 +Z、底部貼地」會最好看。
- 窗戶若想隨情境發光:把窗戶材質的 emissive 開著(任何 `material.emissive` 存在的 mesh 都會被當成發光面,吃情境主色)。

放好後重新整理頁面即可;若沒吃到,確認檔名與路徑為 `public/house.glb`。
