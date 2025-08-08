import nacl from 'tweetnacl';
import bs58 from 'bs58';

export function verifySolanaSignature(message, signatureBase58, walletAddressBase58) {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signature = bs58.decode(signatureBase58);
    const publicKey = bs58.decode(walletAddressBase58);
    return nacl.sign.detached.verify(messageBytes, signature, publicKey);
  } catch {
    return false;
  }
}