/*
 * Onchain facts for this app. GENERATED — do not edit.
 *
 * This file is written from the onchain facts registry, so the values here are
 * the ones the registry itself deploys and links against. Edits are overwritten.
 *
 * Import a fact instead of typing one:
 *
 *   import { getUsdc, requireChain, buildTxExplorerUrl } from '@/onchain-facts';
 *
 * A chain's gas token and its ERC-20 USDC are separate facts. On Arc both are
 * USDC, at different decimal counts: 'nativeCurrency' for the gas token,
 * 'usdc' for the ERC-20. Mixing the two is a 10^12 error on a money path.
 */

interface TokenFact {
  symbol: string;
  address: string;
  decimals: number;
}

interface NativeCurrencyFact {
  symbol: string;
  decimals: number;
  /** True when the gas token IS USDC, which makes 'decimals' above the gas decimals. */
  isUsdc: boolean;
}

export interface OnchainChain {
  chainId: number;
  name: string;
  isTestnet: boolean;
  /** Rollup / alt-EVM family. Absent for an L1 and for a chain in no shared-stack family. */
  family?: string;
  explorerBase: string;
  rpcUrls: string[];
  nativeCurrency: NativeCurrencyFact;
  /** Absent when no USDC contract is deployed on the chain. */
  usdc?: TokenFact;
  cctpDomain?: number;
  /** Circle SCP blockchain enum. Absent unless the deploy tool supports the chain. */
  scpBlockchain?: string;
  /** True for non-EVM chains (e.g. Solana). Addresses are not 0x-hex. */
  isNonEvm?: boolean;
  /** Solana USDC mint address (base58). Set for Solana chains. */
  solanaUsdcMint?: string;
}

interface OnchainFacts {
  chains: OnchainChain[];
}

