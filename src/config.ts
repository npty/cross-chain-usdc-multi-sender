/**
 * wagmi configuration
 *
 * Arc (testnet + mainnet) source chains plus all CCTP v2 Forwarding Service
 * destination chains are registered here so the wallet can prompt users to
 * switch networks and so wallet_watchAsset and wallet_addEthereumChain work
 * correctly.
 *
 * Testnet chains are custom-defined (matching src/cctp-chains.ts).
 * Mainnet chains reuse wagmi/viem exports, except Plume: wagmi's built-in
 * `plume` chain is the legacy chain ID 98865 — the current Plume mainnet is
 * 98866, so it's defined explicitly below.
 *
 * USDC addresses and RPCs sourced from:
 * https://developers.circle.com/stablecoins/usdc-contract-addresses
 * https://developers.circle.com/cctp/concepts/supported-chains-and-domains
 */

import { http, createConfig, fallback } from 'wagmi'
import {
  mainnet,
  avalanche,
  optimism,
  arbitrum,
  base,
  polygon,
  unichain,
  linea,
  codex,
  sonic,
  worldchain,
  monad,
  sei,
  xdc,
  hyperEvm,
  ink,
} from 'wagmi/chains'
import { arcTestnet, arc } from 'viem/chains'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'
import { registerChain } from './tracing'

// Pre-register Arc RPCs for trace events
registerChain(arcTestnet.id, arcTestnet.rpcUrls.default.http[0])
registerChain(arc.id, arc.rpcUrls.default.http[0])

// ── Destination chains (CCTP v2 Forwarding Service testnets) ──────────────────

const ethereumSepolia = defineChain({
  id: 11155111,
  name: 'Ethereum Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://11155111.rpc.thirdweb.com', 'https://rpc.sepolia.org'] } },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' } },
  testnet: true,
})

const avalancheFuji = defineChain({
  id: 43113,
  name: 'Avalanche Fuji',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  rpcUrls: { default: { http: ['https://api.avax-test.network/ext/bc/C/rpc', 'https://avalanche-fuji-c-chain.publicnode.com'] } },
  blockExplorers: { default: { name: 'SnowTrace', url: 'https://testnet.snowtrace.io' } },
  testnet: true,
})

const opSepolia = defineChain({
  id: 11155420,
  name: 'OP Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.optimism.io', 'https://optimism-sepolia.drpc.org'] } },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://sepolia-optimistic.etherscan.io' } },
  testnet: true,
})

const arbitrumSepolia = defineChain({
  id: 421614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia-rollup.arbitrum.io/rpc', 'https://arbitrum-sepolia.drpc.org'] } },
  blockExplorers: { default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' } },
  testnet: true,
})

const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.base.org', 'https://base-sepolia.drpc.org'] } },
  blockExplorers: { default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' } },
  testnet: true,
})

const polygonAmoy = defineChain({
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: { default: { http: ['https://polygon-amoy.drpc.org', 'https://rpc-amoy.polygon.technology'] } },
  blockExplorers: { default: { name: 'PolygonScan', url: 'https://amoy.polygonscan.com' } },
  testnet: true,
})

const unichainSepolia = defineChain({
  id: 1301,
  name: 'Unichain Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.unichain.org'] } },
  blockExplorers: { default: { name: 'Uniscan', url: 'https://sepolia.uniscan.xyz' } },
  testnet: true,
})

const lineaSepolia = defineChain({
  id: 59141,
  name: 'Linea Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.sepolia.linea.build', 'https://linea-sepolia.drpc.org'] } },
  blockExplorers: { default: { name: 'LineaScan', url: 'https://sepolia.lineascan.build' } },
  testnet: true,
})

const sonicBlazeTestnet = defineChain({
  id: 57054,
  name: 'Sonic Blaze Testnet',
  nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.blaze.soniclabs.com'] } },
  blockExplorers: { default: { name: 'SonicScan', url: 'https://testnet.sonicscan.org' } },
  testnet: true,
})

const worldChainSepolia = defineChain({
  id: 4801,
  name: 'World Chain Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://worldchain-sepolia.g.alchemy.com/public'] } },
  blockExplorers: { default: { name: 'WorldScan', url: 'https://sepolia.worldscan.org' } },
  testnet: true,
})

const seiTestnet = defineChain({
  id: 1328,
  name: 'Sei Testnet',
  nativeCurrency: { name: 'Sei', symbol: 'SEI', decimals: 18 },
  rpcUrls: { default: { http: ['https://evm-rpc-testnet.sei-apis.com'] } },
  blockExplorers: { default: { name: 'SeiScan', url: 'https://testnet.seiscan.io' } },
  testnet: true,
})

const inkSepolia = defineChain({
  id: 763373,
  name: 'Ink Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc-gel-sepolia.inkonchain.com'] } },
  blockExplorers: { default: { name: 'Ink Explorer', url: 'https://explorer-sepolia.inkonchain.com' } },
  testnet: true,
})

