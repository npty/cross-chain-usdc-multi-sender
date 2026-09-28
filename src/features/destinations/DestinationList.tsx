import { Plus } from 'lucide-react';

import { getNetworkChain, type NetworkMode } from '@/cctp-chains';
import { ChainRow } from './ChainRow';
import type { ChainDestination } from './types';

interface DestinationListProps {
  destinations: ChainDestination[];
  networkMode: NetworkMode;
  loadingIndices: Set<number>;
  onRemove: (index: number) => void;
  onRecipientChange: (index: number, recipient: string) => void;
}

/** Destination chain rows, or the empty state when none are selected. */
export function DestinationList(props: DestinationListProps) {
  const { destinations, networkMode, loadingIndices, onRemove, onRecipientChange } = props;

  if (destinations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full" style={{ background: 'rgba(0,115,250,0.08)' }}>
          <Plus className="size-5" style={{ color: 'var(--accent)' }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>No chains selected</p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Open the Chains picker above to add destinations</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {destinations.map((dest, index) => {
        const chain = getNetworkChain(networkMode, dest.chainId)!;
        return (
          <ChainRow
            key={dest.chainId}
            dest={dest}
            chain={chain}
            index={index}
            onRemove={onRemove}
            onRecipientChange={onRecipientChange}
            isLoading={loadingIndices.has(index)}
          />
        );
      })}
    </div>
  );
}
