# MultiSend — USDC to Multiple Chains

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

Sends USDC to multiple destination chains simultaneously in a single transaction using CCTP v2 (TokenMessengerWithFees) with Circle's upfront fee Forwarding Service. The UI lets you configure per-chain amounts, fetches real-time fee quotes from Circle's Quote API, shows exact fee breakdowns (principal + forwarding fee per chain), and executes the multi-chain send in one approve + one multiSend call.

## Deployed Contracts

| Contract | Chain | Address | Explorer |
|---|---|---|---|
| MultiChainUSDCSend v1 (deprecated) | Arc Testnet | 0x1c72d8cd88c026fa3bb44c01a573cb9477dc781e | https://explorer.testnet.arc.io/address/0x1c72d8cd88c026fa3bb44c01a573cb9477dc781e |
| MultiChainUSDCSend v2 (deprecated) | Arc Testnet | 0x014f84afa85297376a4a04d4b5922f3ec1f4a215 | https://explorer.testnet.arc.io/address/0x014f84afa85297376a4a04d4b5922f3ec1f4a215 |
| MultiChainUSDCSend v3 (deprecated) | Arc Testnet | 0xe2e1c920d8b5a52af05da22fe0dda3b5dbd0e7eb | https://explorer.testnet.arc.io/address/0xe2e1c920d8b5a52af05da22fe0dda3b5dbd0e7eb |
| MultiChainUSDCSend v4 (active) | Arc Testnet | 0x73b5e63f91c2fa200b2b56f8a8a2b1482f12a02f | https://explorer.testnet.arc.io/address/0x73b5e63f91c2fa200b2b56f8a8a2b1482f12a02f |

## Environment Variables

- `VITE_MULTISEND_ADDRESS` — MultiChainUSDCSend contract address on Arc Testnet (set in .env)
- `VITE_MULTISEND_ADDRESS_MAINNET` — MultiChainUSDCSend contract address on Arc mainnet. Leave as zero address until the contract is reviewed and deployed to mainnet; Mainnet mode shows as preview-only while unset.

## Networks

- The UI has a Testnet / Mainnet segmented toggle (defaults to Testnet). Switching clears all selections and transaction state.
- Source chain is Arc in both modes: Arc Testnet (5042002) / Arc mainnet (5042), CCTP domain 26 for both.
- Destinations follow the Forwarding Service ✅ list at https://developers.circle.com/cctp/concepts/supported-chains-and-domains — 14 testnets, 17 mainnet EVM chains (excludes Arc as source, Solana as non-EVM, EDGE mainnet whose chain ID couldn't be verified).
- Quote API: `https://iris-api-sandbox.circle.com` (testnet) / `https://iris-api.circle.com` (mainnet).
- Chain data lives in `src/cctpChains.ts` (`NETWORKS` record); wagmi chain registration in `src/config.ts`. Note: wagmi's built-in `plume` is the legacy chain ID 98865 — the app defines Plume mainnet explicitly as 98866.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