const plumeTestnet = defineChain({
  id: 161221135,
  name: 'Plume Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.plumenetwork.xyz'] } },
  blockExplorers: { default: { name: 'Plume Explorer', url: 'https://testnet-explorer.plume.org' } },
  testnet: true,
})

const edgeTestnet = defineChain({
  id: 202505,
  name: 'EDGE Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://edgechain-testnet.rpc.caldera.xyz/http'] } },
  blockExplorers: { default: { name: 'EDGE Explorer', url: 'https://edge-testnet.explorer.alchemy.com' } },
  testnet: true,
})

const codexTestnet = defineChain({
  id: 812242,
  name: 'Codex Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.codex-stg.xyz'] } },
  blockExplorers: { default: { name: 'Codex Explorer', url: 'https://explorer.codex-stg.xyz' } },
  testnet: true,
})

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
  blockExplorers: { default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' } },
  testnet: true,
})

const hyperEvmTestnet = defineChain({
  id: 998,
  name: 'HyperEVM Testnet',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.hyperliquid-testnet.xyz/evm', 'https://rpcs.chain.link/hyperevm/testnet'] } },
  blockExplorers: { default: { name: 'Purrsec', url: 'https://testnet.purrsec.com' } },
  testnet: true,
})

const xdcApothem = defineChain({
  id: 51,
  name: 'XDC Apothem',
  nativeCurrency: { name: 'XDC', symbol: 'XDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://erpc.apothem.network'] } },
  blockExplorers: { default: { name: 'XDCScan', url: 'https://testnet.xdcscan.com' } },
  testnet: true,
})

export const DEST_CHAINS = [
  ethereumSepolia, avalancheFuji, opSepolia, arbitrumSepolia,
  baseSepolia, polygonAmoy, unichainSepolia, lineaSepolia,
  sonicBlazeTestnet, worldChainSepolia, seiTestnet,
  inkSepolia, plumeTestnet, edgeTestnet,
  codexTestnet, monadTestnet, hyperEvmTestnet, xdcApothem,
] as const

// ── Mainnet destination chains (CCTP v2 Forwarding Service) ─────────────────
// NOTE: Plume is defined explicitly — wagmi's built-in `plume` is the legacy
// chain ID 98865; current Plume mainnet is 98866 (verified 2026-09-27).

const plumeMainnet = defineChain({
  id: 98866,
  name: 'Plume',
  nativeCurrency: { name: 'Plume', symbol: 'PLUME', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.plume.org'] } },
  blockExplorers: { default: { name: 'Plume Explorer', url: 'https://explorer.plume.org' } },
})

export const MAINNET_DEST_CHAINS = [
  mainnet, avalanche, optimism, arbitrum, base, polygon,
  unichain, linea, codex, sonic, worldchain, monad,
  sei, xdc, hyperEvm, ink, plumeMainnet,
] as const

export const config = createConfig({
  chains: [arcTestnet, arc, ...DEST_CHAINS, ...MAINNET_DEST_CHAINS],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(),
    [arc.id]: fallback([
      http('https://arc-rpc.publicnode.com'),
      http('https://rpc.mainnet.arc.io'),
      http('https://rpc.blockdaemon.mainnet.arc.io'),
    ]),
    [ethereumSepolia.id]: http(),
    [avalancheFuji.id]: http(),
    [opSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [baseSepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [unichainSepolia.id]: http(),
    [lineaSepolia.id]: http(),
    [sonicBlazeTestnet.id]: http(),
    [worldChainSepolia.id]: http(),
    [seiTestnet.id]: http(),
    [inkSepolia.id]: http(),
    [plumeTestnet.id]: http(),
    [edgeTestnet.id]: http(),
    [codexTestnet.id]: http(),
    [monadTestnet.id]: http(),
    [hyperEvmTestnet.id]: http(),
    [xdcApothem.id]: http(),
    [mainnet.id]: http(),
    // Source chains get fallback RPCs: if the primary endpoint is unreachable
    // from the user's browser/network, reads (balance, nonce) and writes fall
    // back to a secondary provider instead of failing outright.
    [avalanche.id]: fallback([
      http('https://api.avax.network/ext/bc/C/rpc'),
      http('https://avalanche-c-chain-rpc.publicnode.com'),
    ]),
    [optimism.id]: http(),
    [arbitrum.id]: fallback([
      http('https://arb1.arbitrum.io/rpc'),
      http('https://arbitrum-one-rpc.publicnode.com'),
    ]),
    [base.id]: fallback([
      http('https://mainnet.base.org'),
      http('https://base-rpc.publicnode.com'),
    ]),
    [polygon.id]: http(),
    [unichain.id]: http(),
    [linea.id]: http(),
    [codex.id]: http(),
    [sonic.id]: http(),
    [worldchain.id]: http(),
    [monad.id]: http(),
    [sei.id]: http(),
    [xdc.id]: http(),
    [hyperEvm.id]: http(),
    [ink.id]: http(),
    [plumeMainnet.id]: http(),
  },
})
