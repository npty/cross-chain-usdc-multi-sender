import { Github } from 'lucide-react';

export function PageFooter() {
  return (
    <>
      {/* Independence disclaimer */}
      <p className="text-center text-xs leading-relaxed px-2" style={{ color: 'var(--subtle)' }}>
        MultiSend is an independent open-source tool. It is <strong>NOT</strong> affiliated with,
        endorsed by, or sponsored by Circle Internet Financial, Inc. It simply interacts with Circle's
        public, permissionless CCTP smart contracts, which any developer can build on.
      </p>
      <p className="text-center pb-6 flex items-center justify-center gap-4">
        <a
          href="https://github.com/npty/cross-chain-usdc-multi-sender"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs underline"
          style={{ color: 'var(--muted)' }}
        >
          <Github className="size-3.5" /> View source on GitHub
        </a>
        <a href="#/contracts" className="text-xs underline" style={{ color: 'var(--muted)' }}>
          Verified contracts
        </a>
      </p>
    </>
  );
}
