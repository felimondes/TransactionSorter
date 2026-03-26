import React, { useState, useRef } from 'react'
import * as api from '../services/api'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [month, setMonth] = useState<number>(1)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inFlight = useRef(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return setMessage('Please select a file')
    if (inFlight.current) return
    inFlight.current = true
    setSubmitting(true)
    try {
      await api.uploadTransactions(month, file)
      // notify listeners (Sort) that new transactions are available
      try { window.dispatchEvent(new Event('transactionsUploaded')) } catch (err) {}
      // try to close the upload modal immediately
      try { if ((window as any).closeUploadModal) (window as any).closeUploadModal() } catch (err) {}
      try { window.dispatchEvent(new Event('closeUploadModal')) } catch (err) {}
      setMessage('Uploaded')
      setFile(null)
    } catch (err) {
      setMessage('Upload failed')
    } finally {
      inFlight.current = false
      setSubmitting(false)
      setTimeout(() => setMessage(null), 3000)
    }
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
        <button type="submit" disabled={submitting}>{submitting ? 'Uploading...' : 'Upload'}</button>
      </form>
      {message && <div className="message">{message}</div>}
    </section>
  )
}
