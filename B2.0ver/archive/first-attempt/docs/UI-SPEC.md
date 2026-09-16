感應光寓 · TV 主顯示 — UI 規格書
================================

> B 區 TV kiosk（`VistwinProject/B-TV`）目前線上狀態的完整介面清單：**所有文字、字體、字級、
> 材質與可切換設定**，附配色 token、版面比例與操作快捷鍵。
>
> - 對應版本：`main` @ `741e845`（2026-09-08 逐檔掃描原始碼校對）
> - 目標螢幕：橫式大尺寸 TV，所有尺寸用 `clamp(最小, vw/vh, 最大)` 自適應（下表一律照原樣列出）
> - 這份文件是**現況記錄**，不是設計提案；改了程式碼請同步更新這裡
> - 表中字級一律是**最終生效值**（已算過 CSS 覆寫順序），不是基礎類別的值

---

## 1. 主題

### 1-1 目前生效的是「白版」

`src/style.css` 與 `src/bento/bento.css` **尾端各有一整段 `WHITE 版` 覆寫**，同權重靠後獲勝。
底下所有「實際值」都是套完白版之後的結果。要回深色版，把那兩段整段刪掉即可（深色版的
基礎值仍完整保留在檔案前半段）。

| 檔案 | 白版覆寫段落 | 改了什麼 |
|---|---|---|
| `src/style.css` | 檔尾 `:root` 起 | 待機系底色轉白、光束轉藍、三行字轉深藍、選角色列表改平塗色塊 |
| `src/bento/bento.css` | `WHITE 版` 起 | 資訊牆底白／面板白／字藍、光邊改外圈、情境牆底改白 |

### 1-2 全域 token（`:root`，白版生效值）

| token | 深色底版 | **白版（生效）** | 用途 |
|---|---|---|---|
| `--accent` / `--accent-2` / `--accent-deep` | `#2f7bff` / `#5b9dff` / `#1657d6` | 同左 | 電光藍主色 |
| `--accent-glow` | `rgba(47,123,255,.28)` | 同左 | 結語大標光暈 |
| `--c-bg` | `#050d1f` | **`#ffffff`** | body 底 |
| `--c-text` | `#eaf1ff` | **`#17357a`** | 主文字 |
| `--c-text-dim` | `#7f96bd` | **`#5b7cb8`** | 次要文字（prompt 副標等） |
| `--good` / `--warn` / `--info` / `--down` | `#2f7bff` / `#f59e0b` / `#6f8ba0` / `#f43f5e` | 同左 | 狀態色（狀態列） |
| `--ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | 同左 | 全站唯一緩動 |

### 1-3 待機系配色 token

待機／前言／選角色／結語共用這組（1-5 情境牆自己畫底，不吃這層）。

| token | 深色底版 | **白版（生效）** | 用途 |
|---|---|---|---|
| `--idle-bg-1` | `#121263` | **`#ffffff`** | 底色漸層起點（左上） |
| `--idle-bg-2` | `#121c49` | **`#eef5ff`** | 底色漸層中段 |
| `--idle-bg-3` | `#000019` | **`#d7e6fa`** | 底色漸層終點（右下） |
| `--idle-haze` | `#308acf` | **`#bcd8fb`** | 中央大範圍霧 |
| `--beam-core` | `#ffffff` | `#ffffff` | 光束核心 |
| `--beam-inner` | `#ade5ff` | **`#7cc0ff`** | 光束內暈 |
| `--beam-glow` | `#8ad2ff` | **`#2f8dfb`** | 光束中暈（資訊牆光邊也吃這顆） |
| `--beam-edge` | `#2e9aff` | **`#1668dd`** | 光束外暈 |
| `--idle-title` | `#7ac3ff` | **`#1b3f8f`** | 大標（前言／結語文字與聲紋同色） |
| `--idle-sub` | `#7ac3ff` | **`#6a8cc8`** | 英文副標 |
| `--idle-hint` | `#7ac3ff` | **`#2a56a8`** | 提示小標 |

白底上白色核心會消失 → 白版把內／中／外暈整體加重、加深。

### 1-4 舞台底層

| 圖層 | 內容 |
|---|---|
| `.stage`（前言／資訊牆／選角色／結語） | 四層疊加：情境色橢圓柔光 12% → 頂部光暈 9% → 中央霧 7% → `linear-gradient(150deg, bg-1, bg-2 45%, bg-3)` |
| `.stage--idle`（待機） | 只留中央霧 + 底色漸層（光束由 SVG 另畫） |
| `.stage__vignette` | 60×60px 網格線 `rgba(70,110,180,.10)`，用橢圓遮罩讓四角淡出 |
| `body` | `cursor: none`、`user-select: none`、`overflow: hidden`（kiosk） |

---

## 2. 字體

### 2-1 本地字檔（`src/fonts/`，隨 build 打包）

| 字族 | 字重 | 檔案 | 用途 |
|---|---|---|---|
| `TASA Orbiter` | 400–800（變體字） | `TASAOrbiter-VariableFont_wght.ttf` | 拉丁字母與**所有數字**（主要數字字體） |
| `GlowSans TC` | 300 Light | `GlowSansTC-Condensed-Light.otf` | 中文窄體（字寬 ≈ 0.9） |
| `GlowSans TC` | 400 Regular | `GlowSansTC-Condensed-Regular.otf` | 中文窄體 |
| `GlowSans TC` | 500 Medium | `GlowSansTC-Condensed-Medium.otf` | 中文窄體 |
| `GlowSans TC` | 700 Bold | `GlowSansTC-Condensed-Bold.otf` | 中文窄體 |

授權：TASA Orbiter 為 SIL OFL，授權文字隨檔附於 `public/fonts/TASAOrbiter-OFL.txt`。

### 2-2 Google Fonts（`index.html` 連結載入）

```
Barlow Condensed        wght 200;300
Barlow Semi Condensed   wght 200;300
Chiron Hei HK           wght 400;500;700
JetBrains Mono          wght 400;500;700
Space Grotesk           wght 400;500;600;700
```

### 2-3 字體堆疊變數

| 變數 | 內容 | 用在哪 |
|---|---|---|
| `--font-cjk` | `'TASA Orbiter', 'GlowSans TC', 'Chiron Hei HK', sans-serif` | `body` 預設、內文 |
| `--font-display` | `'TASA Orbiter', 'GlowSans TC', 'Space Grotesk', sans-serif` | 倒數數字、角色短名 |
| `--font-hud` | `'TASA Orbiter', 'GlowSans TC', 'JetBrains Mono', monospace` | eyebrow、單位、狀態列、編輯面板 |
| `--b-num`（bento） | `'TASA Orbiter', 'GlowSans TC', 'Helvetica Neue', 'Arial', sans-serif` | 資訊牆／情境牆的所有字 |

**例外**：待機頁大標與情境牆底部字標不用 GlowSans（窄體會壓成 0.9 字寬），改用
`Chiron Hei HK` 讓字身回到 1:1；英文副標用 `Barlow Semi Condensed` 200 走細長筆畫。

---

## 3. 流程

### 3-1 主流程（2026-09-08 定案）

```
待機（感應光寓）
  ① 刷 NFC 邀請卡 ─────────→ 房屋資訊牆 ＋ B 區前導語音
  ② 前導語音播完（或逾時）──→ 五種情境選項介面
  ③ 刷情境鑰匙圈 ──────────→ 對應情境牆 ＋ 該情境語音   ↺ 五種任意順序、可重複刷
  ④ 五種都感應過，且最後一個情境播完一輪 → 結語頁 ─9s→ 回待機
```

四步全自動接續，展務員只在需要時介入（`n` 提前跳、`o` 提前收、`r` 重置）。
**前言頁（AI 聲紋）已移出主流程**，按 `i` 才會播。

### 3-2 phase 表（`src/App.jsx`）

| phase | 畫面 | 元件 | 狀態列顯示 | 進入方式 |
|---|---|---|---|---|
| `idle` | 待機頁 | `Idle` + `IdleBeam` | 待機 | 開站／`r`／結語播完 |
| `house` | 房屋即時健康資訊牆 | `HouseInfoBento` | 房屋資訊 | **刷邀請卡**（主流程）／前言按 `n` |
| `character` | 五種情境選項 | `PlacePrompt kind="character"` | 等待角色 | **前導語音播完自動進入**／資訊牆按 `n` |
| `scene` | 情境解方牆（跑一輪） | `SceneBento mode="play"` | 解方展演 | **刷情境鑰匙圈** |
| `loop` | 情境解方牆（續播） | `SceneBento mode="settled"` | 情境體驗 | `scene` 跑完 4 個維度，且**尚未集滿五種** |
| `outro` | 結語 | `Outro` | 結語 | **集滿五種後最後一輪播完**／`o`／server `outro` |
| `intro` | 前言（AI 聲紋） | `Intro` | 前言 | `i`・`Enter`／server `intro`（**不在主流程**） |
| `card` | 等待邀請卡 | `PlacePrompt kind="card"` | 等待邀請卡 | **目前無任何路徑會進到這一頁**（見附錄 A-1） |

