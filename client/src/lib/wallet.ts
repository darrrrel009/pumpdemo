export async function connectPhantom(): Promise<string> {
  const provider = (window as any).solana
  if (!provider?.isPhantom) throw new Error('Phantom not found')
  const resp = await provider.connect()
  return resp.publicKey.toString()
}

export async function signMessage(message: string): Promise<string> {
  const provider = (window as any).solana
  if (!provider?.isPhantom) throw new Error('Phantom not found')
  const encoded = new TextEncoder().encode(message)
  const signed = await provider.signMessage(encoded, 'utf8')
  // signed.signature is Uint8Array base58 expected by server
  // Phantom returns signature bytes, we need base58 encode
  const { default: bs58 } = await import('bs58')
  return bs58.encode(signed.signature)
}