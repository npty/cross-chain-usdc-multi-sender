/**
 * Canonical list of CCTP v2 Forwarding Service destination chains supported from Arc Testnet.
 *
 * Source: https://developers.circle.com/cctp/concepts/supported-chains-and-domains
 * Criteria: Forwarding Service = ✅ AND isTestnet = true AND EVM (Solana excluded).
 *
 * Some chains are in onchain-facts but are missing their cctpDomain — we patch those here.
 * A few chains (Linea, Codex, Sonic, World Chain, Ink, Plume, EDGE) aren't in onchain-facts
 * at all; they're defined inline below using public testnet RPC/explorer info.
 *
 * Arc Testnet (domain 26) is the SOURCE chain and is intentionally excluded.
 */

import { TESTNET_ONCHAIN_CHAINS } from '@/onchain-facts';
import type { OnchainChain } from '@/onchain-facts';

// Chains that are in onchain-facts but have no cctpDomain set — patch them.
const DOMAIN_PATCHES: Record<number, number> = {
  421614: 3,   // Arbitrum Sepolia
  11155420: 2, // OP Sepolia
  80002: 7,    // Polygon Amoy
};

// Chains not in onchain-facts at all — defined inline.
const EXTRA_CHAINS: OnchainChain[] = [
  {
    // CCTP domain 11 — Forwarding Service ✅
    // USDC: https://developers.circle.com/stablecoins/usdc-contract-addresses
    chainId: 59141,
    name: 'Linea Sepolia',
    isTestnet: true,
    family: 'linea',
    explorerBase: 'https://sepolia.lineascan.build',
    rpcUrls: [
      'https://rpc.sepolia.linea.build',
      'https://linea-sepolia.drpc.org',
    ],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: {
      symbol: 'USDC',
      address: '0xFEce4462D57bD51A6A552365A011b95f0E16d9B7',
      decimals: 6,
    },
    cctpDomain: 11,
  },
  {
    // CCTP domain 13 — Forwarding Service ✅
    // USDC: https://developers.circle.com/stablecoins/usdc-contract-addresses (Sonic Blaze Testnet)
    chainId: 57054,
    name: 'Sonic Blaze Testnet',
    isTestnet: true,
    explorerBase: 'https://testnet.sonicscan.org',
    rpcUrls: [
      'https://rpc.blaze.soniclabs.com',
    ],
    nativeCurrency: { symbol: 'S', decimals: 18, isUsdc: false },
    usdc: {
      symbol: 'USDC',
      address: '0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6',
      decimals: 6,
    },
    cctpDomain: 13,
  },
  {
    // CCTP domain 14 — Forwarding Service ✅
    // USDC: https://developers.circle.com/stablecoins/usdc-contract-addresses (World Chain Sepolia)
    chainId: 4801,
    name: 'World Chain Sepolia',
    isTestnet: true,
    explorerBase: 'https://sepolia.worldscan.org',
    rpcUrls: [
      'https://worldchain-sepolia.g.alchemy.com/public',
    ],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: {
      symbol: 'USDC',
      address: '0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88',
      decimals: 6,
    },
    cctpDomain: 14,
  },
  {
    // CCTP domain 21 — Forwarding Service ✅
    // USDC: https://developers.circle.com/stablecoins/usdc-contract-addresses (Ink Testnet)
    chainId: 763373,
    name: 'Ink Sepolia',
    isTestnet: true,
    explorerBase: 'https://explorer-sepolia.inkonchain.com',
    rpcUrls: [
      'https://rpc-gel-sepolia.inkonchain.com',
    ],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: {
      symbol: 'USDC',
      address: '0xFabab97dCE620294D2B0b0e46C68964e326300Ac',
      decimals: 6,
    },
    cctpDomain: 21,
  },
  {
    // CCTP domain 22 — Forwarding Service ✅
    // USDC: https://developers.circle.com/stablecoins/usdc-contract-addresses (Plume Testnet)
    chainId: 161221135,
    name: 'Plume Testnet',
    isTestnet: true,
    explorerBase: 'https://testnet-explorer.plume.org',
    rpcUrls: [
      'https://testnet-rpc.plumenetwork.xyz',
    ],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: {
      symbol: 'USDC',
      address: '0xcB5f30e335672893c7eb944B374c196392C19D18',
      decimals: 6,
    },
    cctpDomain: 22,
  },
  {
    // CCTP domain 28 — Forwarding Service ✅
    // USDC: https://developers.circle.com/stablecoins/usdc-contract-addresses (EDGE Testnet)
    chainId: 202505,
    name: 'EDGE Testnet',
    isTestnet: true,
    explorerBase: 'https://edge-testnet.explorer.alchemy.com',
    rpcUrls: [
      'https://edgechain-testnet.rpc.caldera.xyz/http',
    ],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: {
      symbol: 'USDC',
      address: '0x2d9F7CAD728051AA35Ecdc472a14cf8cDF5CFD6B',
      decimals: 6,
    },
    cctpDomain: 28,
  },
];

// Arc Testnet source chain — excluded from destination list
const SOURCE_CHAIN_ID = 5042002;

// Merge onchain-facts chains (with domain patches) + extra chains
const PATCHED = TESTNET_ONCHAIN_CHAINS.map((c) =>
  DOMAIN_PATCHES[c.chainId] !== undefined
    ? { ...c, cctpDomain: DOMAIN_PATCHES[c.chainId] }
    : c,
);

const ALL_CHAINS: OnchainChain[] = [...PATCHED, ...EXTRA_CHAINS];

/**
 * All EVM CCTP v2 Forwarding Service destination testnets,
 * excluding the Arc Testnet source chain.
 */
export const FORWARDING_DEST_CHAINS: OnchainChain[] = ALL_CHAINS.filter(
  (c) =>
    c.cctpDomain !== undefined &&
    c.usdc !== undefined &&
    c.chainId !== SOURCE_CHAIN_ID,
);

/** Look up a chain from the full merged list by chainId. */
export function getForwardingChain(chainId: number): OnchainChain | undefined {
  return ALL_CHAINS.find((c) => c.chainId === chainId);
}