const FACTS: OnchainFacts = {
  "chains": [
    {
      "chainId": 5042002,
      "name": "Arc Testnet",
      "isTestnet": true,
      "family": "arc",
      "explorerBase": "https://explorer.testnet.arc.io",
      "rpcUrls": [
        "https://rpc.testnet.arc.io"
      ],
      "nativeCurrency": {
        "symbol": "USDC",
        "decimals": 18,
        "isUsdc": true
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x3600000000000000000000000000000000000000",
        "decimals": 6
      },
      "cctpDomain": 26,
      "scpBlockchain": "ARC-TESTNET"
    },
    {
      "chainId": 5042,
      "name": "Arc",
      "isTestnet": false,
      "family": "arc",
      "explorerBase": "https://explorer.arc.io",
      "rpcUrls": [
        "https://rpc.mainnet.arc.io"
      ],
      "nativeCurrency": {
        "symbol": "USDC",
        "decimals": 18,
        "isUsdc": true
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x3600000000000000000000000000000000000000",
        "decimals": 6
      },
      "cctpDomain": 26
    },
    {
      "chainId": 11155111,
      "name": "Ethereum Sepolia",
      "isTestnet": true,
      "explorerBase": "https://sepolia.etherscan.io",
      "rpcUrls": [
        "https://11155111.rpc.thirdweb.com"
      ],
      "nativeCurrency": {
        "symbol": "ETH",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        "decimals": 6
      },
      "cctpDomain": 0,
      "scpBlockchain": "ETH-SEPOLIA"
    },
    {
      "chainId": 84532,
      "name": "Base Sepolia",
      "isTestnet": true,
      "family": "op-stack",
      "explorerBase": "https://sepolia.basescan.org",
      "rpcUrls": [
        "https://sepolia.base.org"
      ],
      "nativeCurrency": {
        "symbol": "ETH",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        "decimals": 6
      },
      "cctpDomain": 6,
      "scpBlockchain": "BASE-SEPOLIA"
    },
    {
      "chainId": 421614,
      "name": "Arbitrum Sepolia",
      "isTestnet": true,
      "family": "arbitrum",
      "explorerBase": "https://sepolia.arbiscan.io",
      "rpcUrls": [
        "https://sepolia-rollup.arbitrum.io/rpc"
      ],
      "nativeCurrency": {
        "symbol": "ETH",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
        "decimals": 6
      },
      "scpBlockchain": "ARB-SEPOLIA"
    },
    {
      "chainId": 43113,
      "name": "Avalanche Fuji",
      "isTestnet": true,
      "explorerBase": "https://testnet.snowtrace.io",
      "rpcUrls": [
        "https://api.avax-test.network/ext/bc/C/rpc"
      ],
      "nativeCurrency": {
        "symbol": "AVAX",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x5425890298aed601595a70AB815c96711a31Bc65",
        "decimals": 6
      },
      "cctpDomain": 1,
      "scpBlockchain": "AVAX-FUJI"
    },
    {
      "chainId": 80002,
      "name": "Polygon Amoy",
      "isTestnet": true,
      "family": "polygon",
      "explorerBase": "https://amoy.polygonscan.com",
      "rpcUrls": [
        "https://polygon-amoy.drpc.org"
      ],
      "nativeCurrency": {
        "symbol": "POL",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
        "decimals": 6
      },
      "scpBlockchain": "MATIC-AMOY"
    },
    {
      "chainId": 11155420,
      "name": "OP Sepolia",
      "isTestnet": true,
      "family": "op-stack",
      "explorerBase": "https://sepolia-optimistic.etherscan.io",
      "rpcUrls": [
        "https://sepolia.optimism.io"
      ],
      "nativeCurrency": {
        "symbol": "ETH",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
        "decimals": 6
      },
      "scpBlockchain": "OP-SEPOLIA"
    },
    {
      "chainId": 1301,
      "name": "Unichain Sepolia",
      "isTestnet": true,
      "family": "op-stack",
      "explorerBase": "https://sepolia.uniscan.xyz",
      "rpcUrls": [
        "https://sepolia.unichain.org"
      ],
      "nativeCurrency": {
        "symbol": "ETH",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x31d0220469e10c4E71834a79b1f276d740d3768F",
        "decimals": 6
      },
      "scpBlockchain": "UNI-SEPOLIA"
    },
    {
      "chainId": 10143,
      "name": "Monad Testnet",
      "isTestnet": true,
      "explorerBase": "https://testnet.monadexplorer.com",
      "rpcUrls": [
        "https://testnet-rpc.monad.xyz"
      ],
      "nativeCurrency": {
        "symbol": "MON",
        "decimals": 18,
        "isUsdc": false
      },
      "scpBlockchain": "MONAD-TESTNET"
    },
    {
      "chainId": 1328,
      "name": "Sei Testnet",
      "isTestnet": true,
      "explorerBase": "https://testnet.seiscan.io",
      "rpcUrls": [
        "https://evm-rpc-testnet.sei-apis.com"
      ],
      "nativeCurrency": {
        "symbol": "SEI",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x4fCF1784B31630811181f670Aea7A7bEF803eaED",
        "decimals": 6
      },
      "cctpDomain": 16
    },
    {
      "chainId": 1,
      "name": "Ethereum",
      "isTestnet": false,
      "explorerBase": "https://etherscan.io",
      "rpcUrls": [
        "https://ethereum.reth.rs/rpc"
      ],
      "nativeCurrency": {
        "symbol": "ETH",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "decimals": 6
      }
    },
    {
      "chainId": 8453,
      "name": "Base",
      "isTestnet": false,
      "family": "op-stack",
      "explorerBase": "https://basescan.org",
      "rpcUrls": [
        "https://mainnet.base.org"
      ],
      "nativeCurrency": {
        "symbol": "ETH",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "decimals": 6
      }
    },
    {
      "chainId": 42161,
      "name": "Arbitrum One",
      "isTestnet": false,
      "family": "arbitrum",
      "explorerBase": "https://arbiscan.io",
      "rpcUrls": [
        "https://arb1.arbitrum.io/rpc"
      ],
      "nativeCurrency": {
        "symbol": "ETH",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        "decimals": 6
      }
    },
    {
      "chainId": 137,
      "name": "Polygon PoS",
      "isTestnet": false,
      "family": "polygon",
      "explorerBase": "https://polygonscan.com",
      "rpcUrls": [
        "https://polygon.drpc.org"
      ],
      "nativeCurrency": {
        "symbol": "POL",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        "decimals": 6
      }
    },
    {
      "chainId": 43114,
      "name": "Avalanche",
      "isTestnet": false,
      "explorerBase": "https://snowtrace.io",
      "rpcUrls": [
        "https://api.avax.network/ext/bc/C/rpc"
      ],
      "nativeCurrency": {
        "symbol": "AVAX",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        "decimals": 6
      }
    },
    {
      "chainId": 10,
      "name": "OP Mainnet",
      "isTestnet": false,
      "family": "op-stack",
      "explorerBase": "https://optimistic.etherscan.io",
      "rpcUrls": [
        "https://mainnet.optimism.io"
      ],
      "nativeCurrency": {
        "symbol": "ETH",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        "decimals": 6
      }
    },
    {
      "chainId": 56,
      "name": "BSC",
      "isTestnet": false,
      "family": "bsc",
      "explorerBase": "https://bscscan.com",
      "rpcUrls": [
        "https://56.rpc.thirdweb.com"
      ],
      "nativeCurrency": {
        "symbol": "BNB",
        "decimals": 18,
        "isUsdc": false
      }
    },
    {
      "chainId": 81457,
      "name": "Blast",
      "isTestnet": false,
      "family": "blast",
      "explorerBase": "https://blastscan.io",
      "rpcUrls": [
        "https://rpc.blast.io"
      ],
      "nativeCurrency": {
        "symbol": "ETH",
        "decimals": 18,
        "isUsdc": false
      }
    },
    {
      "chainId": 100,
      "name": "Gnosis",
      "isTestnet": false,
      "family": "gnosis",
      "explorerBase": "https://gnosisscan.io",
      "rpcUrls": [
        "https://rpc.gnosischain.com"
      ],
      "nativeCurrency": {
        "symbol": "XDAI",
        "decimals": 18,
        "isUsdc": false
      }
    },
    {
      "chainId": 324,
      "name": "zkSync",
      "isTestnet": false,
      "family": "zksync",
      "explorerBase": "https://explorer.zksync.io",
      "rpcUrls": [
        "https://mainnet.era.zksync.io"
      ],
      "nativeCurrency": {
        "symbol": "ETH",
        "decimals": 18,
        "isUsdc": false
      },
      "usdc": {
        "symbol": "USDC",
        "address": "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4",
        "decimals": 6
      }
    }
  ],
};

