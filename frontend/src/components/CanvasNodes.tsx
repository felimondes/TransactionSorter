import React from 'react'
import * as api from '../services/api'
import { formatAmount, formatDay, NODE_H_TX, NODE_H_BUCKET, NODE_W } from '../utils/canvasUtils'

/**
 * CRITICAL: CanvasNodes maintains strict ID namespace separation
 *
 * This component iterates TWO SEPARATE arrays:
 * 1. bucketPositions (Bucket IDs) -> renders bucket nodes
 * 2. txPositions (Transaction IDs) -> renders transaction nodes
 *
 * Bucket #1 and Transaction #1 are DIFFERENT entities rendered separately.
 *
 * The DOM node refs use prefixes to maintain separation:
 * - `bucket-${id}` for bucket with ID
 * - `tx-${id}` for transaction with ID
 *
 * This prevents any visual or functional collision.
 */

interface CanvasNodesProps {
  buckets: api.Bucket[]
  bucketPositions: Record<number, { x: number; y: number }>
  selectedBucketMap: Record<number, boolean>
  hoverBucket: number | null
  transactions: api.Transaction[]
  txPositions: Record<number, { x: number; y: number }>
  selectedTxMap: Record<number, boolean>
  nodeRefs: React.MutableRefObject<Record<string, HTMLElement | null>>
  suggestions: Record<number, api.CategoryScore | null>
  suggestionPos: Record<number, { left: number; top: number }>
  visibleSuggestionIds: Record<number, boolean>
  onBucketPointerDown: (e: React.PointerEvent, bucketId: number) => void
  onBucketClick: (e: React.MouseEvent, bucketId: number) => void
  onBucketContextMenu: (e: React.MouseEvent, bucketId: number) => void
  onTransactionPointerDown: (e: React.PointerEvent, txId: number) => void
  onTransactionContextMenu: (e: React.MouseEvent) => void
  onTransactionEnter: (txId: number, description: string, target: HTMLElement) => void
  onTransactionLeave: (txId: number) => void
  marquee: { x: number; y: number; w: number; h: number } | null
  loading: boolean
}

export const CanvasNodes: React.FC<CanvasNodesProps> = ({
  buckets,
  bucketPositions,
  selectedBucketMap,
  hoverBucket,
  transactions,
  txPositions,
  selectedTxMap,
  nodeRefs,
  suggestions,
  suggestionPos,
  visibleSuggestionIds,
  onBucketPointerDown,
  onBucketClick,
  onBucketContextMenu,
  onTransactionPointerDown,
  onTransactionContextMenu,
  onTransactionEnter,
  onTransactionLeave,
  marquee,
  loading,
}) => {
  return (
    <>
      {Object.entries(bucketPositions).map(([id, pos]) => {
        const bucket = buckets.find(b => b.id === Number(id))
        if (!bucket) return null
        const txCount = transactions.filter(t => t.bucketId === bucket.id).length
        const isHovered = hoverBucket === bucket.id

        return (
          <div
            key={id}
            ref={el => { nodeRefs.current[`bucket-${id}`] = el }}
            className={`node bucket ${selectedBucketMap[bucket.id] ? 'selected' : ''} ${isHovered ? 'hover' : ''}`}
            style={{ left: pos.x, top: pos.y, width: NODE_W, height: NODE_H_BUCKET }}
            onPointerDown={(e) => onBucketPointerDown(e, bucket.id)}
            onClick={(e) => onBucketClick(e, bucket.id)}
            onContextMenu={(e) => onBucketContextMenu(e, bucket.id)}
          >
            <div className="bucket-content">
              <div className="bucket-label">{bucket.name}</div>
              <div className="bucket-tx-count">{txCount} transaction{txCount !== 1 ? 's' : ''}</div>
            </div>
            {isHovered && <div className="bucket-hover-indicator" />}
          </div>
        )
      })}

      {Object.entries(txPositions).map(([id, pos]) => {
        const tx = transactions.find(t => t.id === Number(id))
        if (!tx) return null

        return (
          <div
            key={id}
            ref={el => { nodeRefs.current[`tx-${id}`] = el }}
            className={`node transaction ${selectedTxMap[tx.id] ? 'selected' : ''}`}
            style={{ left: pos.x, top: pos.y, width: NODE_W, height: NODE_H_TX }}
            onPointerDown={(e) => onTransactionPointerDown(e, tx.id)}
            onContextMenu={(e) => onTransactionContextMenu(e)}
            onPointerEnter={(e) => onTransactionEnter(tx.id, tx.description, e.currentTarget as HTMLElement)}
            onPointerLeave={() => onTransactionLeave(tx.id)}
          >
            <div className="transaction-content">
              <div className="transaction-description">{tx.description}</div>
              <div className={`transaction-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                {formatAmount(tx.amount)}
              </div>
              <div className="transaction-date">{formatDay(tx.date)}</div>
            </div>
          </div>
        )
      })}

      {marquee && <div className="marquee-selection" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />}

      {loading && <div className="loading-overlay">Loading...</div>}

      {/* Suggestions */}
      {(() => {
        const keys = new Set<string>([...Object.keys(suggestions), ...Object.keys(suggestionPos)])
        return Array.from(keys).map(idStr => {
          const id = Number(idStr)
          const s = suggestions[id]
          const pos = suggestionPos[id]
          if (!pos || !visibleSuggestionIds[id]) return null

          if (!s) {
            return (
              <div key={`suggest-${id}`} className="suggestion absolute" style={{ left: pos.left, top: pos.top }}>
                <div>
                  <strong>No suggestion</strong>
                </div>
              </div>
            )
          }

          const bucket = buckets.find(b => b.id === s.bucketId)
          const bucketLabel = bucket ? bucket.name : `bucket ${s.bucketId}`
          const showBucket = !(String(s.category || '').toLowerCase() === String(bucketLabel || '').toLowerCase())

          return (
            <div key={`suggest-${id}`} className="suggestion absolute" style={{ left: pos.left, top: pos.top }}>
              <div>
                <strong>Suggested:</strong> {s.category}
                {showBucket ? ' — ' : ' '}
                {showBucket ? <em>{bucketLabel}</em> : null}
              </div>
              <small>press "s" to accept</small>
            </div>
          )
        })
      })()}
    </>
  )
}

