import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend)

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function TokenPage() {
  const { mintAddress } = useParams()
  const [token, setToken] = useState<any>(null)
  const [balance, setBalance] = useState<number>(5000)
  const [held, setHeld] = useState<number>(0)
  const [price, setPrice] = useState<number>(0)
  const [usd, setUsd] = useState<number>(100)
  const [type, setType] = useState<'buy' | 'sell'>('buy')
  const [history, setHistory] = useState<{ t: number; p: number }[]>([])

  useEffect(() => {
    if (!mintAddress) return
    axios.get(`${API_BASE}/api/tokens/${mintAddress}`).then((r) => {
      setToken(r.data)
      setPrice(r.data.price || 0)
    })
  }, [mintAddress])

  useEffect(() => {
    if (!token) return
    const id = setInterval(() => {
      const newPrice = Math.max(0.0000001, price * (1 + (Math.random() - 0.5) * 0.01))
      setPrice(newPrice)
      setHistory((h) => [...h.slice(-300), { t: Date.now(), p: newPrice }])
    }, 3000)
    return () => clearInterval(id)
  }, [token, price])

  const portfolioValue = balance + held * price

  const graphData = useMemo(() => ({
    labels: history.map((h) => new Date(h.t).toLocaleTimeString()),
    datasets: [
      { label: 'Price', data: history.map((h) => h.p), borderColor: '#22c55e', backgroundColor: 'transparent' },
    ],
  }), [history])

  async function submitTrade() {
    if (!mintAddress || !token) return
    const payload = { mintAddress, type, amount: usd, price }
    // In a real app we use the logged in user id; for demo keep local state
    const userId = localStorage.getItem('demoUserId')
    if (!userId) {
      alert('Please register on dashboard first')
      return
    }
    const res = await axios.post(`${API_BASE}/api/users/${userId}/trade`, payload)
    setBalance(res.data.balance)
    const pos = res.data.portfolio.find((p: any) => p.mintAddress === mintAddress)
    setHeld(pos?.quantity || 0)
  }

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-neutral-900 rounded p-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">{token?.name} <span className="text-neutral-400">${token?.ticker}</span></div>
            <div className="text-xl">${price.toFixed(6)}</div>
          </div>
          <div className="mt-4">
            <Line data={graphData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>
      <div className="lg:col-span-1">
        <div className="bg-neutral-900 rounded p-4 space-y-3">
          <div className="text-sm text-neutral-400">Portfolio Value</div>
          <div className="text-2xl font-bold">${portfolioValue.toFixed(2)}</div>
          <div className="flex gap-2">
            <button className={`px-3 py-2 rounded ${type==='buy'?'bg-green-600':'bg-neutral-800'}`} onClick={() => setType('buy')}>Buy</button>
            <button className={`px-3 py-2 rounded ${type==='sell'?'bg-red-600':'bg-neutral-800'}`} onClick={() => setType('sell')}>Sell</button>
          </div>
          <div>
            <div className="text-sm mb-1">USD</div>
            <input type="number" value={usd} onChange={(e)=>setUsd(parseFloat(e.target.value)||0)} className="w-full bg-neutral-800 rounded px-3 py-2" />
            <div className="flex gap-2 mt-2">
              {[100,250,500,1000].map(v=> (
                <button key={v} className="text-xs bg-neutral-800 rounded px-2 py-1" onClick={()=>setUsd(v)}>${v}</button>
              ))}
            </div>
          </div>
          <button onClick={submitTrade} className="w-full bg-blue-600 hover:bg-blue-500 rounded py-2">{type==='buy'?'Buy':'Sell'}</button>
          <div className="text-xs text-neutral-400">Held: {held.toFixed(4)} tokens</div>
          <div className="text-xs text-neutral-400">Balance: ${balance.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}