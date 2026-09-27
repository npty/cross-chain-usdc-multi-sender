import type React from 'react';
import { X, PlusCircle, Loader2 } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import bs58 from 'bs58';
import type { ChainDestination } from './types';
import type { OnchainChain } from '@/onchain-facts';

interface ChainRowProps {
  dest: ChainDestination;
  chain: OnchainChain;
  index: number;
  onRemove: (index: number) => void;
  onRecipientChange: (index: number, recipient: string) => void;
  isLoading: boolean;
}

const row: React.CSSProperties = {
  background: 'var(--surface)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
};

function fmt(wei: string) {
  return (Number(wei) / 1e18).toFixed(4);
}

function expiryLabel(expiresAt: number): string {
  const s = Math.floor((expiresAt - Date.now()) / 1000);
  if (s <= 0) return 'Expired';
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

type EthProvider = { request: (a: { method: string; params?: unknown }) => Promise<unknown> };

async function addToken(chain: OnchainChain & { rpcUrls?: string[] }): Promise<void> {
  if (!chain.usdc || !window.ethereum) return;
  const provider = window.ethereum as EthProvider;
  const chainHex = `0x${chain.chainId.toString(16)}`;

  // 1. Register the chain in the wallet (no-op if already known).
  //    We grab RPC + explorer from the OnchainChain record.
  try {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: chainHex,
        chainName: chain.name,
        nativeCurrency: {
          name: chain.nativeCurrency.symbol,
          symbol: chain.nativeCurrency.symbol,
          decimals: chain.nativeCurrency.decimals,
        },
        rpcUrls: chain.rpcUrls?.length ? chain.rpcUrls : [''],
        blockExplorerUrls: chain.explorerBase ? [chain.explorerBase] : undefined,
      }],
    });
  } catch {
    // Wallet already knows the chain, or user dismissed — continue anyway.
  }

  // 2. Switch to that chain so wallet_watchAsset resolves on the right network.
  await provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: chainHex }],
  });

  // 3. Register the USDC token.
  await provider.request({
    method: 'wallet_watchAsset',
    params: {
      type: 'ERC20',
      options: {
        address: chain.usdc.address,
        symbol: 'USDC',
        decimals: chain.usdc.decimals,
        image: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
      },
    },
  });
}

export function ChainRow({ dest, chain, index, onRemove, onRecipientChange, isLoading }: ChainRowProps) {
  const quote = dest.feeQuote;
  const hasAmount = !!dest.amount && parseFloat(dest.amount) > 0;

  const totalFee = quote ? fmt(quote.feeTotalAmount) : null;
  const fwd = quote?.items.find((i) => i.type === 'FORWARD');
  const pre = quote?.items.find((i) => i.type === 'PRE_FINALITY');

  const expStr = quote ? expiryLabel(quote.expiresAt) : '';
  const almostGone = expStr === 'Expired' ||
    (expStr !== '' && !expStr.includes('m') && parseInt(expStr) <= 30);

  return (
    <div style={row} className="px-3 py-2.5">
      <div className="flex items-center gap-3">

      {/* Chain avatar */}
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
        style={{ background: 'var(--accent)' }}
      >
        {chain.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Name + domain */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--ink)' }}>
          {chain.name}
        </p>
        <p className="text-xs mono leading-tight" style={{ color: 'var(--subtle)' }}>
          Domain {chain.cctpDomain ?? '—'}
        </p>
      </div>

      {/* Fee status */}
      <div className="text-right shrink-0">
        {isLoading && hasAmount ? (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
            <Loader2 className="size-3 animate-spin" /> estimating
          </span>
        ) : totalFee ? (
          <>
            <p className="text-xs font-bold tabular-nums mono leading-tight" style={{ color: 'var(--ink)' }}>
              {totalFee} USDC
            </p>
            {/* Breakdown tooltip-style: fwd + pre */}
            <p className="text-xs mono leading-tight" style={{ color: 'var(--subtle)' }}>
              {fwd ? `fwd ${fmt(fwd.amount)}` : ''}
              {fwd && pre ? ' · ' : ''}
              {pre ? `fast ${fmt(pre.amount)}` : ''}
            </p>
          </>
        ) : dest.feeError ? (
          <span className="text-xs" style={{ color: 'var(--danger)' }}>error</span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>
            {hasAmount ? '—' : 'no amount'}
          </span>
        )}
      </div>

      {/* Expiry badge */}
      {quote && (
        <span
          className="shrink-0 text-xs mono px-1.5 py-0.5 rounded-full"
          style={{
            background: almostGone ? 'rgba(186,43,76,0.1)' : 'rgba(26,128,71,0.1)',
            color: almostGone ? 'var(--danger)' : 'var(--success)',
          }}
        >
          {expStr}
        </span>
      )}

      {/* Add USDC to wallet */}
      {chain.usdc && (
        <button
          onClick={() => { void addToken(chain); }}
          title={`Add USDC on ${chain.name} to wallet`}
          className="shrink-0 flex items-center justify-center size-7 rounded-full transition-colors hover:opacity-70"
          style={{ color: 'var(--accent)', background: 'rgba(0,115,250,0.07)' }}
          aria-label="Add USDC to wallet"
        >
          <PlusCircle className="size-3.5" />
        </button>
      )}

      {/* Remove */}
      <button
        onClick={() => onRemove(index)}
        className="shrink-0 flex items-center justify-center size-7 rounded-full transition-colors hover:bg-red-50"
        style={{ color: 'var(--subtle)' }}
        aria-label="Remove chain"
      >
        <X className="size-3.5" />
      </button>
      </div>
      {chain.isNonEvm && chain.solanaUsdcMint && (
        <div className="pt-2">
          <input
            value={dest.recipient}
            onChange={(e) => onRecipientChange(index, e.target.value.trim())}
            placeholder="Solana wallet address (base58)"
            spellCheck={false}
            autoComplete="off"
            className="w-full rounded-lg px-2.5 py-1.5 text-xs mono outline-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
            }}
          />
          {(() => {
            // Show the derived USDC token account (ATA) so the user knows
            // exactly where funds will land. Circle mints to the ATA, not the wallet.
            try {
              if (!dest.recipient || !isValidSolana(dest.recipient)) return null;
              const ata = getAssociatedTokenAddressSync(
                new PublicKey(chain.solanaUsdcMint),
                new PublicKey(dest.recipient),
              ).toBase58();
              return (
                <div className="pt-1 text-[11px] mono break-all" style={{ color: 'var(--subtle)' }}>
                  USDC token account: {ata}
                </div>
              );
            } catch {
              return null;
            }
          })()}
        </div>
      )}
    </div>
  );
}

function isValidSolana(address: string): boolean {
  try {
    return bs58.decode(address).length === 32;
  } catch {
    return false;
  }
}
