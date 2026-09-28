# CREATE3 Vanity Redeploy — Runbook (EXECUTED 2026-09-28)

Deployed to all five source chains on 2026-09-28 after Euro's approval.
Testnet: 0x0014Ab24834ce29939a8Edb96496460A986044C7 (Arc Testnet, verified on
explorer, end-to-end 0.001 USDC send test passed).
Mainnet: 0x00267A417229895ABCfCd45395Db963505196f3c on Arc, Arbitrum,
Avalanche, and Base (constructor args confirmed on-chain; Sourcify-verified
on all four: exact match on Arc/Arbitrum/Avalanche, partial match on Base).
Vercel envs and the contracts page were cut over to the vanity addresses and
the live bundle was verified to serve them.

The preparation notes below are kept for reference.

## Vanity identities

| Group   | Keystore                     | EOA                                      | Factory (CREATE @ nonce 0)                | Salt                                                             | Predicted MultiSend                          |
|---------|------------------------------|------------------------------------------|------------------------------------------|------------------------------------------------------------------|----------------------------------------------|
| Testnet | multisend-vanity-testnet     | 0xA66AB5fC9743c169a1e5189277e5545Bd15C0F1A | 0x1C32d8fbAB3836152D14dF03f6a1A52B9b6fD5a9 | 0x00000000000000000000000000000000000000000000000000000000000003d8 | 0x0014Ab24834ce29939a8Edb96496460A986044C7 |
| Mainnet | multisend-vanity-mainnet     | 0xC2386Fe2092AF479210EdE26C3B6FaEEDB81357F | 0x60cDCD5177655aa6CAe11638C8d177DE11bFf831 | 0x0000000000000000000000000000000000000000000000000000000000000b82 | 0x00267A417229895ABCfCd45395Db963505196f3c |

Keystore passwords: `~/.foundry/.multisend-vanity-testnet.pw` and
`~/.foundry/.multisend-vanity-mainnet.pw` (0600). Keys were generated fresh
in process memory and imported via pty; no plaintext key ever touched disk.

## Per-chain constructor args (read from live contracts 2026-09-28)

| Chain            | chainId | TokenMessengerWithFees                     | USDC                                       |
|------------------|---------|--------------------------------------------|--------------------------------------------|
| Arc Testnet      | 5042002 | 0x8745d906d67c346e5eb1aeeed38eb87f34df0c0a | 0x3600000000000000000000000000000000000000 |
| Arc              | 5042    | 0x71f54F818671cD0D7ea140Da213e5C8b5C92a408 | 0x3600000000000000000000000000000000000000 |
| Arbitrum One     | 42161   | 0x71f54F818671cD0D7ea140Da213e5C8b5C92a408 | 0xaf88d065E77c8cC2239327C5EDb3A432268e5831 |
| Avalanche C      | 43114   | 0x71f54F818671cD0D7ea140Da213e5C8b5C92a408 | 0xB97EF9Ef8734C71904d8002f8b6Bc66Dd9c48a6E |
| Base             | 8453    | 0x71f54F818671cD0D7ea140Da213e5C8b5C92a408 | 0x833589fCD6eDb6e08f4c7c32d4f71b54bda02913 |

Constructor-args ABI encodings (`cast abi-encode "constructor(address,address)" <messenger> <usdc>`):

- Arc Testnet: 0x0000000000000000000000008745d906d67c346e5eb1aeeed38eb87f34df0c0a0000000000000000000000003600000000000000000000000000000000000000
- Arc: 0x00000000000000000000000071f54f818671cd0d7ea140da213e5c8b5c92a4080000000000000000000000003600000000000000000000000000000000000000
- Arbitrum: 0x00000000000000000000000071f54f818671cd0d7ea140da213e5c8b5c92a408000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e5831
- Avalanche: 0x00000000000000000000000071f54f818671cd0d7ea140da213e5c8b5c92a408000000000000000000000000b97ef9ef8734c71904d8002f8b6bc66dd9c48a6e
- Base: 0x00000000000000000000000071f54f818671cd0d7ea140da213e5c8b5c92a408000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913

## Measured gas (anvil fork simulations, 2026-09-28)

- Create3Factory deploy (plain CREATE): 210,646 gas
- MultiSend via CREATE3 (`deployDeterministic`): ~745,900 gas
- Total per chain: ~957,000 gas (budget 1.2M for headroom)

Funding needed per chain (at gas prices read 2026-09-28):

