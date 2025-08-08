import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

interface TokenItem {
  mintAddress: string
  name: string
  ticker: string
  image?: string
  marketCap?: number
  volume?: number
  price?: number
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function HomePage() {
  const [tokens, setTokens] = useState<TokenItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/tokens/trending`)
      .then((r) => setTokens(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Trending</h1>
        <Link to="/leaderboard" className="text-sm text-blue-400">Leaderboard</Link>
      </div>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tokens.map((t) => (
            <Link
              key={t.mintAddress}
              to={`/token/${t.mintAddress}`}
              className="bg-neutral-900 rounded-lg p-4 hover:bg-neutral-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-neutral-800 overflow-hidden" />
                <div>
                  <div className="font-semibold">{t.name} <span className="text-neutral-400">${t.ticker}</span></div>
                  <div className="text-xs text-neutral-400">MC: ${Math.round(t.marketCap || 0).toLocaleString()} · Vol: ${Math.round(t.volume || 0).toLocaleString()}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}