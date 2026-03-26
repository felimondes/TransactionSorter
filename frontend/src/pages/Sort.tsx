import React, { useEffect, useState, useRef } from 'react'
import * as api from '../services/api'

type Pos = { x: number; y: number }


export default function SortPage() {
  const [transactions, setTransactions] = useState<api.Transaction[]>([])
  const [buckets, setBuckets] = useState<api.Bucket[]>([])
  const [selectedMap, setSelectedMap] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(false)
  const hoverTimers = useRef<Record<number, any>>({})
  const [suggestions, setSuggestions] = useState<Record<number, api.CategoryScore | null>>({})
  const [suggestionPos, setSuggestionPos] = useState<Record<number, { left: number; top: number }>>({})
  const [hoverBucket, setHoverBucket] = useState<number | null>(null)
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true)
  const [lastHoveredId, setLastHoveredId] = useState<number | null>(null)

  // canvas state
  const [bucketPositions, setBucketPositions] = useState<Record<number, Pos>>({})
  const [txPositions, setTxPositions] = useState<Record<number, Pos>>({})
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({})

  // marquee selection
  const isSelectingRef = useRef(false)
  const startPointRef = useRef<{ x: number; y: number } | null>(null)
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  // dragging state: can be single bucket/tx or group
  const draggingRef = useRef<null | {
    mode: 'bucket' | 'tx' | 'group'
    ids: number[]
    startClientX: number
    startClientY: number
    initialPositions: Record<number, Pos>
    idTypes?: Record<number, 'tx' | 'bucket'>
    offsetX?: number
    offsetY?: number
  }>(null)

  // context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  // small helpers for formatting
  function formatDay(dateStr: string) {
    if (!dateStr) return '?'
    try {
      const d = new Date(dateStr)
      if (!Number.isNaN(d.getTime())) return String(d.getDate()).padStart(2, '0')
    } catch {}
    // try dd-MM-yyyy pattern
    const m = dateStr.match(/(\d{1,2})-(\d{1,2})-(\d{4})/)
    if (m) return m[1].padStart(2, '0')
    // fallback: try first two chars
    return dateStr.slice(0, 2)
  }
  function formatAmount(v: number) {
    if (v == null || Number.isNaN(v)) return '-'
    // assume amounts are in currency units; show two decimals
    return (v >= 0 ? '' : '-') + Math.abs(v).toFixed(2)
  }

  async function load() {
    setLoading(true)
    try {
      const [t, b] = await Promise.all([api.getUnsortedTransactions(), api.getAllBuckets()])
      setTransactions(t)
      setBuckets(b)

      // ensure we have positions for all buckets (preserve existing positions)
      const newBucketPositions = { ...bucketPositions }
      // ensure buckets spawn below the floating menu (menu sits at top-left around ~16px + padding)
      // set a safe baseline to avoid spawning underneath the menu
      const bucketBaselineY = 96
      b.forEach((bucket, i) => {
        if (!Object.prototype.hasOwnProperty.call(newBucketPositions, bucket.id)) {
          newBucketPositions[bucket.id] = { x: 40, y: bucketBaselineY + i * 120 }
        }
      })
      setBucketPositions(newBucketPositions)

      // ensure we have positions for all transactions (preserve existing positions)
      const newTxPositions = { ...txPositions }
      t.forEach((tx, i) => {
        if (!Object.prototype.hasOwnProperty.call(newTxPositions, tx.id)) {
          newTxPositions[tx.id] = { x: 360 + ((i % 6) * 180), y: 40 + Math.floor(i / 6) * 100 }
        }
      })
      setTxPositions(newTxPositions)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // reload when UploadPage signals new transactions were uploaded
  useEffect(() => {
    function onUploaded() { load() }
    window.addEventListener('transactionsUploaded', onUploaded)
    return () => window.removeEventListener('transactionsUploaded', onUploaded)
  }, [])

  // clicking anywhere outside context menu or canvas should hide context menu and clear selection
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      // ignore right-clicks / non-left buttons so contextmenu can open unhindered
      if (typeof (e as any).button === 'number' && (e as any).button !== 0) return
      const target = e.target as HTMLElement
      // hide context menu if click outside it
      if (target && !target.closest('.context-menu')) {
        setContextMenu(null)
      }
      // if click outside canvas, clear selection
      if (target && !target.closest('.canvas')) {
        // clear selection when clicking outside canvas
        setSelectedMap({})
      }
    }
    window.addEventListener('pointerdown', onPointerDown)
    // hide context menu on Escape
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') setContextMenu(null) }
    window.addEventListener('keydown', onKeyDown)
    // global 's' key handler to accept current suggestion when appropriate
    function onGlobalKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 's') {
        // only allow when suggestions enabled and single/no selection
        const selectedCount = Object.keys(selectedMap).filter(k => selectedMap[Number(k)]).length
        if (!suggestionsEnabled || selectedCount > 1) return
        const id = lastHoveredId
        if (id == null) return
        const s = suggestions[id]
        if (s && s.bucketId != null) {
          addToBucket(s.bucketId, id).catch(console.error)
        }
      }
    }
    window.addEventListener('keydown', onGlobalKey)
    return () => { window.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keydown', onGlobalKey) }
  }, [selectedMap, suggestionsEnabled, lastHoveredId, suggestions])

  // clear suggestion timers whenever transactions change to avoid stale behavior
  useEffect(() => {
    hoverTimers.current = {}
    setSuggestions({})
  }, [transactions])

  // if multiple items are selected, hide suggestions
  useEffect(() => {
    const selectedCount = Object.keys(selectedMap).filter(k => selectedMap[Number(k)]).length
    if (selectedCount > 1) {
      setSuggestions({})
      setLastHoveredId(null)
    }
  }, [selectedMap])

  // suggestions
  async function fetchSuggestion(id: number, description: string, target?: HTMLElement) {
    // do not fetch suggestions if disabled or group selection is active
    const selectedCount = Object.keys(selectedMap).filter(k => selectedMap[Number(k)]).length
    if (!suggestionsEnabled || selectedCount > 1) return

    clearTimeout(hoverTimers.current[id])
    hoverTimers.current[id] = setTimeout(async () => {
      const s = await api.categorize(description)
      setSuggestions(prev => ({ ...prev, [id]: s }))
      setLastHoveredId(id)
      // position
      try {
        const canvas = canvasRef.current
        // prefer using the stored positions (txPositions/bucketPositions) which are canvas-content coordinates
        const storedPos = txPositions[id] || bucketPositions[id]
        if (canvas && storedPos) {
          const nodeEl = nodeRefs.current[`tx-${id}`] || nodeRefs.current[`bucket-${id}`]
          if (nodeEl) {
            const left = (nodeEl.offsetLeft || storedPos.x) + (nodeEl.offsetWidth || 180) + 8
            const top = nodeEl.offsetTop || storedPos.y
            setSuggestionPos(prev => ({ ...prev, [id]: { left, top } }))
          } else {
            const nodeWidth = 180
            const left = storedPos.x + nodeWidth + 8
            const top = storedPos.y
            setSuggestionPos(prev => ({ ...prev, [id]: { left, top } }))
          }
        } else if (canvas && target) {
          const cRect = canvas.getBoundingClientRect()
          const tRect = target.getBoundingClientRect()
          const left = tRect.right - cRect.left + 8
          const top = tRect.top - cRect.top
          setSuggestionPos(prev => ({ ...prev, [id]: { left, top } }))
        }
      } catch (err) { }
    }, 200)
  }
  function clearSuggestion(id: number) {
    clearTimeout(hoverTimers.current[id])
    setTimeout(() => setSuggestions(prev => ({ ...prev, [id]: null })), 200)
    setLastHoveredId(null)
  }

  // --- pointer handlers for canvas & nodes ---
  useEffect(() => {
    function pointerMove(e: PointerEvent) {
      // dragging
      const d = draggingRef.current
      if (d) {
        const canvas = canvasRef.current
        if (!canvas) return
        // single-node drag: compute absolute position from pointer and stored offset to avoid jumps
        if ((d.mode === 'bucket' || d.mode === 'tx') && d.ids.length === 1) {
          const id = d.ids[0]
          const cRect = canvas.getBoundingClientRect()
          const left = e.clientX - cRect.left + (canvas.scrollLeft || 0) - (d.offsetX ?? 0)
          const top = e.clientY - cRect.top + (canvas.scrollTop || 0) - (d.offsetY ?? 0)
          // clamp to finite numbers and not negative
          const clampedLeft = Number.isFinite(left) ? Math.max(0, Math.round(left)) : 0
          const clampedTop = Number.isFinite(top) ? Math.max(0, Math.round(top)) : 0
          const newPos = { x: clampedLeft, y: clampedTop }
          if (d.mode === 'bucket') setBucketPositions(prev => ({ ...prev, [id]: newPos }))
          else setTxPositions(prev => ({ ...prev, [id]: newPos }))
        } else {
          // group move - use delta from start
          const dx = e.clientX - d.startClientX
          const dy = e.clientY - d.startClientY
          const updated: Record<number, Pos> = {}
          d.ids.forEach(id => {
            const initial = d.initialPositions[id] || { x: 0, y: 0 }
            updated[id] = { x: initial.x + dx, y: initial.y + dy }
          })

          // apply updates only to the appropriate position maps based on idTypes
          const txUpdates = Object.fromEntries(d.ids.filter(i => (d.idTypes ? d.idTypes[i] === 'tx' : Object.prototype.hasOwnProperty.call(txPositions, i))).map(i => [i, updated[i]]))
          const bucketUpdates = Object.fromEntries(d.ids.filter(i => (d.idTypes ? d.idTypes[i] === 'bucket' : Object.prototype.hasOwnProperty.call(bucketPositions, i))).map(i => [i, updated[i]]))

          if (Object.keys(txUpdates).length > 0) setTxPositions(prev => ({ ...prev, ...txUpdates }))
          if (Object.keys(bucketUpdates).length > 0) setBucketPositions(prev => ({ ...prev, ...bucketUpdates }))
        }

        // highlight bucket under pointer when dragging tx (works for single or group)
        if (d.mode === 'tx' || d.mode === 'group') {
          let found: number | null = null
          Object.keys(bucketPositions).forEach(k => {
            const bid = Number(k)
            const nodeEl = nodeRefs.current[`bucket-${bid}`]
            if (nodeEl) {
              const r = nodeEl.getBoundingClientRect()
              if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) found = bid
            }
          })
          setHoverBucket(found)
        }
      }

      // marquee selection update if selecting
      if (isSelectingRef.current) {
        const canvas = canvasRef.current
        if (!canvas) return
        const sp = startPointRef.current
        if (!sp) return
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const left = Math.min(sp.x, x)
        const top = Math.min(sp.y, y)
        const w = Math.abs(x - sp.x)
        const h = Math.abs(y - sp.y)
        setMarquee({ x: left, y: top, w, h })
      }
      // end marquee handling
    }

    function pointerUp(e: PointerEvent) {
      const d = draggingRef.current
      if (d) {
        // if dropping group or tx, check if over bucket to assign transactions
        if (d.mode === 'tx' || d.mode === 'group') {
          // find bucket under pointer
          let found: number | null = null
          Object.keys(bucketPositions).forEach(k => {
            const bid = Number(k)
            const el = nodeRefs.current[`bucket-${bid}`]
            if (el) {
              const r = el.getBoundingClientRect()
              if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) found = bid
            }
          })
          if (found !== null) {
            // assign transaction ids only (filter out bucket ids) using idTypes when available
            const txIds = d.ids.filter(id => d.idTypes ? d.idTypes[id] === 'tx' : Object.prototype.hasOwnProperty.call(txPositions, id))
            if (txIds.length > 0) {
              Promise.all(txIds.map(id => api.addTransactionToBucket(found!, id))).then(() => load())
            }
          }
        }
        draggingRef.current = null
        setHoverBucket(null)
        // clear user-select lock
        document.body.style.userSelect = ''
      }

      // finish marquee selection - compute rectangle from startPointRef + event (avoid stale state)
      if (isSelectingRef.current) {
        isSelectingRef.current = false
        const canvas = canvasRef.current
        const sp = startPointRef.current
        setMarquee(null)
        startPointRef.current = null
        // release user-select lock
        document.body.style.userSelect = ''
        if (canvas && sp) {
          const cRect = canvas.getBoundingClientRect()
          const x = e.clientX - cRect.left
          const y = e.clientY - cRect.top
          const left = Math.min(sp.x, x)
          const top = Math.min(sp.y, y)
          const w = Math.abs(x - sp.x)
          const h = Math.abs(y - sp.y)
          if (w > 0 && h > 0) {
            const newlySelected: Record<number, boolean> = {}
            // transactions
            transactions.forEach(t => {
              // prefer stored position (canvas coordinates)
              const p = txPositions[t.id]
              let nodeLeft = p ? p.x : undefined
              let nodeTop = p ? p.y : undefined
              let nodeW = 180
              let nodeH = 60
              const el = nodeRefs.current[`tx-${t.id}`]
              if (el) {
                nodeW = el.offsetWidth || nodeW
                nodeH = el.offsetHeight || nodeH
                if (nodeLeft === undefined || nodeTop === undefined) {
                  const r = el.getBoundingClientRect()
                  nodeLeft = r.left - cRect.left
                  nodeTop = r.top - cRect.top
                }
              }
              if (nodeLeft !== undefined && nodeTop !== undefined) {
                const rel = { left: nodeLeft, top: nodeTop, right: nodeLeft + nodeW, bottom: nodeTop + nodeH }
                const intersects = !(rel.left > left + w || rel.right < left || rel.top > top + h || rel.bottom < top)
                if (intersects) newlySelected[t.id] = true
              }
            })

            // NOTE: intentionally only select transactions via marquee to avoid accidentally including buckets
            // This prevents buckets from being moved/selected when the user is marquee-selecting multiple transactions.

            setSelectedMap(() => newlySelected)
            // when multiple selected, suggestions should be disabled for them
            setSuggestions({})
            setLastHoveredId(null)
          }
        }
      }
      // end marquee
    }

    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerup', pointerUp)
    return () => { window.removeEventListener('pointermove', pointerMove); window.removeEventListener('pointerup', pointerUp) }
  }, [bucketPositions, txPositions, transactions, selectedMap, suggestionsEnabled, buckets])

  // add missing helper
  async function addToBucket(bucketId: number, txId: number) {
    try {
      await api.addTransactionToBucket(bucketId, txId)
      await load()
    } catch (err) {
      console.error('addToBucket failed', err)
      throw err
    }
  }

  function onCanvasPointerDown(e: React.PointerEvent) {
    // left button only
    if (e.button !== 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const target = e.target as HTMLElement
    // if clicked on a node, node's pointerdown handles dragging; do nothing here
    if (target.closest('.node')) return
    // clear previous selection when clicking empty canvas
    setSelectedMap({})
    // start marquee selection
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    startPointRef.current = { x, y }
    isSelectingRef.current = true
    setMarquee({ x, y, w: 0, h: 0 })
    // prevent text selection
    e.preventDefault()
    // lock user-select while marquee is active
    document.body.style.userSelect = 'none'
  }

  function startNodeDrag(e: React.PointerEvent, type: 'bucket' | 'tx', id: number) {
    // left button only
    if (e.button !== 0) return
    const canvas = canvasRef.current
    if (!canvas) return

    // determine group drag if this id is selected
    const selectedIds = Object.keys(selectedMap).map(k => Number(k)).filter(k => selectedMap[k])
    // if the clicked node was not part of selection, reset selection to only this node
    if (!selectedMap[id]) {
      setSelectedMap({ [id]: true })
    }
    const ids = selectedMap[id] ? selectedIds : [id]
    const initialPositions: Record<number, Pos> = {}
    const idTypes: Record<number, 'tx' | 'bucket'> = {}
    ids.forEach(i => {
      if (Object.prototype.hasOwnProperty.call(txPositions, i)) { initialPositions[i] = { ...txPositions[i] }; idTypes[i] = 'tx' }
      else if (Object.prototype.hasOwnProperty.call(bucketPositions, i)) { initialPositions[i] = { ...bucketPositions[i] }; idTypes[i] = 'bucket' }
      else initialPositions[i] = { x: 0, y: 0 } // fallback
    })
    // compute pointer offset relative to stored position (preferred) to avoid jumps
    let offsetX = 0
    let offsetY = 0
    const pos = (type === 'tx' ? txPositions[id] : bucketPositions[id])
    const cRect = canvas.getBoundingClientRect()
    const pointerCanvasX = e.clientX - cRect.left + (canvas.scrollLeft || 0)
    const pointerCanvasY = e.clientY - cRect.top + (canvas.scrollTop || 0)
    if (pos) {
      offsetX = pointerCanvasX - pos.x
      offsetY = pointerCanvasY - pos.y
    } else {
      const nodeEl = nodeRefs.current[`${type}-${id}`]
      if (nodeEl) {
        const nodeRect = nodeEl.getBoundingClientRect()
        offsetX = e.clientX - nodeRect.left
        offsetY = e.clientY - nodeRect.top
      }
    }
    draggingRef.current = {
      mode: ids.length > 1 ? 'group' : type,
      ids,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initialPositions,
      idTypes,
      offsetX,
      offsetY
    }
    // prevent marquee start when clicking node
    isSelectingRef.current = false
    // prevent text selection while dragging
    e.preventDefault()
    e.stopPropagation()
    // lock user-select on body for smoother dragging
    document.body.style.userSelect = 'none'
  }

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    // clamp to viewport so the menu doesn't end up off-screen
    const rawX = Number(e.clientX) || 0
    const rawY = Number(e.clientY) || 0
    const maxX = Math.max(0, window.innerWidth - 220)
    const maxY = Math.max(0, window.innerHeight - 120)
    const x = Math.min(rawX, maxX)
    const y = Math.min(rawY, maxY)
    console.debug('Sort: onContextMenu', rawX, rawY, 'clamped to', x, y)
    setContextMenu({ x, y })
  }

  async function createBucketAtContext() {
    setContextMenu(null)
    const name = window.prompt('Bucket name')
    if (!name) return
    try {
      await api.createBucket(name)
      await load()
    } catch (err) { alert('Could not create bucket') }
  }

  // helper to open Upload/Stats robustly (calls window helper if present, then dispatches event as fallback)
  function openUploadFromContext() {
    // schedule to next tick so pointer events finish and modal's click-to-close doesn't immediately fire
    setTimeout(() => {
      try { if ((window as any).openUploadModal) (window as any).openUploadModal() } catch (err) {}
      try { window.dispatchEvent(new Event('openUploadModal')) } catch (err) {}
    }, 0)
    setContextMenu(null)
  }
  function openStatsFromContext() {
    setTimeout(() => {
      try { if ((window as any).openStatisticsModal) (window as any).openStatisticsModal() } catch (err) {}
      try { window.dispatchEvent(new Event('openStatisticsModal')) } catch (err) {}
    }, 0)
    setContextMenu(null)
  }

  // ensure right-clicks open our custom menu even if React handlers don't fire
  useEffect(() => {
    function onGlobalContext(e: MouseEvent) {
      try {
        const target = e.target as HTMLElement
        if (target && target.closest('.canvas')) {
          e.preventDefault()
          const rawX = Number((e as any).clientX) || 0
          const rawY = Number((e as any).clientY) || 0
          const maxX = Math.max(0, window.innerWidth - 220)
          const maxY = Math.max(0, window.innerHeight - 120)
          const x = Math.min(rawX, maxX)
          const y = Math.min(rawY, maxY)
          console.debug('Global contextmenu detected on canvas', rawX, rawY, 'clamped to', x, y)
          setContextMenu({ x, y })
        }
      } catch (err) { }
    }
    window.addEventListener('contextmenu', onGlobalContext)
    return () => window.removeEventListener('contextmenu', onGlobalContext)
  }, [])

  return (
    <div className="page sort-page">
      <div className="canvas" ref={canvasRef} onContextMenu={(e) => { e.preventDefault(); onContextMenu(e) }} onPointerDown={onCanvasPointerDown}>
        {Object.entries(bucketPositions).map(([id, pos]) => {
          const bucket = buckets.find(b => b.id === Number(id))
          if (!bucket) return null
          const txCount = transactions.filter(t => t.bucketId === bucket.id).length
          const isHovered = hoverBucket === bucket.id
          return (
            <div
              key={id}
              ref={el => { nodeRefs.current[`bucket-${id}`] = el }}
              className={`node bucket ${selectedMap[bucket.id] ? 'selected' : ''} ${isHovered ? 'hover' : ''}`}
              style={{ left: pos.x, top: pos.y, width: 180, height: 120 }}
              onPointerDown={e => startNodeDrag(e, 'bucket', bucket.id)}
              onContextMenu={e => { e.preventDefault(); onContextMenu(e) }}
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
              className={`node transaction ${selectedMap[tx.id] ? 'selected' : ''}`}
              style={{ left: pos.x, top: pos.y, width: 180, height: 60 }}
              onPointerDown={e => startNodeDrag(e, 'tx', tx.id)}
              onContextMenu={e => { e.preventDefault(); onContextMenu(e) }}
              onPointerEnter={(e) => { const target = e.currentTarget as HTMLElement; fetchSuggestion(tx.id, tx.description, target) }}
              onPointerLeave={() => clearSuggestion(tx.id)}
            >
              <div className="transaction-content">
                <div className="transaction-description">{tx.description}</div>
                <div className="transaction-amount">{formatAmount(tx.amount)}</div>
                <div className="transaction-date">{formatDay(tx.date)}</div>
              </div>
            </div>
          )
        })}
        {marquee && (
          <div className="marquee-selection" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
        )}
        {loading && <div className="loading-overlay">Loading...</div>}

        {/* render suggestion popups inside the canvas so they align with node positions */}
        {Object.entries(suggestions).map(([idStr, s]) => {
          const id = Number(idStr)
          if (!s) return null
          const pos = suggestionPos[id]
          if (!pos) return null
          return (
            <div key={`suggest-${id}`} className="suggestion absolute" style={{ left: pos.left, top: pos.top }}>
              <div><strong>Suggested:</strong> {s.category} (bucket {s.bucketId})</div>
              <small>score: {Math.round((s.score || 0) * 100)}%</small>
              <div style={{marginTop:8,display:'flex',gap:8}}>
                <button onClick={() => { addToBucket(s.bucketId, id).catch(console.error); setSuggestions(prev => ({ ...prev, [id]: null })) }}>Accept</button>
                <button onClick={() => { setSuggestions(prev => ({ ...prev, [id]: null })); setLastHoveredId(null) }}>Dismiss</button>
              </div>
            </div>
          )
        })}

      </div>
      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => openUploadFromContext()}
          >Upload</button>
          <button
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => openStatsFromContext()}
          >Statistics</button>
          <hr style={{border:'none',borderTop:'1px solid rgba(0,0,0,0.06)',margin:'6px 0'}}/>
          <button onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); createBucketAtContext() }} onClick={() => createBucketAtContext()}>Create bucket</button>
          <button onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setSuggestionsEnabled(prev => !prev); setContextMenu(null) }} onClick={() => { setSuggestionsEnabled(prev => !prev); setContextMenu(null) }}>{suggestionsEnabled ? 'Disable suggestions' : 'Enable suggestions'}</button>
          <button onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu(null) }} onClick={() => setContextMenu(null)}>Cancel</button>
        </div>
      )}
    </div>
  )
}
