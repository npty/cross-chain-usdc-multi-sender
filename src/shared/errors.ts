/**
 * Turn a raw onchain/wallet error into a short, human-readable message
 * suitable for a toast.
 */
export function parseOnchainError(error: unknown): string {
  const rawMessage = (error as { shortMessage?: string; message?: string })?.shortMessage
    ?? (error as { message?: string })?.message
    ?? '';
  const message = rawMessage.toLowerCase();
  if (message.includes('user rejected') || message.includes('user denied')) return 'Transaction cancelled.';
  if (message.includes('insufficient funds') || message.includes('exceeds balance') || message.includes('insufficient balance')) return 'Insufficient balance.';
  if (message.includes('reverted')) {
    const m = rawMessage.match(/reason="([^"]+)"/);
    return m ? `Transaction failed: ${m[1]}` : 'Transaction reverted. Check fees and amounts.';
  }
  // Unknown failure: surface the underlying message (truncated) so the cause
  // is diagnosable instead of a dead-end generic toast.
  const short = rawMessage.split('\n')[0].replace(/\s+/g, ' ').trim().slice(0, 180);
  return short ? `Something went wrong: ${short}` : 'Something went wrong. Please try again.';
}
