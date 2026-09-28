import { NETWORKS, NETWORK_MODES, type NetworkMode, type SourceChain } from '@/cctp-chains';
import type { SendStepState } from '../send/multisend';

interface NetworkPanelProps {
  networkMode: NetworkMode;
  step: SendStepState;
  onNetworkSwitch: (mode: NetworkMode) => void;
  sources: SourceChain[];
  sourceChainId: number;
  onSourceSwitch: (chainId: number) => void;
  sourceLabel: string;
  sourceChainName: string;
  contractDeployed: boolean;
  isConnected: boolean;
  formattedBalance: string | null;
  isBalanceError: boolean;
  balanceError: unknown;
  onRetryBalance: () => void;
  isWrongChain: boolean;
  onSwitchToSource: () => void;
}

/**
 * Network toggle, source-chain picker, and USDC balance — the "where from"
 * half of the top config panel.
 */
export function NetworkPanel(props: NetworkPanelProps) {
  const {
    networkMode, step, onNetworkSwitch,
    sources, sourceChainId, onSourceSwitch, sourceLabel, sourceChainName,
    contractDeployed, isConnected, formattedBalance,
    isBalanceError, balanceError, onRetryBalance,
    isWrongChain, onSwitchToSource,
  } = props;
  const interactive = step === 'idle';

  return (
    <div className="space-y-3">
      {/* Network toggle — Testnet / Mainnet */}
      <div className="flex items-center gap-2">
        <div
          className="flex flex-1 rounded-2xl p-1"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          role="tablist"
          aria-label="Network"
        >
          {NETWORK_MODES.map((mode) => {
            const active = mode === networkMode;
            return (
              <button
                key={mode}
                role="tab"
                aria-selected={active}
                disabled={!interactive}
                onClick={() => onNetworkSwitch(mode)}
                className="flex-1 rounded-xl py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={active
                  ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px rgba(0,115,250,0.3)' }
                  : { color: 'var(--muted)' }}
              >
                {NETWORKS[mode].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mainnet guard — contract not deployed yet */}
      {networkMode === 'mainnet' && !contractDeployed && (
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)' }}
        >
          <p className="text-xs font-semibold" style={{ color: '#b45309' }}>
            Sending from {sourceLabel} isn't live yet
          </p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
            The MultiSend contract hasn't been deployed on {sourceLabel} yet, so sending is
            disabled here. You can browse chains and quotes — switch to another source chain
            to send.
          </p>
        </div>
      )}

      {/* Source chain + balance — compact single row */}
      {isConnected && (
        <div
          className="flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full text-white text-xs font-bold" style={{ background: 'var(--accent)' }}>
              {sourceLabel.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold leading-none" style={{ color: 'var(--muted)' }}>Source</p>
              {sources.length > 1 ? (
                <select
                  value={sourceChainId}
                  onChange={(e) => onSourceSwitch(Number(e.target.value))}
                  disabled={!interactive}
                  aria-label="Source chain"
                  className="text-sm font-bold leading-tight bg-transparent outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: 'var(--ink)' }}
                >
                  {sources.map((s) => (
                    <option key={s.chainId} value={s.chainId} style={{ color: '#000' }}>
                      {s.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--ink)' }}>{sourceChainName}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs leading-none" style={{ color: 'var(--muted)' }}>Balance</p>
            <p className="display text-base font-bold tabular-nums leading-tight" style={{ color: 'var(--ink)' }}>
              {formattedBalance ?? '—'} <span className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
            </p>
            {isBalanceError && (
              <button
                type="button"
                onClick={onRetryBalance}
                className="text-xs leading-tight underline"
                style={{ color: 'var(--danger)' }}
                title={balanceError instanceof Error ? balanceError.message : 'Balance failed to load'}
              >
                Balance failed to load — tap to retry
              </button>
            )}
          </div>
          {isWrongChain && (
            <button
              type="button"
              onClick={onSwitchToSource}
              title={`Switch to ${sourceLabel}`}
              className="ml-2 cursor-pointer rounded-lg px-2 py-1 text-xs font-medium"
              style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}
            >
              Wrong network — tap to switch
            </button>
          )}
        </div>
      )}
    </div>
  );
}
