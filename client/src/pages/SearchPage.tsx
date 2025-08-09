import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (q.trim().length < 3) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      setLoading(true)
      axios
        .get(`${API_BASE}/api/tokens/search`, { params: { q } })
        .then((r) => setResults(r.data))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  return (
    <div className="max-w-3xl mx-auto p-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name, ticker, or creator…"
        className="w-full bg-neutral-900 rounded px-4 py-3 outline-none border border-neutral-800 focus:border-neutral-600"
      />
      <div className="mt-4">
        {loading ? 'Searching…' : null}
        <ul className="divide-y divide-neutral-800">
          {results.map((r) => (
            <li key={r.mintAddress} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{r.name} <span className="text-neutral-400">${r.ticker}</span></div>
                <div className="text-xs text-neutral-500">{r.mintAddress}</div>
              </div>
              <Link to={`/token/${r.mintAddress}`} className="text-blue-400">View</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}