import { useState, useCallback, useMemo } from 'react';
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
import { erc20Abi, bytesToHex } from 'viem';
import bs58 from 'bs58';
import { PublicKey, Connection } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Plus, ArrowRight, Loader2, ExternalLink, Info, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { getUsdc, requireChain, buildTxExplorerUrl } from '@/onchain-facts';
import {
  NETWORKS,
  NETWORK_MODES,
  getNetworkChain,
  buildDestinationAddressUrl,
  type NetworkMode,
} from '@/cctpChains';
import { parseAmount } from '@/onchain-money';
import { ChainRow } from './components/ChainRow';
import { ChainPicker } from './components/ChainPicker';
import { useFeeEstimates } from './hooks/useFeeEstimates';
import type { ChainDestination, FeeQuote } from './components/types';

const MULTISEND_ABI = [
  {
    type: 'function', name: 'multiSend', stateMutability: 'payable',
    inputs: [{
      name: 'requests', type: 'tuple[]',
      components: [
        { name: 'destinationDomain', type: 'uint32' },
        { name: 'mintRecipient', type: 'bytes32' },
        { name: 'amount', type: 'uint256' },
        { name: 'fee', type: 'uint256' },
        { name: 'signedQuote', type: 'bytes' },
      ],
    }],
    outputs: [],
  },
  {
    type: 'function', name: 'permitAndMultiSend', stateMutability: 'payable',
    inputs: [
      {
        name: 'requests', type: 'tuple[]',
        components: [
          { name: 'destinationDomain', type: 'uint32' },
          { name: 'mintRecipient', type: 'bytes32' },
          { name: 'amount', type: 'uint256' },
          { name: 'fee', type: 'uint256' },
          { name: 'signedQuote', type: 'bytes' },
        ],
      },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'usdc', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function', name: 'totalCost', stateMutability: 'pure',
    inputs: [{
      name: 'requests', type: 'tuple[]',
      components: [
        { name: 'destinationDomain', type: 'uint32' },
        { name: 'mintRecipient', type: 'bytes32' },
        { name: 'amount', type: 'uint256' },
        { name: 'fee', type: 'uint256' },
        { name: 'signedQuote', type: 'bytes' },
      ],
    }],
    outputs: [
      { name: 'usdcErc20Total', type: 'uint256' },
      { name: 'nativeFeeTotal', type: 'uint256' },
    ],
  },
] as const;

/**
 * Minimal EIP-2612 surface on the Arc USDC contract.
 * Domain verified on-chain: name "USDC", version "2".
 */
const PERMIT_ABI = [
  {
    type: 'function', name: 'nonces', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

function addrToBytes32(address: string): `0x${string}` {
  // Solana (non-EVM): base58-encoded 32-byte public key
  if (!address.startsWith('0x')) {
    const decoded = bs58.decode(address);
    if (decoded.length !== 32) throw new Error('Invalid Solana address');
    return bytesToHex(decoded);
  }
  return `0x${address.replace('0x', '').padStart(64, '0')}`;
}

function isValidSolanaAddress(address: string): boolean {
  try {
    return bs58.decode(address).length === 32;
  } catch {
    return false;
  }
}

/**
 * Resolve the CCTP mintRecipient for a Solana destination.
 * Circle requires the recipient's USDC token account (ATA), NOT the wallet address.
 * - If the entered address is already a USDC token account, use it directly.
 * - Otherwise derive the ATA from the wallet address + USDC mint.
 * The Forwarding Service creates the ATA on-chain if it doesn't exist yet.
 */
async function resolveSolanaMintRecipient(
  solanaUsdcMint: string,
  solanaRpcUrl: string,
  walletAddress: string,
): Promise<`0x${string}`> {
  const entered = new PublicKey(walletAddress);

  // If the user pasted a token account directly, use it as-is.
  // (Deriving an ATA from a token-account address would lose funds.)
  try {
    const connection = new Connection(solanaRpcUrl, 'confirmed');
    const info = await connection.getParsedAccountInfo(entered);
    const data = info.value?.data;
    if (data && typeof data === 'object' && 'parsed' in data) {
      const parsedInfo = (data as { parsed: { info: { mint?: string } } }).parsed.info;
      if (parsedInfo.mint === solanaUsdcMint) {
        return bytesToHex(entered.toBytes());
      }
    }
  } catch {
    // RPC unreachable — fall through to ATA derivation.
  }

  const ata = getAssociatedTokenAddressSync(new PublicKey(solanaUsdcMint), entered);
  return bytesToHex(ata.toBytes());
}

const glass = {
  card: {
    background: 'var(--surface)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
  } as React.CSSProperties,
};

export default function App() {
  const { address, chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const [networkMode, setNetworkMode] = useState<NetworkMode>('testnet');
  const net = NETWORKS[networkMode];
  const [sourceChainId, setSourceChainId] = useState<number>(NETWORKS.testnet.sources[0].chainId);
  const source = net.sources.find((s) => s.chainId === sourceChainId) ?? net.sources[0];
  const SOURCE_CHAIN_ID = source.chainId;
  const MULTISEND_ADDRESS = source.contractAddress;
  const contractDeployed = MULTISEND_ADDRESS !== '0x0000000000000000000000000000000000000000';

  const [destinations, setDestinations] = useState<ChainDestination[]>([]);
  const [globalAmount, setGlobalAmount] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingIndices, setLoadingIndices] = useState<Set<number>>(new Set());
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>();
  const [sendTxHash, setSendTxHash] = useState<`0x${string}` | undefined>();
  const [step, setStep] = useState<'idle' | 'approving' | 'sending' | 'done'>('idle');

  /**
   * Switch testnet ↔ mainnet: reset to that network's default source, clear all
   * network-scoped state, and move the wallet to the new source chain
   * automatically.
   */
  function handleNetworkSwitch(mode: NetworkMode) {
    if (mode === networkMode || step !== 'idle') return;
    const nextSource = NETWORKS[mode].sources[0];
    setNetworkMode(mode);
    setSourceChainId(nextSource.chainId);
    setDestinations([]);
    setGlobalAmount('');
    setPickerOpen(false);
    setLoadingIndices(new Set());
    setApproveTxHash(undefined);
    setSendTxHash(undefined);
    if (isConnected && chainId !== nextSource.chainId) {
      switchChain({ chainId: nextSource.chainId });
    }
  }

  /**
   * Switch the source chain (mainnet): clear all source-scoped state and move
   * the wallet to the new source chain automatically.
   */
  function handleSourceSwitch(nextChainId: number) {
    if (nextChainId === sourceChainId || step !== 'idle') return;
    setSourceChainId(nextChainId);
    setDestinations([]);
    setGlobalAmount('');
    setPickerOpen(false);
    setLoadingIndices(new Set());
    setApproveTxHash(undefined);
    setSendTxHash(undefined);
    if (isConnected && chainId !== nextChainId) {
      switchChain({ chainId: nextChainId });
    }
  }

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

  const { writeContractAsync: approveAsync, isPending: isApprovePending } = useWriteContract();
  const { writeContractAsync: sendAsync, isPending: isSendPending } = useWriteContract();
  const { signTypedDataAsync, isPending: isSignPending } = useSignTypedData();
  const publicClient = usePublicClient({ chainId: SOURCE_CHAIN_ID });

  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({ hash: approveTxHash });
  const { isLoading: isSendConfirming } = useWaitForTransactionReceipt({ hash: sendTxHash });

  // ── Fee estimation ────────────────────────────────────────────────────────

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
    onUpdate: handleFeeUpdate,
  });

  // ── Totals ────────────────────────────────────────────────────────────────

  const totals = useMemo(() => {
    let usdcTotal = 0;
    let feeNativeTotal = BigInt(0);
    let allQuotesReady = destinations.length > 0;

    for (const d of destinations) {
      const amt = parseFloat(d.amount || '0');
      if (!isNaN(amt)) usdcTotal += amt;
      if (!d.feeQuote || !d.amount || parseFloat(d.amount) <= 0) {
        allQuotesReady = false;
      } else {
        feeNativeTotal += BigInt(d.feeQuote.feeTotalAmount);
      }
    }

    const feeUSDC = Number(feeNativeTotal / BigInt(1e12)) / 1e6;
    const grandTotal = usdcTotal + feeUSDC;
    return { usdcTotal, feeUSDC, feeNativeTotal, grandTotal, allQuotesReady };
  }, [destinations]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  /** Toggle a chain on/off in the picker. */
  function handleToggleChain(cId: number) {
    const already = destinations.findIndex((d) => d.chainId === cId);
    if (already !== -1) {
      // Remove — but only if not mid-send
      if (step !== 'idle') return;
      setDestinations((prev) => prev.filter((_, i) => i !== already));
    } else {
      if (destinations.length >= 10) {
        toast.error('Maximum 10 destination chains.');
        return;
      }
      setDestinations((prev) => [
        ...prev,
        {
          chainId: cId,
          amount: globalAmount,
          // Non-EVM chains (Solana) need a native address — don't default to the EVM wallet
          recipient: getNetworkChain(networkMode, cId)?.isNonEvm ? '' : (address ?? ''),
          feeQuote: null,
          feeError: null,
        },
      ]);
    }
  }

  /** Update global amount — broadcasts to all non-overridden chains. */
  function handleGlobalAmountChange(value: string) {
    const v = value.replace(/[^0-9.]/g, '');
    if (v !== '' && !/^\d*\.?\d*$/.test(v)) return;
    setGlobalAmount(v);
    setDestinations((prev) =>
      prev.map((d) => ({ ...d, amount: v, feeQuote: null, feeError: null })),
    );
  }

  function handleRemove(index: number) {
    setDestinations((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRecipientChange(index: number, recipient: string) {
    // Note: the fee quote is intentionally NOT cleared here — it depends only on
    // (source, destination, amount), not on the recipient address.
    setDestinations((prev) =>
      prev.map((d, i) => (i === index ? { ...d, recipient } : d)),
    );
  }

  const handleSend = useCallback(async () => {
    if (!address || !publicClient) return;
    if (isWrongChain) { switchChain({ chainId: SOURCE_CHAIN_ID }); return; }
    if (!contractDeployed) {
      toast.error('Contract not deployed yet.');
      return;
    }

    // Validate non-EVM (Solana) recipients before building requests
    for (const dest of destinations) {
      const chain = getNetworkChain(networkMode, dest.chainId)!;
      if (chain.isNonEvm) {
        const recipient = dest.recipient || address;
        if (!isValidSolanaAddress(recipient)) {
          toast.error(`Invalid Solana address for ${chain.name}. Enter a valid base58 address.`);
          return;
        }
      }
    }

    const requests = await Promise.all(destinations.map(async (dest) => {
      const chain = getNetworkChain(networkMode, dest.chainId)!;
      const parsed = parseAmount(SOURCE_CHAIN_ID, dest.amount);
      const recipient = dest.recipient || address;
      // Solana destinations: mintRecipient must be the USDC token account (ATA),
      // not the wallet address. The Forwarding Service creates the ATA if needed.
      const mintRecipient = chain.isNonEvm
        ? await resolveSolanaMintRecipient(chain.solanaUsdcMint!, chain.rpcUrls[0], recipient)
        : addrToBytes32(recipient);
      return {
        destinationDomain: chain.cctpDomain as number,
        mintRecipient,
        amount: parsed.raw,
        fee: BigInt(dest.feeQuote!.feeTotalAmount),
        signedQuote: dest.feeQuote!.signedQuote as `0x${string}`,
      };
    }));
    const totalUsdc6 = requests.reduce((acc, r) => acc + r.amount, BigInt(0));
    const totalNativeFee = requests.reduce((acc, r) => acc + r.fee, BigInt(0));

    try {
      setApproveTxHash(undefined);
      setSendTxHash(undefined);

      if (source.supportsPermit) {
        // Gasless approval: sign an EIP-2612 permit off-chain (free), then the
        // contract executes permit + multi-send in a single transaction.
        setStep('approving');
        const nonce = await publicClient.readContract({
          address: sourceUsdc.address as `0x${string}`,
          abi: PERMIT_ABI,
          functionName: 'nonces',
          args: [address],
        });
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 min
        const signature = await signTypedDataAsync({
          domain: {
            name: source.permitName,
            version: source.permitVersion,
            chainId: SOURCE_CHAIN_ID,
            verifyingContract: sourceUsdc.address as `0x${string}`,
          },
          types: PERMIT_TYPES,
          primaryType: 'Permit',
          message: {
            owner: address,
            spender: MULTISEND_ADDRESS,
            value: totalUsdc6,
            nonce,
            deadline,
          },
        });
        const r: `0x${string}` = `0x${signature.slice(2, 66)}`;
        const s: `0x${string}` = `0x${signature.slice(66, 130)}`;
        const v = parseInt(signature.slice(130, 132), 16);

        setStep('sending');
        const sendHash = await sendAsync({
          address: MULTISEND_ADDRESS,
          abi: MULTISEND_ABI,
          functionName: 'permitAndMultiSend',
          args: [requests, deadline, v, r, s],
          value: totalNativeFee,
          chainId: SOURCE_CHAIN_ID,
        });
        setSendTxHash(sendHash);
        await publicClient.waitForTransactionReceipt({ hash: sendHash });
        setStep('done');
      } else {
        // Legacy flow: separate on-chain approve, then multiSend.
        setStep('approving');
        const approveHash = await approveAsync({
          address: sourceUsdc.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [MULTISEND_ADDRESS, totalUsdc6],
          chainId: SOURCE_CHAIN_ID,
        });
        setApproveTxHash(approveHash);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        setStep('sending');
        const sendHash = await sendAsync({
          address: MULTISEND_ADDRESS,
          abi: MULTISEND_ABI,
          functionName: 'multiSend',
          args: [requests],
          value: totalNativeFee,
          chainId: SOURCE_CHAIN_ID,
        });
        setSendTxHash(sendHash);
        await publicClient.waitForTransactionReceipt({ hash: sendHash });
        setStep('done');
      }
    } catch (e) {
      toast.error(parseOnchainError(e));
      setStep('idle');
    }
  }, [address, publicClient, isWrongChain, switchChain, networkMode, source, SOURCE_CHAIN_ID, MULTISEND_ADDRESS, destinations, sourceUsdc, contractDeployed, approveAsync, sendAsync, signTypedDataAsync, setApproveTxHash, setSendTxHash, setStep]);

  const canSend =
    isConnected && !isWrongChain && destinations.length > 0 &&
    totals.allQuotesReady && step === 'idle' && contractDeployed;

  const isProcessing =
    step === 'approving' || step === 'sending' || isApprovePending || isSendPending ||
    isApproveConfirming || isSendConfirming || isSignPending;

  function ctaLabel() {
    if (!isConnected) return 'Connect Wallet';
    if (isWrongChain) return `Switch to ${sourceChain.name}`;
    if (!contractDeployed) return 'Contract not deployed';
    if (step === 'approving') {
      if (source.supportsPermit)
        return <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" />{isSignPending ? 'Sign permit in wallet...' : 'Preparing permit...'}</span>;
      if (isApprovePending || isApproveConfirming)
        return <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" />{isApprovePending ? 'Approve in wallet...' : 'Approving USDC...'}</span>;
    }
    if (step === 'sending' && (isSendPending || isSendConfirming))
      return <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" />{isSendPending ? 'Confirm in wallet...' : 'Broadcasting...'}</span>;
    if (step === 'done') return 'Sent!';
    if (destinations.length === 0) return 'Select destination chains below';
    if (!totals.allQuotesReady) return 'Waiting for fee quotes...';
    return (
      <span className="flex items-center justify-center gap-1.5">
        Send USDC to {destinations.length} chain{destinations.length > 1 ? 's' : ''}
        <ArrowRight className="size-4" />
      </span>
    );
  }

  const selectedIds = destinations.map((d) => d.chainId);

  // Two-zone layout: top (sticky config) + bottom (scrollable details)
  return (
    <div className="flex flex-col min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>

      {/* ── TOP ZONE — sticky config panel ───────────────────────────────── */}
      <div
        className="sticky top-0 z-20 px-4 pt-6 pb-4 space-y-3"
        style={{
          background: 'var(--bg-gradient)',
          borderBottom: destinations.length > 0 ? '1px solid var(--border)' : 'none',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className="mx-auto max-w-lg space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>MultiSend</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>USDC to multiple chains in one tx</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>
                Independent developer tool — not affiliated with, endorsed by, or sponsored by Circle Internet Financial, Inc.
              </p>
            </div>
            <ConnectKitButton />
          </div>

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
                    disabled={step !== 'idle'}
                    onClick={() => handleNetworkSwitch(mode)}
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
                Sending from {source.label} isn't live yet
              </p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                The MultiSend contract hasn't been deployed on {source.label} yet, so sending is
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
                  {source.label.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold leading-none" style={{ color: 'var(--muted)' }}>Source</p>
                  {net.sources.length > 1 ? (
                    <select
                      value={sourceChainId}
                      onChange={(e) => handleSourceSwitch(Number(e.target.value))}
                      disabled={step !== 'idle'}
                      aria-label="Source chain"
                      className="text-sm font-bold leading-tight bg-transparent outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ color: 'var(--ink)' }}
                    >
                      {net.sources.map((s) => (
                        <option key={s.chainId} value={s.chainId} style={{ color: '#000' }}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-bold leading-tight" style={{ color: 'var(--ink)' }}>{sourceChain.name}</p>
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
                    onClick={() => refetchBalance()}
                    className="text-xs leading-tight underline"
                    style={{ color: 'var(--danger)' }}
                    title={balanceError instanceof Error ? balanceError.message : String(balanceError ?? '')}
                  >
                    Balance failed to load — tap to retry
                  </button>
                )}
              </div>
              {isWrongChain && (
                <button
                  type="button"
                  onClick={() => switchChain({ chainId: SOURCE_CHAIN_ID })}
                  title={`Switch to ${source.label}`}
                  className="ml-2 cursor-pointer rounded-lg px-2 py-1 text-xs font-medium"
                  style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}
                >
                  Wrong network — tap to switch
                </button>
              )}
            </div>
          )}

          {/* Global amount + chain picker side-by-side */}
          <div className="flex gap-2 items-stretch">
            {/* Amount input */}
            <div
              className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <input
                inputMode="decimal"
                value={globalAmount}
                onChange={(e) => handleGlobalAmountChange(e.target.value)}
                placeholder="0.00"
                className="display flex-1 bg-transparent text-2xl font-bold tabular-nums outline-none placeholder:opacity-25 min-w-0"
                style={{ color: 'var(--ink)' }}
              />
              <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--muted)' }}>USDC</span>
            </div>

            {/* Picker toggle — compact square button */}
            <button
              onClick={() => setPickerOpen((o) => !o)}
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
              {destinations.length > 0 && (
                <span
                  className="text-xs font-bold tabular-nums leading-none"
                  style={{ color: pickerOpen ? 'rgba(255,255,255,0.8)' : 'var(--accent)' }}
                >
                  {destinations.length}
                </span>
              )}
            </button>
          </div>

          {/* Chain picker — opens below the row, above the list */}
          <ChainPicker
            open={pickerOpen}
            chains={net.destinations.filter((d) => d.chainId !== source.chainId)}
            selectedIds={selectedIds}
            onToggle={handleToggleChain}
          />
        </div>
      </div>

      {/* ── BOTTOM ZONE — scrollable chain list + summary + CTA ──────────── */}
      <div className="flex-1 px-4 py-4">
        <div className="mx-auto max-w-lg space-y-4">

          {/* Destination chain rows */}
          {destinations.length > 0 && (
            <div className="space-y-3">
              {destinations.map((dest, index) => {
                const chain = getNetworkChain(networkMode, dest.chainId)!;
                return (
                  <ChainRow
                    key={dest.chainId}
                    dest={dest}
                    chain={chain}
                    index={index}
                    onRemove={handleRemove}
                    onRecipientChange={handleRecipientChange}
                    isLoading={loadingIndices.has(index)}
                  />
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {destinations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-full" style={{ background: 'rgba(0,115,250,0.08)' }}>
                <Plus className="size-5" style={{ color: 'var(--accent)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>No chains selected</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Open the Chains picker above to add destinations</p>
            </div>
          )}

          {/* Fee summary */}
          {destinations.length > 0 && (
            <div style={{ ...glass.card, padding: '16px' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>Transaction Summary</p>
              <div className="space-y-2">
                <SummaryRow label="USDC to send" value={`${totals.usdcTotal.toFixed(2)} USDC`} bold />
                <SummaryRow
                  label={`Forwarding fees (${destinations.length} chain${destinations.length > 1 ? 's' : ''})`}
                  value={totals.allQuotesReady ? `${totals.feeUSDC.toFixed(6)} USDC` : loadingIndices.size > 0 ? 'Estimating...' : '—'}
                  sub="paid as native gas on Arc"
                />
                <div className="h-px my-1" style={{ background: 'var(--border)' }} />
                <SummaryRow
                  label="Total USDC deducted"
                  value={totals.allQuotesReady ? `${totals.grandTotal.toFixed(6)} USDC` : '—'}
                  bold accent
                />
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl p-3" style={{ background: 'rgba(18,45,69,0.05)' }}>
                <Info className="size-3.5 mt-0.5 shrink-0" style={{ color: 'var(--muted)' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  On Arc, native gas and USDC share the same pool. Fees are paid as native (18-dec) via msg.value; principal is pulled as ERC-20 (6-dec). The total above converts both to USDC terms.
                </p>
              </div>

              {destinations.length > 1 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>Per-chain breakdown</p>
                  {destinations.map((dest, i) => {
                    const chain = getNetworkChain(networkMode, dest.chainId)!;
                    const feeDisplay = dest.feeQuote
                      ? `${(Number(dest.feeQuote.feeTotalAmount) / 1e18).toFixed(6)} USDC`
                      : loadingIndices.has(i) ? 'estimating...' : '—';
                    return (
                      <div key={dest.chainId} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--subtle)' }}>
                          {chain.name}
                        </span>
                        <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--ink-2)' }}>
                          {dest.amount ? `${dest.amount} + ` : ''}{feeDisplay} fee
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {step === 'done' && sendTxHash && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(26,128,71,0.08)', border: '1px solid rgba(26,128,71,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="size-4" style={{ color: 'var(--success)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Multi-chain send confirmed</span>
              </div>
              <a href={buildTxExplorerUrl(SOURCE_CHAIN_ID, sendTxHash)} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--accent-hover)' }}>
                View source transaction on explorer <ExternalLink className="size-3" />
              </a>

              {/* Track your transfers — per-destination explorer links */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(26,128,71,0.2)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--ink)' }}>Track your transfers</p>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
                  CCTP transfers typically land in ~1–2 minutes. Open your wallet address on each
                  destination explorer below to confirm the USDC arrived.
                </p>
                <div className="space-y-2">
                  {destinations.map((dest) => {
                    const chain = getNetworkChain(networkMode, dest.chainId)!;
                    const recipient = dest.recipient || address || '';
                    const url = recipient ? buildDestinationAddressUrl(networkMode, dest.chainId, recipient) : undefined;
                    return (
                      <div
                        key={dest.chainId}
                        className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--ink)' }}>
                            {chain.name}
                          </p>
                          <p className="text-xs tabular-nums truncate" style={{ color: 'var(--muted)' }}>
                            {dest.amount} USDC → {recipient ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}` : '—'}
                          </p>
                        </div>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:scale-[1.03] active:scale-[0.97]"
                            style={{ background: 'var(--accent)', color: '#fff' }}
                          >
                            Track <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          <span className="text-xs shrink-0" style={{ color: 'var(--subtle)' }}>No explorer</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            disabled={!canSend || isProcessing}
            onClick={() => { void handleSend(); }}
            className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            {ctaLabel()}
          </button>

          {step === 'done' && (
            <button
              onClick={() => { setStep('idle'); setDestinations([]); setGlobalAmount(''); setApproveTxHash(undefined); setSendTxHash(undefined); }}
              className="w-full rounded-2xl py-3 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted)' }}
            >
              Send again
            </button>
          )}

          {MULTISEND_ADDRESS !== '0x0000000000000000000000000000000000000000' ? (
            <p className="text-center text-xs mono pb-4" style={{ color: 'var(--subtle)' }}>
              Contract:{' '}
              <a href={`${sourceChain.explorerBase}/address/${MULTISEND_ADDRESS}`} target="_blank" rel="noreferrer" className="underline">
                {MULTISEND_ADDRESS.slice(0, 8)}...{MULTISEND_ADDRESS.slice(-6)}
              </a>
            </p>
          ) : (
            <p className="text-center text-xs pb-4" style={{ color: 'var(--subtle)' }}>Deploy the contract to enable sending</p>
          )}

          {/* Independence disclaimer */}
          <p className="text-center text-xs leading-relaxed px-2 pb-6" style={{ color: 'var(--subtle)' }}>
            MultiSend is an independent open-source tool. It is not affiliated with, endorsed by,
            or sponsored by Circle Internet Financial, Inc. It simply interacts with Circle's
            public, permissionless CCTP smart contracts, which any developer can build on.
          </p>
        </div>
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

function parseOnchainError(error: unknown): string {
  const rawMessage = (error as { shortMessage?: string; message?: string })?.shortMessage
    ?? (error as { message?: string })?.message
    ?? '';
  const message = rawMessage.toLowerCase();
  if (message.includes('user rejected') || message.includes('user denied')) return 'Transaction cancelled.';
  if (message.includes('insufficient funds') || message.includes('exceeds balance') || message.includes('insufficient balance')) return 'Insufficient balance.';
  if (message.includes('reverted')) {
    const m = rawMessage.match(/reason="([^"]+)"/);
    return m ? `Transaction failed: ${m[1]}` : 'Transaction reverted. Check fees and amounts.';
  }
  // Unknown failure: surface the underlying message (truncated) so the cause
  // is diagnosable instead of a dead-end generic toast.
  const short = rawMessage.split('\n')[0].replace(/\s+/g, ' ').trim().slice(0, 180);
  return short ? `Something went wrong: ${short}` : 'Something went wrong. Please try again.';
}
