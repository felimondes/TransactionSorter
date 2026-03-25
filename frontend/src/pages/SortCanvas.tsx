import React, { useRef, useEffect, useState } from 'react'
import { Application, extend } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { Container as PixiContainer, Graphics as PixiGraphics, Text as PixiText } from 'pixi.js'
import * as api from '../services/api'

// register Pixi classes so @pixi/react exposes <pixiContainer />, <pixiGraphics />, <pixiText />
extend({ Container: PixiContainer, Graphics: PixiGraphics, Text: PixiText })

type Tx = api.Transaction
type Bk = api.Bucket

export default function SortCanvas() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [buckets, setBuckets] = useState<Bk[]>([])
  const [txPositions, setTxPositions] = useState<Record<number, { x: number; y: number }>>({})
  const [bucketPositions, setBucketPositions] = useState<Record<number, { x: number; y: number }>>({})
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [hoveredTx, setHoveredTx] = useState<number | null>(null)
  const stageRef = useRef<any>(null)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  async function load() {
    const [t, b] = await Promise.all([api.getUnsortedTransactions(), api.getAllBuckets()])
    const txArr = Array.isArray(t) ? t : []
    const bkArr = Array.isArray(b) ? b : []
    if (txArr.length !== (txs?.length ?? 0)) setTxs(txArr)
    if (bkArr.length !== (buckets?.length ?? 0)) setBuckets(bkArr)
    if (Object.keys(txPositions).length === 0 && txArr.length > 0) {
      const tp: Record<number, { x: number; y: number }> = {}
      txArr.forEach((tx, i) => tp[tx.id] = { x: 200 + (i % 8) * 220, y: 80 + Math.floor(i / 8) * 120 })
      setTxPositions(tp)
    }
    if (Object.keys(bucketPositions).length === 0 && bkArr.length > 0) {
      const bp: Record<number, { x: number; y: number }> = {}
      bkArr.forEach((bk, i) => bp[bk.id] = { x: 40, y: 40 + i * 140 })
      setBucketPositions(bp)
    }
  }

  useEffect(() => { load() }, [])

  // basic drag state
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null)

  function onTxPointerDown(e: PIXI.InteractionEvent, id: number) {
    // use global coordinates (stage space) to compute offsets — safer across Stage implementations
    const pos = e.data.global
    const p = txPositions[id]
    if (!p) return
    dragRef.current = { id, offsetX: pos.x - p.x, offsetY: pos.y - p.y }
    try { (e.target as any).alpha = 0.8 } catch (err) { }
  }

  function onPointerMove(e: PIXI.InteractionEvent) {
    if (!dragRef.current) return
    const pos = e.data.global
    const id = dragRef.current.id
    const x = pos.x - dragRef.current.offsetX
    const y = pos.y - dragRef.current.offsetY
    setTxPositions(prev => ({ ...prev, [id]: { x, y } }))
  }

  function onPointerUp(e: PIXI.InteractionEvent) {
    if (!dragRef.current) return
    const id = dragRef.current.id
    // use global position to determine drop
    const pos = e.data.global
    dragRef.current = null
    const p = txPositions[id]
    if (!p) return
    const hit = Object.keys(bucketPositions).map(k => Number(k)).find(bid => {
      const bp = bucketPositions[bid]
      return pos.x >= bp.x && pos.x <= bp.x + 180 && pos.y >= bp.y && pos.y <= bp.y + 100
    })
    if (hit) {
      api.addTransactionToBucket(hit, id).then(() => load())
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0b1220' }}>
      <Application width={size.w} height={size.h} options={{ backgroundAlpha: 0 }} onPointerMove={onPointerMove} onPointerUp={onPointerUp} ref={stageRef}>
        <pixiContainer>
          {/* buckets */}
          {buckets.map(b => {
            const pos = bucketPositions[b.id] || { x: 40, y: 40 }
            return (
              <pixiContainer key={b.id} x={pos.x} y={pos.y} interactive={true}>
                <pixiGraphics draw={g => {
                  g.clear()
                  g.beginFill(0x2b2f3a)
                  g.lineStyle(2, 0x4f83cc)
                  g.drawRoundedRect(0, 0, 180, 100, 8)
                  g.endFill()
                }} />
                <pixiText text={b.name} x={10} y={12} style={new PIXI.TextStyle({ fill: '#fff', fontSize: 14 })} />
              </pixiContainer>
            )
          })}

          {/* txs */}
          {txs.map(t => {
            const pos = txPositions[t.id] || { x: 200, y: 80 }
            return (
              <pixiContainer key={t.id} x={pos.x} y={pos.y} interactive={true}
                         pointerdown={(e) => onTxPointerDown(e, t.id)}
                         pointerover={() => setHoveredTx(t.id)}
                         pointerout={() => setHoveredTx(null)}>
                <pixiGraphics draw={g => {
                  g.clear()
                  g.beginFill(0x1f6f4a)
                  g.drawRoundedRect(0, 0, 200, 64, 6)
                  g.endFill()
                }} />
                <pixiText text={t.description} x={10} y={10} style={new PIXI.TextStyle({ fill: '#fff', fontSize: 12 })} />
                {hoveredTx === t.id && (
                  <pixiContainer x={210} y={0}>
                    <pixiGraphics draw={g => { g.clear(); g.beginFill(0x222831, 0.9); g.drawRect(0,0,160,60); g.endFill() }} />
                    <pixiText text="Suggestion: ..." x={8} y={8} style={new PIXI.TextStyle({ fill: '#fff', fontSize: 12 })} />
                  </pixiContainer>
                )}
              </pixiContainer>
            )
          })}
        </pixiContainer>
      </Application>
    </div>
  )
}
