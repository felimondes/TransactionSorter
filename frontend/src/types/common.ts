/**
 * Shared types for the entire application
 * Centralized to avoid circular imports
 */

export type Pos = { x: number; y: number }

export type TypedID = {
  id: number
  type: 'tx' | 'bucket'
}

export type MarqueeRect = {
  x: number
  y: number
  w: number
  h: number
}

export type DraggingState = {
  mode: 'bucket' | 'tx' | 'group'
  ids: number[]
  startClientX: number
  startClientY: number
  initialPositions: Record<number, Pos>
  idTypes: Record<number, 'tx' | 'bucket'>
  offsetX?: number
  offsetY?: number
}

export type PotentialClick = {
  bucketId: number
  startX: number
  startY: number
  time: number
}