實測時間軸（語音關閉、走退路秒數）：
`c` → 資訊牆 0.0s ／ 自動進情境選項 **20.0s** ／ 刷第 5 張後情境牆播 **20.3s** → 結語 ／ 結語 **9s** → 待機。

### 3-3 事件來源

1. **NFC WebSocket** `ws://localhost:8788`（3 秒自動重連）：`reader-connected` /
   `reader-disconnected` / `tag-present`（`data.kind` = `card` \| `character`）/ `tag-remove`；
   另收 `reset` / `intro` / `outro` 作為展務員 override
2. **鍵盤**（見 §10-1）。模擬鍵走 `relay()`：能送就廣播給 server（桌面投影同步），
   送不出去才本機處理；`n`（下一步）是電視本機流程，不廣播

### 3-4 reducer 的幾條隱形規則

- **刷邀請卡 = 硬重置到 `house`**，並清掉 `character` 與 `visited`。任何階段都成立
  （新訪客不必先按 reset）
- **同一角色在 `scene`/`loop` 重複讀到 → 整個忽略**，不重置場景與節奏（讀卡機會連續回報）；
  `visited` 也不會重複累加
- `tag-remove` 只清 `onReader`，情境保留（單一感應點，要拿起卡才放得下鑰匙圈）
- 感應成功漣漪 `CONFIRM_MS = 1800` 後由計時器移除，不依賴動畫回呼

### 3-5 「五種都感應完成」怎麼判定

state 多一個 `visited: []` —— 這一輪感應過哪些情境 id（去重、不分順序）：

| 事件 | 對 `visited` 的影響 |
|---|---|
| 刷邀請卡 | 清空（視為新訪客） |
| 刷情境鑰匙圈 | 沒有就 push 進去；已在裡面則不動 |
| `r` 重置／結語播完回待機 | 清空 |

`scene-done`（一輪 4 個維度跑完）時分岔：

```
visited.length >= 5  →  phase: 'outro'   （最後一個情境播完就收尾）
否則                 →  phase: 'loop'    （停在該情境等下一張卡）
```

→ **第五張卡刷下去之後，那個情境仍然照常播完整整一輪（約 20 秒）才進結語**，
不會因為集滿就把最後一個情境跳掉。

### 3-6 情境牆節拍

`BEAT_MS 5000 × BEATS_PER_DIM 1` → **每維度 5 秒**，`① 光照 → ② 空氣 → ③ 溫濕度 → ④ 聲音`
一輪 **20 秒**後 `scene → loop`。beat 由 `performance.now()` 推導而不是累加 counter
（免疫重複 interval 造成的加倍）；換角色時在 render 當下重置起點，避免第一幀用到舊角色的 beat。

### 3-7 兩個影響全站的架構決定

- **不用 `AnimatePresence` 換頁**：待機／聲紋等畫面有 `repeat: Infinity`，exit 永遠不 settle
  會卡在舊畫面 → 改成單一 keyed 畫面 + 0.5s 淡入
- **`scene` 與 `loop` 共用同一個 key**：換角色時 `SceneBento` 不 remount，進場動畫改由各卡片
  以 `persona.id` 當 key 重掛載播放
- `main.jsx` **不用 `StrictMode`**（雙重掛載會建兩個 WebGL context）

---

## 4. 待機系各頁的介面元素與文案

### 4-1 待機頁 `idle`

| 元素 | 文字 | 字體 | 字級 | 字重 | 字距 | 顏色 |
|---|---|---|---|---|---|---|
| `.idle__title` | 感應光寓 | Chiron Hei HK | `clamp(56px, 12vh, 150px)` | 500 | `ls .16em`／`indent .16em` | `--idle-title` `#1b3f8f` |
| `.idle__sub` | SENSING RESIDENCE | Barlow Semi Condensed | `clamp(18px, 2.7vh, 34px)` | 200 | `ls .62em`／`indent .62em`／`word-spacing 1.92em` | `--idle-sub` `#6a8cc8` |
| `.idle__hint` | 請入座，將邀請卡放上感應區 | `--font-cjk` | `clamp(15px, 2.2vh, 26px)` | 繼承 | `ls 1.061em`／`indent 1.061em` | `--idle-hint` `#2a56a8` |
| `.idle__halo` | 中央柔光圓 | — | `clamp(380px, 60vh, 720px)` | — | — | `rgba(150,195,250,.30)` 徑向 |
| `.idle__logo` | ANLB inside 商標 | — | 寬 `clamp(120px, 12vw, 260px)`、`aspect-ratio 227/46`、下緣 `clamp(30px, 8vh, 90px)` | — | — | 148° 藍色漸層 |

三行的 `letter-spacing`／`word-spacing` 是**反推算出來的**，目的是讓大標、英文副標、提示三行的
左右墨水邊界在 1280 與 1920 兩種寬度下都完全切齊；`text-indent` 補償尾端字距，置中才不會左偏半格。

**材質**：
- 大標陰影（白版）：三層淡藍灰 `0 2px 10px rgba(120,155,215,.22)` → `0 18px 40px rgba(105,140,200,.12)`，
  只留厚度不留髒污；另加 `-webkit-box-reflect` 往下 0.12em 的漸淡倒影
- 提示行（白版）：三層**白色**外暈（深色版是深藍），壓在光束上仍讀得清楚且不出現黑圈
- 商標：PNG **只當 alpha 遮罩**（`mask`），顏色由 CSS `linear-gradient(148deg, #6fb4ff → #2f8dfb →
  --idle-title → 更深)` 決定 → 不吃圖檔原色，並保留「被上方光帶斜照」的方向感

### 4-2 待機頁光束（`IdleBeam.jsx`）

不是 CSS 漸層。沿**二次貝茲曲線**鋪一條變寬度的帶子：控制點反推使曲線 t=0.5 時真的通過中間
造型點；取樣 120 點算單位法線，上下緣各自偏移後收成封閉多邊形。曲線兩端延伸到畫面外
（`t ∈ [-0.45, 1.45]`），看不到端點。

| 層 | 上緣倍率 | 下緣倍率 | 模糊 @1920 | 填色 | 透明度 |
|---|---|---|---|---|---|
| 外光暈 | `24 × glow` | `2.6 × edge` | 26px | `--beam-glow` | 0.20 |
| 中暈 | `8.5 × glow` | `1.9 × edge` | 13px | `--beam-edge` | 0.30 |
| 內暈 | `3.0 × glow` | `1.25 × edge` | 5px | `--beam-inner` | 0.72 |
| 亮核 | `1 ×` | `1 ×` | 1.2px | `--beam-core` | 1 |

四層貼同一條中心線，只有偏移量與模糊不同 → **上緣鋪很開、下緣俐落收邊**。
座標用畫面百分比（任何解析度成立），寬度以 1920 為基準等比縮放。幾何見 §8-3。

### 4-3 前言 `intro`

| 元素 | 文字 | 字級 | 字重 | 字距／其他 |
|---|---|---|---|---|
| `.intro__eyebrow` | AI 聲紋 · VOICEPRINT | `clamp(13px, 1.7vh, 19px)` | — | `ls .5em`／`indent .5em`、色 `--idle-title` |
| `.intro__line` | 歡迎來到「感應光寓」。我們將以你在上個空間留下的資訊，為你打造專屬的居家體驗。準備好了嗎？體驗即將開始。 | `clamp(22px, 3.6vh, 44px)` | 500 | `ls .04em`、`line-height 1.6`、`max-width 24ch` |
| `.intro__count` | 3／2／1 | `clamp(160px, 36vh, 420px)` | 700 | `--font-display`、色 `--idle-title` |
| `.intro__dim` | 倒數時的全螢幕遮罩 | — | — | `rgba(2,6,16,.55)`，0.35s 淡入 |

倒數出現時間：**7.2s / 8.4s / 9.6s，10.8s 收**。同一段文字也送 TTS（目前語音關閉，見 §11-2）。
倒數數字底光：`0 22px 55px` + `0 42px 100px` 的主色外暈（光從下方往外散）。
聲紋波形顏色 = `var(--idle-title)`。

