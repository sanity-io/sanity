import {useSyncExternalStore} from 'react'

import {getMockProposal} from './mock'
import {type AgentProposal, type MockBatch} from './mock/types'

/**
 * Session-scoped state for mock agent proposals: which are resolved
 * (accepted/rejected), which one is open in the trust card, and per-proposal
 * regeneration seeds. Module-level on purpose — the prototype's "pending
 * work" survives navigation but not a reload, and no provider mounting is
 * needed. Real proposal state is internal work (addendum §7).
 *
 * @internal
 */
interface ConfidenceStoreState {
  resolvedIds: Set<string>
  openProposal: AgentProposal | null
  openBatch: MockBatch | null
  seeds: Map<string, number>
}

const state: ConfidenceStoreState = {
  resolvedIds: new Set(),
  openProposal: null,
  openBatch: null,
  seeds: new Map(),
}

const listeners = new Set<() => void>()
let version = 0

function emit() {
  version++
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getVersion() {
  return version
}

/** Re-render subscription: any store change bumps the version. @internal */
export function useConfidenceStoreVersion(): number {
  return useSyncExternalStore(subscribe, getVersion, getVersion)
}

/** Fields the mock agent proposes on. @internal */
const PROPOSAL_FIELDS = new Set(['description', 'name'])

function fieldKey(documentId: string, fieldName: string): string {
  return `${documentId}:${fieldName}`
}

/**
 * Whether the mock agent has a pending proposal for this field. Deterministic
 * (a stable subset of documents get one) minus anything already resolved this
 * session.
 *
 * @internal
 */
export function getPendingProposal(
  documentId: string,
  documentType: string,
  fieldName: string,
): AgentProposal | null {
  if (!PROPOSAL_FIELDS.has(fieldName)) return null
  const seed = state.seeds.get(fieldKey(documentId, fieldName)) ?? 0
  const proposal = getMockProposal(documentId, documentType, fieldName, seed)
  if (state.resolvedIds.has(proposal.id)) return null
  return proposal
}

/**
 * The document-level pending proposal, if any field has one — drives the
 * ambient row marker in document lists.
 *
 * @internal
 */
export function getAnyPendingProposal(
  documentId: string,
  documentType: string,
): AgentProposal | null {
  for (const fieldName of PROPOSAL_FIELDS) {
    const proposal = getPendingProposal(documentId, documentType, fieldName)
    if (proposal) return proposal
  }
  return null
}

/** @internal */
export function openProposal(proposal: AgentProposal): void {
  state.openProposal = proposal
  emit()
}

/** @internal */
export function closeProposal(): void {
  state.openProposal = null
  emit()
}

/** @internal */
export function getOpenProposal(): AgentProposal | null {
  return state.openProposal
}

/** Accept/reject both retire the proposal for the session. @internal */
export function resolveProposal(proposalId: string): void {
  state.resolvedIds.add(proposalId)
  if (state.openProposal?.id === proposalId) state.openProposal = null
  emit()
}

/** @internal */
export function isProposalResolved(proposalId: string): boolean {
  return state.resolvedIds.has(proposalId)
}

/** @internal */
export function openBatch(batch: MockBatch): void {
  state.openBatch = batch
  emit()
}

/** @internal */
export function closeBatch(): void {
  state.openBatch = null
  emit()
}

/** @internal */
export function getOpenBatch(): MockBatch | null {
  return state.openBatch
}

/** Regenerate: bump the seed so the mock produces a fresh proposal. @internal */
export function regenerateProposal(proposal: AgentProposal): AgentProposal {
  const key = fieldKey(proposal.documentId, proposal.fieldName)
  const nextSeed = (state.seeds.get(key) ?? 0) + 1
  state.seeds.set(key, nextSeed)
  const next = getMockProposal(
    proposal.documentId,
    proposal.documentType,
    proposal.fieldName,
    nextSeed,
  )
  state.openProposal = next
  emit()
  return next
}
