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
    address: '0x0014Ab24834ce29939a8Edb96496460A986044C7',
    explorerBase: 'https://explorer.testnet.arc.io',
    verified: true,
  },
  {
    chain: 'Arc Mainnet',
    mode: 'mainnet',
    address: '0x00267A417229895ABCfCd45395Db963505196f3c',
    explorerBase: 'https://explorer.arc.io',
    verified: true,
  },
  {
    chain: 'Arbitrum',
    mode: 'mainnet',
    address: '0x00267A417229895ABCfCd45395Db963505196f3c',
    explorerBase: 'https://arbiscan.io',
    verified: true,
  },
  {
    chain: 'Avalanche',
    mode: 'mainnet',
    address: '0x00267A417229895ABCfCd45395Db963505196f3c',
    explorerBase: 'https://snowtrace.io',
    verified: true,
  },
  {
    chain: 'Base',
    mode: 'mainnet',
    address: '0x00267A417229895ABCfCd45395Db963505196f3c',
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
