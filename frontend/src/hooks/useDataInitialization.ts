/**
 * Hook for data initialization and loading
 * Handles loading transactions and buckets from API
 */

import { useEffect } from 'react'
import { Pos } from '../types/common'
import { NODE_H_BUCKET } from '../utils/canvasUtils'
import * as apiWrappers from '../utils/apiWrappers'
import * as api from '../services/api'

interface UseDataInitializationProps {
  setLoading: (loading: boolean) => void
  setTransactions: (txs: api.Transaction[]) => void
  setBuckets: (bs: api.Bucket[]) => void
  setBucketPositions: (positions: Record<number, Pos>) => void
  setTxPositions: (positions: Record<number, Pos>) => void
  bucketPositions: Record<number, Pos>
  txPositions: Record<number, Pos>
}

export function useDataInitialization({
  setLoading,
  setTransactions,
  setBuckets,
  setBucketPositions,
  setTxPositions,
  bucketPositions,
  txPositions,
}: UseDataInitializationProps) {
  const loadData = async () => {
    setLoading(true)
    try {
      const { transactions, buckets } = await apiWrappers.loadBoardData()
      setTransactions(transactions)
      setBuckets(buckets)

      // Initialize bucket positions
      const newBucketPos: Record<number, Pos> = { ...bucketPositions }
      const bucketBaselineY = 96
      buckets.forEach((b, i) => {
        if (!(b.id in newBucketPos)) {
          newBucketPos[b.id] = { x: 40, y: bucketBaselineY + i * NODE_H_BUCKET }
        }
      })
      setBucketPositions(newBucketPos)

      // Initialize transaction positions
      const newTxPos: Record<number, Pos> = { ...txPositions }
      transactions.forEach((t, i) => {
        if (!(t.id in newTxPos)) {
          newTxPos[t.id] = { x: 360 + (i % 6) * 180, y: 40 + Math.floor(i / 6) * 100 }
        }
      })
      setTxPositions(newTxPos)
    } finally {
      setLoading(false)
    }
  }

  // Load on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Load when transactions are uploaded
  useEffect(() => {
    const onUploaded = () => loadData()
    window.addEventListener('transactionsUploaded', onUploaded)
    return () => window.removeEventListener('transactionsUploaded', onUploaded)
  }, [])

  return { loadData }
}

