/**
 * Hook for managing drag and drop interactions
 * Handles single item drag, group drag, bucket hover detection
 */

import { useEffect } from 'react'
import { DraggingState, Pos } from '../types/common'
import { NODE_W, NODE_H_TX, NODE_H_BUCKET, DRAG_MOVE_THRESHOLD } from '../utils/canvasUtils'
import { convertClientToCanvasCoords, detectBucketCollision, getTransactionIdsInDrag, getBucketIdsInDrag } from '../utils/dragUtils'

interface UseDragAndDropProps {
  canvasRef: React.MutableRefObject<HTMLDivElement | null>
  draggingRef: React.MutableRefObject<DraggingState | null>
  nodeRefs: Record<string, HTMLElement | null>
  zoom: number
  txPositions: Record<number, Pos>
  bucketPositions: Record<number, Pos>
  selectedTxMap: Record<number, boolean>
  selectedBucketMap: Record<number, boolean>
  potentialClickRef: React.MutableRefObject<{ bucketId: number; startX: number; startY: number; time: number } | null>
  holdTimerRef: React.MutableRefObject<Record<number, any>>
  draggingInitiatedRef: React.MutableRefObject<boolean>
  isSelectingRef: React.MutableRefObject<boolean>
  startPointRef: React.MutableRefObject<Pos | null>
  setTxPositions: (updater: (p: Record<number, Pos>) => Record<number, Pos>) => void
  setBucketPositions: (updater: (p: Record<number, Pos>) => Record<number, Pos>) => void
  setHoverBucket: (bid: number | null) => void
  setSelectedTxMap: (map: Record<number, boolean>) => void
  setSelectedBucketMap: (map: Record<number, boolean>) => void
  setMarquee: (m: { x: number; y: number; w: number; h: number } | null) => void
  setSuggestions: (s: Record<number, any>) => void
  setLastHoveredId: (id: number | null) => void
  onDropInBucket?: (bucketId: number, txIds: number[]) => Promise<void>
}

