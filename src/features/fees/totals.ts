import type { ChainDestination } from '../destinations/types';

export interface SendTotals {
  /** Sum of per-chain USDC amounts (human-readable). */
  usdcTotal: number;
  /** Sum of forwarding fees converted to USDC terms. */
  feeUSDC: number;
  /** Sum of forwarding fees in native wei (18 dec). */
  feeNativeTotal: bigint;
  usdcTotalPlusFees: number;
  /** True when every destination has an amount and a fresh fee quote. */
  allQuotesReady: boolean;
}

/**
 * Aggregate per-destination amounts and fee quotes into summary totals.
 * Native fees (18 dec, e.g. wei on Arc) are converted to USDC terms (6 dec)
 * for display — on Arc, native gas and USDC share the same pool.
 */
export function computeTotals(destinations: ChainDestination[]): SendTotals {
  let usdcTotal = 0;
  let feeNativeTotal = BigInt(0);
  let allQuotesReady = destinations.length > 0;

  for (const d of destinations) {
    const amt = parseFloat(d.amount || '0');
    if (!isNaN(amt)) usdcTotal += amt;
    if (!d.feeQuote || !d.amount || parseFloat(d.amount) <= 0) {
      allQuotesReady = false;
    } else {
      feeNativeTotal += BigInt(d.feeQuote.feeTotalAmount);
    }
  }

  const feeUSDC = Number(feeNativeTotal / BigInt(1e12)) / 1e6;
  return {
    usdcTotal,
    feeUSDC,
    feeNativeTotal,
    usdcTotalPlusFees: usdcTotal + feeUSDC,
    allQuotesReady,
  };
}
