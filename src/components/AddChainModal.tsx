import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { OnchainChain } from '@/onchain-facts';

interface AddChainModalProps {
  open: boolean;
  chains: OnchainChain[];
  onClose: () => void;
  selectedIds: number[];
  onAdd: (chainId: number) => void;
}

export function AddChainModal({ open, chains, onClose, selectedIds, onAdd }: AddChainModalProps) {
  const available = chains.filter((c) => !selectedIds.includes(c.chainId));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
          <motion.section
            className="relative w-full max-w-md overflow-hidden rounded-t-3xl"
            style={{
              background: 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderTop: '1px solid var(--border)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Spectral strip */}
            <div
              className="h-1"
              style={{
                background:
                  'linear-gradient(90deg, #6366f1 0%, #3b82f6 25%, #06b6d4 50%, #10b981 75%, #6366f1 100%)',
              }}
            />
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-black/10" />
            </div>

            <div className="px-5 pb-6 pt-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  Add Destination Chain
                </h2>
                <button
                  onClick={onClose}
                  className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                  style={{ color: 'var(--subtle)' }}
                >
                  <X className="size-4" />
                </button>
              </div>

              {available.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--muted)' }}>
                  All supported chains added
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {available.map((chain) => (
                    <button
                      key={chain.chainId}
                      onClick={() => {
                        onAdd(chain.chainId);
                        onClose();
                      }}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all hover:bg-black/5 active:scale-[0.98]"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                        style={{ background: 'var(--accent)' }}
                      >
                        {chain.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                          {chain.name}
                        </p>
                        <p className="text-xs mono" style={{ color: 'var(--subtle)' }}>
                          CCTP Domain {chain.cctpDomain}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
