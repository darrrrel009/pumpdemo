import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <div className="sticky top-0 z-20 bg-neutral-950/70 backdrop-blur border-b border-neutral-900">
      <div className="max-w-7xl mx-auto p-3 flex items-center gap-4">
        <Link to="/" className="font-bold">PumpDemo</Link>
        <Link to="/search" className="text-neutral-300 hover:text-white">Search</Link>
        <Link to="/leaderboard" className="text-neutral-300 hover:text-white">Leaderboard</Link>
        <Link to="/dashboard" className="ml-auto bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm">Dashboard</Link>
      </div>
    </div>
  )
}