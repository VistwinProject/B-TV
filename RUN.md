# 怎麼在新電腦上跑起來看畫面

## 獨立本機預覽（替代 NFC 卡片）

在本 repo 執行 `npm run dev -- --host 127.0.0.1 --port 5196 --strictPort`，開啟 <http://127.0.0.1:5196/?demo=1>。
若埠已被占用，改用其他未占用埠，不要停止現有服務。

`?demo=1` 不建立 NFC WebSocket，按鈕與鍵盤沿用離線訊息模擬，僅更新此畫面。
左下角「替代 NFC 卡片」可收合，包含邀請卡、五種角色與拿起卡片；「體驗流程」另有前言、下一步、結語、重置。
拿起卡片保留當前情境；「下一步」僅於前言及房屋資訊可用。按鈕可用滑鼠、觸控及原生 Enter／Space 操作。
未帶 `demo=1` 時維持原有 NFC 連線與廣播流程。

## 正式啟動(整區一鍵):用隔壁 `b-livingroom`

電視主畫面不是從這裡單獨開,而是由隔壁 **`b-livingroom`** 一鍵啟動整個 B 區:

- **啟動**:雙擊 **`b-livingroom\啟動.bat`** → 自動建置 + 開 NFC 伺服器(8788)+ 桌面投影(5273)+ **電視主畫面(5274)**,兩個 Chrome 全螢幕 kiosk。
- **關閉**:雙擊 **`b-livingroom\stop.bat`**(一起停 5273 / 5274 / 8788)。
- 前提:`b-livingroom` 與 `b-tv` 兩個資料夾放在**同一層**(`啟動.bat` 會找隔壁的 `b-tv`)。
- ⚠ 第一次開若出現 Chrome 歡迎/登入提示,關掉一次即可(專用 profile 會記住)。

> 看畫面不需要讀卡機;待機畫面 + 鍵盤模擬都能跑(鍵盤鍵見下)。
> 只想單獨看電視:`b-tv` 跑 `npm run preview` 後開 <http://localhost:5274>。

## 這個 b-tv 資料夾只留一個 bat:機位設定工具

| 雙擊這個 | 做什麼 |
|---|---|
| **`啟動-機位設定工具.bat`** | 開伺服器 → Chrome **視窗**開機位設定工具(<http://localhost:5274/camera-tool.html>),設定 3D 室內運鏡 |

它用的 Chrome 專用設定檔(`.chrome-profile`)與 `b-livingroom\啟動.bat` 開電視時**同一個** → 你在這裡存的機位,正式啟動的電視主畫面**讀得到**。

## 鍵盤(沒接讀卡機時測試用)

`c` 刷邀請卡 · `1`~`5` 刷 5 個情境鑰匙圈 · `x` 拿起 · `i` 前言 · `o` 結語 · `r` 重置

## 換電腦 / 複製到別台

- 把 **`b-livingroom` 與 `b-tv` 放在同一層**一起複製,或各自 `git clone`(`b-tv`:<https://github.com/VistwinProject/B-TV.git>)。
- 不用複製 `node_modules`(`啟動.bat` 會自己 `npm install`)。
- 新機器先裝好 Node.js(+ NFC 才需要的 Python),再雙擊 `b-livingroom\啟動.bat`。

## 機位編輯工具(設定 3D 室內運鏡)

雙擊 **`啟動-機位設定工具.bat`**(或手動開 **<http://localhost:5274/camera-tool.html>**):
- 左鍵旋轉 / 滾輪縮放 / 右鍵平移,在模型裡喬好角度 → 按「＋ 擷取機位」。
- 依序擷取多個機位 = 運鏡路徑;⚠ 代表該段直線會穿牆,請在中間補一個機位。
- 「▶ 預覽路徑」看串接效果;滿意按「💾 儲存」(存到瀏覽器 localStorage)。
- 回電視頁重新整理 → 房子格就會用你設定的機位跑運鏡(沒設定則自動環繞)。
- 「⧉ 複製 JSON」可把機位貼給工程固化進程式(localStorage 僅限同一台瀏覽器)。

## 客戶素材放這裡(可選)

- 房子 3D 模型 → `public/house.glb`(放了就自動換掉預設方塊房子)
- 前言 / 結語配音 → `public/voice/intro.mp3`、`public/voice/outro.mp3`(放了再把 `src/speech.js` 的 `ENABLED` 設回 `true`)

## 想要「完全免安裝、雙擊就開的 .exe」?

目前 `.bat` 仍需先裝一次 Node.js。若要做成**單一 .exe**(把瀏覽器引擎與執行環境全包進去,新電腦什麼都不用裝),可改用 Electron 打包 —— 這是另一個工程,需要時再做。
