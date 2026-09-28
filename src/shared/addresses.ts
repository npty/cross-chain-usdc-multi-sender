import bs58 from 'bs58';
import { bytesToHex } from 'viem';
import { PublicKey, Connection } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

/**
 * Encode an EVM (0x-hex) or Solana (base58) address as a 32-byte hex value
 * for CCTP's bytes32 mintRecipient field.
 */
export function addrToBytes32(address: string): `0x${string}` {
  // Solana (non-EVM): base58-encoded 32-byte public key
  if (!address.startsWith('0x')) {
    const decoded = bs58.decode(address);
    if (decoded.length !== 32) throw new Error('Invalid Solana address');
    return bytesToHex(decoded);
  }
  return `0x${address.replace('0x', '').padStart(64, '0')}`;
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    return bs58.decode(address).length === 32;
  } catch {
    return false;
  }
}

/**
 * Resolve the CCTP mintRecipient for a Solana destination.
 * Circle requires the recipient's USDC token account (ATA), NOT the wallet address.
 * - If the entered address is already a USDC token account, use it directly.
 * - Otherwise derive the ATA from the wallet address + USDC mint.
 * The Forwarding Service creates the ATA on-chain if it doesn't exist yet.
 */
export async function resolveSolanaMintRecipient(
  solanaUsdcMint: string,
  solanaRpcUrl: string,
  walletAddress: string,
): Promise<`0x${string}`> {
  const entered = new PublicKey(walletAddress);

  // If the user pasted a token account directly, use it as-is.
  // (Deriving an ATA from a token-account address would lose funds.)
  try {
    const connection = new Connection(solanaRpcUrl, 'confirmed');
    const info = await connection.getParsedAccountInfo(entered);
    const data = info.value?.data;
    if (data && typeof data === 'object' && 'parsed' in data) {
      const parsedInfo = (data as { parsed: { info: { mint?: string } } }).parsed.info;
      if (parsedInfo.mint === solanaUsdcMint) {
        return bytesToHex(entered.toBytes());
      }
    }
  } catch {
    // RPC unreachable — fall through to ATA derivation.
  }

  const ata = getAssociatedTokenAddressSync(new PublicKey(solanaUsdcMint), entered);
  return bytesToHex(ata.toBytes());
}
