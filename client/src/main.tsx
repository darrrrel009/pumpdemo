import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import TokenPage from './pages/TokenPage'
import LeaderboardPage from './pages/LeaderboardPage'
import DashboardPage from './pages/DashboardPage'
import Navbar from './components/Navbar'

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/token/:mintAddress', element: <TokenPage /> },
  { path: '/leaderboard', element: <LeaderboardPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Navbar />
      <RouterProvider router={router} />
    </div>
  </React.StrictMode>,
)
