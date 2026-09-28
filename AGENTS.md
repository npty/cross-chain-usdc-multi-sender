# MultiSend — USDC to Multiple Chains

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

Sends USDC to multiple destination chains simultaneously in a single transaction using CCTP v2 (TokenMessengerWithFees) with Circle's upfront fee Forwarding Service. The UI lets you configure per-chain amounts, fetches real-time fee quotes from Circle's Quote API, shows exact fee breakdowns (principal + forwarding fee per chain), and executes the multi-chain send in one approve + one multiSend call.

## Deployed Contracts

| Contract | Chain | Address | Explorer |
|---|---|---|---|
| MultiChainUSDCSend v5 (active, +EIP-2612 permit) | Arc Testnet | 0x24293D51AB51Fa8c7E7E3E6920eA7262a0214100 | https://explorer.testnet.arc.io/address/0x24293D51AB51Fa8c7E7E3E6920eA7262a0214100 |
| MultiChainUSDCSend v3 (active, +EIP-2612 permit) | Arc Mainnet | 0xB00cDe5662F5190d9F76B3629C16145Be7B28c57 | https://explorer.arc.io/address/0xB00cDe5662F5190d9F76B3629C16145Be7B28c57 |

## Environment Variables

- `VITE_MULTISEND_ADDRESS` — MultiChainUSDCSend contract address on Arc Testnet (set in .env)
- `VITE_MULTISEND_ADDRESS_MAINNET` — MultiChainUSDCSend on Arc mainnet: `0xB00cDe5662F5190d9F76B3629C16145Be7B28c57` (v3 with EIP-2612 permit, deployed 2026-09-27, deploy tx `0xb6cf6ebc63b53d2cfa9e01dd28b905286beb5203bb118206fc14f8418f26016e`; the first mainnet deploy `0x0032A5147f96039b62D08f651884aa58CFa30772` was broken — it stored TokenMessengerV2 instead of TokenMessengerWithFees, so all sends reverted; v2 `0x2b8622e0B04b6ee1CDd235e059503ab3fe5BE839` worked but needed a separate approve tx). Set in Vercel for production+preview; Mainnet mode is live and a 1 USDC test to Arbitrum succeeded 2026-09-27.

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
