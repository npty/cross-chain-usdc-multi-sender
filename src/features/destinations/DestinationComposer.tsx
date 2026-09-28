import { Plus } from 'lucide-react';

import type { OnchainChain } from '@/onchain/facts';
import { ChainPicker } from './ChainPicker';

interface DestinationComposerProps {
  globalAmount: string;
  onGlobalAmountChange: (value: string) => void;
  pickerOpen: boolean;
  onTogglePicker: () => void;
  destinationCount: number;
  chains: OnchainChain[];
  selectedIds: number[];
  onToggleChain: (chainId: number) => void;
}

/**
 * The "compose" row: global USDC amount input plus the chain-picker toggle.
 * The picker opens below the row, above the destination list.
 */
export function DestinationComposer(props: DestinationComposerProps) {
  const {
    globalAmount, onGlobalAmountChange, pickerOpen, onTogglePicker,
    destinationCount, chains, selectedIds, onToggleChain,
  } = props;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-stretch">
        {/* Amount input */}
        <div
          className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-2"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <input
            inputMode="decimal"
            value={globalAmount}
            onChange={(e) => onGlobalAmountChange(e.target.value)}
            placeholder="0.00"
            className="display flex-1 bg-transparent text-2xl font-bold tabular-nums outline-none placeholder:opacity-25 min-w-0"
            style={{ color: 'var(--ink)' }}
          />
          <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--muted)' }}>USDC</span>
        </div>

        {/* Picker toggle — compact square button */}
        <button
          onClick={onTogglePicker}
          className="flex flex-col items-center justify-center rounded-2xl px-3 gap-0.5 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          style={{
            background: pickerOpen ? 'var(--accent)' : 'var(--surface)',
            border: `1.5px solid ${pickerOpen ? 'var(--accent)' : 'var(--border)'}`,
            color: pickerOpen ? '#fff' : 'var(--muted)',
            minWidth: '72px',
          }}
        >
          <Plus className="size-4" />
          <span className="text-xs font-semibold">Chains</span>
          {destinationCount > 0 && (
            <span
              className="text-xs font-bold tabular-nums leading-none"
              style={{ color: pickerOpen ? 'rgba(255,255,255,0.8)' : 'var(--accent)' }}
            >
              {destinationCount}
            </span>
          )}
        </button>
      </div>

      <ChainPicker
        open={pickerOpen}
        chains={chains}
        selectedIds={selectedIds}
        onToggle={onToggleChain}
      />
    </div>
  );
}
