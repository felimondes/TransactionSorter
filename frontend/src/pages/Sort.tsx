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
      if (Object.keys(bucketPositions).length === 0 && b.length > 0) {
        const bp: Record<number, Pos> = {}
        b.forEach((bucket, i) => { bp[bucket.id] = { x: 40, y: 40 + i * 120 } })
        setBucketPositions(bp)
      }
      if (Object.keys(txPositions).length === 0 && t.length > 0) {
        const tp: Record<number, Pos> = {}
        t.forEach((tx, i) => { tp[tx.id] = { x: 360 + ((i % 6) * 180), y: 40 + Math.floor(i / 6) * 100 } })
        setTxPositions(tp)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // suggestions
  async function fetchSuggestion(id: number, description: string, target?: HTMLElement) {
    clearTimeout(hoverTimers.current[id])
    hoverTimers.current[id] = setTimeout(async () => {
      const s = await api.categorize(description)
      setSuggestions(prev => ({ ...prev, [id]: s }))
      // position
      try {
        const canvas = canvasRef.current
        if (canvas && target) {
          const cRect = canvas.getBoundingClientRect()
          const tRect = target.getBoundingClientRect()
          setSuggestionPos(prev => ({ ...prev, [id]: { left: tRect.right - cRect.left + 8, top: tRect.top - cRect.top } }))
        }
      } catch (err) { }
    }, 200)
  }
  function clearSuggestion(id: number) {
    clearTimeout(hoverTimers.current[id])
    setTimeout(() => setSuggestions(prev => ({ ...prev, [id]: null })), 200)
  }

  // --- pointer handlers for canvas & nodes ---
  useEffect(() => {
    function pointerMove(e: PointerEvent) {
      // dragging
      const d = draggingRef.current
      if (d) {
        const canvas = canvasRef.current
        if (!canvas) return
        const dx = e.clientX - d.startClientX
        const dy = e.clientY - d.startClientY
        if (d.mode === 'bucket' || d.mode === 'tx') {
          const id = d.ids[0]
          const initial = d.initialPositions[id]
          const newPos = { x: initial.x + dx, y: initial.y + dy }
          if (d.mode === 'bucket') setBucketPositions(prev => ({ ...prev, [id]: newPos }))
          else setTxPositions(prev => ({ ...prev, [id]: newPos }))

          // highlight bucket under pointer when dragging tx
          if (d.mode === 'tx') {
            let found: number | null = null
            Object.keys(bucketPositions).forEach(k => {
              const bid = Number(k)
              const el = nodeRefs.current[`bucket-${bid}`]
              if (el) {
                const r = el.getBoundingClientRect()
                if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) found = bid
              }
            })
            setHoverBucket(found)
          }
        } else if (d.mode === 'group') {
          // move all ids proportionally
          const updated: Record<number, Pos> = {}
          d.ids.forEach(id => {
            const initial = d.initialPositions[id]
            updated[id] = { x: initial.x + dx, y: initial.y + dy }
          })
          // split between tx and buckets
          setTxPositions(prev => ({ ...prev, ...Object.fromEntries(d.ids.filter(i => prev[i]).map(i => [i, updated[i]])) }))
          // only update bucketPositions for ids that exist in bucketPositions (prev)
          setBucketPositions(prev => ({ ...prev, ...Object.fromEntries(d.ids.filter(i => prev[i]).map(i => [i, updated[i]])) }))
          // highlight if group contains txs and over bucket
          let found: number | null = null
          Object.keys(bucketPositions).forEach(k => {
            const bid = Number(k)
            const el = nodeRefs.current[`bucket-${bid}`]
            if (el) {
              const r = el.getBoundingClientRect()
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
        // no need to store rect variable
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const sx = startPointRef.current!.x
        const sy = startPointRef.current!.y
        const left = Math.min(sx, x)
        const top = Math.min(sy, y)
        const w = Math.abs(x - sx)
        const h = Math.abs(y - sy)
        setMarquee({ x: left, y: top, w, h })
      }
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
            const txIds = d.ids.filter(id => txPositions[id])
            if (txIds.length > 0) {
              Promise.all(txIds.map(id => api.addTransactionToBucket(found!, id))).then(() => load())
            }
          }
        }
        draggingRef.current = null
        setHoverBucket(null)
      }

      if (isSelectingRef.current) {
        // finish marquee selection
        isSelectingRef.current = false
        const m = marquee
        setMarquee(null)
        startPointRef.current = null
        if (m) {
          // select nodes that intersect marquee
          const canvas = canvasRef.current
          if (!canvas) return
          const cRect = canvas.getBoundingClientRect()
          const newlySelected: Record<number, boolean> = { ...selectedMap }
          // check tx nodes
          transactions.forEach(t => {
            const el = nodeRefs.current[`tx-${t.id}`]
            if (!el) return
            const r = el.getBoundingClientRect()
            const rel = { left: r.left - cRect.left, top: r.top - cRect.top, right: r.right - cRect.left, bottom: r.bottom - cRect.top }
            const intersects = !(rel.left > m.x + m.w || rel.right < m.x || rel.top > m.y + m.h || rel.bottom < m.y)
            if (intersects) newlySelected[t.id] = true
          })
          setSelectedMap(() => newlySelected);

          // auto-apply suggestions for selected txs that have suggestions
          (async () => {
            try {
              const txIds = Object.keys(newlySelected).map(k => Number(k)).filter(id => newlySelected[id] && txPositions[id])
              for (const id of txIds) {
                try {
                  const tx = transactions.find(t => t.id === id)
                  if (!tx) { console.warn('Selected tx not found', id); continue }
                  const s = await api.categorize(tx.description)
                  if (s && s.bucketId) {
                    await api.addTransactionToBucket(s.bucketId, id)
                  }
                } catch (err) { console.error('Auto-assign for tx failed', id, err) }
              }
              await load()
            } catch (err) {
              console.error('Auto-assign loop failed', err)
            }
          })()
        }
      }
    }

    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerup', pointerUp)
    return () => { window.removeEventListener('pointermove', pointerMove); window.removeEventListener('pointerup', pointerUp) }
  }, [bucketPositions, txPositions, transactions, marquee, selectedMap])

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
    const ids = selectedMap[id] ? selectedIds : [id]
    const initialPositions: Record<number, Pos> = {}
    ids.forEach(i => {
      if (txPositions[i]) initialPositions[i] = { ...txPositions[i] }
      else if (bucketPositions[i]) initialPositions[i] = { ...bucketPositions[i] }
    })
    draggingRef.current = {
      mode: ids.length > 1 ? 'group' : type,
      ids,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initialPositions
    }
    // prevent marquee start when clicking node
    isSelectingRef.current = false
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
                 ref={el => nodeRefs.current[`bucket-${b.id}`] = el}
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
                 ref={el => nodeRefs.current[`tx-${t.id}`] = el}
                 className={`node tx-node ${selectedMap[t.id] ? 'selected' : ''}`}
                 style={{ left: pos.x, top: pos.y }}
                 onPointerDown={e => startNodeDrag(e, 'tx', t.id)}
                 onPointerEnter={e => fetchSuggestion(t.id, t.description, e.currentTarget as HTMLElement)}
                 onPointerLeave={() => clearSuggestion(t.id)}>
              <div className="node-title">{t.description}</div>
              {suggestions[t.id] && (
                <div className="suggestion absolute" style={ (suggestionPos as any)[t.id] ? { left: (suggestionPos as any)[t.id].left, top: (suggestionPos as any)[t.id].top } : {} }>
                  <div>Suggestion: {suggestions[t.id]?.category}</div>
                  <button onClick={() => {
                    const s = suggestions[t.id]
                    if (!s || typeof s.bucketId !== 'number') return
                    addToBucket(s.bucketId, t.id)
                  }}>Add to suggested</button>
                </div>
              )}
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
          <button onClick={() => setContextMenu(null)}>Cancel</button>
        </div>
      )}
    </section>
  )
}
