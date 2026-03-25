import React, { useState } from 'react'
import SortPage from './pages/Sort'
import UploadPage from './pages/Upload'
import StatisticsPage from './pages/Statistics'

const VERSION = 'v0.2.0' // bumped to indicate the marquee + keyboard changes

export default function App() {
  const [showUpload, setShowUpload] = useState(false)
  const [showStats, setShowStats] = useState(false)

  return (
    <div className="app-root">
      <SortPage />

      <div className="floating-menu">
        <div className="title">TransactionSorter <span style={{fontWeight:400, marginLeft:8, fontSize:12}}>{VERSION}</span></div>
        <div className="menu-actions">
          <button onClick={() => setShowUpload(true)}>Upload</button>
          <button onClick={() => setShowStats(true)}>Statistics</button>
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
