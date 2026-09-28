/**
 * Chain picker modal — a compact centered dialog over a dimmed backdrop.
 * Rendered through a portal so it floats above everything (including the
 * sticky top zone) instead of pushing page content down.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { OnchainChain } from '@/onchain/facts';

interface ChainPickerProps {
  open: boolean;
  onClose: () => void;
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

export function ChainPicker({ open, onClose, chains, selectedIds, onToggle }: ChainPickerProps) {
  // Close on Escape + lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,15,30,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Select destination chains"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-lg rounded-3xl p-5 max-h-[70dvh] overflow-y-auto"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 24px 64px rgba(10,20,40,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                Select destination chains
              </p>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
                style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}
              >
                <X className="size-4" />
              </button>
            </div>

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

            <p className="text-xs mt-4" style={{ color: 'var(--subtle)' }}>
              {selectedIds.length} selected — tap to toggle
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
