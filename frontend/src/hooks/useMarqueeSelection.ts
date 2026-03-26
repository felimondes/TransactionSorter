/**
 * Hook for managing marquee selection
 * Handles marquee rectangle creation and node selection
 */

import { useEffect } from 'react'
import { Pos, MarqueeRect } from '../types/common'
import { convertClientToCanvasCoords } from '../utils/dragUtils'
import { selectNodesInMarquee } from '../utils/marqueeUtils'
import * as api from '../services/api'

interface UseMarqueeSelectionProps {
  canvasRef: React.MutableRefObject<HTMLDivElement | null>
  isSelectingRef: React.MutableRefObject<boolean>
  startPointRef: React.MutableRefObject<Pos | null>
  zoom: number
  transactions: api.Transaction[]
  txPositions: Record<number, Pos>
  buckets: api.Bucket[]
  bucketPositions: Record<number, Pos>
  setMarquee: (m: MarqueeRect | null) => void
  setSelectedTxMap: (map: Record<number, boolean>) => void
  setSelectedBucketMap: (map: Record<number, boolean>) => void
  setSuggestions: (s: Record<number, any>) => void
  setLastHoveredId: (id: number | null) => void
}

export function useMarqueeSelection({
  canvasRef,
  isSelectingRef,
  startPointRef,
  zoom,
  transactions,
  txPositions,
  buckets,
  bucketPositions,
  setMarquee,
  setSelectedTxMap,
  setSelectedBucketMap,
  setSuggestions,
  setLastHoveredId,
}: UseMarqueeSelectionProps) {
  const startMarqueeSelection = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return
    const cRect = canvasRef.current.getBoundingClientRect()
    const x = (clientX - cRect.left) / Math.max(0.0001, zoom) + (canvasRef.current.scrollLeft || 0)
    const y = (clientY - cRect.top) / Math.max(0.0001, zoom) + (canvasRef.current.scrollTop || 0)
    startPointRef.current = { x, y }
    isSelectingRef.current = true
    document.body.style.userSelect = 'none'
  }

  const finishMarqueeSelection = (clientX: number, clientY: number) => {
    if (!isSelectingRef.current || !startPointRef.current || !canvasRef.current) return

    isSelectingRef.current = false
    const cRect = canvasRef.current.getBoundingClientRect()
    const x = (clientX - cRect.left) / Math.max(0.0001, zoom) + (canvasRef.current.scrollLeft || 0)
    const y = (clientY - cRect.top) / Math.max(0.0001, zoom) + (canvasRef.current.scrollTop || 0)
    const sp = startPointRef.current
    const left = Math.min(sp.x, x)
    const top = Math.min(sp.y, y)
    const w = Math.abs(x - sp.x)
    const h = Math.abs(y - sp.y)
    setMarquee(null)
    startPointRef.current = null
    document.body.style.userSelect = ''

    if (w > 0 && h > 0) {
      const marqueeRect: MarqueeRect = { x: left, y: top, w, h }
      const { selectedTx, selectedBuckets } = selectNodesInMarquee(
        marqueeRect,
        transactions,
        txPositions,
        buckets,
        bucketPositions
      )
      setSelectedTxMap(selectedTx)
      setSelectedBucketMap(selectedBuckets)
      setSuggestions({})
      setLastHoveredId(null)
    }
  }

  return { startMarqueeSelection, finishMarqueeSelection }
}

