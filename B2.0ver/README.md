# 感光公寓 2.0 · B 區展演

正式程式在 `app/`，入口為 `app/main.jsx`。封存的 `archive/first-attempt/` 不參與正式建置；歷史進度保留於 `notes/` 與 `docs/SESSION-*`。

## 啟動

雙擊 `啟動-B2.0.command`，或執行 `npm ci`、`npm run dev`。

預覽：http://127.0.0.1:5284/ 。預設連接 B 區共用 NFC bridge；獨立檢視不連動時加 `?hardware=0`，隱藏操作面板加 `kiosk=1`。NFC bridge 綁定 127.0.0.1:8788，設定見 `server/README.md`。

C 感應邀請卡；1–5 切換情境；N 從資訊牆進角色選擇；I／Enter 角色選擇；O 結語；R／Esc 回首頁；X／空白鍵拿起卡片。E 開啟／結束編輯；編輯中 Esc 結束編輯。

## 現行流程

首頁 → 資訊牆 → 角色選擇／前言 → 觀眾自行選擇五種情境 → 結語。

- 資訊牆等待 18 秒房屋動畫（旋轉 6 秒、最後停留 2 秒）及語音完成，語音後至少保留 4 秒，再自動進角色選擇。
- 四種資訊維度每種 5 秒，20 秒循環；房屋情境動畫為 25 秒循環。
- 情境一旦選過就計入已體驗；重複選同張卡不重啟，換卡可中途切換。
- 五種都已選過時，最後情境需語音結束、場景至少播放 25 秒，再保留 2 秒進結語。
- 只有「資訊牆自動進角色選擇」及「最後情境自動進結語」使用各 0.25 秒淡出／淡入；其他沿用普通切換。
- 情境語音結束顯示核心目標。結語結束保留最後字幕，不自動回首頁。

資訊牆及情境數字是**展覽模擬資料**，來自 `app/exhibition.json`；沒有接入真實環境感測器。

## 編輯與播放

E 編輯器可調整版面、文字、玻璃材質與房屋構圖。設定自動保存在目前瀏覽器，可匯出／匯入 JSON；正式預設為 `B2.0-design.json`，目前採用 `B2.0-design (4).json`。

編輯時停止語音並暫停展演計時、NFC 換頁；退出編輯回到原展演頁，語音、房屋動畫和頁面計時一起重新開始，保留已體驗情境紀錄。編輯預覽直接顯示，避免淡入動畫暫停造成白畫面。

八支 WAV 旁白預設啟用，來源與字幕規則見 `public/voice/README.md`。播放被阻擋時提供播放按鈕；資訊牆有 120 秒等待上限，情境旁白受阻需操作播放按鈕。

## 主要程式

| 檔案 | 用途 |
|---|---|
| `app/playback.js`、`app/pageTransitions.js` | 展演流程、計時與指定轉場 |
| `app/useExhibition.js`、`app/captionSync.js` | NFC、鍵盤、音訊與字幕生命週期 |
| `app/screens.jsx`、`app/visuals.jsx` | 五類頁面、資料卡、圖示與數字動畫 |
| `app/homeScene.js`、`app/homePeople.js`、`app/homeFixtures.js` | 房屋、人物、道具與情境動畫 |
| `app/VoiceOrb.jsx`、`public/anlb-orb/` | 共用 ANLB 語音球 |
| `app/editor/` | 編輯器與設定儲存 |

## 驗證

`npm test` 執行測試；`npm run build` 產生 `dist/`。包含選卡順序、轉場、旁白字幕、場景、編輯與資源清理檢查。Three.js 分包大小提示為已知建置提醒。

## Table → TV 連動

桌面下的 NFC reader 接到執行 bridge 的主機。bridge 讀取卡片後，在 `8788` 同時廣播給 table（`5273`）與 tv（`5284`）；瀏覽器不直接存取 USB reader。兩個畫面目前使用同一台主機的 localhost。

分別保持三個終端執行：

```sh
# B2.0ver 根目錄：共用 NFC bridge（先依 server/README.md 安裝依賴）
node server/index.cjs
# B2.0ver 根目錄：TV
npm run dev
# B2.0ver/B-Table：桌面投影
npm run dev
```

先開啟兩邊網址，再於 table 按 C 模擬邀請卡、1–5 模擬角色卡、X 模擬拿起、R 重設。角色感應會立即切換 TV；拿起角色卡時 table 回到鑰匙圈提示，TV 保留情境繼續播放。TV 重新整理或斷線重連，會接收目前仍放在感應區的卡片；這會重新開始該情境，不會還原先前播放秒數。不要同時啟動 B-Table 的 Python server，兩個 bridge 共用 8788。
