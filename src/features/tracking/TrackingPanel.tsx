import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';

import { buildTxExplorerUrl } from '@/onchain/facts';
import {
  getNetworkChain,
  NETWORKS,
  type NetworkMode,
} from '@/cctp-chains';
import type { ChainDestination } from '../destinations/types';
import { useArrivalTracking, type ArrivalInfo } from './useArrivalTracking';

interface TrackingPanelProps {
  sendTxHash: `0x${string}`;
  sourceChainId: number;
  destinations: ChainDestination[];
  networkMode: NetworkMode;
  walletAddress?: string;
}

function ArrivalBadge({ info, live }: { info: ArrivalInfo | undefined; live: boolean }) {
  if (!info || info.state === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] whitespace-nowrap" style={{ color: 'var(--subtle)' }}>
        {live && <Loader2 className="size-3 animate-spin" />}
        Waiting
      </span>
    );
  }
  if (info.state === 'attested') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap" style={{ color: 'var(--accent)' }}>
        {live && <Loader2 className="size-3 animate-spin" />}
        Attested
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap" style={{ color: 'var(--success)' }}>
      <CheckCircle2 className="size-3" />
      Arrived
    </span>
  );
}

/**
 * Post-send confirmation: source transaction link plus live per-destination
 * arrival tracking, polled from Circle's v2 messages API. Once a destination
 * shows delivered, its row links the forwarder's delivery transaction.
 */
export function TrackingPanel(props: TrackingPanelProps) {
  const { sendTxHash, sourceChainId, destinations, networkMode, walletAddress } = props;

  const net = NETWORKS[networkMode];
  const sourceDomain =
    net.sources.find((s) => s.chainId === sourceChainId)?.cctpDomain ?? 26;
  const destinationDomains = destinations.map(
    (d) => getNetworkChain(networkMode, d.chainId)?.cctpDomain ?? -1,
  );

  const { arrivals, live } = useArrivalTracking({
    apiBase: net.quoteApiBase,
    sourceDomain,
    txHash: sendTxHash,
    destinationDomains,
  });

  const allArrived =
    destinationDomains.length > 0 &&
    destinationDomains.every((domain) => arrivals[domain]?.state === 'arrived');

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

      {/* Track your transfers — live per-destination arrival status */}
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(26,128,71,0.2)' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--ink)' }}>Track your transfers</p>
        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
          {allArrived
            ? 'All transfers arrived.'
            : live
              ? 'Watching each destination for your USDC. This updates automatically.'
              : 'Stopped checking for updates. The transfers may still complete.'}
        </p>
        <div className="space-y-2">
          {destinations.map((dest, i) => {
            const chain = getNetworkChain(networkMode, dest.chainId)!;
            const recipient = dest.recipient || walletAddress || '';
            const domain = destinationDomains[i];
            const deliveryTxHash = domain >= 0 ? arrivals[domain]?.forwardTxHash : undefined;
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
                <div className="flex shrink-0 items-center gap-2.5">
                  <ArrivalBadge info={domain >= 0 ? arrivals[domain] : undefined} live={live} />
                  {deliveryTxHash && (
                    <a
                      href={buildTxExplorerUrl(dest.chainId, deliveryTxHash)}
                      target="_blank"
                      rel="noreferrer"
                      title="View delivery transaction"
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:scale-[1.03] active:scale-[0.97]"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      View tx <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
