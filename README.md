# MultiSend — USDC to Multiple Chains

> Built with [Arc Studio](https://studio.arc.io) — money-powered apps in minutes.

Send USDC to multiple destination chains simultaneously in a single transaction,
using CCTP v2 (`TokenMessengerWithFees`) with Circle's upfront-fee Forwarding Service.
The UI lets you configure per-chain amounts, fetches real-time fee quotes from
Circle's Quote API, shows the exact fee breakdown (principal + forwarding fee per chain),
and executes the multi-chain send in one approve + one `multiSend` call.

Source chain: **Arc Testnet** (chain ID `5042002`) — USDC is the native gas token there.

## Deployed Contracts (Arc Testnet)

| Contract | Address |
|---|---|
| MultiChainUSDCSend v1 (deprecated) | [`0x1c72d8cd88c026fa3bb44c01a573cb9477dc781e`](https://explorer.testnet.arc.io/address/0x1c72d8cd88c026fa3bb44c01a573cb9477dc781e) |
| MultiChainUSDCSend v2 (deprecated) | [`0x014f84afa85297376a4a04d4b5922f3ec1f4a215`](https://explorer.testnet.arc.io/address/0x014f84afa85297376a4a04d4b5922f3ec1f4a215) |
| MultiChainUSDCSend v3 (deprecated) | [`0xe2e1c920d8b5a52af05da22fe0dda3b5dbd0e7eb`](https://explorer.testnet.arc.io/address/0xe2e1c920d8b5a52af05da22fe0dda3b5dbd0e7eb) |
| MultiChainUSDCSend v4 (active) | [`0x73b5e63f91c2fa200b2b56f8a8a2b1482f12a02f`](https://explorer.testnet.arc.io/address/0x73b5e63f91c2fa200b2b56f8a8a2b1482f12a02f) |

## Tech Stack

- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS, framer-motion, Sonner toasts
- **Web3:** wagmi v2, viem v2, ConnectKit (injected wallet: MetaMask, etc.)
- **Contracts:** Solidity 0.8.28 + Foundry (`evmVersion: paris`). Sources in `contracts/`,
  unit tests in `contracts/test/`
- **Token:** USDC — 6 decimals ERC-20 (`0x3600000000000000000000000000000000000000` on Arc).
  On Arc, USDC is also the native gas token (18-dec native view = same pool).

## Getting Started

```bash
# install JS deps (bun) and set up the contract address
bun install
cp .env.example .env
# edit .env → VITE_MULTISEND_ADDRESS=0x73b5e63f91c2fa200b2b56f8a8a2b1482f12a02f

# run the dev server
bun run dev
```

Get testnet USDC from https://faucet.circle.com.

## Contracts

```bash
bun run contracts:build   # forge build
bun run contracts:test    # forge test
```

`contracts/MultiChainUSDCSend.sol` — batches multiple CCTP v2 `depositForBurnWithFees`
calls into one transaction. Pulls the 6-decimal ERC-20 principal per destination,
pays per-destination forwarding fees in native (18-dec) USDC via `msg.value`,
and refunds any overpaid fee. Max 10 destinations per call.

## Environment Variables

- `VITE_MULTISEND_ADDRESS` — deployed `MultiChainUSDCSend` address (see `.env.example`).

## Key Files

- `src/App.tsx` — main application logic
- `src/config.ts` — wagmi config (Arc Testnet + CCTP v2 Forwarding destination testnets)
- `src/cctpChains.ts` — canonical CCTP v2 destination chain list with domains + USDC addresses
- `src/components/` — UI components (`ChainPicker`, `ChainRow`, `AddChainModal`)
- `contracts/MultiChainUSDCSend.sol` — the batching contract
