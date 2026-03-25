import React, { useState } from 'react'
import * as api from '../services/api'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [month, setMonth] = useState<number>(1)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return setMessage('Please select a file')
    try {
      await api.uploadTransactions(month, file)
      setMessage('Uploaded')
    } catch (err) {
      setMessage('Upload failed')
    }
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <section>
      <h2>Upload transactions CSV</h2>
      <form onSubmit={submit}>
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <label>
          Month (1-12)
          <input type="number" min={1} max={12} value={month} onChange={e => setMonth(Number(e.target.value))} />
        </label>
        <button type="submit">Upload</button>
      </form>
      {message && <div className="message">{message}</div>}
    </section>
  )
}

