# 2.0 配音檔

請提供以下八個 MP3：

- lead.mp3
- intro.mp3
- outro.mp3
- scene-anti-aging.mp3
- scene-child.mp3
- scene-elder.mp3
- scene-pregnancy.mp3
- scene-nomad.mp3

將 .env.example 複製成 .env，設定 VITE_AUDIO_ENABLED=true，重新啟動服務。新版由 app/useExhibition.js 管理播放與取消；沒有使用第一次嘗試的 src/speech.js。沒有音檔時，資訊牆依計時退路繼續。

前言已內建 `intro.wav`，來源為使用者新增的「B 同一間房子_.wav」，獨立預設啟用，取代前言的 intro.mp3；播放完成直接進入角色選擇。其他頁面的 MP3 仍由 VITE_AUDIO_ENABLED 控制。
