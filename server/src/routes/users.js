import express from 'express';
import Joi from 'joi';
import User from '../models/User.js';
import Token from '../models/Token.js';
import { redis } from '../index.js';

const router = express.Router();

const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

const registerSchema = Joi.object({
  walletAddress: Joi.string().length(44).required(),
  username: Joi.string().pattern(usernameRegex).required(),
  email: Joi.string().email().optional().allow(''),
  signature: Joi.string().required(),
  message: Joi.string().required(),
});

router.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  try {
    // verify wallet signature
    const { verifySolanaSignature } = await import('../utils/solana.js')
    const ok = verifySolanaSignature(value.message, value.signature, value.walletAddress)
    if (!ok) return res.status(400).json({ error: 'Invalid wallet signature' })

    const exists = await User.findOne({
      $or: [
        { walletAddress: value.walletAddress },
        { username: value.username },
        ...(value.email ? [{ email: value.email }] : []),
      ],
    });
    if (exists) return res.status(409).json({ error: 'User already exists' });

    const user = await User.create({
      walletAddress: value.walletAddress,
      username: value.username,
      email: value.email || undefined,
      balance: 5000,
    });
    res.status(201).json({ id: user._id, username: user.username, balance: user.balance });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

const tradeSchema = Joi.object({
  mintAddress: Joi.string().required(),
  type: Joi.string().valid('buy', 'sell').required(),
  amount: Joi.number().positive().required(),
  price: Joi.number().positive().required(),
  slippage: Joi.number().min(0.01).max(0.05).default(0.01),
});

router.post('/:id/trade', async (req, res) => {
  const { error, value } = tradeSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = await Token.findOne({ mintAddress: value.mintAddress });
    if (!token) return res.status(404).json({ error: 'Token not found' });

    const effectivePrice = value.price * (value.type === 'buy' ? 1 + value.slippage : 1 - value.slippage);
    const usdAmount = value.amount; // amount is USD to spend or receive

    if (value.type === 'buy') {
      if (user.balance < usdAmount) return res.status(400).json({ error: 'Insufficient balance' });
      const tokensBought = usdAmount / effectivePrice;
      user.balance -= usdAmount;
      const position = user.portfolio.find((p) => p.mintAddress === value.mintAddress);
      if (position) {
        const totalCost = position.buyPrice * position.quantity + usdAmount;
        const newQty = position.quantity + tokensBought;
        position.quantity = newQty;
        position.buyPrice = totalCost / newQty;
      } else {
        user.portfolio.push({ mintAddress: value.mintAddress, quantity: tokensBought, buyPrice: effectivePrice });
      }
      user.tradeHistory.push({ mintAddress: value.mintAddress, type: 'buy', amount: usdAmount, price: effectivePrice, timestamp: new Date() });
    } else {
      const position = user.portfolio.find((p) => p.mintAddress === value.mintAddress);
      if (!position || position.quantity <= 0) return res.status(400).json({ error: 'No position to sell' });
      const tokensToSell = usdAmount / effectivePrice;
      const actualTokens = Math.min(tokensToSell, position.quantity);
      const proceeds = actualTokens * effectivePrice;
      user.balance += proceeds;
      position.quantity -= actualTokens;
      if (position.quantity <= 1e-9) {
        user.portfolio = user.portfolio.filter((p) => p.mintAddress !== value.mintAddress);
      }
      user.tradeHistory.push({ mintAddress: value.mintAddress, type: 'sell', amount: proceeds, price: effectivePrice, timestamp: new Date() });
    }

    await user.save();

    // Notify via websockets and leaderboard cache invalidation
    await redis.del('leaderboard:top');
    req.app.get('io')?.emit('user:updated', { userId: user._id });

    res.json({ ok: true, balance: user.balance, portfolio: user.portfolio });
  } catch (e) {
    res.status(500).json({ error: 'Trade failed' });
  }
});

router.get('/leaderboard/top', async (_req, res) => {
  try {
    const cacheKey = 'leaderboard:top';
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const users = await User.find({}).lean();
    const tokens = await Token.find({}).lean();
    const priceMap = new Map(tokens.map((t)=>[t.mintAddress, t.price||0]))
    const enriched = users.map((u) => {
      const portfolioValue = (u.portfolio || []).reduce((sum, p) => {
        const price = priceMap.get(p.mintAddress) ?? 0;
        return sum + p.quantity * price;
      }, 0);
      const totalValue = u.balance + portfolioValue;
      return { id: u._id, username: u.username, totalValue, trades: u.tradeHistory?.length || 0 };
    });

    enriched.sort((a, b) => b.totalValue - a.totalValue);
    const top = enriched.slice(0, 100);
    await redis.set(cacheKey, JSON.stringify(top), 'EX', 60);
    res.json(top);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.post('/:id/watchlist', async (req, res) => {
  const { mintAddress, action } = req.body || {};
  if (!mintAddress || !['add', 'remove'].includes(action)) return res.status(400).json({ error: 'Invalid request' });
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (action === 'add') {
      if (!user.watchlist.includes(mintAddress)) user.watchlist.push(mintAddress);
    } else {
      user.watchlist = user.watchlist.filter((m) => m !== mintAddress);
    }
    await user.save();
    res.json({ watchlist: user.watchlist });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update watchlist' });
  }
});

router.get('/:id/watchlist', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ watchlist: user.watchlist });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

export default router;