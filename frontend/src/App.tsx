import React, { useState, useEffect } from 'react'
import SortPage from './pages/Sort'
import UploadPage from './pages/Upload'
import StatisticsPage from './pages/Statistics'

const VERSION = 'v0.8.0' // bumped to reflect UI changes

export default function App() {
  const [showUpload, setShowUpload] = useState(false)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    function onOpenUpload() { setShowUpload(true) }
    function onOpenStats() { setShowStats(true) }
    window.addEventListener('openUploadModal', onOpenUpload)
    window.addEventListener('openStatisticsModal', onOpenStats)

    // expose direct helpers on window as a more robust API for other components
    ;(window as any).openUploadModal = () => setShowUpload(true)
    ;(window as any).openStatisticsModal = () => setShowStats(true)

    return () => {
      window.removeEventListener('openUploadModal', onOpenUpload)
      window.removeEventListener('openStatisticsModal', onOpenStats)
      // cleanup helpers
      try { delete (window as any).openUploadModal } catch {}
      try { delete (window as any).openStatisticsModal } catch {}
    }
  }, [])

  return (
    <div className="app-root">
      <SortPage />

      <div className="floating-menu">
        <div className="title">TransactionSorter <span style={{fontWeight:400, marginLeft:8, fontSize:12}}>{VERSION}</span></div>
        <div className="menu-actions">
          {/* Upload & Statistics moved to canvas context menu */}
        </div>
      </div>

      {showUpload && (
        <div className="modal" onClick={() => setShowUpload(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close" onClick={() => setShowUpload(false)}>✕</button>
            <UploadPage />
          </div>
        </div>
      )}

      {showStats && (
        <div className="modal" onClick={() => setShowStats(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close" onClick={() => setShowStats(false)}>✕</button>
            <StatisticsPage />
          </div>
        </div>
      )}
    </div>
  )
}
