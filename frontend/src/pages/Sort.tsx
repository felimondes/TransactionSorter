import React, { useEffect } from 'react'
import { useCanvasState, DraggingState, Pos } from '../hooks/useCanvasState'
import { CanvasNodes } from '../components/CanvasNodes'
import { ContextMenu } from '../components/ContextMenu'
import { NODE_W, NODE_H_TX, NODE_H_BUCKET, DRAG_MOVE_THRESHOLD, HOLD_DELAY_MS, clientToCanvasCoords } from '../utils/canvasUtils'
import * as apiWrappers from '../utils/apiWrappers'

/**
 * ============================================================================
 * CRITICAL: ID NAMESPACE SEPARATION - PREVENT TRANSACTION/BUCKET COLLISION
 * ============================================================================
 *
 * PROBLEM: Transactions and Buckets use SEPARATE numeric ID namespaces:
 *   - Transaction IDs: 1, 2, 3, ... (stored in canvas.txPositions)
 *   - Bucket IDs: 1, 2, 3, ... (stored in canvas.bucketPositions)
 *   => Transaction #1 and Bucket #1 are DIFFERENT entities!
 *
 * COLLISION BUG EXAMPLE:
 *   When moving buckets [1, 2], transactions [1, 2] get added to bucket 1!
 *   Root cause: Using `id in canvas.txPositions` for type detection
 *   This fails because both txPositions AND bucketPositions can have id=1
 *
 * SOLUTION:
 *   1. ALWAYS use selectedTxMap/selectedBucketMap to determine type
 *   2. Store idTypes: Record<id, 'tx' | 'bucket'> in dragging state
 *   3. NEVER use position maps for type detection
 *   4. ONLY add items with idTypes[id] === 'tx' to buckets
 *
 * CRITICAL RULES (ENFORCE EVERYWHERE):
 *   ✗ WRONG: id in canvas.txPositions  (ambiguous when id exists in both maps)
 *   ✗ WRONG: d.idTypes?.[id] === 'tx' || id in canvas.txPositions  (fallback is dangerous)
 *   ✓ RIGHT: d.idTypes?.[id] === 'tx'  (explicit, no ambiguity)
 *   ✓ RIGHT: selectedTxIds.includes(id)  (source of truth)
 *
 * CRITICAL FIX LOCATIONS:
 *   - startNodeDrag(): Set idTypes using ONLY selectedMaps, NO position fallback
 *   - handlePointerUp(): Only add items with idTypes[id] === 'tx', NO position fallback
 *   - node click detection: Check tx FIRST, then buckets (prevents overlap)
 * ============================================================================
 */

