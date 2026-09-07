感應光寓 · TV 主顯示 — UI 規格書
================================

> B 區 TV kiosk（`VistwinProject/B-TV`）目前線上狀態的完整介面清單：**所有文字、字體、字級**，
> 附配色 token、版面比例與操作快捷鍵。
>
> - 目標螢幕：橫式大尺寸 TV，所有尺寸用 `clamp(最小, vw/vh, 最大)` 自適應（下表一律照原樣列出）
> - 這份文件是**現況記錄**，不是設計提案；改了程式碼請同步更新這裡

---

## 1. 字體

### 1-1 本地字檔（`src/fonts/`，隨 build 打包）

| 字族 | 字重 | 檔案 | 用途 |
|---|---|---|---|
| `TASA Orbiter` | 400–800（變體字） | `TASAOrbiter-VariableFont_wght.ttf` | 拉丁字母與**所有數字**（主要數字字體） |
| `GlowSans TC` | 300 Light | `GlowSansTC-Condensed-Light.otf` | 中文窄體（字寬 ≈ 0.9） |
| `GlowSans TC` | 400 Regular | `GlowSansTC-Condensed-Regular.otf` | 中文窄體 |
| `GlowSans TC` | 500 Medium | `GlowSansTC-Condensed-Medium.otf` | 中文窄體 |
| `GlowSans TC` | 700 Bold | `GlowSansTC-Condensed-Bold.otf` | 中文窄體 |

授權：TASA Orbiter 為 SIL OFL，授權文字隨檔附於 `public/fonts/TASAOrbiter-OFL.txt`。

### 1-2 Google Fonts（`index.html` 連結載入）

```
Barlow Condensed        wght 200;300
Barlow Semi Condensed   wght 200;300
Chiron Hei HK           wght 400;500;700
JetBrains Mono          wght 400;500;700
Space Grotesk           wght 400;500;600;700
```

### 1-3 字體堆疊變數

| 變數 | 內容 | 用在哪 |
|---|---|---|
| `--font-cjk` | `'TASA Orbiter', 'GlowSans TC', 'Chiron Hei HK', sans-serif` | `body` 預設、內文 |
| `--font-display` | `'TASA Orbiter', 'GlowSans TC', 'Space Grotesk', sans-serif` | 大數字、角色名 |
| `--font-hud` | `'TASA Orbiter', 'GlowSans TC', 'JetBrains Mono', monospace` | eyebrow、單位、狀態列、編輯面板 |
| `--b-num`（bento） | `'TASA Orbiter', 'GlowSans TC', 'Helvetica Neue', 'Arial', sans-serif` | 資訊牆／情境牆的所有字 |

**例外**：待機頁大標不用 GlowSans（窄體會壓成 0.9 字寬），改用 `Chiron Hei HK` 讓字身回到 1:1；
英文副標用 `Barlow Semi Condensed` 200 走細長筆畫。

---

## 2. 流程與各頁文字

八個 phase，導覽人員以鍵盤或 NFC 推進。

| phase | 畫面 | 狀態列顯示 |
|---|---|---|
| `idle` | 待機頁（感應光寓） | 待機 |
| `intro` | 前言（AI 聲紋） | 前言 |
| `card` | 等待邀請卡 | 等待邀請卡 |
| `house` | 房屋即時健康資訊牆 | 房屋資訊 |
| `character` | 等待角色鑰匙圈 | 等待角色 |
| `scene` | 情境解方牆（1-5） | 解方展演 |
| `loop` | 情境體驗（同上循環） | 情境體驗 |
| `outro` | 結語 | 結語 |

### 2-1 待機頁 `idle`

| 元素 | 文字 | 字體 | 字級 | 字重 | 字距 | 顏色 |
|---|---|---|---|---|---|---|
| `.idle__title` | 感應光寓 | Chiron Hei HK | `clamp(56px, 12vh, 150px)` | 500 | `letter-spacing .16em`／`text-indent .16em` | `--idle-title` `#7ac3ff` |
| `.idle__sub` | SENSING RESIDENCE | Barlow Semi Condensed | `clamp(18px, 2.7vh, 34px)` | 200 | `ls .62em`／`indent .62em`／`word-spacing 1.92em` | `--idle-sub` `#7ac3ff` |
| `.idle__hint` | 請入座，將邀請卡放上感應區 | `--font-cjk` | `clamp(15px, 2.2vh, 26px)` | 繼承 | `ls 1.061em`／`indent 1.061em` | `--idle-hint` `#7ac3ff` |
| `.idle__logo` | ANLB inside 商標（PNG alpha 當遮罩，顏色由 CSS 148° 漸層決定） | — | — | — | — | `#7ac3ff` 色系漸層 |

