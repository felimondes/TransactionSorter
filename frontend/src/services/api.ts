export type Transaction = {
  id: number
  description: string
  date: string
  amount: number
  bucket?: { id:number, name:string } | null
}

export type Bucket = {
  id: number
  name: string
}

export type CategoryScore = {
  bucketId: number
  category: string
  score: number
}

const handleResp = async (r: Response) => {
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t || r.statusText)
  }
  const ct = r.headers.get('content-type') || ''
  if (ct.includes('application/json')) return r.json()
  return r.text()
}

export const getUnsortedTransactions = async (): Promise<Transaction[]> => {
  const r = await fetch('/transactions')
  return handleResp(r)
}

export const getTransaction = async (id: number): Promise<Transaction> => {
  const r = await fetch(`/transactions/${id}`)
  return handleResp(r)
}

export const createTransaction = async (body: Partial<Transaction>): Promise<Transaction> => {
  const r = await fetch('/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return handleResp(r)
}

export const deleteTransaction = async (id: number): Promise<void> => {
  const r = await fetch(`/transactions/${id}`, { method: 'DELETE' })
  return handleResp(r)
}

export const createBucket = async (name: string): Promise<Bucket> => {
  const r = await fetch(`/buckets?name=${encodeURIComponent(name)}`, { method: 'POST' })
  return handleResp(r)
}

export const getAllBuckets = async (): Promise<Bucket[]> => {
  const r = await fetch('/buckets')
  return handleResp(r)
}

export const deleteBucket = async (bucketId: number): Promise<Transaction[]> => {
  const r = await fetch(`/buckets/${bucketId}`, { method: 'DELETE' })
  return handleResp(r)
}

export const addTransactionToBucket = async (bucketId: number, transactionId: number): Promise<Transaction> => {
  const r = await fetch(`/buckets/${bucketId}/transactions/${transactionId}`, { method: 'POST' })
  return handleResp(r)
}

export const removeTransactionFromBucket = async (bucketId: number, transactionId: number): Promise<Transaction> => {
  const r = await fetch(`/buckets/${bucketId}/transactions/${transactionId}`, { method: 'DELETE' })
  return handleResp(r)
}

export const getTransactionsInBucket = async (bucketId: number): Promise<Transaction[]> => {
  const r = await fetch(`/buckets/${bucketId}/transactions`)
  return handleResp(r)
}

export const uploadTransactions = async (month: number, file: File): Promise<string> => {
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch(`/api/transactions/upload/${month}`, { method: 'POST', body: fd })
  return handleResp(r)
}

export const categorize = async (description: string): Promise<CategoryScore | null> => {
  const enc = encodeURIComponent(description)
  const r = await fetch(`/categorizer/${enc}`)
  try {
    return await handleResp(r)
  } catch (e) {
    return null
  }
}

export const getAveragePerMonth = async (): Promise<Record<string, number>> => {
  const r = await fetch('/api/statistics/average-per-month')
  return handleResp(r)
}

