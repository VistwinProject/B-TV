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

2026-09-17 更新：outro.wav 與 scene-anti-aging.wav、scene-child.wav、scene-elder.wav、scene-pregnancy.wav、scene-nomad.wav 已內建並預設啟用。情境字幕時間軸位於 app/sceneCaptions.js，使用音檔 currentTime 換句；單支播完保留既有核心目標。五種體驗完成後，最後一支旁白播完保留核心目標 4 秒再進結語。lead.mp3 仍由 VITE_AUDIO_ENABLED 控制。
