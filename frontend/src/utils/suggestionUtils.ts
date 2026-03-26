/**
 * Suggestion utilities
 * Handles positioning calculations and label formatting for suggestions
 */

export interface SuggestionPosition {
  left: number
  top: number
}

export function calculateSuggestionPosition(
  nodeElement: HTMLElement,
  canvasRect: DOMRect | null
): SuggestionPosition | null {
  if (!canvasRect) return null
  
  const rect = nodeElement.getBoundingClientRect()
  const left = rect.right - canvasRect.left + 8
  const top = rect.top - canvasRect.top
  
  return { left, top }
}

export function shouldShowBucketLabel(category: string | undefined, bucketLabel: string): boolean {
  return !(String(category || '').toLowerCase() === String(bucketLabel || '').toLowerCase())
}

