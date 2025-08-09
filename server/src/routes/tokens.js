import express from 'express';
import Token from '../models/Token.js';
import { redis } from '../index.js';
import { bitqueryGraphQL } from '../index.js';

const router = express.Router();

const SEARCH_TTL_SECONDS = 300;

const searchQuery = `
query SearchTokens($query: String!) {
  Solana {
    DEXTrades(
      where: {
        Trade: { Buy: { Currency: { any: [
          { Name: { like: $query } },
          { Symbol: { like: $query } },
          { MintAuthority: { is: $query } }
        ] } } }
      }
      limit: { count: 20 }
    ) {
      Trade { Buy { Currency { Name Symbol MintAddress MintAuthority } } }
    }
  }
}`;

router.get('/', async (req, res) => {
  try {
    const tokens = await Token.find({}).sort({ marketCap: -1 }).limit(50);
    res.json(tokens);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

router.get('/trending', async (req, res) => {
  try {
    const tokens = await Token.find({}).sort({ volume: -1 }).limit(30);
    res.json(tokens);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch trending tokens' });
  }
});

router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing query' });
  try {
    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    // Try Mongo first
    const mongoResults = await Token.find({
      $or: [
        { name: new RegExp(q, 'i') },
        { ticker: new RegExp(q, 'i') },
        { creatorAddress: q },
        { creatorUsername: new RegExp(q, 'i') },
      ],
    })
      .limit(30)
      .lean();
    if (mongoResults.length > 0) {
      await redis.set(cacheKey, JSON.stringify(mongoResults), 'EX', SEARCH_TTL_SECONDS);
      return res.json(mongoResults);
    }

    // Bitquery fallback
    const { data, errors } = await bitqueryGraphQL(searchQuery, { query: q });
    if (errors) return res.status(502).json({ error: 'Bitquery error', details: errors });
    const trades = data?.Solana?.DEXTrades || [];
    const formatted = trades
      .map((t) => t.Trade?.Buy?.Currency)
      .filter(Boolean)
      .map((c) => ({
        name: c.Name,
        ticker: c.Symbol,
        mintAddress: c.MintAddress,
        creatorAddress: c.MintAuthority,
      }));

    await redis.set(cacheKey, JSON.stringify(formatted), 'EX', SEARCH_TTL_SECONDS);
    res.json(formatted);
  } catch (e) {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/:mintAddress', async (req, res) => {
  const { mintAddress } = req.params;
  try {
    const token = await Token.findOne({ mintAddress });
    if (!token) return res.status(404).json({ error: 'Token not found' });
    res.json(token);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

export default router;