> ⚠ **這一頁已不在主流程**（主流程是刷邀請卡直接進資訊牆），按 `i`／`Enter` 才會播。
> 也**不會自動續播**：倒數收掉後畫面停在前言，等展務員按 `n`。
> （`Intro.jsx` 註解提到的 `INTRO_MS = 11000` 已不存在於 `App.jsx`。）

### 4-4 AI 聲紋（`Voiceprint`，前言與結語共用）

48 根長條，高度 `clamp(120px, 22vh, 260px)`，寬度 `min(1000px, 84vw)`。
播 mp3 配音檔時用 Web Audio `AnalyserNode`（`fftSize 256`、`smoothing .75`）**讀真實頻譜**
驅動條高；沒音檔時退回擬真正弦動畫。用 `requestAnimationFrame` 直接寫 `transform`，不走 framer。
單根材質：`linear-gradient(to top, 30% 透明 → 實色)` + `0 0 14px` 同色外光暈。

### 4-5 等待邀請卡 `card`（**目前流程進不到這一頁**）

| 元素 | 文字 | 字級 | 字重 | 字距 |
|---|---|---|---|---|
| `.prompt__eyebrow` | 感應光寓 · SENSING RESIDENCE | `clamp(13px, 1.7vh, 20px)` | — | `ls .44em`／`indent .44em` |
| `.prompt__title` | 打開邀請卡，放上感應區 | `clamp(32px, 5.2vh, 64px)` | 700 | `ls .06em`、`line-height 1.15` |
| `.prompt__sub` | 同步這間房子的即時健康資訊 | `clamp(16px, 2.3vh, 28px)` | — | `ls .04em`、`max-width 32ch` |

中央為感應目標環 `SensorRing`：直徑 `clamp(240px, 36vh, 400px)`，外環＋內環＋
`conic-gradient` 掃描（4s 一圈，用環形 mask 只留 38–50% 半徑）＋三層外擴脈衝（2.6s，錯開 0.86s）。

### 4-6 等待角色 `character`

| 元素 | 文字 | 字級 | 字重 | 字距 |
|---|---|---|---|---|
| `.prompt__eyebrow` | 你的痛點，寶舖有解方 | `clamp(13px, 1.7vh, 20px)` | — | `ls .44em` |
| `.prompt__title--top` | 選一個情境鑰匙圈，放上感應區 | `clamp(32px, 5.2vh, 64px)` | 700 | `ls .06em` |
| `.persona-list__no` | 01／02／03／04／05 | `clamp(16px, 2.4vh, 28px)` | 700 | `--font-hud`、`rgba(255,255,255,.72)` |
| `.persona-list__q` | 見下表「引導問句」 | `clamp(20px, 3vh, 38px)` | 500 | `ls .03em`、白色 |
| `.persona-list__name` | 見下表「短名」 | `clamp(14px, 1.9vh, 22px)` | — | `--font-display`、`ls .18em`、`rgba(255,255,255,.78)` |
| `.prompt__sub--bottom` | 房子會調整光、空氣、溫濕度與聲音來照顧你 | `clamp(16px, 2.3vh, 28px)` | — | `ls .04em` |

**材質（白版改過）**：五列不再是「透明底 + 彩色外框」，改成與 1-5 一致的**平塗色塊 + 白字**：
底色 = 該角色 `accent` 混 20% 暖灰 `#4a4a30`（與 `fillColor()` 同一套算法），`border: 0`，
圓角 16px，逐列 stagger 0.09s 滑入。

| # | 引導問句 | 短名 | accent |
|---|---|---|---|
| 01 | 成年人逆齡衰老？ | 生理逆齡 | `#7394a5` |
| 02 | 提高兒童免疫力？ | 原生健康 | `#8ba78d` |
| 03 | 老年的安全守護？ | 安全守護 | `#c47f75` |
| 04 | 孕婦的安心休養？ | 極致純淨 | `#c5b192` |
| 05 | 高效的在宅工作？ | 數位遊牧 | `#3a446f` |

### 4-7 結語 `outro`

| 元素 | 文字 | 字級 | 字重 | 字距 |
|---|---|---|---|---|
| `.outro__eyebrow` | 結語 · OUTRO | `clamp(13px, 1.7vh, 19px)` | — | `ls .5em` |
| `.outro__line` | 房子的健康，就是你的健康 | `clamp(34px, 6vh, 76px)` | 700 | `ls .06em`、`0 0 40px` 主色光暈 |
| `.outro__sub` | 房子的健康，我有解方　·　請往下個展區體驗 | `clamp(12px, 1.8vh, 20px)` | — | `ls .24em`、色 `--idle-title` |

TTS 全文：「房子的健康，就是你的健康。房子的健康，我有解方。請往下個展區體驗。」

### 4-8 感應成功漣漪 / 角落狀態列

- `ConfirmRipple`：雙環外擴（`scale .4 → 1.8`，1s，第二環延遲 0.12s）+ 打勾 `scale 0 → 1.15 → 1`
  （1.4s）。顏色 = 該角色 accent（邀請卡則用 `--accent-2`）
- `.statusdot` — `--font-hud` `12px`、`ls .16em`、`opacity .5`，位置 `bottom 20px / right 24px`。
  連線文字：`連線中`（WS 未連）／`讀卡機就緒`／`等待讀卡機`；後面接 phase 中文標籤（見 §3-1）

---

## 5. 房屋即時健康資訊牆 `house`

6 欄 × 4 列 bento grid，內距 `clamp(10px, 1.4vw, 22px)`、間隙 `clamp(8px, 1vw, 16px)`。

### 5-1 格位與文字

| 格位（欄／列） | 面板 | 文字 |
|---|---|---|
| 1-2／1-2 | 標題卡 `.bento-hero` | eyebrow「寶舖 Sensor · 數位孿生平台」＋大標「這間房子的／即時健康資訊」 |
| 3／1 | 室內 PM2.5 | `8 µg/m³` |
| 4／1 | 室外 PM2.5 | `42 µg/m³` |
| 5-6／1-2 | **影片格** | 樣品屋影片循環播放，疊字「你的未來居家」／`Walkthrough`；**維持 16:9** |
| 3／2 | CO₂ | `620 ppm` |
| 4／2 | 室內溫度 | `26.2 °C` |
| 1-2／3-4 | 天氣預報 | 大字「多雲時晴」＋`28 °C` |
| 3／3-4 | 聲學環境 | `38 dBA` |
| 4／3 | 相對濕度 | `58 %` |
| 4／4 | 照度 | `420 lux` |
| 5-6／3-4 | 宣言卡 `.bento-claim` | eyebrow「12-in-1 Sensor · 24/7」＋大標「房子的健康／就是你的健康」＋註腳「選一個情境鑰匙圈，看寶舖怎麼解」 |

數字全部 count-up 進場。資料源目前是 `src/houseInfo.js` 的 mock baseline，接寶舖 Sensor 後替換。

> 這一格（5-6／1-2）原本規劃是 three.js 3D 房子，現況是**影片格**（`VideoTile`）。見附錄 A-2。

### 5-1b 前導語音與自動推進

進到這一頁時同時播 **B 區前導語音**（cue `lead` → `public/voice/lead.mp3`），
播完自動進入「五種情境選項」那一頁。三段保險（`HouseInfoBento.jsx`）：

| 情況 | 行為 |
|---|---|
| 配音檔正常播完 | `onEnd` → 立刻進情境選項頁 |
| 沒有配音檔／語音關閉／自動播放被擋 | `onFail` → 改用 `LEAD_FALLBACK_MS = 20000`（停留 20 秒） |
| 有音檔但 `ended` 事件沒來 | `LEAD_MAX_MS = 120000` 兜底，不會整場卡在這一頁 |

展務員按 `n` 隨時可提前跳。離開這一頁時 `cancelSpeech()` 一定會停掉語音。
語音關閉時 TTS 退路唸的字幕：「這是這間房子的即時健康資訊。房子的健康，就是你的健康。」
（正式配音文字以客戶錄音檔為準。）

### 5-2 牆面與面板材質（白版生效值）

