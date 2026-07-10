/* Confidence-surface prototype (overhaul branch) — not for upstream.
 * The mock seam lives in ./mock; real behavior (accept-gate mutations)
 * lives here. See docs/workspace/studio-ux-overhaul/BRIEF-ADDENDUM. */
export {applyProposal} from './applyProposal'
export {ConfidenceDashboard} from './ConfidenceDashboard'
export {confidenceFieldAction} from './confidenceFieldAction'
export * from './mock'
export {ConfirmationQueueHost} from './ConfirmationQueue'
export {NeedsYouButton} from './NeedsYouButton'
export {
  closeBatch,
  closeProposal,
  getAnyPendingProposal,
  getOpenBatch,
  getPendingProposal,
  isProposalResolved,
  openBatch,
  openProposal,
  regenerateProposal,
  resolveProposal,
  useConfidenceStoreVersion,
} from './proposalStore'
export {TrustCardHost} from './TrustCard'
