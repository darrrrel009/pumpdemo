import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

interface Entry { id: string; username: string; totalValue: number; trades: number }

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Entry[]>([])

  useEffect(() => {
    axios.get(`${API_BASE}/api/users/leaderboard/top`).then((r) => setRows(r.data))
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-neutral-400 text-sm">
              <th className="py-2">#</th>
              <th>User</th>
              <th>Portfolio</th>
              <th>Trades</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-neutral-800">
                <td className="py-2">{i + 1}</td>
                <td>{r.username}</td>
                <td>${r.totalValue.toFixed(2)}</td>
                <td>{r.trades}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}