import { ExternalLink } from 'lucide-react';
import { CONTRACTS, explorerAddressUrl, shortAddress, type DeployedContract } from './contracts';

const MODES: { mode: 'testnet' | 'mainnet'; label: string }[] = [
  { mode: 'testnet', label: 'Testnet' },
  { mode: 'mainnet', label: 'Mainnet' },
];

function StatusBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: 'rgba(22,163,74,0.12)', color: '#15803d' }}
    >
      Verified
    </span>
  ) : (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: 'rgba(217,119,6,0.12)', color: '#b45309' }}
    >
      Unverified
    </span>
  );
}

function VanityShortAddress({ address }: { address: string }) {
  // Vanity deployments start with 0x001 (testnet) or 0x002 (mainnet).
  // Bold that prefix so the network is visible at a glance.
  const short = shortAddress(address);
  if (!/^0x00[12]/i.test(address)) return <>{short}</>;
  return (
    <>
      {short.slice(0, 2)}
      <span className="font-bold" style={{ color: 'var(--ink)' }}>
        {short.slice(2, 5)}
      </span>
      {short.slice(5)}
    </>
  );
}

function ContractRow({ contract }: { contract: DeployedContract }) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          {contract.chain}
        </p>
        <StatusBadge verified={contract.verified} />
      </div>
      <a
        href={explorerAddressUrl(contract)}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 inline-flex items-center gap-1.5 text-xs mono underline"
        style={{ color: 'var(--muted)' }}
      >
        <VanityShortAddress address={contract.address} />
        <ExternalLink className="size-3.5" />
      </a>
      {contract.note && (
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--subtle)' }}>
          {contract.note}
        </p>
      )}
    </div>
  );
}

export function ContractsPanel() {
  return (
    <div className="space-y-5">
      {MODES.map(({ mode, label }) => {
        const list = CONTRACTS.filter((c) => c.mode === mode);
        if (list.length === 0) return null;
        return (
          <div key={mode} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--subtle)' }}>
              {label}
            </p>
            {list.map((contract) => (
              <ContractRow key={`${contract.mode}-${contract.chain}`} contract={contract} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
