import { useState, useRef } from 'react'
import * as api from '../services/api'
import { Pos, DraggingState } from '../types/common'

/**
 * ============================================================================
 * ID NAMESPACE ARCHITECTURE - TRANSACTIONS VS BUCKETS
 * ============================================================================
 *
 * This hook manages state for a canvas with TWO separate entity types:
 *
 * TRANSACTIONS (API Source: api.Transaction):
 *   - IDs: 1, 2, 3, ... (from transaction records)
 *   - Storage: canvas.txPositions[txId] = { x, y }
 *   - Selection: canvas.selectedTxMap[txId] = boolean
 *   - Identifier in DOM: `tx-${txId}`
 *
 * BUCKETS (API Source: api.Bucket):
 *   - IDs: 1, 2, 3, ... (from bucket records)
 *   - Storage: canvas.bucketPositions[bucketId] = { x, y }
 *   - Selection: canvas.selectedBucketMap[bucketId] = boolean
 *   - Identifier in DOM: `bucket-${bucketId}`
 *
 * CRITICAL INVARIANT:
 *   Transaction #1 is NOT the same as Bucket #1
 *   They have separate IDs in separate namespaces
 *   They must NEVER be confused in any operation
 *
 * ID TYPE TRACKING:
 *   When dragging, idTypes: Record<id, 'tx' | 'bucket'> tells us:
 *   - Which map to use: txPositions (if 'tx') or bucketPositions (if 'bucket')
 *   - Who to add to buckets: ONLY items with idTypes[id] === 'tx'
 *
 * SOURCE OF TRUTH FOR TYPE:
 *   1. selectedTxMap/selectedBucketMap (highest authority)
 *   2. The clicked element's DOM node ID (tx- or bucket- prefix)
 *   3. NEVER use: id in canvas.txPositions (ambiguous with overlapping IDs)
 * ============================================================================
 */

// Re-export types for backward compatibility
export type { Pos, DraggingState } from '../types/common'

export function useCanvasState() {
  const [transactions, setTransactions] = useState<api.Transaction[]>([])
  const [buckets, setBuckets] = useState<api.Bucket[]>([])
  const [selectedTxMap, setSelectedTxMap] = useState<Record<number, boolean>>({})
  const [selectedBucketMap, setSelectedBucketMap] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [bucketPositions, setBucketPositions] = useState<Record<number, Pos>>({})
  const [txPositions, setTxPositions] = useState<Record<number, Pos>>({})
  const [hoverBucket, setHoverBucket] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; bucketId?: number } | null>(null)
  const [bucketPanelTxs, setBucketPanelTxs] = useState<api.Transaction[]>([])
  const [bucketPanelVisibleCount, setBucketPanelVisibleCount] = useState(10)
  const [zoom, setZoom] = useState<number>(1)
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [suggestions, setSuggestions] = useState<Record<number, api.CategoryScore | null>>({})
  const [suggestionPos, setSuggestionPos] = useState<Record<number, { left: number; top: number }>>({})
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true)
  const [lastHoveredId, setLastHoveredId] = useState<number | null>(null)
  const [visibleSuggestionIds, setVisibleSuggestionIds] = useState<Record<number, boolean>>({})

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({})
  const draggingRef = useRef<DraggingState | null>(null)
  const isSelectingRef = useRef(false)
  const startPointRef = useRef<Pos | null>(null)
  const potentialClickRef = useRef<{ bucketId: number; startX: number; startY: number; time: number } | null>(null)
  const holdTimerRef = useRef<Record<number, any>>({})
  const draggingInitiatedRef = useRef(false)
  const hoverTimers = useRef<Record<number, any>>({})

  return {
    // State
    transactions, setTransactions,
    buckets, setBuckets,
    selectedTxMap, setSelectedTxMap,
    selectedBucketMap, setSelectedBucketMap,
    loading, setLoading,
    bucketPositions, setBucketPositions,
    txPositions, setTxPositions,
    hoverBucket, setHoverBucket,
    contextMenu, setContextMenu,
    bucketPanelTxs, setBucketPanelTxs,
    bucketPanelVisibleCount, setBucketPanelVisibleCount,
    zoom, setZoom,
    marquee, setMarquee,
    suggestions, setSuggestions,
    suggestionPos, setSuggestionPos,
    suggestionsEnabled, setSuggestionsEnabled,
    lastHoveredId, setLastHoveredId,
    visibleSuggestionIds, setVisibleSuggestionIds,
    // Refs
    canvasRef,
    contentRef,
    nodeRefs,
    draggingRef,
    isSelectingRef,
    startPointRef,
    potentialClickRef,
    holdTimerRef,
    draggingInitiatedRef,
    hoverTimers,
  }
}