export const ONCHAIN_CHAINS: readonly OnchainChain[] = FACTS.chains;

export const TESTNET_ONCHAIN_CHAINS: readonly OnchainChain[] = FACTS.chains.filter((chain) => chain.isTestnet);

const BY_CHAIN_ID = new Map(ONCHAIN_CHAINS.map((chain) => [chain.chainId, chain]));

const BY_SCP_BLOCKCHAIN = new Map(
  ONCHAIN_CHAINS.flatMap((chain) => (chain.scpBlockchain ? [[chain.scpBlockchain, chain] as const] : [])),
);

function getChain(chainId: number): OnchainChain | undefined {
  return BY_CHAIN_ID.get(chainId);
}

export function requireChain(chainId: number): OnchainChain {
  const chain = getChain(chainId);

  if (!chain) {
    throw new Error('Unknown chain ID ' + chainId + ' — add it to the onchain facts registry');
  }

  return chain;
}

function getChainByScpBlockchain(blockchain: string): OnchainChain | undefined {
  return BY_SCP_BLOCKCHAIN.get(blockchain);
}

export function requireChainByScpBlockchain(blockchain: string): OnchainChain {
  const chain = getChainByScpBlockchain(blockchain);

  if (!chain) {
    throw new Error(
      "No chain for SCP blockchain '" + blockchain + "' — add it to the onchain facts registry",
    );
  }

  return chain;
}

export function getUsdc(chainId: number): TokenFact | undefined {
  return getChain(chainId)?.usdc;
}

export function buildTxExplorerUrl(chainId: number, txHash: string): string {
  return requireChain(chainId).explorerBase + '/tx/' + txHash;
}
