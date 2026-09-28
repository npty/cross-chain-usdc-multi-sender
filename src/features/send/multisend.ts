import type { PublicClient } from 'viem';
import type { useWriteContract, useSignTypedData } from 'wagmi';
import { erc20Abi } from 'viem';

import { getNetworkChain, type NetworkMode } from '@/cctp-chains';
import { parseUsdcAmount } from '@/onchain/money';
import { addrToBytes32, isValidSolanaAddress, resolveSolanaMintRecipient } from '@/shared/addresses';
import type { ChainDestination } from '../destinations/types';
import { signPermit, type PermitConfig } from './permit';

export const MULTISEND_ABI = [
  {
    type: 'function', name: 'multiSend', stateMutability: 'payable',
    inputs: [{
      name: 'requests', type: 'tuple[]',
      components: [
        { name: 'destinationDomain', type: 'uint32' },
        { name: 'mintRecipient', type: 'bytes32' },
        { name: 'amount', type: 'uint256' },
        { name: 'fee', type: 'uint256' },
        { name: 'signedQuote', type: 'bytes' },
      ],
    }],
    outputs: [],
  },
  {
    type: 'function', name: 'permitAndMultiSend', stateMutability: 'payable',
    inputs: [
      {
        name: 'requests', type: 'tuple[]',
        components: [
          { name: 'destinationDomain', type: 'uint32' },
          { name: 'mintRecipient', type: 'bytes32' },
          { name: 'amount', type: 'uint256' },
          { name: 'fee', type: 'uint256' },
          { name: 'signedQuote', type: 'bytes' },
        ],
      },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'usdc', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function', name: 'totalCost', stateMutability: 'pure',
    inputs: [{
      name: 'requests', type: 'tuple[]',
      components: [
        { name: 'destinationDomain', type: 'uint32' },
        { name: 'mintRecipient', type: 'bytes32' },
        { name: 'amount', type: 'uint256' },
        { name: 'fee', type: 'uint256' },
        { name: 'signedQuote', type: 'bytes' },
      ],
    }],
    outputs: [
      { name: 'usdcErc20Total', type: 'uint256' },
      { name: 'nativeFeeTotal', type: 'uint256' },
    ],
  },
] as const;

export interface SendRequest {
  destinationDomain: number;
  mintRecipient: `0x${string}`;
  amount: bigint;
  fee: bigint;
  signedQuote: `0x${string}`;
}

export interface PreparedSend {
  requests: SendRequest[];
  /** Total principal in USDC minor units (6 dec). */
  totalUsdc6: bigint;
  /** Total forwarding fees in native wei (18 dec). */
  totalNativeFee: bigint;
}

export type SendStep = 'approving' | 'sending';

/** Full lifecycle of the send UI, including idle and done states. */
export type SendStepState = 'idle' | SendStep | 'done';

export interface SendFlowDeps {
  /** Connected wallet address (also the default recipient). */
  address: `0x${string}`;
  networkMode: NetworkMode;
  sourceChainId: number;
  multisendAddress: `0x${string}`;
  sourceUsdcAddress: `0x${string}`;
  /** Null on chains whose USDC lacks EIP-2612 — falls back to a separate approve tx. */
  permit: PermitConfig | null;
  publicClient: PublicClient;
  approveContractAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  sendContractAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  signTypedDataAsync: ReturnType<typeof useSignTypedData>['signTypedDataAsync'];
}

export interface SendHooks {
  onStep: (step: SendStep) => void;
  onApproveHash: (hash: `0x${string}`) => void;
  onSendHash: (hash: `0x${string}`) => void;
}

/**
 * Orchestrates a multi-chain USDC send: validates destinations, builds the
 * contract requests (resolving Solana ATAs), then executes either the gasless
 * EIP-2612 permit flow or the legacy approve-then-send flow.
 *
 * Pure orchestration — all UI state updates go through the hooks callbacks.
 */
export class SendFlow {
  constructor(private deps: SendFlowDeps) {}

  /**
   * Validate destinations and build the contract call requests.
   * Throws an Error with a user-facing message when validation fails.
   */
  async prepare(destinations: ChainDestination[]): Promise<PreparedSend> {
    const { address, networkMode, sourceChainId } = this.deps;

    // Validate non-EVM (Solana) recipients before building requests
    for (const dest of destinations) {
      const chain = getNetworkChain(networkMode, dest.chainId)!;
      if (chain.isNonEvm) {
        const recipient = dest.recipient || address;
        if (!isValidSolanaAddress(recipient)) {
          throw new Error(`Invalid Solana address for ${chain.name}. Enter a valid base58 address.`);
        }
      }
    }

    const requests = await Promise.all(destinations.map(async (dest) => {
      const chain = getNetworkChain(networkMode, dest.chainId)!;
      const amountRaw = parseUsdcAmount(sourceChainId, dest.amount);
      const recipient = dest.recipient || address;
      // Solana destinations: mintRecipient must be the USDC token account (ATA),
      // not the wallet address. The Forwarding Service creates the ATA if needed.
      const mintRecipient = chain.isNonEvm
        ? await resolveSolanaMintRecipient(chain.solanaUsdcMint!, chain.rpcUrls[0], recipient)
        : addrToBytes32(recipient);
      return {
        destinationDomain: chain.cctpDomain as number,
        mintRecipient,
        amount: amountRaw,
        fee: BigInt(dest.feeQuote!.feeTotalAmount),
        signedQuote: dest.feeQuote!.signedQuote as `0x${string}`,
      };
    }));

    return {
      requests,
      totalUsdc6: requests.reduce((acc, r) => acc + r.amount, BigInt(0)),
      totalNativeFee: requests.reduce((acc, r) => acc + r.fee, BigInt(0)),
    };
  }

  /**
   * Execute the send. Resolves with the multiSend transaction hash once
   * confirmed. Throws on user rejection or on-chain failure.
   */
  async execute(prepared: PreparedSend, hooks: SendHooks): Promise<`0x${string}`> {
    const {
      address, sourceChainId, multisendAddress, sourceUsdcAddress,
      permit, publicClient, approveContractAsync, sendContractAsync, signTypedDataAsync,
    } = this.deps;
    const { requests, totalUsdc6, totalNativeFee } = prepared;

    if (permit) {
      // Gasless approval: sign an EIP-2612 permit off-chain (free), then the
      // contract executes permit + multi-send in a single transaction.
      hooks.onStep('approving');
      const { deadline, v, r, s } = await signPermit({
        publicClient,
        signTypedDataAsync,
        owner: address,
        spender: multisendAddress,
        value: totalUsdc6,
        usdcAddress: sourceUsdcAddress,
        chainId: sourceChainId,
        permit,
      });

      hooks.onStep('sending');
      const sendHash = await sendContractAsync({
        address: multisendAddress,
        abi: MULTISEND_ABI,
        functionName: 'permitAndMultiSend',
        args: [requests, deadline, v, r, s],
        value: totalNativeFee,
        chainId: sourceChainId,
      });
      hooks.onSendHash(sendHash);
      await publicClient.waitForTransactionReceipt({ hash: sendHash });
      return sendHash;
    }

    // Legacy flow: separate on-chain approve, then multiSend.
    hooks.onStep('approving');
    const approveHash = await approveContractAsync({
      address: sourceUsdcAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [multisendAddress, totalUsdc6],
      chainId: sourceChainId,
    });
    hooks.onApproveHash(approveHash);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    hooks.onStep('sending');
    const sendHash = await sendContractAsync({
      address: multisendAddress,
      abi: MULTISEND_ABI,
      functionName: 'multiSend',
      args: [requests],
      value: totalNativeFee,
      chainId: sourceChainId,
    });
    hooks.onSendHash(sendHash);
    await publicClient.waitForTransactionReceipt({ hash: sendHash });
    return sendHash;
  }
}
