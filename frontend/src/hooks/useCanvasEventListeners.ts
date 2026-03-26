/**
 * Hook for managing global event listeners and keyboard shortcuts
 */

import { useEffect } from 'react'

interface UseCanvasEventListenersProps {
  onGlobalPointerDown: (e: PointerEvent) => void
  onGlobalKeyDown: (e: KeyboardEvent) => void
  onGlobalContextMenu: (e: MouseEvent) => void
}

export function useCanvasEventListeners({
  onGlobalPointerDown,
  onGlobalKeyDown,
  onGlobalContextMenu,
}: UseCanvasEventListenersProps) {
  useEffect(() => {
    window.addEventListener('pointerdown', onGlobalPointerDown)
    window.addEventListener('keydown', onGlobalKeyDown)
    window.addEventListener('contextmenu', onGlobalContextMenu)

    return () => {
      window.removeEventListener('pointerdown', onGlobalPointerDown)
      window.removeEventListener('keydown', onGlobalKeyDown)
      window.removeEventListener('contextmenu', onGlobalContextMenu)
    }
  }, [onGlobalPointerDown, onGlobalKeyDown, onGlobalContextMenu])
}

