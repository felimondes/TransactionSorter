/**
 * ID Manager - Ensures strict separation between transaction and bucket IDs
 * Transaction IDs and Bucket IDs are in separate namespaces with prefixes
 */

export type IDWithType = { id: number; type: 'tx' | 'bucket' }

/**
 * Create a namespaced key to uniquely identify an item
 * This prevents collisions between transaction #1 and bucket #1
 */
export function createIdKey(id: number, type: 'tx' | 'bucket'): string {
  return `${type}:${id}`
}

/**
 * Parse a namespaced key back to ID and type
 */
export function parseIdKey(key: string): IDWithType | null {
  const parts = key.split(':')
  if (parts.length !== 2) return null
  const type = parts[0] as 'tx' | 'bucket'
  const id = Number(parts[1])
  if (isNaN(id)) return null
  return { id, type }
}

/**
 * Build position maps with type-aware keys
 */
export function createTypedPositionMaps(
  txPositions: Record<number, { x: number; y: number }>,
  bucketPositions: Record<number, { x: number; y: number }>
): Record<string, { x: number; y: number }> {
  const result: Record<string, { x: number; y: number }> = {}

  Object.entries(txPositions).forEach(([id, pos]) => {
    result[createIdKey(Number(id), 'tx')] = pos
  })

  Object.entries(bucketPositions).forEach(([id, pos]) => {
    result[createIdKey(Number(id), 'bucket')] = pos
  })

  return result
}

/**
 * Split typed positions back into separate maps
 */
export function splitTypedPositionMaps(
  typedPositions: Record<string, { x: number; y: number }>
): {
  txPositions: Record<number, { x: number; y: number }>
  bucketPositions: Record<number, { x: number; y: number }>
} {
  const txPositions: Record<number, { x: number; y: number }> = {}
  const bucketPositions: Record<number, { x: number; y: number }> = {}

  Object.entries(typedPositions).forEach(([key, pos]) => {
    const parsed = parseIdKey(key)
    if (!parsed) return

    if (parsed.type === 'tx') {
      txPositions[parsed.id] = pos
    } else {
      bucketPositions[parsed.id] = pos
    }
  })

  return { txPositions, bucketPositions }
}

/**
 * Merge two sets of selected IDs by type, ensuring no collisions
 */
export function mergeSelectedByType(
  selectedTxIds: number[],
  selectedBucketIds: number[]
): { txIds: number[]; bucketIds: number[] } {
  // Ensure no overlap (shouldn't happen in normal operation)
  const txSet = new Set(selectedTxIds)
  const bucketSet = new Set(selectedBucketIds)

  // Remove any tx IDs from bucket set and vice versa (defensive)
  bucketSet.forEach(bid => {
    if (txSet.has(bid)) txSet.delete(bid)
  })

  return { txIds: Array.from(txSet), bucketIds: Array.from(bucketSet) }
}

