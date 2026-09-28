import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useReadContract,
  usePublicClient,
  useSignTypedData,
} from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { erc20Abi } from 'viem';
import { toast } from 'sonner';
import { ContractsPage } from './features/contracts/ContractsPage';
import { PageFooter } from '@/shared/PageFooter';

import { getUsdc, requireChain } from '@/onchain/facts';
import { NETWORKS, type NetworkMode } from '@/cctp-chains';
import { parseOnchainError } from '@/shared/errors';

import { NetworkPanel } from './features/network/NetworkPanel';
import { switchNetwork, switchSourceChain } from './features/network/network';
import { DestinationComposer } from './features/destinations/DestinationComposer';
import { DestinationList } from './features/destinations/DestinationList';
import {
  applyGlobalAmount,
  removeDestination,
  sanitizeAmountInput,
  setDestinationChains,
  toggleDestination,
  updateRecipient,
} from './features/destinations/destinations';
import type { ChainDestination, FeeQuote } from './features/destinations/types';
import { FeeSummary } from './features/fees/FeeSummary';
import { computeTotals } from './features/fees/totals';
import { useFeeEstimates } from './features/fees/useFeeEstimates';
import { SendButton } from './features/send/SendButton';
import { SendFlow, type SendStepState } from './features/send/multisend';
import { TrackingPanel } from './features/tracking/TrackingPanel';

// Hash-based route: '#/contracts' shows the info-only contracts page,
// anything else shows the send flow.
function useHashRoute(): 'send' | 'contracts' {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash === '#/contracts' ? 'contracts' : 'send';
}

