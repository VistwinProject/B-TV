export const DIMENSION_MS = 5000
export const OUTRO_MS = 9000
export const CONFIRM_MS = 1800
export const LEAD_FALLBACK_MS = 20000
export const LEAD_MAX_MS = 120000

export function scenePosition(elapsedMs, dimensionCount = 4) {
  const beat = Math.max(0, Math.floor(elapsedMs / DIMENSION_MS))
  return { beat, dim: beat % dimensionCount, completed: beat >= dimensionCount }
}
