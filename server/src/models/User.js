import mongoose from 'mongoose';

const TradeSchema = new mongoose.Schema(
  {
    mintAddress: { type: String, index: true, required: true },
    type: { type: String, enum: ['buy', 'sell'], required: true },
    amount: { type: Number, required: true },
    price: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PortfolioItemSchema = new mongoose.Schema(
  {
    mintAddress: { type: String, index: true, required: true },
    quantity: { type: Number, default: 0 },
    buyPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    walletAddress: { type: String, unique: true, index: true, required: true },
    username: { type: String, unique: true, index: true, required: true },
    email: { type: String, unique: true, sparse: true },
    balance: { type: Number, default: 5000 },
    portfolio: { type: [PortfolioItemSchema], default: [] },
    tradeHistory: { type: [TradeSchema], default: [] },
    watchlist: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'users' }
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;