| 部位 | 值 |
|---|---|
| 牆底 | `radial-gradient(120% 90% at 50% 4%, rgba(255,255,255,.9) → 透明 46%)` ＋ `linear-gradient(158deg, #ffffff, #eef5ff 45%, #dce9fb)` |
| 一般面板 | 底 `#ffffff`、字 `#17357a`、圓角 `clamp(14px, 1.4vw, 26px)`、**無邊框／無投影／無 text-shadow** |
| 標題卡 · 宣言卡 | 底 `#a2d0f8`（`--panel-fill` 覆寫），其餘同上 |
| 影片格 | `.tile--ink` 深藍玻璃底（實際被滿格影片蓋住），底部 scrim `linear-gradient(to top, rgba(6,14,30,.62) → 透明 52%)` 讓白字讀得清楚 |
| 進場 | 每格 `opacity 0 → 1`、`y 26 → 0`、`scale .985 → 1`，0.55s，逐格 delay 0.05–0.5s |

**上色方式（編輯模式 `E`）**：10 格各有 `#rrggbb` 輸入框，即打即套（會混 20% 暖灰
`fillColor()`），清空或按「無」回到面板預設；存 `localStorage.bentoColors`。
**現場定案是全部留空** → 全部吃白版的白底。

### 5-3 光邊格 `.tile--beam`

主視覺那道光的「邊」。白版把漸層從面板**內部搬到外面**：

```
面板本身        background: #ffffff（或 #a2d0f8）
邊框            clamp(1px, 0.085vw, 1.8px) solid  color-mix(--beam-glow 85%, #fff) ≈ #4d9dfc
外圈 ::after    inset: -clamp(3px, .32vw, 6px)、圓角 clamp(17px, 1.72vw, 32px)、z-index: -1
                linear-gradient(168deg, --beam-glow 72% → --beam-inner 44% 16%
                                → 透明 44–58% → --beam-inner 42% 85% → --beam-glow 64%)
                filter: blur(clamp(3px, .36vw, 7px))
                （父層 overflow 改 visible，否則外圈會被切掉）
```

深色底版則相反：漸層鋪在面板**內部**（兩端青 46% → 中央 `rgba(20,44,96,.10)`）＋白銳邊
＋`inset 0 0 clamp(26px, 3vw, 60px)` 青色向內衰減。青色由
`--rim-hue = color-mix(--beam-glow 55%, #2ee6ff)` 推出。**純漸層，不加雜訊。**

**現場定案（`BENTO_BEAM_DEFAULT`，2026-09-07 匯出固化）**：8 個數據格全開光邊
（室內外 PM2.5、CO₂、溫度、天氣、聲學、濕度、照度），標題卡與宣言卡不開。
現場覆寫存 `localStorage.bentoBeam`。與色碼平塗互斥（開了光邊就不吃 inline 平塗色）。

### 5-4 字級（`.bento` 專屬覆寫，約為基礎字級的 75%）

| class | 用途 | 字級 | 字重 | 行高 |
|---|---|---|---|---|
| `.t-num`／`.t-num--sm` | L1 大數字 | `clamp(30px, 4.5vw, 87px)` | 400 | 0.9 |
| `.t-label--lg` | L2 標題 | `clamp(17px, 2.33vw, 37px)` | 500 | 1.14 |
| `.t-label` | L3 內文 | `clamp(11px, 1.35vw, 21px)` | 400 | 1.3 |
| `.t-eyebrow`／`.t-foot` | L4 小標 | `clamp(9px, 1.05vw, 16px)` | 600 | — |
| `.t-unit` | 單位 | `0.32em`（跟著數字縮放） | 700 | — |

宣言卡 `.bento-claim` 例外，維持較大字級：`.t-label--lg` `clamp(23px, 3.1vw, 50px)`、
`.t-label` `clamp(15px, 1.8vw, 28px)`、eyebrow／foot `clamp(12px, 1.4vw, 21px)`。

字距：`.t-label--lg`／`.t-label`／`.t-eyebrow`／`.t-foot` 一律 `letter-spacing .1em`；
大數字維持 `-0.03em` 緊排並開 `font-variant-numeric: tabular-nums`。標題列一律頂端對齊。

---

## 6. 情境解方牆 `scene`／`loop`（1-5）

三欄版面，以「當前維度」為主時鐘（節拍見 §3-4）。

| 欄 | 內容 | flex |
|---|---|---|
| **左** | 當前維度的 3 張相關卡（大數字／對比長條／視覺化），整欄 reel 上捲換頁 | `1.15 / 0.95 / 0.9` |
| **中** | 影像卡（16:9，固定不動）＋ 全健築指數 | — |
| **右** | 痛點卡（上，高度 `--hero-h`）＋ 解方論述（下，reel 換頁） | — |

底部另有 footer（`--foot-h: clamp(34px, 4vh, 62px)`），三欄下方讓出這段高度。

### 6-0 情境語音

刷下某張情境鑰匙圈時，同時播該情境的配音（cue `scene-<persona id>` →
`public/voice/scene-<id>.mp3`，五個情境各一段）。`SceneBento` 換情境時**不 remount**，
所以語音掛在 `[persona.id]` 的 effect 上：先 `cancelSpeech()` 停掉上一段，再播這一段；
離開情境牆（進結語／重置）也會停掉。語音關閉時 TTS 退路唸「<情境名>。<一句話>。」。

### 6-1 中欄影像卡（**每情境一張照片**）

`VideoTile` 帶 `photo` prop：`persona.photo` 有值就放該情境照片，缺省退回導覽影片。
key 帶 `persona.id` → 換情境時重掛載，照片才會跟著換。

| 情境 | 照片 |
|---|---|
| 居家抗老 | `public/scene/anti-aging.jpg` |
| 兒童免疫 | `public/scene/child.jpg` |
| 在宅樂齡 | `public/scene/elder.jpg` |
| 孕婦照護 | **未設** → 退回 `public/video/house-tour.mp4` |
| 數位遊牧 | `public/scene/nomad.jpg` |

卡片固定 `aspect-ratio: 16/9`，高度由欄寬推導 → **要改影片格大小是拖左/中、中/右的欄寬**，不是拖高度。
字幕在情境牆縮一級：`b` `clamp(12px, 1.1vw, 19px)`、`span` `clamp(8px, .62vw, 11px)`／`ls .1em`。

### 6-2 牆面背景（編輯模式可切三段，`glass.bg`）

| 值 | 說明 |
|---|---|
| **`key`（預設）** | 主視覺原圖 `public/bg/anlb-key.jpg` 當**亮度遮罩**（`mask-mode: luminance`），上面鋪一層 `color-mix(--scene-accent 58%, #fff)`、`opacity .8`。原圖是深藍底＋亮光束 → 亮的光束變不透明吃主色、深藍底變透明 → **白底 + 主色光束，整張圖不出現任何深色**。牆底 `linear-gradient(180deg, #fff 0%, #fff 62%, #fafcff)`（帶藍灰的底會跟主色光束疊成濁色） |
| `white` | 全白 `#ffffff` |
| `video` | 樣品屋影片鋪滿整牆：`object-fit: cover` + `blur(2px) saturate(1.06)` + `scale(1.04)`（放大是為了蓋掉模糊的邊），上面疊可調濃度的柔光層 `--scene-bg-wash`。刻意**不帶 persona key** → 換情境不重掛載，影片連續播不跳回第 0 秒 |

遮罩層 inset 用 `calc(-1 * clamp(10px, 1.4vw, 22px))` 抵掉 `.scene-cols` 的 padding，才是真滿版。

### 6-3 面板樣式（`glass.panel`）

**`flat`（預設）— 平塗色塊**

```
基礎        background: rgba(255,255,255,0.13)、color: #ffffff、border: 0、box-shadow: none
六塊上色    color-mix(in srgb, var(--fill-*) 72%, transparent)   ← 留 28% 讓背後的光透出來
backdrop-filter: none                ← 關鍵：模糊會把背後那道主色光糊成均勻的暈
::before 玻璃高光關掉
圓角        clamp(16px, 1.7vw, 30px)
```

**`glass` — 淺色玻璃（opt-in）**：四層疊出厚玻璃

| 層 | 內容 |
|---|---|
| 底 | `--tile-fill`（= `glassFill()`，見 §7-3），預設 `rgba(255,255,255,.52)` |
| 顆粒 | 內嵌 SVG `feTurbulence`（`baseFrequency .85`、3 octaves、opacity .22）以 `background-blend-mode: overlay` 疊上 —— **大面積半透明漸層在 TV 上會走色帶，這層是必要的** |
| 霧化 | `backdrop-filter: blur(--glass-blur) saturate(1.6) brightness(1.03)` |
| 斜掠高光 `::before` | `linear-gradient(125deg, .58 → .13 → 0 → .09 → .26)`，強度乘 `--glass-gloss` |
| 漸層描邊 `::after` | `padding: 1px` + `mask-composite: exclude` 只留 1px 外圈；`z-index: 3` 壓在內容之上（滿格照片會蓋掉描邊） |
| 立體 | `inset 0 1px 1px` 受光 + `inset 0 -1px 1px` 背光 + `inset 0 0 26px` 內散射 + `0 2px 6px` / `0 16px 40px` 外影 |

