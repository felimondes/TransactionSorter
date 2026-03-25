import React, { useEffect, useState } from 'react'
import * as api from '../services/api'

export default function StatisticsPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [bucketsMap, setBucketsMap] = useState<Record<string,string>>({})

  useEffect(() => {
    async function load() {
      const b = await api.getAllBuckets()
      const map: Record<string,string> = {}
      b.forEach(x => map[String(x.id)] = x.name)
      setBucketsMap(map)
    }
    load()
  }, [])

  async function get() {
    const s = await api.getAveragePerMonth()
    setStats(s)
  }

  return (
    <section>
      <h2>Statistics</h2>
      <button onClick={get}>Get average per month</button>
      {stats && (
        <ul>
          {Object.entries(stats).sort((a,b)=>b[1]-a[1]).map(([id,amount]) => (
            <li key={id}>{bucketsMap[id] ?? `Bucket ${id}`}: {amount}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

