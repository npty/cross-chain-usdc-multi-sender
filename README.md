# MultiSend

Send USDC to multiple destination chains in a single transaction via Circle CCTP v2
(`TokenMessengerWithFees`). Pick destinations, set per-chain amounts, get real-time
fee quotes from Circle's Quote API, then execute everything in one transaction with
EIP-2612 gasless approval (no separate approve tx).

Source chains: Arc Testnet in testnet mode; Arc, Arbitrum, Avalanche, and Base in
mainnet mode. On Arc, USDC is the native gas token.

## Features

- Batch sends to up to 10 destination chains in one transaction
- Real-time fee quotes per chain from Circle's Forwarding Service Quote API
- Fee breakdown: ERC-20 principal plus per-chain forwarding fee, shown before sending
- EIP-2612 permit: single-transaction approval and send on all chains
- Post-send tracking panel with explorer links per destination
- Testnet/Mainnet toggle; wallet auto-switches to the selected source chain

## Deployed contracts

All run the same permit-version source (`permitAndMultiSend`), confirmed by on-chain
bytecode comparison.

| Network | Address |
|---|---|
| Arc Testnet | [`0x24293D51AB51Fa8c7E7E3E6920eA7262a0214100`](https://explorer.testnet.arc.io/address/0x24293D51AB51Fa8c7E7E3E6920eA7262a0214100) |
| Arc Mainnet | [`0xB00cDe5662F5190d9F76B3629C16145Be7B28c57`](https://explorer.arc.io/address/0xB00cDe5662F5190d9F76B3629C16145Be7B28c57) |
| Arbitrum | [`0x0032a5147f96039b62d08f651884aa58cfa30772`](https://arbiscan.io/address/0x0032a5147f96039b62d08f651884aa58cfa30772) |
| Base | [`0x0032a5147f96039b62d08f651884aa58cfa30772`](https://basescan.org/address/0x0032a5147f96039b62d08f651884aa58cfa30772) |
| Avalanche | [`0x24293d51ab51fa8c7e7e3e6920ea7262a0214100`](https://snowtrace.io/address/0x24293d51ab51fa8c7e7e3e6920ea7262a0214100) |

## Local dev

```bash
bun install
cp .env.example .env   # set VITE_MULTISEND_ADDRESS_* (see below)
bun run dev
```

Get testnet USDC from https://faucet.circle.com.

### Environment variables

| Variable | Purpose |
|---|---|
| `VITE_MULTISEND_ADDRESS` | Contract address on Arc Testnet |
| `VITE_MULTISEND_ADDRESS_MAINNET` | Contract address on Arc Mainnet |
| `VITE_MULTISEND_ADDRESS_ARBITRUM` | Contract address on Arbitrum |
| `VITE_MULTISEND_ADDRESS_BASE` | Contract address on Base |
| `VITE_MULTISEND_ADDRESS_AVALANCHE` | Contract address on Avalanche |

## Contracts

Solidity 0.8.28, Foundry (`evm_version: paris`, optimizer 200 runs).

```bash
bun run contracts:build   # forge build
bun run contracts:test    # forge test
```

`contracts/MultiChainUSDCSend.sol` batches CCTP v2 `depositForBurnWithFees` calls.
Constructor takes `(tokenMessengerWithFees, usdc)`. Deploys use plain `cast`:

```bash
# encode constructor args, append to init bytecode, then:
cast send --rpc-url <rpc> --account <deployer> --create <initcode+args>
```

(`cast send --create` rejects wallet flags placed after the bytecode arg; put them
before. Testnet deploys can also go through `bun run deploy:self`, which uses
Circle's Smart Contract Platform API with faucet funding.)

Verify on Blockscout explorers with:

```bash
forge verify-contract <address> contracts/MultiChainUSDCSend.sol:MultiChainUSDCSend \
  --chain <chain-id> --verifier blockscout \
  --verifier-url "https://explorer.<chain>.io/api/" \
  --constructor-args 0x<abi-encoded-args>
```

