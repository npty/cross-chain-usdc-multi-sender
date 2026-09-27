/**
 * Network-aware CCTP v2 Forwarding Service chain configuration.
 *
 * Sources (fetched 2026-09-27):
 * - Chains/domains: https://developers.circle.com/cctp/concepts/supported-chains-and-domains
 * - USDC addresses: https://developers.circle.com/stablecoins/usdc-contract-addresses
 *
 * The docs page lists 20 chains with Forwarding Service = ✅. Coverage here:
 * - Arc → the SOURCE chain (one per network), excluded from destinations.
 * - Solana → non-EVM, not supported by this EVM wallet flow.
 * - EDGE mainnet → chain ID could not be verified from any source, excluded
 *   (EDGE Testnet remains available in testnet mode).
 * - The remaining 17 EVM chains are all included as mainnet destinations.
 *
 * Testnet destinations (14) are unchanged from before; a few chains (Linea,
 * Sonic, World Chain, Ink, Plume, EDGE) aren't in onchain-facts at all and are
 * defined inline using public testnet RPC/explorer info.
 */

import { TESTNET_ONCHAIN_CHAINS } from '@/onchain-facts';
import type { OnchainChain } from '@/onchain-facts';

export type NetworkMode = 'testnet' | 'mainnet';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// ── Testnet ──────────────────────────────────────────────────────────────────

// Chains that are in onchain-facts but have no cctpDomain set — patch them.
const TESTNET_DOMAIN_PATCHES: Record<number, number> = {
  421614: 3,   // Arbitrum Sepolia
  11155420: 2, // OP Sepolia
  80002: 7,    // Polygon Amoy
};

