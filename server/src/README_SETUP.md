PumpDemo - Setup

1) Server env (.env)
PORT=4000
MONGODB_URI=...
REDIS_URL=...
BITQUERY_API_ID=...
BITQUERY_API_SECRET=...
FIREBASE_CONFIG=...

2) Start server
npm run dev

3) Client env (.env)
VITE_API_BASE=http://localhost:4000
VITE_FIREBASE_CONFIG=...

4) Start client
npm run dev

Flow: Search/Trade
User -> Search Bar (validate) -> GET /api/tokens/search?q
  -> Redis cache? Hit -> return
  -> Miss -> Mongo -> Bitquery -> Cache 5m -> Return
User selects token -> Token page
User submits trade -> POST /api/users/:id/trade
  -> Validate balance/slippage
  -> Update Mongo (portfolio/balance/trades)
  -> Emit websocket updates
  -> Return updated state

Security: rate limit, sanitization, CORS, no chain txns.