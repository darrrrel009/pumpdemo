import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [email, setEmail] = useState('')

  async function register() {
    const { connectPhantom, signMessage } = await import('../lib/wallet')
    const addr = walletAddress || await connectPhantom()
    const message = `PumpDemo signup ${new Date().toISOString()}`
    const signature = await signMessage(message)
    const res = await axios.post(`${API_BASE}/api/users/register`, { username, walletAddress: addr, email, message, signature })
    localStorage.setItem('demoUserId', res.data.id)
    const u = await axios.get(`${API_BASE}/api/users/${res.data.id}`)
    setUser(u.data)
  }

  useEffect(() => {
    const id = localStorage.getItem('demoUserId')
    if (id) {
      axios.get(`${API_BASE}/api/users/${id}`).then((r) => setUser(r.data))
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {!user ? (
        <div className="bg-neutral-900 p-4 rounded space-y-2">
          <div className="text-sm text-neutral-400">Create demo account ($5000 balance)</div>
          <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Username" className="w-full bg-neutral-800 rounded px-3 py-2" />
          <input value={walletAddress} onChange={(e)=>setWalletAddress(e.target.value)} placeholder="Solana wallet address" className="w-full bg-neutral-800 rounded px-3 py-2" />
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email (optional)" className="w-full bg-neutral-800 rounded px-3 py-2" />
          <button onClick={register} className="bg-blue-600 hover:bg-blue-500 rounded px-4 py-2">Register</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-neutral-900 p-4 rounded">
            <div className="text-sm text-neutral-400">Balance</div>
            <div className="text-2xl font-bold">${user.balance?.toFixed(2)}</div>
          </div>
          <div className="bg-neutral-900 p-4 rounded">
            <div className="text-lg font-semibold mb-2">Portfolio</div>
            <ul className="text-sm">
              {user.portfolio?.map((p:any)=> (
                <li key={p.mintAddress} className="py-1 border-b border-neutral-800">{p.mintAddress} — {p.quantity.toFixed(4)} tokens @ ${p.buyPrice.toFixed(6)}</li>
              ))}
              {user.portfolio?.length===0 && <li className="text-neutral-500">No holdings yet</li>}
            </ul>
          </div>
          <div className="bg-neutral-900 p-4 rounded">
            <div className="text-lg font-semibold mb-2">Trades</div>
            <ul className="text-sm">
              {[...user.tradeHistory].reverse().slice(0,50).map((t:any,i:number)=> (
                <li key={i} className="py-1 border-b border-neutral-800">{t.type.toUpperCase()} {t.amount.toFixed(2)} USD @ ${t.price.toFixed(6)} — {new Date(t.timestamp).toLocaleString()}</li>
              ))}
              {(!user.tradeHistory || user.tradeHistory.length===0) && <li className="text-neutral-500">No trades yet</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}