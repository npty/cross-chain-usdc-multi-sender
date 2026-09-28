/**
 * Inline compact chain picker — a horizontal wrap-grid of toggle pills.
 * Replaces the modal bottom-sheet for a faster, less intrusive UX.
 */
import { motion, AnimatePresence } from 'framer-motion';
import type { OnchainChain } from '@/onchain/facts';

interface ChainPickerProps {
  open: boolean;
  chains: OnchainChain[];
  selectedIds: number[];
  onToggle: (chainId: number) => void;
}

const ACCENT_PALETTE = [
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#84cc16', '#a855f7',
  '#0ea5e9', '#64748b', '#22d3ee', '#fb7185',
  '#4ade80',
];

function shortName(name: string): string {
  return name
    .replace(' Testnet', '')
    .replace(' Sepolia', '')
    .replace(' Mainnet', '')
    .replace(' Fuji', '')
    .replace(' Amoy', '')
    .replace(' Blaze', '');
}

export function ChainPicker({ open, chains, selectedIds, onToggle }: ChainPickerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="rounded-2xl p-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>
            Select destination chains
          </p>
          <div className="flex flex-wrap gap-2">
            {chains.map((chain, i) => {
              const selected = selectedIds.includes(chain.chainId);
              const color = ACCENT_PALETTE[i % ACCENT_PALETTE.length];
              return (
                <button
                  key={chain.chainId}
                  onClick={() => onToggle(chain.chainId)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.03] active:scale-[0.97]"
                  style={selected ? {
                    background: color,
                    color: '#fff',
                    border: `1.5px solid ${color}`,
                    boxShadow: `0 2px 8px ${color}40`,
                  } : {
                    background: 'var(--surface-muted)',
                    color: 'var(--ink-2)',
                    border: '1.5px solid var(--border)',
                  }}
                >
                  {/* mini avatar */}
                  <span
                    className="flex size-4 items-center justify-center rounded-full text-white font-bold"
                    style={{
                      fontSize: '9px',
                      background: selected ? 'rgba(255,255,255,0.25)' : color,
                    }}
                  >
                    {chain.name.slice(0, 2).toUpperCase()}
                  </span>
                  {shortName(chain.name)}
                </button>
              );
            })}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--subtle)' }}>
            {selectedIds.length} / 10 selected — tap to toggle
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