export function useDragAndDrop({
  canvasRef,
  draggingRef,
  nodeRefs,
  zoom,
  txPositions,
  bucketPositions,
  selectedTxMap,
  selectedBucketMap,
  potentialClickRef,
  holdTimerRef,
  draggingInitiatedRef,
  isSelectingRef,
  startPointRef,
  setTxPositions,
  setBucketPositions,
  setHoverBucket,
  setSelectedTxMap,
  setSelectedBucketMap,
  setMarquee,
  setSuggestions,
  setLastHoveredId,
  onDropInBucket,
}: UseDragAndDropProps) {
  const handlePointerMove = (e: PointerEvent) => {
    const d = draggingRef.current
    if (!canvasRef.current) return

    // Handle bucket click candidate (differentiate between click and drag)
    if (potentialClickRef.current && !draggingInitiatedRef.current) {
      const cc = potentialClickRef.current
      const dx = Math.abs(e.clientX - cc.startX)
      const dy = Math.abs(e.clientY - cc.startY)
      if (dx > DRAG_MOVE_THRESHOLD || dy > DRAG_MOVE_THRESHOLD) {
        // Movement detected - start drag
        draggingInitiatedRef.current = true
        startNodeDragInternal('bucket', cc.bucketId, {
          button: 0,
          clientX: e.clientX,
          clientY: e.clientY,
        })
        potentialClickRef.current = null
        // Clear hold timer
        if (holdTimerRef.current[cc.bucketId]) {
          clearTimeout(holdTimerRef.current[cc.bucketId])
          delete holdTimerRef.current[cc.bucketId]
        }
      }
    }

    if (d) {
      // Unified drag handler for both single and group drag
      const cRect = canvasRef.current.getBoundingClientRect()
      const pointerCanvasX = (e.clientX - cRect.left) / Math.max(0.0001, zoom) + (canvasRef.current.scrollLeft || 0)
      const pointerCanvasY = (e.clientY - cRect.top) / Math.max(0.0001, zoom) + (canvasRef.current.scrollTop || 0)

      if (d.ids.length === 1) {
        // Single drag
        const id = d.ids[0]
        const newPos = {
          x: Math.max(0, Math.round(pointerCanvasX - (d.offsetX ?? 0))),
          y: Math.max(0, Math.round(pointerCanvasY - (d.offsetY ?? 0))),
        }

        if (d.idTypes[id] === 'bucket') {
          setBucketPositions(p => ({ ...p, [id]: newPos }))
        } else {
          setTxPositions(p => ({ ...p, [id]: newPos }))
        }
      } else {
        // Group drag - calculate delta and apply to all
        const startCanvasX = (d.startClientX - cRect.left) / Math.max(0.0001, zoom) + (canvasRef.current.scrollLeft || 0)
        const startCanvasY = (d.startClientY - cRect.top) / Math.max(0.0001, zoom) + (canvasRef.current.scrollTop || 0)

        const dx = pointerCanvasX - startCanvasX
        const dy = pointerCanvasY - startCanvasY

        const txUpdates: Record<number, Pos> = {}
        const bucketUpdates: Record<number, Pos> = {}

        // Check if we have both txs and buckets in this drag
        const hasTxs = d.ids.some(id => d.idTypes[id] === 'tx')
        const hasBuckets = d.ids.some(id => d.idTypes[id] === 'bucket')
        const hasMixed = hasTxs && hasBuckets

        d.ids.forEach(id => {
          const initial = d.initialPositions[id] || { x: 0, y: 0 }
          const newPos = { x: initial.x + dx, y: initial.y + dy }

          if (d.idTypes[id] === 'tx') {
            txUpdates[id] = newPos
          } else if (!hasMixed) {
            // Only move buckets if we DON'T have a mixed selection
            // If mixed, only transactions move (and buckets stay in place)
            bucketUpdates[id] = newPos
          }
        })

        if (Object.keys(txUpdates).length > 0) {
          setTxPositions(p => ({ ...p, ...txUpdates }))
        }
        if (Object.keys(bucketUpdates).length > 0) {
          setBucketPositions(p => ({ ...p, ...bucketUpdates }))
        }
      }

      // Bucket hover detection (only for tx/group drag)
      if (d.idTypes[d.ids[0]] === 'tx' || d.ids.some(id => d.idTypes[id] === 'tx')) {
        const found = detectBucketCollision(e.clientX, e.clientY, bucketPositions, nodeRefs)
        setHoverBucket(found)
      }
    } else if (isSelectingRef.current && startPointRef.current && canvasRef.current) {
      // Marquee selection
      const cRect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - cRect.left) / Math.max(0.0001, zoom) + (canvasRef.current.scrollLeft || 0)
      const y = (e.clientY - cRect.top) / Math.max(0.0001, zoom) + (canvasRef.current.scrollTop || 0)
      const sp = startPointRef.current
      const left = Math.min(sp.x, x)
      const top = Math.min(sp.y, y)
      const w = Math.abs(x - sp.x)
      const h = Math.abs(y - sp.y)
      setMarquee({ x: left, y: top, w, h })
    }
  }

  const handlePointerUp = (e: PointerEvent) => {
    const d = draggingRef.current
    if (d) {
      const dx = Math.abs(e.clientX - d.startClientX)
      const dy = Math.abs(e.clientY - d.startClientY)
      const hasMoved = dx > 3 || dy > 3

      // Drop transactions into bucket on release
      if (hasMoved && canvasRef.current) {
        const txIds = getTransactionIdsInDrag(d)
        if (txIds.length > 0) {
          const bucketId = detectBucketCollision(e.clientX, e.clientY, bucketPositions, nodeRefs)
          if (bucketId !== null && onDropInBucket) {
            onDropInBucket(bucketId, txIds).then(() => {
              // Clear selection after successful drop
              setSelectedTxMap({})
              setSelectedBucketMap({})
            })
          }
        }
      }

      draggingRef.current = null
      setHoverBucket(null)
      document.body.style.userSelect = ''
    }
  }

  function startNodeDragInternal(type: 'tx' | 'bucket', id: number, e: any) {
    const selectedTxIds = Object.entries(selectedTxMap).filter(([, v]) => v).map(([k]) => Number(k))
    const selectedBucketIds = Object.entries(selectedBucketMap).filter(([, v]) => v).map(([k]) => Number(k))

    const clickedIsInMarquee = (type === 'tx' && selectedTxIds.includes(id)) ||
                              (type === 'bucket' && selectedBucketIds.includes(id))

    let ids: number[]
    if (clickedIsInMarquee) {
      ids = [...new Set([...selectedTxIds, ...selectedBucketIds])]
    } else {
      ids = [id]
    }

    const initialPositions: Record<number, Pos> = {}
    const idTypes: Record<number, 'tx' | 'bucket'> = {}

    ids.forEach(i => {
      if (selectedTxIds.includes(i)) {
        idTypes[i] = 'tx'
        if (i in txPositions) {
          initialPositions[i] = { ...txPositions[i] }
        }
      } else if (selectedBucketIds.includes(i)) {
        idTypes[i] = 'bucket'
        if (i in bucketPositions) {
          initialPositions[i] = { ...bucketPositions[i] }
        }
      } else {
        idTypes[i] = type
        if (type === 'tx' && i in txPositions) {
          initialPositions[i] = { ...txPositions[i] }
        } else if (type === 'bucket' && i in bucketPositions) {
          initialPositions[i] = { ...bucketPositions[i] }
        } else {
          initialPositions[i] = { x: 0, y: 0 }
        }
      }
    })

    const pos = type === 'tx' ? txPositions[id] : bucketPositions[id]
    const coords = convertClientToCanvasCoords(canvasRef.current, e.clientX, e.clientY, zoom)
    let offsetX = 0, offsetY = 0
    if (pos) {
      offsetX = coords.x - pos.x
      offsetY = coords.y - pos.y
    }

    draggingRef.current = {
      mode: ids.length > 1 ? 'group' : type,
      ids,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initialPositions,
      idTypes,
      offsetX,
      offsetY,
    }

    // Validate idTypes
    ids.forEach(i => {
      if (!(i in idTypes)) {
        console.error(`CRITICAL: ID ${i} missing from idTypes!`, { ids, idTypes })
      }
    })

    isSelectingRef.current = false
    document.body.style.userSelect = 'none'
  }

  // Export function for external drag start (from click handlers)
  const startNodeDrag = (e: React.PointerEvent | { button?: number; clientX: number; clientY: number }, type: 'tx' | 'bucket', id: number) => {
    try {
      startNodeDragInternal(type, id, e as any)
    } catch (err) {
      console.error('startNodeDrag error', err)
    }
  }

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove as any)
    window.addEventListener('pointerup', handlePointerUp as any)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove as any)
      window.removeEventListener('pointerup', handlePointerUp as any)
    }
  }, [draggingRef.current, zoom, bucketPositions, txPositions, selectedTxMap, selectedBucketMap])

  return { startNodeDrag, handlePointerMove, handlePointerUp }
}

