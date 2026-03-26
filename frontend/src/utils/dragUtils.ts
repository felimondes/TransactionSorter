/**
 * Drag and drop related utilities
 * Handles coordinate conversion, collision detection, and ID type validation
 */

import { Pos, DraggingState } from '../types/common'

export function convertClientToCanvasCoords(
  canvasRef: HTMLDivElement | null,
  clientX: number,
  clientY: number,
  zoom: number
): Pos {
  if (!canvasRef) return { x: 0, y: 0 }
  const rect = canvasRef.getBoundingClientRect()
  const x = (clientX - rect.left) / Math.max(0.0001, zoom) + (canvasRef.scrollLeft || 0)
  const y = (clientY - rect.top) / Math.max(0.0001, zoom) + (canvasRef.scrollTop || 0)
  return { x, y }
}

export function detectBucketCollision(
  pointerX: number,
  pointerY: number,
  bucketPositions: Record<number, Pos>,
  nodeRefs: Record<string, HTMLElement | null>
): number | null {
  let found: number | null = null
  Object.keys(bucketPositions).forEach(k => {
    const bid = Number(k)
    const el = nodeRefs[`bucket-${bid}`]
    if (el) {
      const r = el.getBoundingClientRect()
      if (pointerX >= r.left && pointerX <= r.right && pointerY >= r.top && pointerY <= r.bottom) {
        found = bid
      }
    }
  })
  return found
}

/**
 * Validates that all IDs in the dragging state have their type properly set in idTypes
 * This is CRITICAL for preventing ID namespace collision bugs
 */
export function validateIdTypes(draggingState: DraggingState): boolean {
  for (const id of draggingState.ids) {
    if (!(id in draggingState.idTypes)) {
      console.error(`CRITICAL: ID ${id} missing from idTypes!`, { ids: draggingState.ids, idTypes: draggingState.idTypes })
      return false
    }
  }
  return true
}

/**
 * Filters IDs to get only transactions from a dragging set
 * Uses ONLY idTypes as source of truth, never position maps
 */
export function getTransactionIdsInDrag(draggingState: DraggingState): number[] {
  return draggingState.ids.filter(id => draggingState.idTypes?.[id] === 'tx')
}

/**
 * Filters IDs to get only buckets from a dragging set
 * Uses ONLY idTypes as source of truth, never position maps
 */
export function getBucketIdsInDrag(draggingState: DraggingState): number[] {
  return draggingState.ids.filter(id => draggingState.idTypes?.[id] === 'bucket')
}

