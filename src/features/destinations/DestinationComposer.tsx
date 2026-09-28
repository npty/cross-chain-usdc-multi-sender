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
  onSelectMany: (chainIds: number[]) => void;
}

/**
 * The "compose" row: global USDC amount input plus the chain-picker toggle.
 * The picker opens as a modal dialog above the page content.
 */
export function DestinationComposer(props: DestinationComposerProps) {
  const {
    globalAmount, onGlobalAmountChange, pickerOpen, onTogglePicker,
    destinationCount, chains, selectedIds, onToggleChain, onSelectMany,
  } = props;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-stretch w-full min-w-0">
        {/* Amount input */}
        <div
          className="flex-1 min-w-0 rounded-2xl px-4 py-3 flex items-center gap-2"
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

        {/* Picker toggle — opens the chain picker modal */}
        <button
          onClick={onTogglePicker}
          className="flex items-center justify-center gap-1.5 rounded-2xl px-4 transition-colors hover:brightness-95 active:brightness-90 shrink-0"
          style={{
            background: pickerOpen ? 'var(--accent)' : 'var(--surface)',
            border: `1.5px solid ${pickerOpen ? 'var(--accent)' : 'var(--border)'}`,
            color: pickerOpen ? '#fff' : 'var(--ink)',
          }}
        >
          <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
            To Chains ({destinationCount})
          </span>
        </button>
      </div>

      <ChainPicker
        open={pickerOpen}
        onClose={onTogglePicker}
        chains={chains}
        selectedIds={selectedIds}
        onToggle={onToggleChain}
        onSelectMany={onSelectMany}
      />
    </div>
  );
}
