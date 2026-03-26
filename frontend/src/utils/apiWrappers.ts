import * as api from '../services/api'

/**
 * CRITICAL: ID Namespace Separation at API Layer
 *
 * All functions in this file maintain strict separation between:
 * - bucketId: numeric ID of a bucket (from Bucket entities)
 * - transactionId: numeric ID of a transaction (from Transaction entities)
 *
 * These are in SEPARATE namespaces:
 * - addTransactionToBucketSafe(bucketId, transactionId)
 *   => ONLY transactionIds are added to buckets, NEVER bucketIds
 * - removeTransactionFromBucketSafe(bucketId, transactionId)
 *   => ONLY removes transactionIds from the bucket
 * - addTransactionsToBucketBatch(bucketId, txIds)
 *   => txIds array contains ONLY transaction IDs, NEVER bucket IDs
 *
 * The caller is RESPONSIBLE for ensuring type correctness when calling these functions.
 * DO NOT pass bucket IDs where transaction IDs are expected!
 */

export async function loadBoardData() {
  const [transactions, buckets] = await Promise.all([
    api.getUnsortedTransactions(),
    api.getAllBuckets(),
  ])
  return { transactions, buckets }
}

export async function addTransactionToBucketSafe(bucketId: number, transactionId: number) {
  try {
    await api.addTransactionToBucket(bucketId, transactionId)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, error: err }
  }
}

export async function removeTransactionFromBucketSafe(bucketId: number, transactionId: number) {
  try {
    await api.removeTransactionFromBucket(bucketId, transactionId)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, error: err }
  }
}

export async function createBucketSafe(name: string) {
  try {
    await api.createBucket(name)
    return { success: true }
  } catch (err) {
    console.error(err)
    alert('Could not create bucket')
    return { success: false, error: err }
  }
}

export async function getSuggestion(description: string) {
  try {
    return await api.categorize(description)
  } catch (err) {
    console.error('Failed to get suggestion:', err)
    return null
  }
}

export async function getTransactionsInBucketSafe(bucketId: number) {
  try {
    const list = await api.getTransactionsInBucket(bucketId)
    return Array.isArray(list) ? [...list].reverse() : []
  } catch (err) {
    console.error(err)
    return []
  }
}

export function addTransactionsToBucketBatch(bucketId: number, txIds: number[]) {
  return Promise.all(txIds.map(id => api.addTransactionToBucket(bucketId, id)))
}

export function removeTransactionsFromBucketBatch(bucketId: number, txIds: number[]) {
  return Promise.all(txIds.map(id => api.removeTransactionFromBucket(bucketId, id)))
}

