import { getNetworkChain, type NetworkMode } from '@/cctp-chains';
import type { ChainDestination } from './types';

export interface NewDestinationOpts {
  networkMode: NetworkMode;
  /** Pre-fill amount, e.g. the global amount input. */
  amount: string;
  /** Connected wallet address — default recipient for EVM chains. */
  walletAddress?: string;
}

/**
 * Build a fresh destination entry. Non-EVM chains (Solana) need a native
 * address entered by hand, so their recipient starts empty instead of
 * defaulting to the EVM wallet address.
 */
export function createDestination(chainId: number, opts: NewDestinationOpts): ChainDestination {
  const chain = getNetworkChain(opts.networkMode, chainId);
  return {
    chainId,
    amount: opts.amount,
    recipient: chain?.isNonEvm ? '' : (opts.walletAddress ?? ''),
    feeQuote: null,
    feeError: null,
  };
}

/**
 * Toggle a chain in the destination list (pure — no side effects).
 * Returns the new list.
 */
export function toggleDestination(
  destinations: ChainDestination[],
  chainId: number,
  opts: NewDestinationOpts,
): ChainDestination[] {
  const index = destinations.findIndex((d) => d.chainId === chainId);
  if (index !== -1) return destinations.filter((_, i) => i !== index);
  return [...destinations, createDestination(chainId, opts)];
}

export function removeDestination(destinations: ChainDestination[], index: number): ChainDestination[] {
  return destinations.filter((_, i) => i !== index);
}

export function updateRecipient(
  destinations: ChainDestination[],
  index: number,
  recipient: string,
): ChainDestination[] {
  // Note: the fee quote is intentionally NOT cleared here — it depends only on
  // (source, destination, amount), not on the recipient address.
  return destinations.map((d, i) => (i === index ? { ...d, recipient } : d));
}

/**
 * Broadcast a new global amount to every destination, invalidating their
 * fee quotes (quotes are amount-dependent).
 */
export function applyGlobalAmount(destinations: ChainDestination[], value: string): ChainDestination[] {
  return destinations.map((d) => ({ ...d, amount: value, feeQuote: null, feeError: null }));
}

/**
 * Sanitize the global amount input. Returns the sanitized value, or null when
 * the keystroke should be rejected (would produce an invalid number).
 */
export function sanitizeAmountInput(value: string): string | null {
  const v = value.replace(/[^0-9.]/g, '');
  if (v !== '' && !/^\d*\.?\d*$/.test(v)) return null;
  return v;
}
