/**
 * Circle CCTP v2 messages API client.
 *
 * After a send transaction confirms on the source chain, this endpoint reports
 * each emitted CCTP message: its attestation status and, for Forwarding
 * Service transfers, the forwarder's delivery transaction on the destination.
 *
 * Docs: https://developers.circle.com/api-reference/cctp/all/get-messages-v2
 */

export interface CctpMessage {
  /** Attestation status, e.g. "complete" once Circle has attested the message. */
  status: string;
  /** Forwarding state, e.g. "PENDING" while the forwarder is delivering. */
  forwardState: string | null;
  /** Forwarder delivery tx hash on the destination chain, once delivered. */
  forwardTxHash: string | null;
  /** CCTP domain of the destination chain. */
  destinationDomain: number;
  /** CCTP nonce of the message. */
  nonce: string;
  /** Amount in USDC base units (decimal string). */
  amount: string;
  /** Final recipient of the minted USDC. */
  mintRecipient: string;
}

interface RawMessagesResponse {
  messages?: Array<{
    status?: string;
    forwardState?: string | null;
    forwardTxHash?: string | null;
    decodedMessage?: {
      destinationDomain?: string;
      nonce?: string;
      decodedMessageBody?: {
        amount?: string;
        mintRecipient?: string;
      };
    };
  }>;
}

/**
 * Fetch the CCTP messages Circle has indexed for a source-chain transaction.
 * Returns an empty array when the transaction is not indexed yet.
 */
export async function fetchSourceMessages(
  apiBase: string,
  sourceDomain: number,
  txHash: string,
): Promise<CctpMessage[]> {
  const res = await fetch(
    `${apiBase}/v2/messages/${sourceDomain}?transactionHash=${txHash}`,
  );
  if (!res.ok) {
    throw new Error(`Circle messages API responded ${res.status}`);
  }
  const data = (await res.json()) as RawMessagesResponse;
  return (data.messages ?? []).map((m) => ({
    status: m.status ?? '',
    forwardState: m.forwardState ?? null,
    forwardTxHash: m.forwardTxHash ?? null,
    destinationDomain: Number(m.decodedMessage?.destinationDomain ?? NaN),
    nonce: m.decodedMessage?.nonce ?? '',
    amount: m.decodedMessage?.decodedMessageBody?.amount ?? '',
    mintRecipient: m.decodedMessage?.decodedMessageBody?.mintRecipient ?? '',
  }));
}
