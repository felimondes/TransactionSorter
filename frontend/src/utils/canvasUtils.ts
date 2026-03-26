export const NODE_W = 180
export const NODE_H_TX = 60
export const NODE_H_BUCKET = 120
export const DRAG_MOVE_THRESHOLD = 3
export const HOLD_DELAY_MS = 80

export function formatDay(dateStr: string): string {
  if (!dateStr) return '?'
  try {
    const d = new Date(dateStr)
    if (!Number.isNaN(d.getTime())) return String(d.getDate()).padStart(2, '0')
  } catch {}
  const m = dateStr.match(/(\d{1,2})-(\d{1,2})-(\d{4})/)
  if (m) return m[1].padStart(2, '0')
  return dateStr.slice(0, 2)
}

export function formatAmount(v: number): string {
  if (v == null || Number.isNaN(v)) return '-'
  return (v >= 0 ? '' : '-') + Math.abs(v).toFixed(2)
}

export function clientToCanvasCoords(
  canvasRef: HTMLDivElement | null,
  clientX: number,
  clientY: number,
  zoom: number
) {
  if (!canvasRef) return { x: 0, y: 0 }
  const rect = canvasRef.getBoundingClientRect()
  const x = (clientX - rect.left) / Math.max(0.0001, zoom) + (canvasRef.scrollLeft || 0)
  const y = (clientY - rect.top) / Math.max(0.0001, zoom) + (canvasRef.scrollTop || 0)
  return { x, y }
}

