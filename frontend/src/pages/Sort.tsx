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
    offsetX?: number
    offsetY?: number
  }>(null)

  // context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [t, b] = await Promise.all([api.getUnsortedTransactions(), api.getAllBuckets()])
      setTransactions(t)
      setBuckets(b)

      // ensure we have positions for all buckets (preserve existing positions)
      const newBucketPositions = { ...bucketPositions }
      b.forEach((bucket, i) => {
        if (!Object.prototype.hasOwnProperty.call(newBucketPositions, bucket.id)) {
          newBucketPositions[bucket.id] = { x: 40, y: 40 + i * 120 }
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
        if (s && typeof s.bucketId === 'number') {
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
            // offsetLeft/offsetTop are relative to the canvas content box — reliable for positioning
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
          setTxPositions(prev => ({ ...prev, ...Object.fromEntries(d.ids.filter(i => Object.prototype.hasOwnProperty.call(prev, i)).map(i => [i, updated[i]])) }))
          setBucketPositions(prev => ({ ...prev, ...Object.fromEntries(d.ids.filter(i => Object.prototype.hasOwnProperty.call(prev, i)).map(i => [i, updated[i]])) }))
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
            // assign transaction ids only (filter out bucket ids)
            const txIds = d.ids.filter(id => Object.prototype.hasOwnProperty.call(txPositions, id))
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

      // finish marquee selection
      if (isSelectingRef.current) {
        isSelectingRef.current = false
        const m = marquee
        setMarquee(null)
        startPointRef.current = null
        if (m) {
          // select nodes that intersect marquee
          const canvas = canvasRef.current
          if (canvas) {
            const cRect = canvas.getBoundingClientRect()
            const newlySelected: Record<number, boolean> = {}
            transactions.forEach(t => {
              const el = nodeRefs.current[`tx-${t.id}`]
              if (!el) return
              const r = el.getBoundingClientRect()
              const rel = { left: r.left - cRect.left, top: r.top - cRect.top, right: r.right - cRect.left, bottom: r.bottom - cRect.top }
              const intersects = !(rel.left > m.x + m.w || rel.right < m.x || rel.top > m.y + m.h || rel.bottom < m.y)
              if (intersects) newlySelected[t.id] = true
            })
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
  }, [bucketPositions, txPositions, transactions, selectedMap, suggestionsEnabled])

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
    ids.forEach(i => {
      if (Object.prototype.hasOwnProperty.call(txPositions, i)) initialPositions[i] = { ...txPositions[i] }
      else if (Object.prototype.hasOwnProperty.call(bucketPositions, i)) initialPositions[i] = { ...bucketPositions[i] }
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
    setContextMenu({ x: e.clientX, y: e.clientY })
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

  return (
    <section className="sort-page" style={{height:'100%',width:'100%'}} onContextMenu={onContextMenu}>
      <div ref={canvasRef} className="canvas" onPointerDown={onCanvasPointerDown} style={{height:'100%'}}>
        {loading && <div className="loading">Loading...</div>}

        {/* buckets as nodes */}
        {buckets.map(b => {
          const pos = bucketPositions[b.id] || { x: 20, y: 20 }
          return (
            <div key={b.id}
                 ref={el => { nodeRefs.current[`bucket-${b.id}`] = el }}
                 className={`node bucket-node ${hoverBucket === b.id ? 'highlight' : ''}`}
                 style={{ left: pos.x, top: pos.y }}
                 onPointerDown={e => startNodeDrag(e, 'bucket', b.id)}>
              <div className="node-title">{b.name}</div>
            </div>
          )
        })}

        {/* transactions as nodes */}
        {transactions.map(t => {
          const pos = txPositions[t.id] || { x: 320, y: 20 }
          return (
            <div key={t.id}
                 ref={el => { nodeRefs.current[`tx-${t.id}`] = el }}
                 className={`node tx-node ${selectedMap[t.id] ? 'selected' : ''}`}
                 style={{ left: pos.x, top: pos.y }}
                 onPointerDown={e => startNodeDrag(e, 'tx', t.id)}
                 onPointerEnter={e => { setLastHoveredId(t.id); fetchSuggestion(t.id, t.description, e.currentTarget as HTMLElement) }}
                 onPointerLeave={() => { clearSuggestion(t.id); setLastHoveredId(null) }}>
              <div className="node-title">{t.description}</div>
            </div>
          )
        })}

        {/* render suggestion popups at canvas level */}
        {Object.keys(suggestions).map(k => {
          const id = Number(k)
          const s = suggestions[id]
          if (!s) return null
          const pos = suggestionPos[id] || { left: 0, top: 0 }
          return (
            <div key={`suggest-${id}`} className="suggestion absolute" style={{ left: pos.left, top: pos.top }}>
              <div>Suggestion: {s.category}</div>
              <div style={{opacity:0.8,fontSize:12,marginTop:6}}>Press "s" to accept suggestion</div>
            </div>
          )
        })}

        {/* marquee overlay */}
        {marquee && (
          <div className="marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
        )}

      </div>

      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={createBucketAtContext}>Create bucket</button>
          <button onClick={() => { setSuggestionsEnabled(prev => !prev); setContextMenu(null) }}>{suggestionsEnabled ? 'Disable suggestions' : 'Enable suggestions'}</button>
          <button onClick={() => setContextMenu(null)}>Cancel</button>
        </div>
      )}
    </section>
  )
}
