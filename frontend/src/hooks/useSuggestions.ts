/**
 * Hook for managing suggestion popups
 * Handles fetching, positioning, and clearing suggestions
 */

import { useEffect } from 'react'
import { calculateSuggestionPosition } from '../utils/suggestionUtils'
import * as apiWrappers from '../utils/apiWrappers'
import * as api from '../services/api'

interface UseSuggestionsProps {
  canvasRef: React.MutableRefObject<HTMLDivElement | null>
  nodeRefs: Record<string, HTMLElement | null>
  hoverTimers: React.MutableRefObject<Record<number, any>>
  suggestionsEnabled: boolean
  transactions: api.Transaction[]
  setSuggestions: (updater: (p: Record<number, api.CategoryScore | null>) => Record<number, api.CategoryScore | null>) => void
  setVisibleSuggestionIds: (updater: (p: Record<number, boolean>) => Record<number, boolean>) => void
  setSuggestionPos: (updater: (p: Record<number, { left: number; top: number }>) => Record<number, { left: number; top: number }>) => void
  setLastHoveredId: (id: number | null) => void
}

export function useSuggestions({
  canvasRef,
  nodeRefs,
  hoverTimers,
  suggestionsEnabled,
  transactions,
  setSuggestions,
  setVisibleSuggestionIds,
  setSuggestionPos,
  setLastHoveredId,
}: UseSuggestionsProps) {
  // Clear suggestions when transactions change
  useEffect(() => {
    hoverTimers.current = {}
    setSuggestions({})
    setVisibleSuggestionIds({})
  }, [transactions])

  const fetchSuggestion = async (id: number, description: string) => {
    if (!suggestionsEnabled) return

    clearTimeout(hoverTimers.current[id])
    const timer = setTimeout(async () => {
      if (hoverTimers.current[id] !== timer) return
      const s = await apiWrappers.getSuggestion(description)
      if (hoverTimers.current[id] === timer) {
        setSuggestions(p => ({ ...p, [id]: s }))
        setLastHoveredId(id)
        setVisibleSuggestionIds(p => ({ ...p, [id]: true }))

        // Position the suggestion popup
        try {
          const el = nodeRefs[`tx-${id}`]
          if (el) {
            const canvasRect = canvasRef.current?.getBoundingClientRect() || null
            const pos = calculateSuggestionPosition(el, canvasRect)
            if (pos) {
              setSuggestionPos(p => ({ ...p, [id]: pos }))
            }
          }
        } catch (err) {
          console.error('Error positioning suggestion:', err)
        }
      }
    }, 600)
    hoverTimers.current[id] = timer as any
  }

  const clearSuggestion = (id: number) => {
    clearTimeout(hoverTimers.current[id])
    delete hoverTimers.current[id]
    setVisibleSuggestionIds(p => {
      const copy = { ...p }
      delete copy[id]
      return copy
    })
    setSuggestions(p => {
      const copy = { ...p }
      delete copy[id]
      return copy
    })
    setSuggestionPos(p => {
      const copy = { ...p }
      delete copy[id]
      return copy
    })
  }

  return { fetchSuggestion, clearSuggestion }
}

