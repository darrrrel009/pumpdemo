import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';
import axios from 'axios';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});
app.set('io', io);

// Env
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const REDIS_URL = process.env.REDIS_URL;
const BITQUERY_API_ID = process.env.BITQUERY_API_ID;
const BITQUERY_API_SECRET = process.env.BITQUERY_API_SECRET;

if (!MONGODB_URI || !REDIS_URL || !BITQUERY_API_ID || !BITQUERY_API_SECRET) {
  console.error('Missing required environment variables.');
}

// MongoDB
mongoose.set('strictQuery', true);
mongoose
  .connect(MONGODB_URI, { dbName: 'pump_demo' })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error', err));

// Redis
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 2,
});
redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (e) => console.error('Redis error', e));

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('tiny'));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Bitquery GraphQL client
const bitqueryClient = axios.create({
  baseURL: 'https://streaming.bitquery.io/graphql',
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': BITQUERY_API_SECRET,
    'X-USER-ID': BITQUERY_API_ID,
  },
});

export async function bitqueryGraphQL(query, variables = {}) {
  const { data } = await bitqueryClient.post('', { query, variables });
  return data;
}

// Models
import './models/User.js';
import './models/Token.js';

// Routes
import tokensRouter from './routes/tokens.js';
import usersRouter from './routes/users.js';

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api/tokens', tokensRouter);
app.use('/api/users', usersRouter);

// Socket.io basic channels
io.on('connection', (socket) => {
  socket.emit('connected', { ok: true });
});

server.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});