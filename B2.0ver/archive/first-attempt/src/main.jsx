import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { applyLayout } from './layoutStore.js'
import './style.css'

// 佈展時用編輯模式(E)調過的欄位比例存在 localStorage,開站先套用
applyLayout()

// 不用 StrictMode:這是單頁 kiosk,且房子那格是 41MB 模型的 three.js renderer。
// StrictMode 的雙重掛載會建立兩個 WebGL context + 兩次重模型解析(浪費、且雙 canvas
// 互搶會造成畫面凍結),對 kiosk 無實益 → 關閉,單一掛載乾淨穩定。
createRoot(document.getElementById('root')).render(<App />)
