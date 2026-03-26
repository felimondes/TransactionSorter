import React, { useEffect, useMemo } from 'react'
import { useCanvasState, Pos } from '../hooks/useCanvasState'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import { useMarqueeSelection } from '../hooks/useMarqueeSelection'
import { useSuggestions } from '../hooks/useSuggestions'
import { useCanvasEventListeners } from '../hooks/useCanvasEventListeners'
import { useDataInitialization } from '../hooks/useDataInitialization'
import { CanvasNodes } from '../components/CanvasNodes'
import { ContextMenu } from '../components/ContextMenu'
import { NODE_W, NODE_H_TX, NODE_H_BUCKET, DRAG_MOVE_THRESHOLD } from '../utils/canvasUtils'
import * as apiWrappers from '../utils/apiWrappers'

export default function SortPage() {
  const canvas = useCanvasState()

  // ============ Data Loading ============
  const { loadData } = useDataInitialization({
    setLoading: canvas.setLoading,
    setTransactions: canvas.setTransactions,
    setBuckets: canvas.setBuckets,
    setBucketPositions: canvas.setBucketPositions,
    setTxPositions: canvas.setTxPositions,
    bucketPositions: canvas.bucketPositions,
    txPositions: canvas.txPositions,
  })

  // ============ Drag and Drop ============
  const { startNodeDrag } = useDragAndDrop({
    canvasRef: canvas.canvasRef,
    draggingRef: canvas.draggingRef,
    nodeRefs: canvas.nodeRefs.current,
    zoom: canvas.zoom,
    txPositions: canvas.txPositions,
    bucketPositions: canvas.bucketPositions,
    selectedTxMap: canvas.selectedTxMap,
    selectedBucketMap: canvas.selectedBucketMap,
    potentialClickRef: canvas.potentialClickRef,
    holdTimerRef: canvas.holdTimerRef,
    draggingInitiatedRef: canvas.draggingInitiatedRef,
    isSelectingRef: canvas.isSelectingRef,
    startPointRef: canvas.startPointRef,
    setTxPositions: canvas.setTxPositions,
    setBucketPositions: canvas.setBucketPositions,
    setHoverBucket: canvas.setHoverBucket,
    setSelectedTxMap: canvas.setSelectedTxMap,
    setSelectedBucketMap: canvas.setSelectedBucketMap,
    setMarquee: canvas.setMarquee,
    setSuggestions: canvas.setSuggestions,
    setLastHoveredId: canvas.setLastHoveredId,
    onDropInBucket: async (bucketId: number, txIds: number[]) => {
      await apiWrappers.addTransactionsToBucketBatch(bucketId, txIds)
      await loadData()
    },
  })

  // ============ Marquee Selection ============
  const { startMarqueeSelection, finishMarqueeSelection } = useMarqueeSelection({
    canvasRef: canvas.canvasRef,
    isSelectingRef: canvas.isSelectingRef,
    startPointRef: canvas.startPointRef,
    zoom: canvas.zoom,
    transactions: canvas.transactions,
    txPositions: canvas.txPositions,
    buckets: canvas.buckets,
    bucketPositions: canvas.bucketPositions,
    setMarquee: canvas.setMarquee,
    setSelectedTxMap: canvas.setSelectedTxMap,
    setSelectedBucketMap: canvas.setSelectedBucketMap,
    setSuggestions: canvas.setSuggestions,
    setLastHoveredId: canvas.setLastHoveredId,
  })

  // ============ Suggestions ============
  const { fetchSuggestion, clearSuggestion } = useSuggestions({
    canvasRef: canvas.canvasRef,
    nodeRefs: canvas.nodeRefs.current,
    hoverTimers: canvas.hoverTimers,
    suggestionsEnabled: canvas.suggestionsEnabled,
    transactions: canvas.transactions,
    setSuggestions: canvas.setSuggestions,
    setVisibleSuggestionIds: canvas.setVisibleSuggestionIds,
    setSuggestionPos: canvas.setSuggestionPos,
    setLastHoveredId: canvas.setLastHoveredId,
  })

  // ============ Global Event Listeners ============
  const onGlobalPointerDown = (e: PointerEvent) => {
    if ((e as any).button !== 0) return
    const target = e.target as HTMLElement
    if (target && !target.closest('.context-menu')) canvas.setContextMenu(null)
    if (target && !target.closest('.canvas')) {
      canvas.setSelectedTxMap({})
      canvas.setSelectedBucketMap({})
    }
  }

  const onGlobalKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') canvas.setContextMenu(null)
    if (e.key.toLowerCase() === 's' && canvas.suggestionsEnabled && canvas.lastHoveredId != null) {
      const s = canvas.suggestions[canvas.lastHoveredId]
      if (s?.bucketId) {
        apiWrappers.addTransactionToBucketSafe(s.bucketId, canvas.lastHoveredId).then(() => loadData())
      }
    }
  }

  const onGlobalContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target?.closest('.canvas')) {
      e.preventDefault()
      openContextMenu((e as MouseEvent).clientX, (e as MouseEvent).clientY)
    }
  }

  useCanvasEventListeners({
    onGlobalPointerDown,
    onGlobalKeyDown,
    onGlobalContextMenu,
  })

  // ============ Compute Content Bounds ============
  const contentBounds = useMemo(() => {
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

  // ============ Context Menu Handler ============
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

            if (nodeType === 'bucket') {
              // Bucket clicked
              if (isClickedInMarquee) {
                // Bucket IS in marquee → let it drag with the marquee selection
                startNodeDrag(e, nodeType, clickedId)
              } else {
                // Bucket NOT in marquee → clear marquee and prepare to open bucket window
                canvas.setSelectedTxMap({})
                canvas.setSelectedBucketMap({})
                canvas.potentialClickRef.current = { bucketId: clickedId, startX: e.clientX, startY: e.clientY, time: Date.now() }
              }
            } else {
              // Transaction clicked
              if (hasMarqueeSelection && !isClickedInMarquee) {
                // Clicked transaction is not in marquee - don't drag
                return
              }
              startNodeDrag(e, nodeType, clickedId)
            }
          } else {
            // Click on blank canvas - clear marquee and start new marquee selection
            canvas.setSelectedTxMap({})
            canvas.setSelectedBucketMap({})
            startMarqueeSelection(e.clientX, e.clientY)
          }
        }}
        onPointerUp={(e) => {
          finishMarqueeSelection(e.clientX, e.clientY)
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
                // Mark as potential click - wait to see if movement happens
                canvas.potentialClickRef.current = { bucketId: bid, startX: e.clientX, startY: e.clientY, time: Date.now() }
              }
            }}
            onBucketClick={(e, bid) => {
              const selectedBucketIds = Object.entries(canvas.selectedBucketMap)
                .filter(([, v]) => v)
                .map(([k]) => Number(k))
              const selectedTxIds = Object.entries(canvas.selectedTxMap)
                .filter(([, v]) => v)
                .map(([k]) => Number(k))
              const hasMarqueeSelection = selectedBucketIds.length > 0 || selectedTxIds.length > 0
              const isBucketInMarquee = selectedBucketIds.includes(bid)

              // Exception rule: clicking a marqueed object should NOT clear marquee.
              if (hasMarqueeSelection && isBucketInMarquee) {
                canvas.potentialClickRef.current = null
                canvas.draggingInitiatedRef.current = false
                return
              }

              const cc = canvas.potentialClickRef.current
              if (cc && cc.bucketId === bid && !canvas.draggingInitiatedRef.current) {
                const dx = Math.abs(e.clientX - cc.startX)
                const dy = Math.abs(e.clientY - cc.startY)
                // If movement was minimal, this is a click (not a drag)
                if (dx <= DRAG_MOVE_THRESHOLD && dy <= DRAG_MOVE_THRESHOLD) {
                  e.stopPropagation()
                  // Clear marquee when clicking NON-marqueed bucket and open bucket window.
                  canvas.setSelectedTxMap({})
                  canvas.setSelectedBucketMap({})
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
            if (name) await apiWrappers.createBucketSafe(name).then(() => loadData())
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
              loadData()
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

