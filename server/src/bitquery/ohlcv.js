import { bitqueryGraphQL } from '../index.js';
import { redis } from '../index.js';

const OHLCV_QUERY = `
query OHLCV($mint: String!, $interval: Int!) {
  Solana {
    DEXTrades(
      where: { Trade: { Buy: { Currency: { MintAddress: { is: $mint } } } } }
      orderBy: { descendingByBlockTime: true }
      limit: { count: 200 }
    ) {
      Block { TimeISO8601 }
      Trade { Buy { Amount InUSD } }
    }
  }
}`;

export async function getOhlcv(mintAddress, intervalSec = 60) {
  const key = `ohlcv:${mintAddress}:${intervalSec}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const { data } = await bitqueryGraphQL(OHLCV_QUERY, { mint: mintAddress, interval: intervalSec });
  const rows = data?.Solana?.DEXTrades || [];
  await redis.set(key, JSON.stringify(rows), 'EX', 60);
  return rows;
}