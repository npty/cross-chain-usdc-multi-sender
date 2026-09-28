import { parseUnits } from 'viem';
import { getUsdc } from './facts';

/**
 * Parse a human-readable USDC amount (e.g. "1.5") into smallest units.
 *
 * The decimal count comes from the onchain facts registry; the parsing is
 * viem's `parseUnits`. Throws on empty input, non-numeric input, or more
 * fraction digits than the token allows — callers treat any throw as
 * "invalid amount".
 */
export function parseUsdcAmount(chainId: number, value: string): bigint {
  const usdc = getUsdc(chainId);
  if (!usdc) {
    throw new Error(`Chain ${chainId} has no USDC`);
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    throw new Error('Amount is empty');
  }

  const fraction = trimmed.split('.')[1] ?? '';
  if (fraction.length > usdc.decimals) {
    throw new Error(`'${value}' has more fraction digits than USDC allows`);
  }

  return parseUnits(trimmed, usdc.decimals);
}