export default function SortPage() {
  const canvas = useCanvasState()

  // ============ Load Data ============
  async function load() {
    canvas.setLoading(true)
    try {
      const { transactions, buckets } = await apiWrappers.loadBoardData()
      canvas.setTransactions(transactions)
      canvas.setBuckets(buckets)

      // Initialize positions
      const newBucketPos: Record<number, Pos> = { ...canvas.bucketPositions }
      const bucketBaselineY = 96
      buckets.forEach((b, i) => {
        if (!(b.id in newBucketPos)) {
          newBucketPos[b.id] = { x: 40, y: bucketBaselineY + i * NODE_H_BUCKET }
        }
      })
      canvas.setBucketPositions(newBucketPos)

      const newTxPos: Record<number, Pos> = { ...canvas.txPositions }
      transactions.forEach((t, i) => {
        if (!(t.id in newTxPos)) {
          newTxPos[t.id] = { x: 360 + (i % 6) * NODE_W, y: 40 + Math.floor(i / 6) * 100 }
        }
      })
      canvas.setTxPositions(newTxPos)
    } finally {
      canvas.setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ============ Event Listeners ============
  useEffect(() => {
    const onUploaded = () => load()
    window.addEventListener('transactionsUploaded', onUploaded)
    return () => window.removeEventListener('transactionsUploaded', onUploaded)
  }, [])

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if ((e as any).button !== 0) return
      const target = e.target as HTMLElement
      if (target && !target.closest('.context-menu')) canvas.setContextMenu(null)
      if (target && !target.closest('.canvas')) {
        canvas.setSelectedTxMap({})
        canvas.setSelectedBucketMap({})
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') canvas.setContextMenu(null)
      if (e.key.toLowerCase() === 's' && canvas.suggestionsEnabled && canvas.lastHoveredId != null) {
        const s = canvas.suggestions[canvas.lastHoveredId]
        if (s?.bucketId) {
          apiWrappers.addTransactionToBucketSafe(s.bucketId, canvas.lastHoveredId).then(() => load())
        }
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [canvas.lastHoveredId, canvas.suggestions, canvas.suggestionsEnabled])

  // ============ Compute Content Bounds ============
  const contentBounds = React.useMemo(() => {
    let maxX = 800, maxY = 600
    Object.values(canvas.bucketPositions).forEach(p => {
      maxX = Math.max(maxX, p.x + NODE_W + 200)
      maxY = Math.max(maxY, p.y + NODE_H_BUCKET + 200)
    })
    Object.values(canvas.txPositions).forEach(p => {
      maxX = Math.max(maxX, p.x + NODE_W + 200)
      maxY = Math.max(maxY, p.y + NODE_H_TX + 200)
    })
    return { width: Math.ceil(maxX), height: Math.ceil(maxY) }
  }, [canvas.bucketPositions, canvas.txPositions])

  // ============ Pointer Handlers ============
  const startNodeDrag = (e: React.PointerEvent | { button?: number; clientX: number; clientY: number }, type: 'tx' | 'bucket', id: number) => {
    try {
      const selectedTxIds = Object.entries(canvas.selectedTxMap).filter(([, v]) => v).map(([k]) => Number(k))
      const selectedBucketIds = Object.entries(canvas.selectedBucketMap).filter(([, v]) => v).map(([k]) => Number(k))

      // Determine which IDs to drag
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

      // CRITICAL: Determine type for each ID using ONLY selected maps as source of truth
      // NO fallback to position maps - this prevents ID collision
      ids.forEach(i => {
        if (selectedTxIds.includes(i)) {
          idTypes[i] = 'tx'
          if (i in canvas.txPositions) {
            initialPositions[i] = { ...canvas.txPositions[i] }
          }
        } else if (selectedBucketIds.includes(i)) {
          idTypes[i] = 'bucket'
          if (i in canvas.bucketPositions) {
            initialPositions[i] = { ...canvas.bucketPositions[i] }
          }
        } else {
          // Single item drag - use the provided type parameter
          idTypes[i] = type
          if (type === 'tx' && i in canvas.txPositions) {
            initialPositions[i] = { ...canvas.txPositions[i] }
          } else if (type === 'bucket' && i in canvas.bucketPositions) {
            initialPositions[i] = { ...canvas.bucketPositions[i] }
          } else {
            initialPositions[i] = { x: 0, y: 0 }
          }
        }
      })

      const pos = type === 'tx' ? canvas.txPositions[id] : canvas.bucketPositions[id]
      const coords = clientToCanvasCoords(canvas.canvasRef.current, (e as any).clientX, (e as any).clientY, canvas.zoom)
      let offsetX = 0, offsetY = 0
      if (pos) {
        offsetX = coords.x - pos.x
        offsetY = coords.y - pos.y
      }

      canvas.draggingRef.current = {
        mode: ids.length > 1 ? 'group' : type,
        ids,
        startClientX: (e as any).clientX,
        startClientY: (e as any).clientY,
        initialPositions,
        idTypes,
        offsetX,
        offsetY,
      }

      // ASSERTION: Verify idTypes is complete - CRITICAL for preventing ID collision
      ids.forEach(i => {
        if (!(i in idTypes)) {
          console.error(`CRITICAL: ID ${i} missing from idTypes! This will cause collision bugs.`, { ids, idTypes })
        }
      })

      canvas.isSelectingRef.current = false
      document.body.style.userSelect = 'none'
    } catch (err) {
      console.error('startNodeDrag error', err)
    }
  }

  const handlePointerMove = (e: PointerEvent) => {
    const d = canvas.draggingRef.current
    if (!canvas.canvasRef.current) return

    // Cancel bucket click candidate if movement detected
    if (canvas.potentialClickRef.current && !canvas.draggingInitiatedRef.current) {
      const cc = canvas.potentialClickRef.current
      const dx = Math.abs(e.clientX - cc.startX)
      const dy = Math.abs(e.clientY - cc.startY)
      if (dx > DRAG_MOVE_THRESHOLD || dy > DRAG_MOVE_THRESHOLD) {
        // Movement detected - start drag
        canvas.draggingInitiatedRef.current = true
        startNodeDrag({ button: 0, clientX: e.clientX, clientY: e.clientY }, 'bucket', cc.bucketId)
        canvas.potentialClickRef.current = null
        // Clear hold timer
        if (canvas.holdTimerRef.current[cc.bucketId]) {
          clearTimeout(canvas.holdTimerRef.current[cc.bucketId])
          delete canvas.holdTimerRef.current[cc.bucketId]
        }
      }
    }

    if (d) {
      // Single node drag
      if ((d.mode === 'bucket' || d.mode === 'tx') && d.ids.length === 1) {
        const id = d.ids[0]
        const cRect = canvas.canvasRef.current.getBoundingClientRect()
        const pointerCanvasX = (e.clientX - cRect.left) / Math.max(0.0001, canvas.zoom) + (canvas.canvasRef.current.scrollLeft || 0)
        const pointerCanvasY = (e.clientY - cRect.top) / Math.max(0.0001, canvas.zoom) + (canvas.canvasRef.current.scrollTop || 0)
        const newPos = {
          x: Math.max(0, Math.round(pointerCanvasX - (d.offsetX ?? 0))),
          y: Math.max(0, Math.round(pointerCanvasY - (d.offsetY ?? 0)))
        }

        if (d.mode === 'bucket') canvas.setBucketPositions(p => ({ ...p, [id]: newPos }))
        else canvas.setTxPositions(p => ({ ...p, [id]: newPos }))
      } else if (d.ids.length > 1) {
        // Group drag - use same coordinate system as single drag for consistency
        const cRect = canvas.canvasRef.current.getBoundingClientRect()
        const pointerCanvasX = (e.clientX - cRect.left) / Math.max(0.0001, canvas.zoom) + (canvas.canvasRef.current.scrollLeft || 0)
        const pointerCanvasY = (e.clientY - cRect.top) / Math.max(0.0001, canvas.zoom) + (canvas.canvasRef.current.scrollTop || 0)

        const startCanvasX = (d.startClientX - cRect.left) / Math.max(0.0001, canvas.zoom) + (canvas.canvasRef.current.scrollLeft || 0)
        const startCanvasY = (d.startClientY - cRect.top) / Math.max(0.0001, canvas.zoom) + (canvas.canvasRef.current.scrollTop || 0)

        const dx = pointerCanvasX - startCanvasX
        const dy = pointerCanvasY - startCanvasY

        const updated: Record<number, Pos> = {}
        d.ids.forEach(id => {
          const initial = d.initialPositions[id] || { x: 0, y: 0 }
          updated[id] = { x: initial.x + dx, y: initial.y + dy }
        })

        // Determine what should move based on the types captured at drag start
        // CRITICAL: Use idTypes captured at drag start, NOT current selection
        // This prevents ID collision where buckets and transactions mix
        const txItemsInDrag = d.ids.filter(i => d.idTypes?.[i] === 'tx')
        const bucketItemsInDrag = d.ids.filter(i => d.idTypes?.[i] === 'bucket')

        // Update based on what's actually in the drag
        if (txItemsInDrag.length > 0) {
          const txUpdates = Object.fromEntries(txItemsInDrag.map(i => [i, updated[i]]))
          // SAFETY: Verify all IDs being updated are actually transactions
          txItemsInDrag.forEach(i => {
            if (d.idTypes?.[i] !== 'tx') {
              console.error(`CRITICAL: ID ${i} marked as non-tx but included in txItemsInDrag!`, { id: i, type: d.idTypes?.[i] })
            }
          })
          canvas.setTxPositions(p => ({ ...p, ...txUpdates }))
        }
        if (bucketItemsInDrag.length > 0) {
          const bucketUpdates = Object.fromEntries(bucketItemsInDrag.map(i => [i, updated[i]]))
          // SAFETY: Verify all IDs being updated are actually buckets
          bucketItemsInDrag.forEach(i => {
            if (d.idTypes?.[i] !== 'bucket') {
              console.error(`CRITICAL: ID ${i} marked as non-bucket but included in bucketItemsInDrag!`, { id: i, type: d.idTypes?.[i] })
            }
          })
          canvas.setBucketPositions(p => ({ ...p, ...bucketUpdates }))
        }
      }

      // Hover bucket detection
      if (d.mode === 'tx' || d.mode === 'group') {
        let found: number | null = null
        Object.keys(canvas.bucketPositions).forEach(k => {
          const bid = Number(k)
          const el = canvas.nodeRefs.current[`bucket-${bid}`]
          if (el) {
            const r = el.getBoundingClientRect()
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) found = bid
          }
        })
        canvas.setHoverBucket(found)
      }
    } else {
      // Marquee selection
      if (canvas.isSelectingRef.current && canvas.startPointRef.current && canvas.canvasRef.current) {
        const cRect = canvas.canvasRef.current.getBoundingClientRect()
        const x = (e.clientX - cRect.left) / Math.max(0.0001, canvas.zoom) + (canvas.canvasRef.current.scrollLeft || 0)
        const y = (e.clientY - cRect.top) / Math.max(0.0001, canvas.zoom) + (canvas.canvasRef.current.scrollTop || 0)
        const sp = canvas.startPointRef.current
        const left = Math.min(sp.x, x)
        const top = Math.min(sp.y, y)
        const w = Math.abs(x - sp.x)
        const h = Math.abs(y - sp.y)
        canvas.setMarquee({ x: left, y: top, w, h })
      }
    }
  }

  const handlePointerUp = (e: PointerEvent) => {
    const d = canvas.draggingRef.current
    if (d) {
      // Only process bucket drops if there was actual movement (drag, not click)
      const dx = Math.abs(e.clientX - d.startClientX)
      const dy = Math.abs(e.clientY - d.startClientY)
      const hasMoved = dx > 3 || dy > 3

      if (hasMoved && (d.mode === 'tx' || d.mode === 'group') && canvas.canvasRef.current) {
        let found: number | null = null
        Object.keys(canvas.bucketPositions).forEach(k => {
          const bid = Number(k)
          const el = canvas.nodeRefs.current[`bucket-${bid}`]
          if (el) {
            const r = el.getBoundingClientRect()
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) found = bid
          }
        })

        if (found !== null) {
          // CRITICAL: Only add items that are EXPLICITLY marked as 'tx' in idTypes
          // This prevents bucket IDs from being treated as transaction IDs
          const txIds = d.ids.filter(id => {
            // Must be explicitly a 'tx' type
            return d.idTypes?.[id] === 'tx'
          })

          if (txIds.length) {
            apiWrappers.addTransactionsToBucketBatch(found, txIds).then(() => {
              // Clear selection after successful drop into bucket
              canvas.setSelectedTxMap({})
              canvas.setSelectedBucketMap({})
              load()
            })
          }
        }
      }

      canvas.draggingRef.current = null
      canvas.setHoverBucket(null)
      document.body.style.userSelect = ''
    }
  }

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove as any)
    window.addEventListener('pointerup', handlePointerUp as any)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove as any)
      window.removeEventListener('pointerup', handlePointerUp as any)
    }
  }, [canvas.draggingRef.current, canvas.canvasRef.current, canvas.zoom, canvas.bucketPositions, canvas.txPositions])

  // ============ Suggestion Handling ============
  useEffect(() => {
    canvas.hoverTimers.current = {}
    canvas.setSuggestions({})
    canvas.setVisibleSuggestionIds({})
  }, [canvas.transactions])

  const fetchSuggestion = async (id: number, description: string) => {
    if (!canvas.suggestionsEnabled) return

    clearTimeout(canvas.hoverTimers.current[id])
    const timer = setTimeout(async () => {
      if (canvas.hoverTimers.current[id] !== timer) return
      const s = await apiWrappers.getSuggestion(description)
      if (canvas.hoverTimers.current[id] === timer) {
        canvas.setSuggestions(p => ({ ...p, [id]: s }))
        canvas.setLastHoveredId(id)
        canvas.setVisibleSuggestionIds(p => ({ ...p, [id]: true }))

        // Position the suggestion popup
        try {
          const el = canvas.nodeRefs.current[`tx-${id}`]
          if (el) {
            const rect = el.getBoundingClientRect()
            const canvasRect = canvas.canvasRef.current?.getBoundingClientRect()
            if (canvasRect) {
              const left = rect.right - canvasRect.left + 8
              const top = rect.top - canvasRect.top
              canvas.setSuggestionPos(p => ({ ...p, [id]: { left, top } }))
            }
          }
        } catch (err) {
          console.error('Error positioning suggestion:', err)
        }
      }
    }, 600)
    canvas.hoverTimers.current[id] = timer as any
  }

  const clearSuggestion = (id: number) => {
    clearTimeout(canvas.hoverTimers.current[id])
    delete canvas.hoverTimers.current[id]
    canvas.setVisibleSuggestionIds(p => { const copy = { ...p }; delete copy[id]; return copy })
    canvas.setSuggestions(p => { const copy = { ...p }; delete copy[id]; return copy })
    canvas.setSuggestionPos(p => { const copy = { ...p }; delete copy[id]; return copy })
  }

  // ============ Context Menu Handlers ============
  const openContextMenu = (x: number, y: number, bucketId?: number) => {
    const maxX = Math.max(0, window.innerWidth - 320)
    const maxY = Math.max(0, window.innerHeight - 360)
    const clampedX = Math.min(x, maxX)
    const clampedY = Math.min(y, maxY)
    canvas.setContextMenu({ x: clampedX, y: clampedY, bucketId })

    if (bucketId != null) {
      canvas.setBucketPanelVisibleCount(10)
      apiWrappers.getTransactionsInBucketSafe(bucketId).then(canvas.setBucketPanelTxs)
    }
  }

  useEffect(() => {
    const onGlobalContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target?.closest('.canvas')) {
        e.preventDefault()
        openContextMenu(e.clientX, e.clientY)
      }
    }

    window.addEventListener('contextmenu', onGlobalContext)
    return () => window.removeEventListener('contextmenu', onGlobalContext)
  }, [])

  // ============ Render ============
  return (
    <div className="page sort-page">
      <div
        className="canvas"
        ref={canvas.canvasRef}
        onContextMenu={(e) => { e.preventDefault(); openContextMenu(e.clientX, e.clientY) }}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          const cRect = canvas.canvasRef.current?.getBoundingClientRect()
          if (!cRect) return

          // Check if clicked on node - CHECK TRANSACTIONS FIRST, then buckets
          // This prevents ID collision where tx#1 and bucket#1 can both exist
          let nodeId: string | undefined
          let nodeType: 'tx' | 'bucket' | undefined

          // Check transactions first
          nodeId = Object.keys(canvas.txPositions).find(k => {
            const el = canvas.nodeRefs.current[`tx-${k}`]
            if (!el) return false
            const r = el.getBoundingClientRect()
            return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
          })
          if (nodeId) {
            nodeType = 'tx'
          } else {
            // Check buckets only if no transaction was hit
            nodeId = Object.keys(canvas.bucketPositions).find(k => {
              const el = canvas.nodeRefs.current[`bucket-${k}`]
              if (!el) return false
              const r = el.getBoundingClientRect()
              return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
            })
            if (nodeId) {
              nodeType = 'bucket'
            }
          }

          if (nodeId && nodeType) {
            // Get current selection state
            const selectedTxIds = Object.entries(canvas.selectedTxMap).filter(([, v]) => v).map(([k]) => Number(k))
            const selectedBucketIds = Object.entries(canvas.selectedBucketMap).filter(([, v]) => v).map(([k]) => Number(k))
            const hasMarqueeSelection = selectedTxIds.length > 0 || selectedBucketIds.length > 0
            const clickedId = Number(nodeId)

            // Check if clicked item is in the marquee selection
            const isClickedInMarquee = (nodeType === 'tx' && selectedTxIds.includes(clickedId)) ||
                                      (nodeType === 'bucket' && selectedBucketIds.includes(clickedId))

            // Marquee selection has ABSOLUTE priority
            // Only allow drag if:
            // 1. No marquee selection exists, OR
            // 2. Marquee selection exists AND clicked item is part of it
            if (hasMarqueeSelection && !isClickedInMarquee) {
              // Clicked item is not in marquee - don't drag
              return
            }

            // Safe to drag
            startNodeDrag(e, nodeType, clickedId)
          } else {
            // Click on blank canvas - clear selections and start marquee selection
            canvas.setSelectedTxMap({})
            canvas.setSelectedBucketMap({})
            canvas.isSelectingRef.current = true
            const x = (e.clientX - cRect.left) / Math.max(0.0001, canvas.zoom) + (canvas.canvasRef.current.scrollLeft || 0)
            const y = (e.clientY - cRect.top) / Math.max(0.0001, canvas.zoom) + (canvas.canvasRef.current.scrollTop || 0)
            canvas.startPointRef.current = { x, y }
            document.body.style.userSelect = 'none'
          }
        }}
        onPointerUp={(e) => {
          // Finish marquee on canvas pointerup (not relying on global handler for marquee)
          if (canvas.isSelectingRef.current && canvas.startPointRef.current && canvas.canvasRef.current) {
            canvas.isSelectingRef.current = false
            const cRect = canvas.canvasRef.current.getBoundingClientRect()
            const x = (e.clientX - cRect.left) / Math.max(0.0001, canvas.zoom) + (canvas.canvasRef.current.scrollLeft || 0)
            const y = (e.clientY - cRect.top) / Math.max(0.0001, canvas.zoom) + (canvas.canvasRef.current.scrollTop || 0)
            const sp = canvas.startPointRef.current
            const left = Math.min(sp.x, x)
            const top = Math.min(sp.y, y)
            const w = Math.abs(x - sp.x)
            const h = Math.abs(y - sp.y)
            canvas.setMarquee(null)
            canvas.startPointRef.current = null
            document.body.style.userSelect = ''

            if (w > 0 && h > 0) {
              const newlySelectedTx: Record<number, boolean> = {}
              const newlySelectedBucket: Record<number, boolean> = {}

              canvas.transactions.forEach(t => {
                const p = canvas.txPositions[t.id]
                const nodeLeft = p?.x ?? 0
                const nodeTop = p?.y ?? 0
                const nodeW = NODE_W
                const nodeH = NODE_H_TX
                const rel = { left: nodeLeft, top: nodeTop, right: nodeLeft + nodeW, bottom: nodeTop + nodeH }
                const intersects = !(rel.left > left + w || rel.right < left || rel.top > top + h || rel.bottom < top)
                if (intersects) newlySelectedTx[t.id] = true
              })

              canvas.buckets.forEach(b => {
                const p = canvas.bucketPositions[b.id]
                const nodeLeft = p?.x ?? 0
                const nodeTop = p?.y ?? 0
                const nodeW = NODE_W
                const nodeH = NODE_H_BUCKET
                const rel = { left: nodeLeft, top: nodeTop, right: nodeLeft + nodeW, bottom: nodeTop + nodeH }
                const intersects = !(rel.left > left + w || rel.right < left || rel.top > top + h || rel.bottom < top)
                if (intersects) newlySelectedBucket[b.id] = true
              })

              canvas.setSelectedTxMap(newlySelectedTx)
              canvas.setSelectedBucketMap(newlySelectedBucket)
              canvas.setSuggestions({})
              canvas.setLastHoveredId(null)
            }
          }
        }}
      >
        <div
          className="content"
          ref={canvas.contentRef}
          style={{
            transform: `scale(${canvas.zoom})`,
            transformOrigin: 'top left',
            width: contentBounds.width + 'px',
            height: contentBounds.height + 'px',
          }}
        >
          <CanvasNodes
            buckets={canvas.buckets}
            bucketPositions={canvas.bucketPositions}
            selectedBucketMap={canvas.selectedBucketMap}
            hoverBucket={canvas.hoverBucket}
            transactions={canvas.transactions}
            txPositions={canvas.txPositions}
            selectedTxMap={canvas.selectedTxMap}
            nodeRefs={canvas.nodeRefs}
            suggestions={canvas.suggestions}
            suggestionPos={canvas.suggestionPos}
            visibleSuggestionIds={canvas.visibleSuggestionIds}
            onBucketPointerDown={(e, bid) => {
              if (e.button === 0) {
                // Check if there's a marquee selection
                const selectedBucketIds = Object.entries(canvas.selectedBucketMap).filter(([, v]) => v).map(([k]) => Number(k))
                const selectedTxIds = Object.entries(canvas.selectedTxMap).filter(([, v]) => v).map(([k]) => Number(k))
                const hasMarqueeSelection = selectedBucketIds.length > 0 || selectedTxIds.length > 0

                // If marquee exists and this bucket is NOT in it, don't allow drag
                if (hasMarqueeSelection && !selectedBucketIds.includes(bid)) {
                  return
                }

                // Mark as potential click - wait to see if movement happens
                canvas.potentialClickRef.current = { bucketId: bid, startX: e.clientX, startY: e.clientY, time: Date.now() }
              }
            }}
            onBucketClick={(e, bid) => {
              // Only open panel if no drag occurred AND not part of marquee selection
              const selectedBucketIds = Object.entries(canvas.selectedBucketMap).filter(([, v]) => v).map(([k]) => Number(k))
              const selectedTxIds = Object.entries(canvas.selectedTxMap).filter(([, v]) => v).map(([k]) => Number(k))
              const hasMarqueeSelection = selectedBucketIds.length > 0 || selectedTxIds.length > 0

              // If there's marquee selection and this bucket is part of it, don't open panel
              if (hasMarqueeSelection && selectedBucketIds.includes(bid)) {
                canvas.potentialClickRef.current = null
                canvas.draggingInitiatedRef.current = false
                return
              }

              const cc = canvas.potentialClickRef.current
              if (cc && cc.bucketId === bid && !canvas.draggingInitiatedRef.current) {
                const dx = Math.abs(e.clientX - cc.startX)
                const dy = Math.abs(e.clientY - cc.startY)
                if (dx <= DRAG_MOVE_THRESHOLD && dy <= DRAG_MOVE_THRESHOLD) {
                  e.stopPropagation()
                  openContextMenu(e.clientX, e.clientY, bid)
                }
              }
              canvas.potentialClickRef.current = null
              canvas.draggingInitiatedRef.current = false
            }}
            onBucketContextMenu={(e, bid) => {
              e.preventDefault()
              openContextMenu(e.clientX, e.clientY, bid)
            }}
            onTransactionPointerDown={(e, txId) => startNodeDrag(e, 'tx', txId)}
            onTransactionContextMenu={(e) => { e.preventDefault(); openContextMenu(e.clientX, e.clientY) }}
            onTransactionEnter={(txId, desc, target) => fetchSuggestion(txId, desc)}
            onTransactionLeave={clearSuggestion}
            marquee={canvas.marquee}
            loading={canvas.loading}
          />
        </div>
      </div>

      {canvas.contextMenu && (
        <ContextMenu
          x={canvas.contextMenu.x}
          y={canvas.contextMenu.y}
          bucketId={canvas.contextMenu.bucketId}
          buckets={canvas.buckets}
          bucketPanelTxs={canvas.bucketPanelTxs}
          bucketPanelVisibleCount={canvas.bucketPanelVisibleCount}
          suggestionsEnabled={canvas.suggestionsEnabled}
          onUpload={() => {
            setTimeout(() => {
              try { (window as any).openUploadModal?.() } catch {}
              window.dispatchEvent(new Event('openUploadModal'))
            }, 0)
            canvas.setContextMenu(null)
          }}
          onStatistics={() => {
            setTimeout(() => {
              try { (window as any).openStatisticsModal?.() } catch {}
              window.dispatchEvent(new Event('openStatisticsModal'))
            }, 0)
            canvas.setContextMenu(null)
          }}
          onCreateBucket={async () => {
            canvas.setContextMenu(null)
            const name = window.prompt('Bucket name')
            if (name) await apiWrappers.createBucketSafe(name).then(() => load())
          }}
          onToggleSuggestions={() => {
            canvas.setSuggestionsEnabled(p => !p)
            canvas.setContextMenu(null)
          }}
          onClose={() => canvas.setContextMenu(null)}
          onScroll={(e) => {
            const el = e.target as HTMLElement
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
              canvas.setBucketPanelVisibleCount(p => Math.min(canvas.bucketPanelTxs.length, p + 10))
            }
          }}
          onSelectTransaction={(txId) => canvas.setSelectedTxMap(p => ({ ...p, [txId]: !p[txId] }))}
          onRemoveTransaction={(txId) => {
            apiWrappers.removeTransactionFromBucketSafe(canvas.contextMenu!.bucketId!, txId).then(() => {
              load()
              // Refresh bucket panel
              if (canvas.contextMenu?.bucketId) {
                apiWrappers.getTransactionsInBucketSafe(canvas.contextMenu.bucketId).then(canvas.setBucketPanelTxs)
              }
            })
          }}
        />
      )}

      <div className="zoom-controls">
        <button onClick={() => canvas.setZoom(p => Math.min(p * 1.25, 4))}>＋</button>
        <button onClick={() => canvas.setZoom(p => Math.max(p / 1.25, 0.2))}>－</button>
        <button onClick={() => canvas.setZoom(1)}>reset</button>
      </div>
    </div>
  )
}

