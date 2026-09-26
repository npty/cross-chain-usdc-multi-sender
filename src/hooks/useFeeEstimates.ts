import { useEffect, useRef, useCallback } from 'react';
import { parseAmount } from '@/onchain-money';
import { getForwardingChain } from '@/cctpChains';
import type { ChainDestination, FeeQuote, FeeQuoteItem } from '../components/types';

// CCTP v2 Quote API — testnet base URL
// POST /v2/quote/burn/usdc/{sourceDomainId}/{destDomainId}
const QUOTE_API_BASE = 'https://iris-api-sandbox.circle.com';

// Arc Testnet CCTP domain
const SOURCE_DOMAIN = 26;

// ── API types (from OpenAPI spec) ────────────────────────────────────────────

interface QuoteExpiry {
  mode: 'TIMESTAMP' | 'BLOCK_NUMBER';
  // TIMESTAMP mode
  expiresAt?: number;
  // BLOCK_NUMBER mode
  expiresAtBlock?: number;
  blockEstimatedAt?: number;
}

interface QuoteResponseItem {
  type: 'FORWARD' | 'PRE_FINALITY';
  amount: string;
  args: string[];
  argsHash: string;
}

interface QuoteResponse {
  signedQuote?: string;
  issuedAt?: number;
  expiry?: QuoteExpiry;
  feeTotalAmount?: string;
  feeToken?: string;
  items?: QuoteResponseItem[];
  nonce?: string;
  // Error fields
  errorCode?: string;
  error?: string;
}

// ── Core fetch ───────────────────────────────────────────────────────────────

export interface FeeEstimateResult {
  quote: FeeQuote | null;
  error: string | null;
}

async function callQuoteApi(
  url: string,
  amountRaw: string,
  requestTypes: Array<{ type: string }>,
  signal: AbortSignal,
): Promise<{ res: Response; json: QuoteResponse }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amountRaw,
      // feeToken omitted → fees paid in native gas token (Arc native = USDC at 18 dec).
      // feeTotalAmount in response is in native wei units (18 dec).
      requests: requestTypes,
    }),
    signal,
  });
  const json = (await res.json()) as QuoteResponse;
  return { res, json };
}

async function fetchQuote(
  destDomain: number,
  amountHuman: string, // human-readable USDC
  sourceChainId: number,
  signal: AbortSignal,
): Promise<FeeEstimateResult> {
  // Parse to 6-decimal integer string (USDC minor units)
  let amountRaw: string;
  try {
    const parsed = parseAmount(sourceChainId, amountHuman);
    amountRaw = parsed.raw.toString();
  } catch {
    return { quote: null, error: 'Invalid amount' };
  }

  const url = `${QUOTE_API_BASE}/v2/quote/burn/usdc/${SOURCE_DOMAIN}/${destDomain}`;

  // Try FORWARD + PRE_FINALITY first; fall back to FORWARD-only when
  // PRE_FINALITY is unavailable on this route (errorCode PRE_FINALITY_UNAVAILABLE, HTTP 422).
  let { res, json } = await callQuoteApi(
    url, amountRaw, [{ type: 'FORWARD' }, { type: 'PRE_FINALITY' }], signal,
  );

  if (!res.ok && json.errorCode === 'PRE_FINALITY_UNAVAILABLE') {
    ({ res, json } = await callQuoteApi(
      url, amountRaw, [{ type: 'FORWARD' }], signal,
    ));
  }

  if (!res.ok) {
    const msg = json.error ?? json.errorCode ?? `HTTP ${res.status}`;
    return { quote: null, error: `Quote error: ${msg}` };
  }

  if (!json.signedQuote || !json.feeTotalAmount || !json.expiry) {
    return { quote: null, error: 'Incomplete quote response from Circle API' };
  }

  // Resolve expiry to a unix-ms timestamp
  let expiresAtMs: number;
  if (json.expiry.mode === 'TIMESTAMP' && json.expiry.expiresAt !== undefined) {
    expiresAtMs = json.expiry.expiresAt * 1000;
  } else if (json.expiry.mode === 'BLOCK_NUMBER' && json.expiry.blockEstimatedAt !== undefined) {
    // blockEstimatedAt is an advisory wall-clock estimate in seconds
    expiresAtMs = json.expiry.blockEstimatedAt * 1000;
  } else {
    // Fallback: 2 min from now (Arc Testnet window from docs)
    expiresAtMs = Date.now() + 2 * 60 * 1000;
  }

  const items: FeeQuoteItem[] = (json.items ?? []).map((item) => ({
    type: item.type,
    amount: item.amount,
  }));

  return {
    quote: {
      feeTotalAmount: json.feeTotalAmount,
      signedQuote: json.signedQuote,
      expiresAt: expiresAtMs,
      items,
    },
    error: null,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseFeeEstimatesOptions {
  destinations: ChainDestination[];
  sourceChainId: number;
  onUpdate: (index: number, quote: FeeQuote | null, error: string | null, loading: boolean) => void;
}

export function useFeeEstimates({ destinations, sourceChainId, onUpdate }: UseFeeEstimatesOptions) {
  const timerRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const abortRefs = useRef<Map<number, AbortController>>(new Map());

  const estimate = useCallback(
    (index: number, dest: ChainDestination) => {
      // Cancel any in-flight debounce/request for this index
      const prevTimer = timerRefs.current.get(index);
      if (prevTimer !== undefined) clearTimeout(prevTimer);
      const prevAbort = abortRefs.current.get(index);
      if (prevAbort) prevAbort.abort();

      const amount = dest.amount;
      if (!amount || parseFloat(amount) <= 0) {
        onUpdate(index, null, null, false);
        return;
      }

      // Debounce 600ms so we don't hammer the API on every keystroke
      const timer = setTimeout(() => {
        const chain = getForwardingChain(dest.chainId);
        if (!chain) {
          onUpdate(index, null, 'Chain not supported for CCTP forwarding', false);
          return;
        }

        const controller = new AbortController();
        abortRefs.current.set(index, controller);
        onUpdate(index, null, null, true);

        fetchQuote(chain.cctpDomain!, amount, sourceChainId, controller.signal)
          .then((result) => {
            if (!controller.signal.aborted) {
              onUpdate(index, result.quote, result.error, false);
            }
          })
          .catch((err: unknown) => {
            if (err instanceof Error && err.name === 'AbortError') return;
            onUpdate(index, null, 'Network error fetching quote', false);
          });
      }, 600);

      timerRefs.current.set(index, timer);
    },
    [sourceChainId, onUpdate],
  );

  // Re-run when destinations change (keyed by chainId + amount to avoid object identity churn)
  const destKey = JSON.stringify(destinations.map((d) => ({ chainId: d.chainId, amount: d.amount })));
  useEffect(() => {
    destinations.forEach((dest, index) => {
      estimate(index, dest);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destKey, estimate]);

  // Cleanup on unmount
  useEffect(() => {
    const timers = timerRefs.current;
    const aborts = abortRefs.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      aborts.forEach((c) => c.abort());
    };
  }, []);
}