三行的 `letter-spacing`／`word-spacing` 是**反推算出來的**，目的是讓大標、英文副標、提示三行的
左右墨水邊界在 1280 與 1920 兩種寬度下都完全切齊；`text-indent` 補償尾端字距，置中才不會左偏半格。

大標陰影：四層深藍模糊，上緣淡、往下逐層加重擴散（`0 -3px 14px` → `0 22px 48px`），不加光暈。

### 2-2 前言 `intro`

| 元素 | 文字 | 字級 | 字重 | 字距 |
|---|---|---|---|---|
| `.intro__eyebrow` | AI 聲紋 · VOICEPRINT | `clamp(13px, 1.7vh, 19px)` | — | `ls .5em`／`indent .5em` |
| `.intro__line` | 歡迎來到「感應光寓」。我們將以你在上個空間留下的資訊，為你打造專屬的居家體驗。準備好了嗎？體驗即將開始。 | `clamp(22px, 3.6vh, 44px)` | 500 | `ls .04em`、`line-height 1.6`、`max-width 24ch` |
| `.intro__count` | 3／2／1 | `clamp(160px, 36vh, 420px)` | 700 | `--font-display`，色 `--idle-title` |

同一段文字也送 TTS。倒數出現時間：7.2s／8.4s／9.6s，10.8s 收；整段 `INTRO_MS = 11000`。
聲紋波形顏色 = `var(--idle-title)`。

### 2-3 等待邀請卡 `card`

| 元素 | 文字 | 字級 | 字重 | 字距 |
|---|---|---|---|---|
| `.prompt__eyebrow` | 感應光寓 · SENSING RESIDENCE | `clamp(13px, 1.7vh, 20px)` | — | `ls .44em`／`indent .44em` |
| `.prompt__title` | 打開邀請卡，放上感應區 | `clamp(32px, 5.2vh, 64px)` | 700 | `ls .06em`、`line-height 1.15` |
| `.prompt__sub` | 同步這間房子的即時健康資訊 | `clamp(16px, 2.3vh, 28px)` | — | `ls .04em`、`max-width 32ch` |

### 2-4 等待角色 `character`

| 元素 | 文字 | 字級 | 字重 | 字距 |
|---|---|---|---|---|
| `.prompt__eyebrow` | 你的痛點，寶舖有解方 | `clamp(13px, 1.7vh, 20px)` | — | `ls .44em` |
| `.prompt__title--top` | 選一個情境鑰匙圈，放上感應區 | `clamp(32px, 5.2vh, 64px)` | 700 | `ls .06em` |
| `.persona-list__no` | 01／02／03／04／05 | `clamp(16px, 2.4vh, 28px)` | 700 | `--font-hud`，色 = 該角色 accent |
| `.persona-list__q` | 見下表「引導問句」 | `clamp(20px, 3vh, 38px)` | 500 | `ls .03em` |
| `.persona-list__name` | 見下表「短名」 | `clamp(14px, 1.9vh, 22px)` | — | `--font-display`、`ls .18em` |
| `.prompt__sub--bottom` | 房子會調整光、空氣、溫濕度與聲音來照顧你 | `clamp(16px, 2.3vh, 28px)` | — | `ls .04em` |

五筆清單內容：

| # | 引導問句 | 短名 | accent |
|---|---|---|---|
| 01 | 成年人逆齡衰老？ | 生理逆齡 | `#7394a5` |
| 02 | 提高兒童免疫力？ | 原生健康 | `#8ba78d` |
| 03 | 老年的安全守護？ | 安全守護 | `#c47f75` |
| 04 | 孕婦的安心休養？ | 極致純淨 | `#c5b192` |
| 05 | 高效的在宅工作？ | 數位遊牧 | `#3a446f` |

### 2-5 結語 `outro`

| 元素 | 文字 | 字級 | 字重 | 字距 |
|---|---|---|---|---|
| `.outro__eyebrow` | 結語 · OUTRO | `clamp(13px, 1.7vh, 19px)` | — | `ls .5em` |
| `.outro__line` | 房子的健康，就是你的健康 | `clamp(34px, 6vh, 76px)` | 700 | `ls .06em` |
| `.outro__sub` | 房子的健康，我有解方　·　請往下個展區體驗 | `clamp(12px, 1.8vh, 20px)` | — | `ls .24em`，色 `--idle-title` |