玻璃模式下字色整組翻成 `#17357a`（次要 `.70` 透明度），長條／區間軌道底色從 `currentColor`
改成 `rgba(23,53,122,.13)`。

> ⚠ 取捨：`backdrop-filter` 必然會把背後那道主色光糊掉。要看清楚那道光就留 `flat`。

**邊緣折射（`glass.refract`，只在 `glass` 模式下有效）**

| 值 | 實作 | 成本 |
|---|---|---|
| **`off`（預設）** | 只有模糊玻璃 | 最低 |
| `warp` | 自寫 SVG 濾鏡：`feTurbulence(.006 .011, 2 octaves)` → `feGaussianBlur(1.6)` → `feDisplacementMap(scale 16, R→X, G→Y)`，串進 `backdrop-filter`。低頻擾動、**尺寸無關**，不必 per-panel 貼圖 | 中 |
| `real` | `src/vendor/liquid-glass.js`（MIT, © 2026 Deepika Rao，原檔未修改）：每面板一張對應尺寸的位移圖 + 三通道色散。用 `MutationObserver` 追 DOM 生滅補掛／`destroy`（卡片每 5 秒換頁，不清會積 `<filter>` 與 canvas） | 最高 |

`backdrop-filter: url(#…)` **只有 Chromium 支援**（Safari 會自動只剩模糊）。kiosk 跑 Chrome 全螢幕，可用。

### 6-4 底部字標 `.scene-foot`

情境頁也帶展區識別：左側字標「**感應光寓**」（Chiron Hei HK 500、`clamp(13px, 1.5vh, 24px)`、
`ls .16em`、色 `--idle-title`）＋「SENSING RESIDENCE」（Barlow Semi Condensed 200、
`clamp(9px, 1.05vh, 16px)`、`ls .32em`、色 `--idle-sub`）；中央 ANLB 商標（同一張 PNG 遮罩，
情境頁塗**純白**，高度 62%、`aspect-ratio 227/46`）。進場 0.8s 淡入上移，delay 0.5s。

### 6-5 字級（`.scene-cols` 覆寫後的生效值）

| class | 用途 | 字級 | 字重 | 其他 |
|---|---|---|---|---|
| `.hero__label` | 右上主標＝當頁情境名 | `clamp(18px, 2vw, 34px)` | 700 | 白色、`ls .08em`、`line-height 1.2` |
| `.hero__short` | 主標下的痛點短句 | `clamp(12px, 1.4vw, 21px)` | 600 | `rgba(255,255,255,.78)`、`ls .06em` |
| `.hero__q` | 痛點一句話 | `clamp(19px, 2.2vw, 38px)` | 500 | `line-height 1.34` |
| `.stat__num` | L1 大數字 | `clamp(40px, 6vw, 116px)` | 500 | `line-height .84`、`ls -.03em`、`tabular-nums` |
| `.narr__head` | L2 解方標題 | `clamp(23px, 3.1vw, 50px)` | 500 | `line-height 1.16` |
| `.range__value` | L2 區間數值 | `clamp(23px, 3.1vw, 50px)` | 500 | `small` 為 `0.42em` |
| `.cbar__val` | L2 長條數值 | `clamp(23px, 3.1vw, 50px)` | 500 | — |
| `.stat__num--long` | L2 長字串數字（如 2200–6500） | `clamp(23px, 3.1vw, 50px)` | 500 | 不換行 |
| `.narr__detail` | L3 解方長句 | `clamp(15px, 1.8vw, 28px)` | 400 | `line-height 1.55`、72% 不透明 |
| `.viz__labels`／`.cbar__label`／`.chart__title` | L3 刻度／標籤 | `clamp(15px, 1.8vw, 28px)` | 400 | — |
| `.t-eyebrow` | L4 維度標籤（① 光照 等） | `clamp(12px, 1.4vw, 21px)` | 600 | 大寫、`opacity .7` |
| `.t-foot` | L4 註腳 | `clamp(12px, 1.4vw, 21px)` | 600 | — |
| `.stat__unit` | 單位 | `0.3em` | 700 | `opacity .66` |

次要文字（eyebrow／foot／解方長句／刻度／長條標籤）統一 `rgba(255,255,255,.78)`，
**不換色只降透明度**。各卡頂列一律頂端對齊 → 每格標題離框頂等距。

### 6-6 卡片內的視覺元件

| 元件 | 材質 |
|---|---|
| 色溫色帶 `.swatch__bar` | 情境牆用**暖色譜** `linear-gradient(90deg, #f4a04a → #f7c96b → #ecdf8c → #cfe08a → #b7d977)`，高 `clamp(40px, 7vh, 100px)`、圓角 12px |
| 對比長條 `.cbar` | 軌道 `currentColor 16%`、一般填色 `currentColor 38%`、**高亮填色 = `--scene-accent-2`**，全圓角 |
| 舒適區間 `.range` | 軌道 `currentColor 16%`、舒適區塊與游標 = `--scene-accent-2`，游標 6px 寬 + 同色外光暈 |
| 聲景波形 `.wave` | 22 根靜態長條（`0.25 + abs(sin(i×0.7)) × 0.7`），色 = `--scene-accent-2` 85%。**刻意靜態**：捲軸內放無限動畫會卡住 AnimatePresence 的 exit |
| 圖示 | `stat__ico` `clamp(36px, 4vw, 68px)`、`viz__ico` `clamp(36px, 3.8vw, 68px)`、`narr__ico` `clamp(32px, 3.2vw, 58px)`；角色圖標 `hero__icon` `clamp(46px, 5.6vw, 104px)` |

角色圖標來自單張 sprite `public/icons/personas.png`（2051×173），每個 icon 的邊界是用 canvas
掃 alpha 通道實測出來的，換算成 CSS `background-size`／`background-position`。

### 6-7 固定文字

| 位置 | 文字 |
|---|---|
| 全健築指數卡 | eyebrow「全健築指數」、單位 `/100`、註腳「WELL Building Standard」 |
| 色溫色帶卡 | eyebrow「① 動態色溫」、刻度「暖 2200K」「冷 6500K」、註腳「晝夜節律照明」 |
| PM2.5 對比卡 | eyebrow「② 室外 vs 室內 PM2.5」、長條「室外 42」「室內（該情境值，高亮）」、max 50 |
| 體感區間卡 | eyebrow「③ 體感舒適區間」、刻度 `18–30°C`、舒適區 `22–26`、數值後綴「舒適」 |
| 噪音對比卡 | eyebrow「④ 噪音對比」、長條「一般住宅 65」「全健築（該情境值，高亮）」、max 80 |
| 聲景卡 | eyebrow「④ 聲景類型」、註腳＝該情境聲景名 |
| 影像卡 | 「你的未來居家」／`Walkthrough` |
| 解方卡 eyebrow | 「① 光照解方」「② 空氣解方」「③ 溫濕度解方」「④ 聲音解方」 |

### 6-8 維度中繼資料

| 維度 | 中文 | 英文 | 序號 | tint |
|---|---|---|---|---|
| light | 光照 | LIGHT | ① | `#f5c451` |
| air | 空氣 | AIR | ② | `#5ec4b6` |
| temp | 溫濕度 | THERMAL | ③ | `#5a9bd8` |
| sound | 聲音 | SOUND | ④ | `#b48fd8` |

> 序號與中文標籤會出現在 eyebrow；**tint 目前沒有畫面在用**（見附錄 A-4）。

### 6-9 五情境 × 四維度全文案

#### ① 居家抗老 `anti-aging`

Anti-aging prevention · 生理逆齡 · 成年人 — 抗衰老 · 全健築指數 94

- 一句話：校正晝夜節律，啟動深層修復
- 痛點 L1：成年人逆齡衰老
- 痛點 L2：熬夜、壓力與老化，怎麼讓身體回到修復狀態？
- 痛點 L3（桌面端用，TV 不顯示）：長期晚睡與壓力讓晝夜節律紊亂、氧化壓力升高，睡眠品質變差、修復不足，身體與外貌都加速老化。

