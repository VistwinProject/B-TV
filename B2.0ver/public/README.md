# B 區靜態資源

- `models/home-wireframe.json`、`home-wireframe.bin`、`home-fill.bin`：目前房屋 3D 線稿與表面資料，由 `scripts/build-home-wireframe.mjs` 產生。
- `voice/`：目前使用的 WAV 旁白，對照表見 `voice/README.md`。
- `anlb-orb/`：ANLB 語音球與原包授權資訊。
- `icons/`、`fonts/`、`bg/`、`backgrounds/`：介面圖像與字體。

資訊牆使用 `app/exhibition.json` 的展覽模擬數據，不連接真實環境感測器。NFC 只負責展演選卡與流程控制。