TTS 全文：「房子的健康，就是你的健康。房子的健康，我有解方。請往下個展區體驗。」

### 2-6 角落狀態列（給展務員，訪客近乎看不到）

`.statusdot` — `--font-hud` `12px`、`ls .16em`、`opacity .5`，位置 `bottom 20px / right 24px`。

連線文字：`連線中`（WS 未連）／`讀卡機就緒`／`等待讀卡機`；後面接 phase 中文標籤（見上表）。

---

## 3. 房屋即時健康資訊牆 `house`

6 欄 × 4 列 bento grid。面板為**平塗色塊**：半透明白底 `rgba(255,255,255,.13)`、白字、
圓角 `clamp(14px, 1.4vw, 26px)`，**無邊框、無光暈、無投影**，文字帶 `0 2px 10px rgba(2,8,22,.45)` 投影。

### 3-1 格位與文字

| 格位（欄／列） | 面板 | 文字 |
|---|---|---|
| 1-2／1-2 | 標題卡 | eyebrow「寶舖 Sensor · 數位孿生平台」＋大標「這間房子的／即時健康資訊」 |
| 3／1 | 室內 PM2.5 | `8 µg/m³` |
| 4／1 | 室外 PM2.5 | `42 µg/m³` |
| 5-6／1-2 | 影片格 | 影片循環播放，疊字「你的未來居家」／`Walkthrough`；**維持 16:9** |
| 3／2 | CO₂ | `620 ppm` |
| 4／2 | 室內溫度 | `26.2 °C` |
| 1-2／3-4 | 天氣預報 | 大字「多雲時晴」＋`28 °C` |
| 3／3-4 | 聲學環境 | `38 dBA` |
| 4／3 | 相對濕度 | `58 %` |
| 4／4 | 照度 | `420 lux` |
| 5-6／3-4 | 宣言卡 | eyebrow「12-in-1 Sensor · 24/7」＋大標「房子的健康／就是你的健康」＋註腳「選一個情境鑰匙圈，看寶舖怎麼解」 |

數字全部 count-up 進場。資料源目前是 `src/houseInfo.js` 的 mock baseline，接寶舖 Sensor 後替換。

### 3-2 字級（`.bento` 專屬覆寫，約為原始字級的 75%）

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
大數字維持 `-0.03em` 緊排並開 `font-variant-numeric: tabular-nums`。

### 3-3 兩種上色方式（編輯模式 `E`）

1. **直接輸入色碼** — 10 格各有 `#rrggbb` 輸入框，即打即套；清空或按「無」回到半透明。
   平塗時會混 20% 暖灰（`fillColor()`），避免參考色太亮讓白字糊掉。存 `localStorage.bentoColors`。
2. **光邊**（`.tile--beam`）— 主視覺那道光的邊：
   - 白邊 `clamp(1px, 0.085vw, 1.8px) solid rgba(244,253,255,.94)`
   - 168° 青色漸層，兩端 `--beam-inner` 46% → 中央深藍 `rgba(20,44,96,.10)`
   - 往內衰減 `inset 0 0 clamp(26px, 3vw, 60px)`（`--beam-inner` 62%）
   - 青色由 `--rim-hue = color-mix(--beam-glow 55%, #2ee6ff)` ≈ `rgb(97,219,255)`
   - 純漸層、**不加雜訊**；與色碼平塗互斥
   - 預設開在**八個數據格**（室內外 PM2.5、CO₂、溫度、天氣、聲學、濕度、照度）；
     標題卡與宣言卡不開。定案值在 `BENTO_BEAM_DEFAULT`，現場覆寫存 `localStorage.bentoBeam`

---

## 4. 情境解方牆 `scene`／`loop`（1-5）

三欄版面，以「當前維度」為主時鐘：`① 光照 → ② 空氣 → ③ 溫濕度 → ④ 聲音`，
每維度 5 秒（`BEAT_MS 5000 × BEATS_PER_DIM 1`），走完一輪進入 loop。

- **左欄**：當前維度的 3 張相關卡（大數字／對比長條／視覺化），flex `1.15 / 0.95 / 0.9`
- **中欄**：樣品屋影片 + 全健築指數
- **右欄**：痛點卡（上）+ 解方論述（下）

