import {type MutationPayload} from './buffered-doc/types'

/** @internal */
export interface MutationEvent {
  type: 'mutation'
  documentId: string
  transactionId: string
  mutations: MutationPayload[]
  effects: {apply: unknown; revert: unknown}

  previousRev: string
  resultRev: string
  transactionTotalEvents: number
  transactionCurrentEvent: number
  messageReceivedAt: string
  visibility: 'transaction' | 'query'

  transition: 'update' | 'appear' | 'disappear'
}

/** @internal */
export interface PendingMutationsEvent {
  type: 'pending'
  phase: 'begin' | 'end'
}

/** @internal */
export interface IdPair {
  draftId: string
  publishedId: string
  versionId?: string
}

/**
 * The document targeted by the selected perspective and variant, as declared by a caller of the
 * document pair APIs. Callers resolve targets asynchronously (variant scope ids are opaque,
 * server-generated hashes discoverable only by lookup), so the union carries the unresolved and
 * missing states explicitly — the store must guard operations in those states instead of falling
 * back to the base draft/published pair.
 *
 * `scopeId` is the second segment of a version document id (`versions.<scopeId>.<groupId>`),
 * matching `_system.scopeId` on the document itself: a release name (or agent/anonymous bundle
 * name) for plain versions today, an opaque server-generated hash for variant-scoped versions.
 *
 * - `version` — a plain version (release, agent or anonymous bundle): the pair checks out
 *   `versions.<scopeId>.<groupId>`. Passing a bare `string` is shorthand for this kind.
 * - `variant` — a resolved variant-scoped version: the pair checks out
 *   `versions.<scopeId>.<groupId>` via the variant's scope id.
 * - `target-missing` — a variant is selected but the document has no variant-scoped version for
 *   the current bundle (or the variant selection is invalid). Operations are disabled with
 *   `TARGET_NOT_FOUND` and throw if executed.
 * - `unresolved` — target resolution is still in flight. Operations stay guarded (`NOT_READY`)
 *   and throw if executed.
 *
 * @internal
 */
export type DocumentPairTarget =
  | {kind: 'version'; scopeId: string}
  | {kind: 'variant'; scopeId: string; variantId: string}
  | {kind: 'target-missing'; variantId?: string}
  | {kind: 'unresolved'}

export type {ReconnectEvent, ResetEvent, WelcomeBackEvent, WelcomeEvent} from '@sanity/client'
