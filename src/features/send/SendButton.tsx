import { ArrowRight, Loader2 } from 'lucide-react';

import type { SendStepState } from './multisend';

interface SendButtonProps {
  isConnected: boolean;
  isWrongChain: boolean;
  wrongChainLabel: string;
  contractDeployed: boolean;
  step: SendStepState;
  supportsPermit: boolean;
  isApprovePending: boolean;
  isApproveConfirming: boolean;
  isSendPending: boolean;
  isSendConfirming: boolean;
  isSignPending: boolean;
  destinationCount: number;
  allQuotesReady: boolean;
  onSend: () => void;
}

function SpinnerLabel({ text }: { text: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <Loader2 className="size-4 animate-spin" />{text}
    </span>
  );
}

/** The main send CTA. Owns the "can I send right now?" rules and the button label. */
export function SendButton(props: SendButtonProps) {
  const {
    isConnected, isWrongChain, wrongChainLabel, contractDeployed, step,
    supportsPermit, isApprovePending, isApproveConfirming,
    isSendPending, isSendConfirming, isSignPending,
    destinationCount, allQuotesReady, onSend,
  } = props;

  const canSend =
    isConnected && !isWrongChain && destinationCount > 0 &&
    allQuotesReady && step === 'idle' && contractDeployed;

  const isProcessing =
    step === 'approving' || step === 'sending' || isApprovePending || isSendPending ||
    isApproveConfirming || isSendConfirming || isSignPending;

  let label: React.ReactNode;
  if (!isConnected) label = 'Connect Wallet';
  else if (isWrongChain) label = `Switch to ${wrongChainLabel}`;
  else if (!contractDeployed) label = 'Contract not deployed';
  else if (step === 'approving') {
    if (supportsPermit) label = <SpinnerLabel text={isSignPending ? 'Sign permit in wallet...' : 'Preparing permit...'} />;
    else if (isApprovePending || isApproveConfirming)
      label = <SpinnerLabel text={isApprovePending ? 'Approve in wallet...' : 'Approving USDC...'} />;
    else label = <SpinnerLabel text="Preparing..." />;
  } else if (step === 'sending' && (isSendPending || isSendConfirming)) {
    label = <SpinnerLabel text={isSendPending ? 'Confirm in wallet...' : 'Broadcasting...'} />;
  } else if (step === 'done') label = 'Sent!';
  else if (destinationCount === 0) label = 'Select destination chains below';
  else if (!allQuotesReady) label = 'Waiting for fee quotes...';
  else label = (
    <span className="flex items-center justify-center gap-1.5">
      Send USDC to {destinationCount} chain{destinationCount > 1 ? 's' : ''}
      <ArrowRight className="size-4" />
    </span>
  );

  return (
    <button
      disabled={!canSend || isProcessing}
      onClick={onSend}
      className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      style={{ background: 'var(--accent)' }}
    >
      {label}
    </button>
  );
}