| 維度 | 標題 | 論述 | 數值 |
|---|---|---|---|
| 光照 | 晝夜節律照明 | 模擬日光週期，白天冷白喚醒、入夜暖光助眠，校正生理時鐘 | 2200–6500 K（動態色溫）／800 lux（日間照度） |
| 空氣 | 抗氧化純淨空氣 | 負離子淨化 + 高效過濾，降低氧化壓力，延緩細胞老化 | 5 µg/m³（PM2.5）／580 ppm（CO₂） |
| 溫濕度 | 深層修復溫區 | 微涼恆溫促進夜間修復與生長激素分泌 | 24.0 °C（室溫）／50 %（相對濕度） |
| 聲音 | 深層修復聲景 | 低頻 Delta 波背景音，引導深睡與細胞再生 | 35 dBA（背景噪音）· 聲景 Delta Wave |

#### ② 兒童免疫 `child`

Child Safety · 原生健康 · 兒童 — 提高免疫力 · 全健築指數 92

- 一句話：保護發育中的肺部與視力
- 痛點 L1：提高兒童免疫力
- 痛點 L2：怎麼保護發育中的孩子，少生病、長得好？
- 痛點 L3：兒童發育中的肺部與視力脆弱，容易受空汙與藍光傷害；抵抗力弱、易過敏生病，睡眠也常被干擾而影響發育。

| 維度 | 標題 | 論述 | 數值 |
|---|---|---|---|
| 光照 | 護眼全光譜 | 高顯色全光譜 + 無藍光危害，保護發育中的視力 | 500 lux（學習照度）／4000 K（中性白） |
| 空氣 | 醫療級潔淨肺保護 | HEPA 三重過濾，守護發育中的肺部與免疫系統 | 3 µg/m³（PM2.5）／0.05 mg/m³（TVOC） |
| 溫濕度 | 舒適防敏溫濕 | 溫和恆濕抑制塵蟎與過敏原，呵護敏感體質 | 25.0 °C／55 % |
| 聲音 | 低噪安睡環境 | 柔和自然白噪音遮蔽干擾，穩定睡眠週期 | 32 dBA · 聲景 White Noise |

#### ③ 在宅樂齡 `elder`

Aging Well at Home · 安全守護 · 老人 — 在宅終老 · 全健築指數 88

- 一句話：補償視覺退化，預防意外與跌倒
- 痛點 L1：老年安全守護
- 痛點 L2：怎麼讓長輩在家安全、安心地終老？
- 痛點 L3：長者視覺退化、夜間容易跌倒；慢性病讓血壓波動與失溫風險升高，緊急狀況也常無人即時察覺。

| 維度 | 標題 | 論述 | 數值 |
|---|---|---|---|
| 光照 | 高照度視覺補償 | 提高照度補償視覺退化，夜間動作感應地燈預防跌倒 | 750 lux（活動照度）／3000 K（暖白光） |
| 空氣 | 安全守護監測 | 持續監測空氣與燃氣，異常即時警示守護長者 | 8 µg/m³（PM2.5）／650 ppm（CO₂） |
| 溫濕度 | 防失溫恆溫區 | 偏暖恆溫避免血壓波動與失溫風險 | 26.0 °C／50 % |
| 聲音 | 清晰安靜聲學 | 提升語音清晰度，緊急警報音可被即時辨識 | 40 dBA · 聲景 Clear Speech |

#### ④ 孕婦照護 `pregnancy`

Maternity Care · 極致純淨 · 孕婦 — 在家休養 · 全健築指數 96

- 一句話：零毒害微環境，緩解身心壓力
- 痛點 L1：孕婦安心休養
- 痛點 L2：怎麼給孕媽咪一個零毒害、能好好休養的家？
- 痛點 L3：孕期對甲醛等毒害極度敏感、擔心影響胎兒；身心壓力大、睡眠不安，體感也容易不適。

| 維度 | 標題 | 論述 | 數值 |
|---|---|---|---|
| 光照 | 柔和無頻閃照明 | 無頻閃柔光降低眼壓與焦慮，營造安心休養氛圍 | 300 lux（休養照度）／2700 K（暖光） |
| 空氣 | 零毒害微環境 | 醫療級過濾 + 零甲醛，為母嬰打造純淨呼吸 | 3 µg/m³（PM2.5）／0.03 mg/m³（甲醛） |
| 溫濕度 | 舒適安養溫濕 | 恆溫恆濕緩解孕期不適，維持體感舒適 | 25.0 °C／55 % |
| 聲音 | 極靜療癒聲景 | 近乎無聲的環境輔以海浪胎教音，緩解身心壓力 | 30 dBA · 聲景 Ocean Calm |

#### ⑤ 數位遊牧 `nomad`

Digital Nomad · 數位遊牧 · 高效 — 在家辦公 · 全健築指數 90

- 一句話：啟動認知潛能，維持深層專注
- 痛點 L1：高效在家工作
- 痛點 L2：在家怎麼維持專注，不被環境拖累效率？
- 痛點 L3：在家工作容易分心、午後倦怠；CO₂ 累積讓頭腦昏沉、決策力下降，環境噪音也干擾深度工作。

| 維度 | 標題 | 論述 | 數值 |
|---|---|---|---|
| 光照 | 專注抗疲勞照明 | 高照度中性白提升警覺與專注，抑制午後倦怠 | 750 lux（工作照度）／4500 K（日光白） |
| 空氣 | 清醒新風換氣 | 持續新風維持低 CO₂，保持頭腦清醒與決策力 | 6 µg/m³（PM2.5）／700 ppm（CO₂） |
| 溫濕度 | 提神工作溫區 | 微涼乾爽抑制睏意，維持長時間高效專注 | 23.0 °C／45 % |
| 聲音 | 專注遮蔽聲場 | Pink Noise 遮蔽環境干擾，鞏固深層工作狀態 | 45 dBA · 聲景 Pink Noise |

---

## 7. 情境牆配色

### 7-1 五情境 CI 色

| 情境 | 主色 accent | 參考配色 A（accent2） | 參考配色 B（accent3） | 情境卡完整 palette |
|---|---|---|---|---|
| 居家抗老 | `#7394a5` | `#fa864d` | `#17ab54` | `#7394a5` `#b6dbe6` `#fa864d` `#02cdab` `#17ab54` |
| 兒童免疫 | `#8ba78d` | `#e04b64` | `#549a60` | `#8ba78d` `#e04b64` `#cfd785` `#549a60` `#4b9af7` |
| 在宅樂齡 | `#c47f75` | `#bfd71b` | `#f96224` | `#c47f75` `#f96224` `#bfd71b` `#1a4527` `#eff7d6` |
| 孕婦照護 | `#c5b192` | `#628e6b` | `#5040ee` | `#c3b192` `#628e6b` `#c0e797` `#5040ee` `#5f0004` |
| 數位遊牧 | `#3a446f` | `#7cc8f0` | `#3cb3a7` | `#3a446f` `#d5bead` `#b19857` `#3cb3a7` `#7cc8f0` |

`accent` 同時決定牆面背景光束的顏色（`--scene-accent`）。
`accent2`／`accent3` 只在 `SCENE_DEFAULTS` 沒有該情境時當退路。

### 7-2 七格定案色（`SCENE_DEFAULTS`，2026-09-07 現場挑定並匯出固化）

定案值寫在 [`src/sceneColorStore.js`](../src/sceneColorStore.js) —— **隨程式碼走**，換電腦、
清 localStorage、重新 clone 都一樣。編輯模式（`E`）挑的色只存在該台瀏覽器的
`localStorage.sceneColors`，是現場微調用的暫時覆寫；挑完要固化就按面板的「複製 CSS」。

| 面板（slot） | 居家抗老 | 兒童免疫 | 在宅樂齡 | 孕婦照護 | 數位遊牧 |
|---|---|---|---|---|---|
| `data` 數據強調（長條/區間/波形） | `#b6dbe6` | `#4b9af7` | `#eff7d6` | `#628e6b` | `#d5bead` |
| `pain` 痛點卡 · 右上 | `#7394a5` | `#8ba78d` | `#c47f75` | `#c3b192` | `#3a446f` |
| `solution` 解方卡 · 右下 | `#b6dbe6` | `#cfd785` | `#eff7d6` | `#628e6b` | `#d5bead` |
| `score` 全健築指數 · 中欄 | `#b6dbe6` | `#549a60` | `#eff7d6` | `#628e6b` | `#d5bead` |
| `l1` 左欄第 1 張 | `#fa864d` | `#cfd785` | `#bfd71b` | `#5040ee` | `#b19857` |
| `l2` 左欄第 2 張 | `#17ab54` | `#4b9af7` | `#f96224` | `#5f0004` | `#3cb3a7` |
| `l3` 左欄第 3 張 | `#7394a5` | `#cfd785` | `#c47f75` | `#c0e797` | `#3a446f` |

