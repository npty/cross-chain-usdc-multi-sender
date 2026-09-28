import { CheckCircle2, ExternalLink } from 'lucide-react';

import { buildTxExplorerUrl } from '@/onchain/facts';
import { buildDestinationAddressUrl, getNetworkChain, type NetworkMode } from '@/cctp-chains';
import type { ChainDestination } from '../destinations/types';

interface TrackingPanelProps {
  sendTxHash: `0x${string}`;
  sourceChainId: number;
  destinations: ChainDestination[];
  networkMode: NetworkMode;
  walletAddress?: string;
}

/**
 * Post-send confirmation: source transaction link plus per-destination
 * explorer links so the user can track each CCTP transfer.
 */
export function TrackingPanel(props: TrackingPanelProps) {
  const { sendTxHash, sourceChainId, destinations, networkMode, walletAddress } = props;

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(26,128,71,0.08)', border: '1px solid rgba(26,128,71,0.2)' }}>
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="size-4" style={{ color: 'var(--success)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Multi-chain send confirmed</span>
      </div>
      <a href={buildTxExplorerUrl(sourceChainId, sendTxHash)} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--accent-hover)' }}>
        View source transaction on explorer <ExternalLink className="size-3" />
      </a>

      {/* Track your transfers — per-destination explorer links */}
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(26,128,71,0.2)' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--ink)' }}>Track your transfers</p>
        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
          CCTP transfers typically land in ~1–2 minutes. Open your wallet address on each
          destination explorer below to confirm the USDC arrived.
        </p>
        <div className="space-y-2">
          {destinations.map((dest) => {
            const chain = getNetworkChain(networkMode, dest.chainId)!;
            const recipient = dest.recipient || walletAddress || '';
            const url = recipient ? buildDestinationAddressUrl(networkMode, dest.chainId, recipient) : undefined;
            return (
              <div
                key={dest.chainId}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--ink)' }}>
                    {chain.name}
                  </p>
                  <p className="text-xs tabular-nums truncate" style={{ color: 'var(--muted)' }}>
                    {dest.amount} USDC → {recipient ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}` : '—'}
                  </p>
                </div>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:scale-[1.03] active:scale-[0.97]"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    Track <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="text-xs shrink-0" style={{ color: 'var(--subtle)' }}>No explorer</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