面板同為平塗色塊：`rgba(255,255,255,.13)`、白字、圓角 `clamp(16px, 1.7vw, 30px)`、
`backdrop-filter: blur(14px) saturate(1.05)`，無邊框無投影。

### 4-1 字級（`.scene-cols` 覆寫）

| class | 用途 | 字級 | 字重 | 其他 |
|---|---|---|---|---|
| `.hero__label` | 右上主標＝當頁情境名 | `clamp(18px, 2vw, 34px)` | 700 | 白色、`ls .08em`、`line-height 1.2` |
| `.hero__short` | 主標下的痛點短句 | `clamp(12px, 1.4vw, 21px)` | 600 | `rgba(255,255,255,.78)`、`ls .06em` |
| `.hero__q` | 痛點一句話 | `clamp(19px, 2.2vw, 38px)` | 500 | `line-height 1.34` |
| `.stat__num` | 大數字 | `clamp(40px, 6vw, 116px)` | 500 | `line-height .84`、`ls -.03em` |
| `.stat__num--long` | 長字串數字（如 2200–6500） | `clamp(23px, 3.1vw, 50px)` | 500 | 不換行 |
| `.stat__unit` | 單位 | `0.3em` | 700 | `opacity .66` |
| `.narr__head` | 解方標題 | `clamp(30px, 4.1vw, 66px)` | 700 | `ls .02em`、`line-height 1.16` |
| `.narr__detail` | 解方長句 | `clamp(18px, 1.95vw, 38px)` | — | `line-height 1.55`、72% 不透明 |
| `.t-eyebrow` | 維度標籤（① 光照 等） | `clamp(14px, 1.55vw, 26px)` | 700 | `ls .03em`、大寫、`opacity .7` |
| `.t-foot` | 註腳 | `clamp(12px, 1.4vw, 21px)` | 600 | — |
| `.chart__title` | 圖表標題 | `clamp(15px, 1.8vw, 28px)` | 400 | — |
| `.cbar__label` | 長條標籤 | `clamp(16px, 1.7vw, 28px)` | — | 不換行 |
| `.cbar__val` | 長條數值 | `clamp(24px, 2.8vw, 48px)` | 700 | — |
| `.range__value` | 區間數值 | `clamp(30px, 3.6vw, 60px)` | 700 | `small` 為 `0.42em` |
| `.viz__labels` | 刻度標籤 | `clamp(14px, 1.5vw, 24px)` | — | 55% 不透明 |

次要文字（eyebrow／foot／解方長句／刻度／長條標籤）統一 `rgba(255,255,255,.78)`，不換色只降透明度。

### 4-2 固定文字

| 位置 | 文字 |
|---|---|
| 全健築指數卡 | eyebrow「全健築指數」、單位 `/100`、註腳「WELL Building Standard」 |
| 色溫色帶卡 | eyebrow「① 動態色溫」、刻度「暖 2200K」「冷 6500K」、註腳「晝夜節律照明」 |
| PM2.5 對比卡 | eyebrow「② 室外 vs 室內 PM2.5」、長條「室外 42」「室內（該情境值，高亮）」 |
| 體感區間卡 | eyebrow「③ 體感舒適區間」、刻度 `18–30°C`、舒適區 `22–26`、數值後綴「舒適」 |
| 噪音對比卡 | eyebrow「④ 噪音對比」、長條「一般住宅 65」「全健築（該情境值，高亮）」 |
| 聲景卡 | eyebrow「④ 聲景類型」、註腳＝該情境聲景名 |
| WELL 甜甜圈卡 | eyebrow「WELL 五維健康」、圓心「WELL／balanced」 |
| 解方卡 eyebrow | 「① 光照解方」「② 空氣解方」「③ 溫濕度解方」「④ 聲音解方」 |
| 影片格 | 「你的未來居家」／`Walkthrough` |

### 4-3 維度中繼資料

| 維度 | 中文 | 英文 | 序號 | tint |
|---|---|---|---|---|
| light | 光照 | LIGHT | ① | `#f5c451` |
| air | 空氣 | AIR | ② | `#5ec4b6` |
| temp | 溫濕度 | THERMAL | ③ | `#5a9bd8` |
| sound | 聲音 | SOUND | ④ | `#b48fd8` |

### 4-4 五情境 × 四維度全文案

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

## 5. 配色

### 5-1 待機頁／同系列頁面（除 1-5 外全部共用）