### 7-3 色彩管線

```
情境卡 palette
  └ slotColor(persona, slot)                     ← SCENE_DEFAULTS + 現場覆寫
       ├ fillColor()   混 20% 暖灰 #4a4a30        → --fill-*    （flat 模式）
       │    └ CSS 再取 72% alpha                  ← 讓背後那道光透出來
       └ glassFill()   混 62% 白 + --glass-alpha  → --glass-*   （glass 模式）
                       沒選色的面板再乘 0.84 透明度
  └ slotColor(persona,'data') → --scene-accent-2 （數據強調，不混色、原值直用）
```

`fillColor()` 混暖灰的原因：參考色原值亮度偏高，白字會糊。
`glassFill()` 混白的原因：原值飽和度高，直接當半透明膜會把背景壓成濁色。

**混色後的實際平塗值**（flat 模式，未計 72% alpha）：

| 面板 | 居家抗老 | 兒童免疫 | 在宅樂齡 | 孕婦照護 | 數位遊牧 |
|---|---|---|---|---|---|
| 數據強調 | `#a0bec2` | `#4b8acf` | `#ced4b5` | `#5d805f` | `#b9a794` |
| 痛點卡 · 右上 | `#6b858e` | `#7e947a` | `#ac7467` | `#ab9c7e` | `#3d4562` |
| 解方卡 · 右下 | `#a0bec2` | `#b4bb74` | `#ced4b5` | `#5d805f` | `#b9a794` |
| 全健築指數 · 中欄 | `#a0bec2` | `#528a56` | `#ced4b5` | `#5d805f` | `#b9a794` |
| 左欄第 1 張 | `#d77a47` | `#b4bb74` | `#a8bb1f` | `#4f42c8` | `#9c884f` |
| 左欄第 2 張 | `#21984d` | `#4b8acf` | `#d65d26` | `#5b0f0d` | `#3f9e8f` |
| 左欄第 3 張 | `#6b858e` | `#b4bb74` | `#ac7467` | `#a8c882` | `#3d4562` |

（數據強調欄不經 `fillColor()`，該欄列出的是給參考的混色結果；實際畫面用的是原值。）

### 7-4 玻璃質感參數（`GLASS_DEFAULT`，五個情境共用一組）

```
alpha   0.48    面板不透明度（越低背景越清楚）
wash    0       背景柔光（越低影片越清楚）
blur    0       玻璃霧化（0 = 完全清透）
gloss   0.5     光澤（0 = 完全平面）
refract 'off'   邊緣折射
bg      'key'   牆面背景
panel   'flat'  面板樣式
```

**預設值 = 現有視覺**：玻璃／影片背景／折射全都是 opt-in，不切就完全不影響現況。

---

## 8. 版面比例（編輯模式拖曳結果，已固化為預設值）

### 8-1 情境牆

共用底版 `LAYOUT_DEFAULT`：

```
colL  0.92     左欄 flex
colM  1.251    中欄 flex
colR  1.179    右欄 flex
heroH 58       右欄痛點卡高度（% 欄高）
```

**每情境覆寫 `SCENE_LAYOUTS`**（2026-09-07 固化）—— 換角色即換版面，展演中也生效：

| 情境 | colL | colM | colR | heroH |
|---|---|---|---|---|
| 居家抗老 `anti-aging` | 0.62 | 1.063 | 1.069 | 46 |
| 兒童免疫 `child` | 0.91 | 1.36 | 1.08 | 34 |
| 在宅樂齡 `elder` | 0.86 | 1.287 | 1.203 | 58 |
| 孕婦照護 `pregnancy` | 0.82 | 1.35 | 1.18 | 40 |
| 數位遊牧 `nomad` | 0.969 | 1.381 | 1 | 28 |

疊法：共用底版 → 程式碼固化的該情境版面 → `localStorage.sceneLayoutByPersona`。
拖分隔線／拉滑桿時**只寫進當前情境**，不會動到其他四個。

### 8-2 房屋資訊牆

```
bentoCols  [0.873, 0.467, 0.947, 0.878, 1.553, 1.282]
bentoRows  [1, 0.904, 1.096, 1]
```

欄寬經等比重分配，讓影片格（欄 5-6 × 列 1-2）維持 **16:9**（1920×1080 下實測 852×479，誤差 0.01%）。
這一組是五個情境共用的（不分 persona）。

### 8-3 待機頁光束幾何（`src/beamStore.js`）

```
p0 (5.83, 95.59)    尾（左下）
p1 (64.43, 67.64)   中（曲線實際通過此點）
p2 (99.29, -2.28)   頭（右上）
w0 28   尾寬（px @1920）
w1 9    中寬
w2 7    頭寬
glow 0.75  上緣光暈倍率
edge 0.95  下緣收邊倍率
```

尾粗頭細，光束由左下往右上收。

---

## 9. 動效清單

| 動效 | 實作 | 時間 |
|---|---|---|
| 換頁 | 單一 keyed 畫面 `opacity 0 → 1` | 0.5s |
| 整牆進場 | 各卡 `y 22 → 0`、`scale .97 → 1`，錯開 delay 0.08 / 0.14 / 0.16 / 0.2 / 0.26 / 0.5 | 0.6s |
| 換維度 | reel 整頁 `y 100% → 0`，舊頁 `→ -100%` | 0.8s |
| 資訊牆磚 | `y 26 → 0`、`scale .985 → 1`，逐格 delay 0.05–0.5s | 0.55s |
| 數字 count-up | `useCountUp` rAF + easeOutCubic，支援小數，target 變更自動補間 | 1.1–1.3s |
| 折線圖 | `pathLength 0 → 1` 描繪 + 面積淡入（delay 0.5）+ 資料點逐一彈出 | 1.3s |
| 甜甜圈 | 各段 stagger 0.16s、圖例 stagger 0.12s，`currentColor` 不同濃淡 | — |
| AI 聲紋 | rAF 直寫 `transform`，真實頻譜或擬真正弦 | 連續 |
| 感應成功 | 雙環外擴 + 打勾 scale | 1.0 / 1.4s |
| 感應目標環 | `conic-gradient` 掃描 + 三層脈衝（錯開 0.86s） | 4s / 2.6s |
| 待機呼吸 | halo `scale 1↔1.08`、提示文字 `opacity .35↔.85` | 6s / 3s |
| 牆面換色 | `.scene-cols` background `transition 0.8s` | 0.8s |

全站唯一緩動：`cubic-bezier(0.16, 1, 0.3, 1)`。

**禁區**：捲軸（reel）內不放 `repeat: Infinity` 動畫 —— 會讓 `AnimatePresence` 的 exit
永遠不 settle。所以聲景波形是靜態取樣值。

---

## 10. 操作

### 10-1 鍵盤

| 鍵 | 動作 | 廣播給 server？ |
|---|---|---|
| `i`／`Enter` | 開始（進前言） | ✓ |
| `n`／`→` | 下一步（前言 → 房屋資訊 → 選角色） | ✗（電視本機） |
| `o` | 播結語 | ✓ |
| `r`／`Esc` | 重置回待機 | ✓ |
| `c` | 模擬刷邀請卡 | ✓ |
| `1`–`5` | 模擬刷角色鑰匙圈（依 `PERSONA_ORDER`） | ✓ |
| `x`／`Space` | 模擬拿起 tag | ✓ |
| `e` | 開／關編輯模式 | — |

在編輯面板的輸入框裡打字時，流程快捷鍵自動停用。

### 10-2 編輯模式（`E`）

面板可拖曳，內容**依當前頁面自動切換**：

| 頁面 | 可編輯項目 |
|---|---|
| 待機頁 | 光束三造型點（直接拖畫面上的 尾·中·頭）、頭中尾寬度與上下緣倍率、11 個顏色（色票 + hex + HSL 滑桿） |
| 情境頁 1-5 | **牆面背景**（主視覺光束／全白／情境影片）· **面板樣式**（平塗色塊／淺色玻璃）· 玻璃四參數 · **折射**（關／擾動／真折射）· 7 個面板的參考配色色票 · 欄寬列高滑桿 + 畫面上可拖的藍色分隔線 · 「套到全部情境」「還原此情境」 |
| 房屋資訊牆 | 10 格的色碼輸入 + 逐格光邊開關 + 可拖的藍色格線調欄寬列高 |
| 共用 | 「複製 CSS」「重設」 |

「複製 CSS」一次輸出 6 段可直接貼回原始碼的定案值：

