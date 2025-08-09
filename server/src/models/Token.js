import mongoose from 'mongoose';

const HolderSchema = new mongoose.Schema(
  {
    address: { type: String, index: true },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const TokenSchema = new mongoose.Schema(
  {
    mintAddress: { type: String, unique: true, index: true, required: true },
    name: { type: String, index: true },
    ticker: { type: String, index: true },
    image: { type: String },
    description: { type: String },
    socials: {
      twitter: { type: String },
      telegram: { type: String },
    },
    marketCap: { type: Number, default: 0 },
    volume: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    holders: { type: [HolderSchema], default: [] },
    creatorAddress: { type: String, index: true },
    creatorUsername: { type: String, index: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  { collection: 'tokens' }
);

export const Token =
  mongoose.models.Token || mongoose.model('Token', TokenSchema);
export default Token;