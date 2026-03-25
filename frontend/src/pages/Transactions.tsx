import React, { useEffect, useState } from 'react'
import * as api from '../services/api'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<api.Transaction[]>([])
  const [buckets, setBuckets] = useState<api.Bucket[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [t, b] = await Promise.all([api.getUnsortedTransactions(), api.getAllBuckets()])
      setTransactions(t)
      setBuckets(b)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function remove(id: number) {
    await api.deleteTransaction(id)
    load()
  }

  async function addToBucket(transactionId: number, bucketId: number) {
    await api.addTransactionToBucket(bucketId, transactionId)
    load()
  }

  async function suggest(description: string) {
    setMessage('...suggesting')
    try {
      const s = await api.categorize(description)
      setMessage(s ? `Suggested: ${s.category} (bucket ${s.bucketId}) score ${s.score}` : 'No suggestion')
    } catch (e) {
      setMessage('No suggestion')
    }
    setTimeout(() => setMessage(null), 4000)
  }

  return (
    <section>
      <h2>Unsorted Transactions</h2>
      {message && <div className="message">{message}</div>}
      {loading && <div>Loading...</div>}
      {!loading && transactions.length === 0 && <div>No unsorted transactions</div>}
      <ul>
        {transactions.map(t => (
          <li key={t.id} className="transaction">
            <div className="meta">
              <div className="desc">{t.description}</div>
              <div className="date">{t.date} • {t.amount}</div>
            </div>
            <div className="actions">
              <button onClick={() => remove(t.id)}>Delete</button>
              <select onChange={e => addToBucket(t.id, Number(e.target.value))} defaultValue="">
                <option value="">Add to bucket...</option>
                {buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <button onClick={() => suggest(t.description)}>Suggest</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

