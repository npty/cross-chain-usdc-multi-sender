import { useEffect, useState } from 'react';

import { fetchSourceMessages } from './messagesApi';

export type ArrivalState = 'pending' | 'attested' | 'arrived';

export interface ArrivalInfo {
  state: ArrivalState;
  forwardTxHash: string | null;
}

interface UseArrivalTrackingArgs {
  /** Circle Iris base URL (sandbox for testnet, production for mainnet). */
  apiBase: string;
  /** CCTP domain of the source chain the send transaction was sent on. */
  sourceDomain: number;
  /** Confirmed source-chain send transaction hash. */
  txHash: string;
  /** CCTP domains of the destination chains, in send order. */
  destinationDomains: number[];
}

const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = 20 * 60_000;

function rank(state: ArrivalState): number {
  if (state === 'arrived') return 2;
  if (state === 'attested') return 1;
  return 0;
}

/**
 * Poll Circle's v2 messages API for a confirmed send transaction and report
 * per-destination arrival state:
 * - pending: no attested message for the destination yet
 * - attested: Circle attested the message, the forwarder is delivering
 * - arrived: the forwarder delivered (forwardTxHash is set)
 *
 * Polling stops once every destination has arrived, or after a timeout.
 * A transient API failure keeps the last known state and retries next tick.
 */
export function useArrivalTracking({
  apiBase,
  sourceDomain,
  txHash,
  destinationDomains,
}: UseArrivalTrackingArgs): { arrivals: Record<number, ArrivalInfo>; live: boolean } {
  const [arrivals, setArrivals] = useState<Record<number, ArrivalInfo>>({});
  const [live, setLive] = useState(true);
  // Stable effect identity: the send's destinations never change mid-panel.
  const domainsKey = destinationDomains.join(',');

  useEffect(() => {
    const domains = domainsKey.split(',').map(Number);
    let stopped = false;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const messages = await fetchSourceMessages(apiBase, sourceDomain, txHash);
        if (stopped) return;
        const next: Record<number, ArrivalInfo> = {};
        for (const domain of domains) {
          let best: ArrivalInfo = { state: 'pending', forwardTxHash: null };
          for (const m of messages) {
            if (m.destinationDomain !== domain) continue;
            const candidate: ArrivalInfo = m.forwardTxHash
              ? { state: 'arrived', forwardTxHash: m.forwardTxHash }
              : m.status === 'complete'
                ? { state: 'attested', forwardTxHash: null }
                : { state: 'pending', forwardTxHash: null };
            if (rank(candidate.state) > rank(best.state)) best = candidate;
          }
          next[domain] = best;
        }
        setArrivals(next);
        const allArrived = domains.every((d) => next[d]?.state === 'arrived');
        if (allArrived || Date.now() - startedAt > POLL_TIMEOUT_MS) {
          stopped = true;
          setLive(false);
        }
      } catch {
        // Keep the last known state; the next tick retries.
      }
    };

    void poll();
    const timer = setInterval(() => {
      if (stopped) {
        clearInterval(timer);
        return;
      }
      void poll();
    }, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [apiBase, sourceDomain, txHash, domainsKey]);

  return { arrivals, live };
}
