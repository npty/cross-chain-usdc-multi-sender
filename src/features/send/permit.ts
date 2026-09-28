/**
 * Minimal EIP-2612 surface on the Arc USDC contract.
 * Domain verified on-chain: name "USDC", version "2".
 */
export const PERMIT_ABI = [
  {
    type: 'function', name: 'nonces', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export interface PermitConfig {
  /** EIP-712 domain name, e.g. "USDC" (Arc) or "USD Coin" (other chains). */
  name: string;
  /** EIP-712 domain version, e.g. "2". */
  version: string;
}

export interface SignedPermit {
  deadline: bigint;
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
}

import type { PublicClient } from 'viem';
import type { useSignTypedData } from 'wagmi';

/**
 * Sign an EIP-2612 permit off-chain (gasless) authorizing the MultiSend
 * contract to pull `value` USDC. Returns the deadline and split signature
 * ready for `permitAndMultiSend`.
 */
export async function signPermit(args: {
  publicClient: PublicClient;
  signTypedDataAsync: ReturnType<typeof useSignTypedData>['signTypedDataAsync'];
  owner: `0x${string}`;
  spender: `0x${string}`;
  value: bigint;
  usdcAddress: `0x${string}`;
  chainId: number;
  permit: PermitConfig;
}): Promise<SignedPermit> {
  const { publicClient, signTypedDataAsync, owner, spender, value, usdcAddress, chainId, permit } = args;
  const nonce = await publicClient.readContract({
    address: usdcAddress,
    abi: PERMIT_ABI,
    functionName: 'nonces',
    args: [owner],
  });
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 min
  const signature = await signTypedDataAsync({
    domain: {
      name: permit.name,
      version: permit.version,
      chainId,
      verifyingContract: usdcAddress,
    },
    types: PERMIT_TYPES,
    primaryType: 'Permit',
    message: { owner, spender, value, nonce, deadline },
  });
  const r: `0x${string}` = `0x${signature.slice(2, 66)}`;
  const s: `0x${string}` = `0x${signature.slice(66, 130)}`;
  const v = parseInt(signature.slice(130, 132), 16);
  return { deadline, v, r, s };
}