| token | 值 | 用途 |
|---|---|---|
| `--idle-bg-1` | `#121263` | 底色漸層起點（左上） |
| `--idle-bg-2` | `#121c49` | 底色漸層中段 |
| `--idle-bg-3` | `#000019` | 底色漸層終點（右下，近黑） |
| `--idle-haze` | `#308acf` | 中央大範圍藍霧 |
| `--beam-core` | `#ffffff` | 光束核心 |
| `--beam-inner` | `#ade5ff` | 光束內暈 |
| `--beam-glow` | `#8ad2ff` | 光束中暈 |
| `--beam-edge` | `#2e9aff` | 光束外暈 |
| `--idle-title` | `#7ac3ff` | 大標（前言／結語文字與聲紋同色） |
| `--idle-sub` | `#7ac3ff` | 英文副標 |
| `--idle-hint` | `#7ac3ff` | 提示小標 |

底色為 `linear-gradient(150deg, bg-1 0%, bg-2 45%, bg-3 100%)`。

### 5-2 五情境 CI 色

| 情境 | 主色 accent | 參考配色 A（accent2） | 參考配色 B（accent3） | 情境卡完整 palette |
|---|---|---|---|---|
| 居家抗老 | `#7394a5` | `#fa864d` | `#17ab54` | `#7394a5` `#b6dbe6` `#fa864d` `#02cdab` `#17ab54` |
| 兒童免疫 | `#8ba78d` | `#e04b64` | `#549a60` | `#8ba78d` `#e04b64` `#cfd785` `#549a60` `#4b9af7` |
| 在宅樂齡 | `#c47f75` | `#bfd71b` | `#f96224` | `#c47f75` `#f96224` `#bfd71b` `#1a4527` `#eff7d6` |
| 孕婦照護 | `#c5b192` | `#628e6b` | `#5040ee` | `#c3b192` `#628e6b` `#c0e797` `#5040ee` `#5f0004` |
| 數位遊牧 | `#3a446f` | `#7cc8f0` | `#3cb3a7` | `#3a446f` `#d5bead` `#b19857` `#3cb3a7` `#7cc8f0` |

`accent2` 用於「數據強調」（高亮長條／舒適區間／聲景波形）與右欄兩張平塗；
`accent3` 用於左欄第二張平塗。編輯模式（`E`）可逐格從 palette 換色，存 `localStorage.sceneColors`。

### 5-3 情境牆 1-5 各格顏色（正式記錄）

定案值寫在 [`src/sceneColorStore.js`](../src/sceneColorStore.js) 的 `SCENE_DEFAULTS` —— **隨程式碼走**，
換電腦、清 localStorage、重新 clone 都一樣。編輯模式（`E`）挑的色只存在該台瀏覽器的
`localStorage.sceneColors`，是現場微調用的暫時覆寫；挑完要固化就按面板的「複製 CSS」，
它會輸出一份可以直接貼回原始碼的 `SCENE_DEFAULTS`。

下表為 2026-09-07 現場挑定並匯出固化的值（七格全部指定，沒有留白的格）：

| 面板 | 居家抗老 | 兒童免疫 | 在宅樂齡 | 孕婦照護 | 數位遊牧 |
|---|---|---|---|---|---|
| 數據強調（長條/區間/波形） | `#b6dbe6` | `#4b9af7` | `#eff7d6` | `#628e6b` | `#d5bead` |
| 痛點卡 · 右上 | `#7394a5` | `#8ba78d` | `#c47f75` | `#c3b192` | `#3a446f` |
| 解方卡 · 右下 | `#b6dbe6` | `#cfd785` | `#eff7d6` | `#628e6b` | `#d5bead` |
| 全健築指數 · 中欄 | `#b6dbe6` | `#549a60` | `#eff7d6` | `#628e6b` | `#d5bead` |
| 左欄第 1 張 | `#fa864d` | `#cfd785` | `#bfd71b` | `#5040ee` | `#b19857` |
| 左欄第 2 張 | `#17ab54` | `#4b9af7` | `#f96224` | `#5f0004` | `#3cb3a7` |
| 左欄第 3 張 | `#7394a5` | `#cfd785` | `#c47f75` | `#c0e797` | `#3a446f` |

上表是**參考色原值**。實際鋪在卡片上會再經過兩道：

1. `fillColor()` 混 20% 暖灰 `#4a4a30`（參考色原值亮度偏高，白字會糊）
2. 卡片再取 72% alpha（`color-mix(… 72%, transparent)`），讓背景的光透出來

混色後的實際平塗值（未計 alpha）：

