import React from 'react'
import * as api from '../services/api'
import { formatAmount, formatDay } from '../utils/canvasUtils'

/**
 * CRITICAL: ContextMenu handles ONLY transaction IDs from bucketPanelTxs
 *
 * The bucketId passed to this component is a Bucket ID (from buckets array)
 * The tx.id values come from Transaction objects (from transactions array)
 *
 * These are in SEPARATE namespaces - Bucket #1 and Transaction #1 are different!
 * This component maintains that separation correctly:
 * - bucketId is only used for bucket operations
 * - tx.id is only used for transaction operations (onSelectTransaction, onRemoveTransaction)
 */

interface ContextMenuProps {
  x: number
  y: number
  bucketId?: number
  buckets: api.Bucket[]
  bucketPanelTxs: api.Transaction[]
  bucketPanelVisibleCount: number
  suggestionsEnabled: boolean
  onUpload: () => void
  onStatistics: () => void
  onCreateBucket: () => void
  onToggleSuggestions: () => void
  onClose: () => void
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void
  onSelectTransaction: (txId: number) => void
  onRemoveTransaction: (txId: number) => void
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  bucketId,
  buckets,
  bucketPanelTxs,
  bucketPanelVisibleCount,
  suggestionsEnabled,
  onUpload,
  onStatistics,
  onCreateBucket,
  onToggleSuggestions,
  onClose,
  onScroll,
  onSelectTransaction,
  onRemoveTransaction,
}) => {
  const isBucketPanel = bucketId != null
  const bucket = buckets.find(b => b.id === bucketId)

  if (isBucketPanel) {
    return (
      <div className="context-menu" style={{ left: x, top: y, width: 320, maxHeight: 360, overflow: 'hidden', userSelect: 'none' }}>
        <div style={{ fontWeight: 700, padding: '6px 8px' }}>
          Bucket: {bucket?.name ?? 'Bucket'}
        </div>
        <div className="bucket-panel-list" style={{ height: 260, overflowY: 'auto', overflowX: 'hidden', padding: '6px 8px' }} onScroll={onScroll}>
          {bucketPanelTxs.slice(0, bucketPanelVisibleCount).map(tx => (
            <div
              key={`panel-tx-${tx.id}`}
              className="panel-row"
              style={{
                position: 'relative',
                width: '100%',
                height: 60,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                userSelect: 'none',
              }}
              onClick={(e) => {
                e.stopPropagation()
                onSelectTransaction(tx.id)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
                <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx.description}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {new Date(tx.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: '0 0 auto', marginLeft: 8, fontWeight: 700, marginRight: 0 }} className={`transaction-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                    {formatAmount(tx.amount)}
                  </div>
                  <button
                    className="remove-btn"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      onRemoveTransaction(tx.id)
                    }}
                    title="Remove from bucket"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="context-menu" style={{ left: x, top: y, userSelect: 'none' }}>
      <button onPointerDown={(e) => { e.preventDefault(); e.stopPropagation() }} onClick={onUpload}>
        Upload
      </button>
      <button onPointerDown={(e) => { e.preventDefault(); e.stopPropagation() }} onClick={onStatistics}>
        Statistics
      </button>
      <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.06)', margin: '6px 0' }} />
      <button onPointerDown={(e) => { e.preventDefault(); e.stopPropagation() }} onClick={onCreateBucket}>
        Create bucket
      </button>
      <button onPointerDown={(e) => { e.preventDefault(); e.stopPropagation() }} onClick={onToggleSuggestions}>
        {suggestionsEnabled ? 'Disable suggestions' : 'Enable suggestions'}
      </button>
      <button onPointerDown={(e) => { e.preventDefault(); e.stopPropagation() }} onClick={onClose}>
        Cancel
      </button>
    </div>
  )
}

