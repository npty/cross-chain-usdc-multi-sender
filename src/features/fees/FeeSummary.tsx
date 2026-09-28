
import type { ChainDestination } from '../destinations/types';
import type { SendTotals } from './totals';
import { formatUSDC } from './format';

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '20px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
};

interface FeeSummaryProps {
  destinations: ChainDestination[];
  totals: SendTotals;
  loadingIndices: Set<number>;
}

/** Transaction summary: total USDC to send, total forwarding fees, total deducted. */
export function FeeSummary({ destinations, totals, loadingIndices }: FeeSummaryProps) {
  if (destinations.length === 0) return null;

  return (
    <div style={{ ...card, padding: '16px' }}>
      <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>Transaction Summary</p>
      <div className="space-y-2">
        <SummaryRow label="USDC to send" value={`${formatUSDC(totals.usdcTotal)} USDC`} bold />
        <SummaryRow
          label={`Forwarding fees (${destinations.length} chain${destinations.length > 1 ? 's' : ''})`}
          value={totals.allQuotesReady ? `${totals.feeUSDC.toFixed(6)} USDC` : loadingIndices.size > 0 ? 'Estimating...' : '—'}
          sub="paid as native gas on Arc"
        />
        <div className="h-px my-1" style={{ background: 'var(--border)' }} />
        <SummaryRow
          label="Total USDC deducted"
          value={totals.allQuotesReady ? `${totals.usdcTotalPlusFees.toFixed(6)} USDC` : '—'}
          bold accent
        />
      </div>
    </div>
  );
}

function SummaryRow({ label, value, sub, bold, accent }: { label: string; value: string; sub?: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <span className={`text-xs ${bold ? 'font-semibold' : 'font-normal'}`} style={{ color: accent ? 'var(--ink)' : 'var(--muted)' }}>
          {label}
        </span>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>{sub}</p>}
      </div>
      <span className={`text-xs tabular-nums ${bold ? 'font-bold' : 'font-medium'}`} style={{ color: accent ? 'var(--ink)' : 'var(--ink-2)' }}>
        {value}
      </span>
    </div>
  );
}
