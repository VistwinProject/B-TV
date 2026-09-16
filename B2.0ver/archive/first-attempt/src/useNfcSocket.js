import { useCallback, useEffect, useRef } from 'react'

// ── B 區 TV ↔ NFC WebSocket ──────────────────────────────────────────────────
// 與 B-Table / F 區 vibenfc 同協議(path A:直接連 NFC server,前端自行從原始
// 事件推導畫面狀態)。server 廣播:reader-connected / reader-disconnected /
// tag-present(data.id / data.kind = 'card'|'character' / data.label)/ tag-remove。
// 另接受 'reset' 作為展務員 override(8788 server 待擴充;見 zone md 現況協議)。
//
// 埠口固定 8788 — 展覽同網域,F 區占 8787。只在特殊佈署(遠端 daemon)用
// VITE_WS_URL 覆寫。
const WS_URL       = import.meta.env.VITE_WS_URL || 'ws://localhost:8788'
const RECONNECT_MS = 3000
// 2.0 is isolated by default. Opt in explicitly when connecting exhibition hardware.
const HARDWARE_ENABLED = import.meta.env.VITE_NFC_ENABLED === 'true'
  || new URLSearchParams(window.location.search).get('hardware') === '1'

// onMessage 收到 server 原始訊息物件(已 JSON.parse)。
// onStatus 收到 'connecting' | 'connected' | 'disconnected'。
// 回傳 send(obj):把訊息送進 8788 server(dev 注入,讓鍵盤模擬廣播給桌面 + 電視)。
// 回傳 true=已送出、false=未連線(呼叫端可 fallback 成本機處理)。
export function useNfcSocket(onMessage, onStatus) {
  const msgRef    = useRef(onMessage)
  const statusRef = useRef(onStatus)
  const wsRef     = useRef(null)
  msgRef.current    = onMessage
  statusRef.current = onStatus

  useEffect(() => {
    if (!HARDWARE_ENABLED) { statusRef.current?.('local'); return }
    let alive = true
    let timer = null

    const connect = () => {
      statusRef.current?.('connecting')
      let ws
      try { ws = new WebSocket(WS_URL) } catch {
        statusRef.current?.('disconnected')
        timer = setTimeout(connect, RECONNECT_MS)
        return
      }
      wsRef.current = ws
      ws.onopen = () => {
        if (!alive) return
        statusRef.current?.('connected')
        clearTimeout(timer)
      }
      ws.onmessage = ({ data }) => {
        if (!alive) return
        try {
          const message = JSON.parse(data)
          if (message && typeof message.type === 'string') msgRef.current?.(message)
        } catch { /* ignore malformed */ }
      }
      ws.onclose = () => {
        if (!alive) return
        statusRef.current?.('disconnected')
        timer = setTimeout(connect, RECONNECT_MS)
      }
      ws.onerror = () => ws.close()
    }

    connect()
    return () => { alive = false; clearTimeout(timer); wsRef.current?.close() }
  }, [])

  const send = useCallback((obj) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify(obj)); return true } catch { return false }
    }
    return false
  }, [])

  return { send }
}
