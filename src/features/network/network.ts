import { NETWORKS, type NetworkMode } from '@/cctp-chains';
import type { SendStepState } from '../send/multisend';

export interface NetworkSwitchDeps {
  networkMode: NetworkMode;
  step: SendStepState;
  isConnected: boolean;
  walletChainId?: number;
  setNetworkMode: (mode: NetworkMode) => void;
  setSourceChainId: (chainId: number) => void;
  /** Clear all network-scoped send state (destinations, amount, hashes, quotes). */
  resetSendState: () => void;
  switchChain: (args: { chainId: number }) => void;
}

/**
 * Switch testnet ↔ mainnet: move to that network's default source chain,
 * clear all network-scoped state, and move the wallet automatically.
 * No-op when already on the mode or mid-send.
 */
export function switchNetwork(deps: NetworkSwitchDeps, mode: NetworkMode): void {
  if (mode === deps.networkMode || deps.step !== 'idle') return;
  const nextSource = NETWORKS[mode].sources[0];
  deps.setNetworkMode(mode);
  deps.setSourceChainId(nextSource.chainId);
  deps.resetSendState();
  if (deps.isConnected && deps.walletChainId !== nextSource.chainId) {
    deps.switchChain({ chainId: nextSource.chainId });
  }
}

/**
 * Switch the source chain: clear all source-scoped state and move the
 * wallet automatically. No-op when already on the chain or mid-send.
 */
export function switchSourceChain(deps: NetworkSwitchDeps, nextChainId: number, currentChainId: number): void {
  if (nextChainId === currentChainId || deps.step !== 'idle') return;
  deps.setSourceChainId(nextChainId);
  deps.resetSendState();
  if (deps.isConnected && deps.walletChainId !== nextChainId) {
    deps.switchChain({ chainId: nextChainId });
  }
}