// Chains not in onchain-facts at all — defined inline.
const TESTNET_EXTRA_CHAINS: OnchainChain[] = [
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

/** All EVM CCTP v2 Forwarding Service destination testnets (Arc Testnet is the source). */
const TESTNET_DEST_CHAINS: OnchainChain[] = [
  ...TESTNET_ONCHAIN_CHAINS.map((c) =>
    TESTNET_DOMAIN_PATCHES[c.chainId] !== undefined
      ? { ...c, cctpDomain: TESTNET_DOMAIN_PATCHES[c.chainId] }
      : c,
  ),
  ...TESTNET_EXTRA_CHAINS,
].filter(
  (c) => c.cctpDomain !== undefined && c.usdc !== undefined && c.chainId !== 5042002,
);

// ── Mainnet ──────────────────────────────────────────────────────────────────
// Every chain below is Forwarding Service ✅ on the Circle docs page, EVM,
// with chain ID, USDC address and explorer verified against Circle's docs.
// Ordered by CCTP domain.

const MAINNET_DEST_CHAINS: OnchainChain[] = [
  {
    chainId: 1,
    name: 'Ethereum',
    isTestnet: false,
    explorerBase: 'https://etherscan.io',
    rpcUrls: ['https://eth.llamarpc.com', 'https://cloudflare-eth.com'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    cctpDomain: 0,
  },
  {
    chainId: 43114,
    name: 'Avalanche',
    isTestnet: false,
    explorerBase: 'https://snowtrace.io',
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    nativeCurrency: { symbol: 'AVAX', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6 },
    cctpDomain: 1,
  },
  {
    chainId: 10,
    name: 'OP Mainnet',
    isTestnet: false,
    family: 'op-stack',
    explorerBase: 'https://optimistic.etherscan.io',
    rpcUrls: ['https://mainnet.optimism.io'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
    cctpDomain: 2,
  },
  {
    chainId: 42161,
    name: 'Arbitrum One',
    isTestnet: false,
    family: 'arbitrum',
    explorerBase: 'https://arbiscan.io',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    cctpDomain: 3,
  },
  {
    chainId: 8453,
    name: 'Base',
    isTestnet: false,
    family: 'op-stack',
    explorerBase: 'https://basescan.org',
    rpcUrls: ['https://mainnet.base.org'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    cctpDomain: 6,
  },
  {
    chainId: 137,
    name: 'Polygon PoS',
    isTestnet: false,
    explorerBase: 'https://polygonscan.com',
    rpcUrls: ['https://polygon-rpc.com'],
    nativeCurrency: { symbol: 'POL', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
    cctpDomain: 7,
  },
  {
    chainId: 130,
    name: 'Unichain',
    isTestnet: false,
    family: 'op-stack',
    explorerBase: 'https://uniscan.xyz',
    rpcUrls: ['https://mainnet.unichain.org'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x078D782b760474a361dDA0AF3839290b0EF57AD6', decimals: 6 },
    cctpDomain: 10,
  },
  {
    chainId: 59144,
    name: 'Linea',
    isTestnet: false,
    family: 'linea',
    explorerBase: 'https://lineascan.build',
    rpcUrls: ['https://rpc.linea.build'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', decimals: 6 },
    cctpDomain: 11,
  },
  {
    chainId: 81224,
    name: 'Codex',
    isTestnet: false,
    family: 'op-stack',
    explorerBase: 'https://explorer.codex.xyz',
    rpcUrls: ['https://rpc.codex.xyz'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0xd996633a415985DBd7D6D12f4A4343E31f5037cf', decimals: 6 },
    cctpDomain: 12,
  },
  {
    chainId: 146,
    name: 'Sonic',
    isTestnet: false,
    explorerBase: 'https://sonicscan.org',
    rpcUrls: ['https://rpc.soniclabs.com'],
    nativeCurrency: { symbol: 'S', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894', decimals: 6 },
    cctpDomain: 13,
  },
  {
    chainId: 480,
    name: 'World Chain',
    isTestnet: false,
    family: 'op-stack',
    explorerBase: 'https://worldscan.org',
    rpcUrls: ['https://worldchain-mainnet.g.alchemy.com/public'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x79A02482A880bCe3F13E09da970dC34dB4cD24D1', decimals: 6 },
    cctpDomain: 14,
  },
  {
    chainId: 143,
    name: 'Monad',
    isTestnet: false,
    explorerBase: 'https://monadvision.com',
    rpcUrls: ['https://rpc.monad.xyz'],
    nativeCurrency: { symbol: 'MON', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603', decimals: 6 },
    cctpDomain: 15,
  },
  {
    chainId: 1329,
    name: 'Sei',
    isTestnet: false,
    explorerBase: 'https://seiscan.io',
    rpcUrls: ['https://evm-rpc.sei-apis.com'],
    nativeCurrency: { symbol: 'SEI', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392', decimals: 6 },
    cctpDomain: 16,
  },
  {
    chainId: 50,
    name: 'XDC',
    isTestnet: false,
    explorerBase: 'https://xdcscan.com',
    rpcUrls: ['https://rpc.xdc.org', 'https://earpc.xdc.org'],
    nativeCurrency: { symbol: 'XDC', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1', decimals: 6 },
    cctpDomain: 18,
  },
  {
    chainId: 999,
    name: 'HyperEVM',
    isTestnet: false,
    explorerBase: 'https://hyperscan.com',
    rpcUrls: ['https://rpc.hyperliquid.xyz/evm'],
    nativeCurrency: { symbol: 'HYPE', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0xb88339CB7199b77E23DB6E890353E22632Ba630f', decimals: 6 },
    cctpDomain: 19,
  },
  {
    chainId: 57073,
    name: 'Ink',
    isTestnet: false,
    family: 'op-stack',
    explorerBase: 'https://explorer.inkonchain.com',
    rpcUrls: ['https://rpc-gel.inkonchain.com'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x2D270e6886d130D724215A266106e6832161EAEd', decimals: 6 },
    cctpDomain: 21,
  },
  {
    // NOTE: chain ID 98866 (current Plume mainnet). wagmi's built-in `plume`
    // chain is the legacy 98865 — do NOT use it; see config.ts.
    chainId: 98866,
    name: 'Plume',
    isTestnet: false,
    explorerBase: 'https://explorer.plume.org',
    rpcUrls: ['https://rpc.plume.org'],
    nativeCurrency: { symbol: 'PLUME', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x222365EF19F7947e5484218551B56bb3965Aa7aF', decimals: 6 },
    cctpDomain: 22,
  },
];

// ── Network configs ──────────────────────────────────────────────────────────

export interface NetworkConfig {
  mode: NetworkMode;
  label: string;
  /** Arc chain ID the sends originate from. */
  sourceChainId: number;
  /** CCTP domain of the Arc source chain (26 for both Arc networks). */
  sourceDomain: number;
  /** Circle quote API base (sandbox for testnet, production for mainnet). */
  quoteApiBase: string;
  /** MultiChainUSDCSend contract on the Arc source chain. Zero address = not deployed → sends disabled. */
  contractAddress: `0x${string}`;
  /** Forwarding Service destination chains for this network. */
  destinations: OnchainChain[];
}

function envAddress(name: string): `0x${string}` {
  const v = import.meta.env[name] as string | undefined;
  return (v && v.startsWith('0x') ? v : ZERO_ADDRESS) as `0x${string}`;
}

export const NETWORKS: Record<NetworkMode, NetworkConfig> = {
  testnet: {
    mode: 'testnet',
    label: 'Testnet',
    sourceChainId: 5042002,
    sourceDomain: 26,
    quoteApiBase: 'https://iris-api-sandbox.circle.com',
    contractAddress: envAddress('VITE_MULTISEND_ADDRESS'),
    destinations: TESTNET_DEST_CHAINS,
  },
  mainnet: {
    mode: 'mainnet',
    label: 'Mainnet',
    sourceChainId: 5042,
    sourceDomain: 26,
    quoteApiBase: 'https://iris-api.circle.com',
    contractAddress: envAddress('VITE_MULTISEND_ADDRESS_MAINNET'),
    destinations: MAINNET_DEST_CHAINS,
  },
};

export const NETWORK_MODES: NetworkMode[] = ['testnet', 'mainnet'];

/** Look up a destination chain for a network by chainId. */
export function getNetworkChain(mode: NetworkMode, chainId: number): OnchainChain | undefined {
  return NETWORKS[mode].destinations.find((c) => c.chainId === chainId);
}

/**
 * Block explorer URL for a wallet address on a destination chain.
 * Uses the chain's configured explorerBase (Etherscan/Blockscout family all
 * serve address pages at `/address/{address}`).
 * Returns undefined when the chain has no explorer configured.
 */
export function buildDestinationAddressUrl(
  mode: NetworkMode,
  chainId: number,
  address: string,
): string | undefined {
  const chain = getNetworkChain(mode, chainId);
  if (!chain?.explorerBase) return undefined;
  return `${chain.explorerBase.replace(/\/+$/, '')}/address/${address}`;
}
