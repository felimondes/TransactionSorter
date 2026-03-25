import React, { useEffect, useState } from 'react'
import * as api from '../services/api'

export default function BucketsPage() {
  const [buckets, setBuckets] = useState<api.Bucket[]>([])
  const [name, setName] = useState('')
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<api.Transaction[]>([])

  async function load() {
    const b = await api.getAllBuckets()
    setBuckets(b)
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!name.trim()) return
    await api.createBucket(name)
    setName('')
    load()
  }

  async function removeBucket(bucketId: number) {
    await api.deleteBucket(bucketId)
    setSelectedBucket(null)
    load()
  }

  async function view(bucketId: number) {
    setSelectedBucket(bucketId)
    const tx = await api.getTransactionsInBucket(bucketId)
    setTransactions(tx)
  }

  async function removeFromBucket(bucketId: number, transactionId: number) {
    await api.removeTransactionFromBucket(bucketId, transactionId)
    if (selectedBucket) view(selectedBucket)
    load()
  }

  return (
    <section>
      <h2>Buckets</h2>
      <div className="create">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="New bucket name" />
        <button onClick={create}>Create</button>
      </div>
      <ul className="buckets">
        {buckets.map(b => (
          <li key={b.id}>
            <button onClick={() => view(b.id)}>{b.name}</button>
            <button onClick={() => removeBucket(b.id)} className="danger">Delete</button>
          </li>
        ))}
      </ul>
      {selectedBucket && (
        <div className="bucket-details">
          <h3>Transactions in bucket</h3>
          <ul>
            {transactions.map(t => (
              <li key={t.id}>
                {t.description} • {t.date} • {t.amount}
                <button onClick={() => removeFromBucket(selectedBucket, t.id)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

