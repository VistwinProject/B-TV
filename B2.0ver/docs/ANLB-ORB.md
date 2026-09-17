# ANLB 語音球接入（2026-09-17）

- 原包 demo：http://127.0.0.1:8080/demo.html（需啟動 demo 伺服器）。
- 前言、五種情境核心目標卡、結語共用 VoiceOrbProvider 中的一個原版 mountOrb 實例。
- public/anlb-orb 保留原包、MIT LICENSE 與 UPSTREAM；orb.js / restored-orb.js 未修改。
- 使用現有 useNarration 的 analyser，RMS 校正為 max(0, RMS - 0.008) × 5，上限 1。不呼叫 connectAudio，不重複建立音源。
- 展演開始進入 thinking；斷句、音檔結束、換頁與編輯暫停僅將音量歸零。整場回 welcome 或手動重設才 end。
- 無顯示插槽時，球放在畫面外的 520 × 520 容器，避免 WebGPU 在零尺寸容器初始化失敗；跨頁不重建。
- 不支援 WebGPU 時顯示原版錯誤，不換製另一顆球。

## 音檔
目前只有 public/voice/intro.wav。其餘檔名沿用 public/voice/README.md；放入後以 VITE_AUDIO_ENABLED=true 啟用全區旁白。缺檔時不能驗證該情境的實際音量同步，球維持思考。

## 驗證
原版 demo 已檢查思考、停頓與待機。接入頁前言量測到非零 RMS，情境靜音時 thinking / level=0，結語結束後 idle / level=0。新增測試驗證原包一致及生命週期。35 項測試、正式建置通過。
