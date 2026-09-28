/**
 * Format a USDC amount for display: up to 6 decimals, trailing zeros trimmed.
 * 0.004 stays "0.004" instead of rounding to "0.00".
 */
export function formatUSDC(value: number, maxDecimals = 6): string {
  const text = value.toFixed(maxDecimals);
  if (!text.includes('.')) return text;
  return text.replace(/\.?0+$/, '');
}
