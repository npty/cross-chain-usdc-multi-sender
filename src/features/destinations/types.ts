export interface FeeQuoteItem {
  type: 'FORWARD' | 'PRE_FINALITY';
  amount: string; // fee token minor units (string)
}

export interface FeeQuote {
  /** Total fee in fee-token minor units (native wei on Arc = 18 dec). Pass as msg.value. */
  feeTotalAmount: string;
  /** Signed quote blob — pass directly to depositForBurnWithFees. */
  signedQuote: string;
  /** Unix ms when the quote expires (derived from expiry.expiresAt or expiry.blockEstimatedAt). */
  expiresAt: number;
  /** Per-fee-type breakdown: FORWARD and/or PRE_FINALITY. */
  items: FeeQuoteItem[];
}

export interface ChainDestination {
  chainId: number;
  amount: string;     // human-readable USDC, driven by the global amount input
  recipient: string;  // destination address
  feeQuote: FeeQuote | null;
  feeError: string | null;
}
