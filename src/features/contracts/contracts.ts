export interface DeployedContract {
  chain: string;
  mode: 'testnet' | 'mainnet';
  address: string;
  explorerBase: string;
  verified: boolean;
  note?: string;
}

export const CONTRACTS: DeployedContract[] = [
  {
    chain: 'Arc Testnet',
    mode: 'testnet',
    address: '0x24293D51AB51Fa8c7E7E3E6920eA7262a0214100',
    explorerBase: 'https://explorer.testnet.arc.io',
    verified: true,
  },
  {
    chain: 'Arc Mainnet',
    mode: 'mainnet',
    address: '0xB00cDe5662F5190d9F76B3629C16145Be7B28c57',
    explorerBase: 'https://explorer.arc.io',
    verified: true,
  },
  {
    chain: 'Arbitrum',
    mode: 'mainnet',
    address: '0x0032a5147f96039b62d08f651884aa58cfa30772',
    explorerBase: 'https://arbiscan.io',
    verified: true,
  },
  {
    chain: 'Avalanche',
    mode: 'mainnet',
    address: '0x24293d51ab51fa8c7e7e3e6920ea7262a0214100',
    explorerBase: 'https://snowtrace.io',
    verified: false,
    note: 'Verification pending: this explorer does not accept constructor arguments in its upload form yet.',
  },
  {
    chain: 'Base',
    mode: 'mainnet',
    address: '0x0032a5147f96039b62d08f651884aa58cfa30772',
    explorerBase: 'https://basescan.org',
    verified: true,
  },
];

export function explorerAddressUrl(c: DeployedContract): string {
  return `${c.explorerBase}/address/${c.address}`;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}