```
:root                → src/style.css
BEAM_DEFAULT         → src/beamStore.js
LAYOUT_DEFAULT       → src/layoutStore.js
SCENE_LAYOUTS        → src/layoutStore.js（每情境版面）
GLASS_DEFAULT        → src/sceneColorStore.js（玻璃質感）
SCENE_DEFAULTS       → src/sceneColorStore.js（1-5 各格顏色）
（有調過才附）bentoColors / bentoBeam
```

### 10-3 localStorage 一覽

| key | 內容 | 對應固化位置 |
|---|---|---|
| `idleStyleTuner-white` | 待機頁 11 色（含主題簽章，CSS 換主題就自動作廢） | `style.css` 的 `:root` |
| `idleBeamGeo` | 光束幾何 | `beamStore.js` `BEAM_DEFAULT` |
| `sceneLayout` | 共用底版 + 資訊牆格線 | `layoutStore.js` `LAYOUT_DEFAULT` |
| `sceneLayoutByPersona` | 每情境版面覆寫 | `layoutStore.js` `SCENE_LAYOUTS` |
| `sceneColors` | 情境牆七格選色 | `sceneColorStore.js` `SCENE_DEFAULTS` |
| `sceneGlass` | 牆面背景／面板樣式／折射／玻璃四參數 | `sceneColorStore.js` `GLASS_DEFAULT` |
| `bentoColors` | 資訊牆 10 格色碼 | （尚未固化，現場全空） |
| `bentoBeam` | 資訊牆逐格光邊 | `sceneColorStore.js` `BENTO_BEAM_DEFAULT` |

> localStorage 只跟著那台瀏覽器走。要換機器也一樣，必須按「複製 CSS」貼回原始碼。

---

## 11. 素材與執行環境

### 11-1 素材

| 路徑 | 用途 | 現況 |
|---|---|---|
| `public/bg/anlb-key.jpg` | 情境牆背景光束的亮度遮罩 | 324 KB |
| `public/video/house-tour.mp4` | 資訊牆影片格 + 情境牆影片背景 + 孕婦情境退路 | 1280×720 / 7s / 1.9 MB |
| `public/scene/*.jpg` | 情境牆中欄照片（4 張，1366 寬 / q80） | anti-aging 182K · child 269K · elder 120K · nomad 244K |
| `public/icons/anlb.png` | ANLB 商標（只當 alpha 遮罩） | 227:46 |
| `public/icons/personas.png` | 五個角色圖標 sprite | 2051×173 |
| `public/hdr/studio.hdr` | 3D 房子的 HDRI | **目前無畫面使用** |
| `public/house.glb` | 3D 房子模型 | **不存在** |
| `public/voice/lead.mp3` | **B 區前導語音**（主流程，資訊牆播） | **不存在** |
| `public/voice/scene-<id>.mp3` | **五個情境語音**（`anti-aging`／`child`／`elder`／`pregnancy`／`nomad`） | **不存在** |
| `public/voice/intro.mp3`／`outro.mp3` | 前言頁（手動）／結語配音 | **不存在** |

素材路徑一律走 `src/assetUrl.js` 的 `asset()`：執行期用 `document.baseURI` 解成絕對 URL。
（直接用 `import.meta.env.BASE_URL` 塞進 CSS `url()` 時，瀏覽器會拿樣式表位置 `/assets/`
當基準 → 子路徑部署會 404，遮罩載不到的元素會整個不顯示。）

### 11-2 語音

八個 cue 全部接好了（`src/speech.js` 的 `VOICE_FILES`），路徑走 `asset()` 解成絕對 URL：

| cue | 檔案 | 何時播 |
|---|---|---|
| `lead` | `voice/lead.mp3` | **主流程**：刷邀請卡後在資訊牆播，播完自動進情境選項 |
| `scene-anti-aging` | `voice/scene-anti-aging.mp3` | 刷居家抗老鑰匙圈 |
| `scene-child` | `voice/scene-child.mp3` | 刷兒童免疫鑰匙圈 |
| `scene-elder` | `voice/scene-elder.mp3` | 刷在宅樂齡鑰匙圈 |
| `scene-pregnancy` | `voice/scene-pregnancy.mp3` | 刷孕婦照護鑰匙圈 |
| `scene-nomad` | `voice/scene-nomad.mp3` | 刷數位遊牧鑰匙圈 |
| `intro` | `voice/intro.mp3` | 前言頁（手動 `i`，不在主流程） |
| `outro` | `voice/outro.mp3` | 結語 |

`SPEECH.ENABLED` 目前仍是 **`false`** → 全部靜音，只有字幕 + 擬真聲紋，流程照跑
（資訊牆走 20 秒退路）。**配音檔到位後把 `ENABLED` 改成 `true` 就會播**，不必再改別的地方。

`speak(text, { cue, onEnd, onFail })`：`onEnd` 只有**音檔自然播完**才觸發；語音關閉、
檔案 404、自動播放被擋都走 `onFail`（呼叫端改用固定秒數）。瀏覽器 TTS 沒有可靠的結束事件，
一律當 `onFail`。

### 11-3 執行環境

- dev / preview server 固定 `5274`（`strictPort: true`，避免撞 F 區 5173-5175 與 B 桌面 5273）
- NFC 讀卡機 WebSocket：`ws://localhost:8788`（`VITE_WS_URL` 可覆寫）
- 多頁 build：`index.html`（kiosk 主顯示）+ `camera-tool.html`（3D 機位設定工具）
- 子路徑部署用 `--base=./`；push `main` 自動建置上 GitHub Pages
- kiosk 跑 Chrome 全螢幕（`b-livingroom\啟動.bat` 一鍵起整區）

---

## 附錄 A · 現況與文件／README 的落差

掃描時發現、**尚未處理**的項目，記錄在這裡以免下次又被誤導：

**A-1 `card` 畫面目前無法進入。**
reducer 裡沒有任何一條會把 phase 設成 `'card'`：刷邀請卡直接跳 `house`，前言按 `n` 也是直接到
`house`。`PlacePrompt kind="card"`（「打開邀請卡，放上感應區」+ 感應目標環）與 `PHASE_LABEL.card`
都還在，只是接不到。README 的流程圖 `intro → card → house` 是舊的。

**A-2 three.js 已無畫面在用。**
`HouseInfoBento.jsx` 仍 `import HouseCanvas`，但那格早就換成 `VideoTile`；情境牆中欄也換成
情境照片。`src/bento/HouseCanvas.jsx`（646 行）與 `houseLighting.js` 目前是死碼，
`public/house.glb` 也不存在。套件本身還不能移除 —— `camera-tool.html`（機位設定工具）還在用。
README 仍寫「牆裡右上那格是 three.js 的 3D 房子，燈光隨情境即時變化」。

**A-3 十色輪轉 `tile--<color>` 在兩面牆都不生效。**
`.tile--yellow` 這類 class 只設 `--b-tint`，而 `.scene-cols .tile` 與
`.bento .tile:not(.tile--ink)` 都直接覆寫了 `background`（權重較高）。
→ 情境牆顏色實際只由 `SCENE_DEFAULTS` 的七格決定；資訊牆則全部是白版的白底 + 光邊。
`SceneBento.jsx` 裡的 `COLORS` 輪轉、`DIM_COLOR` 都只影響 class 名稱，沒有視覺效果。

**A-4 `SceneBento.jsx` 有一批宣告後沒用到的變數**：
`tint`、`badge`、`label`、`color`、`SPIN_MS`、`TREND`、`SAVE`、`COMFORT`、`SAT`，
以及 `CardFace` 的 `line` / `donut` 兩個分支（`dimCards()` 不會產生這兩種卡）。
CSS 的 `.viz__hi { color: var(--dv) }` 也沒有任何地方設過 `--dv`。

**A-5 舊版元件仍在庫裡但沒被 `App.jsx` 引用**：
`components/Scene.jsx`、`SceneLoop.jsx`、`DimensionVisual.jsx`、`HouseInfo.jsx`
（`style.css` 中對應的 `.scene` / `.dim` / `.viz-*` / `.loop` / `.house__*` 約 200 行樣式也一併留著）。

**A-6 資料仍是 mock**：`houseInfo.js` 的 8 筆是 OTA120 v6 範例值，`jitter()` 目前直接
`return value`（不抖動）。接寶舖 Sensor / WELLTEK REST/WS 後替換。
`scenes.js` 的 setpoint 以寶舖數據表為準（見 zone md §未決點）。

**A-7 孕婦照護沒有情境照片** → 中欄退回導覽影片。其餘四個情境都有。