| 面板 | 居家抗老 | 兒童免疫 | 在宅樂齡 | 孕婦照護 | 數位遊牧 |
|---|---|---|---|---|---|
| 數據強調 | `#a0bec2` | `#4b8acf` | `#ced4b5` | `#5d805f` | `#b9a794` |
| 痛點卡 · 右上 | `#6b858e` | `#7e947a` | `#ac7467` | `#ab9c7e` | `#3d4562` |
| 解方卡 · 右下 | `#a0bec2` | `#b4bb74` | `#ced4b5` | `#5d805f` | `#b9a794` |
| 全健築指數 · 中欄 | `#a0bec2` | `#528a56` | `#ced4b5` | `#5d805f` | `#b9a794` |
| 左欄第 1 張 | `#d77a47` | `#b4bb74` | `#a8bb1f` | `#4f42c8` | `#9c884f` |
| 左欄第 2 張 | `#21984d` | `#4b8acf` | `#d65d26` | `#5b0f0d` | `#3f9e8f` |
| 左欄第 3 張 | `#6b858e` | `#b4bb74` | `#ac7467` | `#a8c882` | `#3d4562` |

### 5-4 全域 token

| token | 值 |
|---|---|
| `--accent`／`--accent-2`／`--accent-deep` | `#2f7bff`／`#5b9dff`／`#1657d6` |
| `--c-bg`／`--c-text`／`--c-text-dim` | `#050d1f`／`#eaf1ff`／`#7f96bd` |
| `--good`／`--warn`／`--info`／`--down` | `#2f7bff`／`#f59e0b`／`#6f8ba0`／`#f43f5e` |
| `--ease` | `cubic-bezier(0.16, 1, 0.3, 1)` |

---

## 6. 版面比例（編輯模式拖曳結果，已固化為預設值）

### 6-1 情境牆

```
colL  0.92     左欄 flex
colM  1.251    中欄 flex
colR  1.179    右欄 flex
heroH 58       右欄痛點卡高度（% 欄高）
```

### 6-2 房屋資訊牆

```
bentoCols  [0.873, 0.467, 0.947, 0.878, 1.553, 1.282]
bentoRows  [1, 0.904, 1.096, 1]
```

欄寬經等比重分配，讓影片格（欄 5-6 × 列 1-2）維持 **16:9**（1920×1080 下實測 852×479，誤差 0.01%）。

### 6-3 待機頁光束幾何（`src/beamStore.js`）

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

尾粗頭細，光束由左下往右上收。以二次貝茲曲線繪製，控制點反推使曲線通過中點。

---

## 7. 操作

### 7-1 展務員鍵盤

| 鍵 | 動作 |
|---|---|
| `i`／`Enter` | 開始（進前言） |
| `n`／`→` | 下一步（前言 → 房屋資訊 → 選角色） |
| `o` | 播結語 |
| `r`／`Esc` | 重置回待機 |

### 7-2 無硬體開發模擬

| 鍵 | 動作 |
|---|---|
| `c` | 刷邀請卡 |
| `1`–`5` | 刷角色鑰匙圈（依 `PERSONA_ORDER`） |
| `x`／`Space` | 拿起卡片 |

### 7-3 編輯模式

按 `E` 開啟／關閉。面板可拖曳，內容依當前頁面切換：

- **待機頁**：光束三點與頭中尾寬度、11 個顏色欄位
- **情境頁 1-5**：7 個面板的參考配色選擇（色票，非自由調色）+ 欄寬列高滑桿
- **房屋資訊牆**：10 格的色碼輸入 + 光邊開關 + 拖曳格線調欄寬列高
- 共用：「複製 CSS」輸出 `:root`／`BEAM_DEFAULT`／`LAYOUT_DEFAULT`／已選配色，貼回原始碼固化；
  「重設」清空所有覆寫

所有調整即時生效並存 `localStorage`（`sceneColors`／`bentoColors`／`bentoBeam`／光束／版面）。
編輯模式輸入框內打字時，流程快捷鍵自動停用。

---

## 8. 執行環境

- dev server 固定 `5274`（`strictPort: true`，避免撞 F 區 5173-5175 與 B 桌面 5273）
- NFC 讀卡機 WebSocket：`ws://localhost:8788`
- 多頁 build：`index.html`（kiosk 主顯示）+ `camera-tool.html`（機位設定工具）
- 子路徑部署用 `--base=./`；執行期素材（影片／圖標）走 `import.meta.env.BASE_URL`