| Chain       | Gas price now | 1.2M gas costs | Fund the vanity EOA with |
|-------------|---------------|----------------|--------------------------|
| Arc Testnet | 25 gwei       | ~0.03 USDC     | 0.1 USDC (native gas)    |
| Arc         | 20 gwei       | ~0.024 USDC    | 0.1 USDC (native gas)    |
| Arbitrum    | ~0.02 gwei    | ~0.000024 ETH  | 0.001 ETH                |
| Avalanche   | ~5.1 gwei     | ~0.0061 AVAX   | 0.05 AVAX                |
| Base        | ~0.006 gwei   | ~0.0000072 ETH | 0.001 ETH                |

Funding transfers do NOT consume the EOA nonce. The factory MUST be the
EOA's nonce-0 transaction on each chain; the CREATE3 deploy is nonce-1.

## Deploy (per chain, after approval)

```bash
cd ~/workspace/cross-chain-usdc-multi-sender
export PATH="$HOME/.foundry/bin:$PATH"

# testnet example (Arc Testnet); swap group vars for mainnet chains
FACTORY_ADDRESS=0x1C32d8fbAB3836152D14dF03f6a1A52B9b6fD5a9 \
CREATE3_SALT=0x00000000000000000000000000000000000000000000000000000000000003d8 \
TOKEN_MESSENGER=0x8745d906d67c346e5eb1aeeed38eb87f34df0c0a \
USDC=0x3600000000000000000000000000000000000000 \
forge script contracts/script/DeployCreate3.s.sol \
  --rpc-url https://rpc.testnet.arc.io \
  --account multisend-vanity-testnet \
  --sender 0xA66AB5fC9743c169a1e5189277e5545Bd15C0F1A \
  --broadcast
```

Mainnet group env (per chain, same script):

```bash
FACTORY_ADDRESS=0x60cDCD5177655aa6CAe11638C8d177DE11bFf831
CREATE3_SALT=0x0000000000000000000000000000000000000000000000000000000000000b82
# + per-chain TOKEN_MESSENGER / USDC from the table above
# --account multisend-vanity-mainnet --sender 0xC2386Fe2092AF479210EdE26C3B6FaEEDB81357F
```

The script asserts the factory lands at the expected address and the
MultiSend lands at the predicted vanity address, and skips steps that are
already done (idempotent re-runs).

## Verify (after deployment — NOT run yet)

Compiler: v0.8.28+commit.7893614a, optimizer on, 200 runs, EVM paris
(foundry.toml is picked up automatically when run from the repo root).

Avalanche (Builder Hub custom verifier):

```bash
forge verify-contract \
  --chain-id 43114 \
  --verifier custom \
  --verifier-url https://build.avax.network/api/verify/43114/api \
  --compiler-version v0.8.28+commit.7893614a \
  0x00267A417229895ABCfCd45395Db963505196f3c \
  contracts/MultiChainUSDCSend.sol:MultiChainUSDCSend \
  --constructor-args 0x00000000000000000000000071f54f818671cd0d7ea140da213e5c8b5c92a408000000000000000000000000b97ef9ef8734c71904d8002f8b6bc66dd9c48a6e
```

Arbitrum (Arbiscan; needs `--etherscan-api-key`):

```bash
forge verify-contract \
  --chain-id 42161 \
  --compiler-version v0.8.28+commit.7893614a \
  0x00267A417229895ABCfCd45395Db963505196f3c \
  contracts/MultiChainUSDCSend.sol:MultiChainUSDCSend \
  --constructor-args 0x00000000000000000000000071f54f818671cd0d7ea140da213e5c8b5c92a408000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e5831
```

Base (Basescan; needs `--etherscan-api-key`): same shape, `--chain-id 8453`,
Base constructor-args encoding from the table above.

Arc / Arc Testnet explorer: the explorer's forge-compatible verifier
endpoint was not re-confirmed in this pass (previous verification was done
via API); resolve the endpoint before running.

Also verify the factory on each chain (no constructor args), e.g. Avalanche:

```bash
forge verify-contract \
  --chain-id 43114 \
  --verifier custom \
  --verifier-url https://build.avax.network/api/verify/43114/api \
  --compiler-version v0.8.28+commit.7893614a \
  0x60cDCD5177655aa6CAe11638C8d177DE11bFf831 \
  contracts/Create3Factory.sol:Create3Factory
```

## Simulation evidence

- Arc Testnet fork: factory → 0x1C32d8fbAB3836152D14dF03f6a1A52B9b6fD5a9,
  MultiSend → 0x0014Ab24834ce29939a8Edb96496460A986044C7, constructor args
  read back correctly on-chain.
- Arbitrum fork: factory → 0x60cDCD5177655aa6CAe11638C8d177DE11bFf831,
  MultiSend → 0x00267A417229895ABCfCd45395Db963505196f3c, constructor args
  read back correctly on-chain.
- `forge test --match-contract Create3VanityTest`: 2/2 pass.
