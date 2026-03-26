/**
 * Marquee selection utilities
 * Handles rectangle intersection detection and node selection within marquee bounds
 */

import { Pos, MarqueeRect } from '../types/common'
import { NODE_W, NODE_H_TX, NODE_H_BUCKET } from './canvasUtils'
import * as api from '../services/api'

export function computeMarqueeRect(start: Pos, end: Pos): MarqueeRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
  }
}

export interface NodeBounds {
  left: number
  top: number
  right: number
  bottom: number
}

export function getNodeBounds(x: number, y: number, width: number, height: number): NodeBounds {
  return {
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
  }
}

export function checkIntersection(nodeBounds: NodeBounds, marqueeRect: MarqueeRect): boolean {
  return !(
    nodeBounds.left > marqueeRect.x + marqueeRect.w ||
    nodeBounds.right < marqueeRect.x ||
    nodeBounds.top > marqueeRect.y + marqueeRect.h ||
    nodeBounds.bottom < marqueeRect.y
  )
}

export function selectNodesInMarquee(
  marqueeRect: MarqueeRect,
  transactions: api.Transaction[],
  txPositions: Record<number, Pos>,
  buckets: api.Bucket[],
  bucketPositions: Record<number, Pos>
): { selectedTx: Record<number, boolean>; selectedBuckets: Record<number, boolean> } {
  const selectedTx: Record<number, boolean> = {}
  const selectedBuckets: Record<number, boolean> = {}

  // Select transactions
  transactions.forEach(t => {
    const p = txPositions[t.id]
    const bounds = getNodeBounds(p?.x ?? 0, p?.y ?? 0, NODE_W, NODE_H_TX)
    if (checkIntersection(bounds, marqueeRect)) {
      selectedTx[t.id] = true
    }
  })

  // Select buckets
  buckets.forEach(b => {
    const p = bucketPositions[b.id]
    const bounds = getNodeBounds(p?.x ?? 0, p?.y ?? 0, NODE_W, NODE_H_BUCKET)
    if (checkIntersection(bounds, marqueeRect)) {
      selectedBuckets[b.id] = true
    }
  })

  return { selectedTx, selectedBuckets }
}