export default function App() {
  const route = useHashRoute();
  const { address, chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  // ── Network + source chain ──────────────────────────────────────────────

  const [networkMode, setNetworkMode] = useState<NetworkMode>('testnet');
  const net = NETWORKS[networkMode];
  const [sourceChainId, setSourceChainId] = useState<number>(NETWORKS.testnet.sources[0].chainId);
  const source = net.sources.find((s) => s.chainId === sourceChainId) ?? net.sources[0];
  const SOURCE_CHAIN_ID = source.chainId;
  const MULTISEND_ADDRESS = source.contractAddress;
  const contractDeployed = MULTISEND_ADDRESS !== '0x0000000000000000000000000000000000000000';

  // ── Send session state ──────────────────────────────────────────────────

  const [destinations, setDestinations] = useState<ChainDestination[]>([]);
  const [globalAmount, setGlobalAmount] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingIndices, setLoadingIndices] = useState<Set<number>>(new Set());
  const [sendTxHash, setSendTxHash] = useState<`0x${string}` | undefined>();
  const [step, setStep] = useState<SendStepState>('idle');

  const resetSendState = useCallback(() => {
    setDestinations([]);
    setGlobalAmount('');
    setPickerOpen(false);
    setLoadingIndices(new Set());
    setSendTxHash(undefined);
  }, [setDestinations, setGlobalAmount, setPickerOpen, setLoadingIndices, setSendTxHash]);

  const networkDeps = {
    networkMode,
    step,
    isConnected,
    walletChainId: chainId,
    setNetworkMode,
    setSourceChainId,
    resetSendState,
    switchChain,
  };

  // Keyboard shortcuts: 1 → Testnet, 2 → Mainnet. Ignored while typing in
  // inputs or mid-send (switchNetwork also no-ops then).
  const networkDepsRef = useRef(networkDeps);
  useEffect(() => {
    networkDepsRef.current = networkDeps;
  });
  useEffect(() => {
    if (step !== 'idle') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === '1') switchNetwork(networkDepsRef.current, 'testnet');
      else if (e.key === '2') switchNetwork(networkDepsRef.current, 'mainnet');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step]);

  // ── Wallet data ─────────────────────────────────────────────────────────

  const isWrongChain = isConnected && chainId !== SOURCE_CHAIN_ID;
  const sourceChain = requireChain(SOURCE_CHAIN_ID);
  const sourceUsdc = getUsdc(SOURCE_CHAIN_ID)!;

  const { data: usdcBalance, isError: isBalanceError, error: balanceError, refetch: refetchBalance } = useReadContract({
    address: sourceUsdc.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    chainId: SOURCE_CHAIN_ID,
    query: { enabled: !!address },
  });
  const formattedBalance = usdcBalance !== undefined
    ? (Number(usdcBalance) / 1e6).toFixed(2) : null;

  const { writeContractAsync: sendAsync, isPending: isSendPending } = useWriteContract();
  const { signTypedDataAsync, isPending: isSignPending } = useSignTypedData();
  const publicClient = usePublicClient({ chainId: SOURCE_CHAIN_ID });

  const { isLoading: isSendConfirming } = useWaitForTransactionReceipt({ hash: sendTxHash });

  // ── Fee estimation ──────────────────────────────────────────────────────

  const handleFeeUpdate = useCallback(
    (index: number, quote: FeeQuote | null, error: string | null, loading: boolean) => {
      setDestinations((prev) => {
        const next = [...prev];
        if (next[index]) next[index] = { ...next[index], feeQuote: quote, feeError: error };
        return next;
      });
      setLoadingIndices((prev) => {
        const next = new Set(prev);
        if (loading) next.add(index); else next.delete(index);
        return next;
      });
    },
    [setDestinations, setLoadingIndices],
  );

  useFeeEstimates({
    destinations,
    sourceChainId: SOURCE_CHAIN_ID,
    networkMode,
    quoteApiBase: net.quoteApiBase,
    sourceDomain: source.cctpDomain,
    enabled: step === 'idle',
    onUpdate: handleFeeUpdate,
  });

  // ── Totals ──────────────────────────────────────────────────────────────

  const totals = useMemo(() => computeTotals(destinations), [destinations]);

  // ── Destination handlers (thin wrappers over pure feature helpers) ──────

  function handleToggleChain(cId: number) {
    const already = destinations.some((d) => d.chainId === cId);
    // Can't remove a chain mid-send
    if (already && step !== 'idle') return;
    setDestinations((prev) =>
      toggleDestination(prev, cId, { networkMode, amount: globalAmount, walletAddress: address }),
    );
  }

  function handleSelectChains(ids: number[]) {
    if (step !== 'idle') return;
    setDestinations((prev) =>
      setDestinationChains(prev, ids, { networkMode, amount: globalAmount, walletAddress: address }),
    );
  }

  function handleGlobalAmountChange(value: string) {
    const v = sanitizeAmountInput(value);
    if (v === null) return;
    setGlobalAmount(v);
    setDestinations((prev) => applyGlobalAmount(prev, v));
  }

  function handleRemove(index: number) {
    setDestinations((prev) => removeDestination(prev, index));
  }

  function handleRecipientChange(index: number, recipient: string) {
    setDestinations((prev) => updateRecipient(prev, index, recipient));
  }

  // ── Send ────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!address || !publicClient) return;
    if (isWrongChain) { switchChain({ chainId: SOURCE_CHAIN_ID }); return; }
    if (!contractDeployed) {
      toast.error('Contract not deployed yet.');
      return;
    }

    const flow = new SendFlow({
      address,
      networkMode,
      sourceChainId: SOURCE_CHAIN_ID,
      multisendAddress: MULTISEND_ADDRESS,
      sourceUsdcAddress: sourceUsdc.address as `0x${string}`,
      permit: { name: source.permitName, version: source.permitVersion },
      publicClient,
      sendContractAsync: sendAsync,
      signTypedDataAsync,
    });

    try {
      setSendTxHash(undefined);
      const prepared = await flow.prepare(destinations);
      await flow.execute(prepared, {
        onStep: setStep,
        onSendHash: setSendTxHash,
      });
      setStep('done');
    } catch (e) {
      toast.error(parseOnchainError(e));
      setStep('idle');
    }
  }, [address, publicClient, isWrongChain, switchChain, networkMode, source, SOURCE_CHAIN_ID, MULTISEND_ADDRESS, destinations, sourceUsdc, contractDeployed, sendAsync, signTypedDataAsync, setSendTxHash, setStep]);

  const selectedIds = destinations.map((d) => d.chainId);
  const pickerChains = net.destinations.filter((d) => d.chainId !== source.chainId);

  // ── Render: single scrolling page ─────────────────────────────────────────
  // Everything flows in one column; the whole page scrolls together.

  // Info-only route: '#/contracts' renders the verified-contracts page.
  if (route === 'contracts') {
    return <ContractsPage />;
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <div className="mx-auto max-w-lg px-4 pt-6 pb-8 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>MultiSend</h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>USDC to multiple chains in one tx</p>
          </div>
          <ConnectKitButton />
        </div>

        <NetworkPanel
          networkMode={networkMode}
          step={step}
          onNetworkSwitch={(mode) => switchNetwork(networkDeps, mode)}
          sources={net.sources}
          sourceChainId={sourceChainId}
          onSourceSwitch={(id) => switchSourceChain(networkDeps, id, sourceChainId)}
          sourceLabel={source.label}
          sourceChainName={sourceChain.name}
          contractDeployed={contractDeployed}
          isConnected={isConnected}
          formattedBalance={formattedBalance}
          isBalanceError={isBalanceError}
          balanceError={balanceError}
          onRetryBalance={() => { void refetchBalance(); }}
          isWrongChain={isWrongChain}
          onSwitchToSource={() => switchChain({ chainId: SOURCE_CHAIN_ID })}
        />

        <DestinationComposer
          globalAmount={globalAmount}
          onGlobalAmountChange={handleGlobalAmountChange}
          pickerOpen={pickerOpen}
          onTogglePicker={() => setPickerOpen((o) => !o)}
          destinationCount={destinations.length}
          chains={pickerChains}
          selectedIds={selectedIds}
          onToggleChain={handleToggleChain}
          onSelectMany={handleSelectChains}
        />

        <DestinationList
          destinations={destinations}
          networkMode={networkMode}
          loadingIndices={loadingIndices}
          onRemove={handleRemove}
          onRecipientChange={handleRecipientChange}
        />

        <FeeSummary
          destinations={destinations}
          networkMode={networkMode}
          totals={totals}
          loadingIndices={loadingIndices}
        />

        {step === 'done' && sendTxHash && (
          <TrackingPanel
            sendTxHash={sendTxHash}
            sourceChainId={SOURCE_CHAIN_ID}
            destinations={destinations}
            networkMode={networkMode}
            walletAddress={address}
          />
        )}

        <SendButton
          isConnected={isConnected}
          isWrongChain={isWrongChain}
          wrongChainLabel={sourceChain.name}
          contractDeployed={contractDeployed}
          step={step}
          isSendPending={isSendPending}
          isSendConfirming={isSendConfirming}
          isSignPending={isSignPending}
          destinationCount={destinations.length}
          allQuotesReady={totals.allQuotesReady}
          onSend={() => { void handleSend(); }}
        />

        {step === 'done' && (
          <button
            onClick={() => { setStep('idle'); resetSendState(); }}
            className="w-full rounded-2xl py-3 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--muted)' }}
          >
            Send again
          </button>
        )}

        {contractDeployed ? (
          <p className="text-center text-xs mono pb-4" style={{ color: 'var(--subtle)' }}>
            Contract:{' '}
            <a href={`${sourceChain.explorerBase}/address/${MULTISEND_ADDRESS}`} target="_blank" rel="noreferrer" className="underline">
              {MULTISEND_ADDRESS.slice(0, 8)}...{MULTISEND_ADDRESS.slice(-6)}
            </a>
          </p>
        ) : (
          <p className="text-center text-xs pb-4" style={{ color: 'var(--subtle)' }}>Deploy the contract to enable sending</p>
        )}

        <PageFooter />
      </div>
    </div>
  );
}
