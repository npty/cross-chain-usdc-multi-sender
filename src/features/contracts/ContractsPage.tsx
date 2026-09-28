import { ContractsPanel } from './ContractsPanel';
import { PageFooter } from '@/shared/PageFooter';

export function ContractsPage() {
  return (
    <div className="flex flex-col min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <div className="px-4 pt-6 pb-4">
        <div className="mx-auto max-w-lg space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>MultiSend</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Verified contracts</p>
            </div>
            <a href="#/" className="text-sm font-semibold underline" style={{ color: 'var(--accent)' }}>
              Back to Send
            </a>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        <div className="mx-auto max-w-lg space-y-4">
          <ContractsPanel />
          <PageFooter />
        </div>
      </div>
    </div>
  );
}
