/**
 * The role a proposal is acting under. Determines which trust tiers apply.
 */
export type ConfidenceHat =
  | 'strategist'
  | 'author'
  | 'reviewer'
  | 'localizer'
  | 'developer'
  | 'marketer'
  | 'ops-owner'

/**
 * Trust granted to an agent for a given hat/operation.
 * T0 = propose-only, T1 = draft-commit, T2 = staged-commit, T3 = auto-commit.
 */
export type TrustTier = 'T0' | 'T1' | 'T2' | 'T3'

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export interface AgentProposal {
  id: string
  documentId: string
  documentType: string
  fieldName: string
  hat: ConfidenceHat
  changeSummary: string
  diff: {field: string; before: string; after: string}
  intent: string
  evidence: string[]
  confidence: ConfidenceLevel
  reversibility: 'draft' | 'staged-release' | 'live'
  tier: TrustTier
}

export interface MockBatch {
  id: string
  hat: ConfidenceHat
  title: string
  createdBy: 'agent'
  proposals: AgentProposal[]
}
