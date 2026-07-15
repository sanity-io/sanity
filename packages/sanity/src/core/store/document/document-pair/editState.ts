import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type Schema} from '@sanity/types'
import {combineLatest, type Observable, of, ReplaySubject, timer} from 'rxjs'
import {map, share, startWith, switchMap} from 'rxjs/operators'

import {getReleaseIdFromReleaseDocumentId} from '../../../releases'
import {getVersionFromId} from '../../../util'
import {measureFirstEmission} from '../../../util/measureFirstEmission'
import {createSWR} from '../../../util/rxSwr'
import {type DocumentStoreExtraOptions} from '../getPairListener'
import {type IdPair, type PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizeKeyGen} from './memoizeKeyGen'
import {snapshotPair} from './snapshotPair'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'

interface TransactionSyncLockState {
  enabled: boolean
}

const swr = createSWR<
  [SanityDocument, SanityDocument, TransactionSyncLockState, SanityDocument | null]
>({maxSize: 50})

/**
 * @hidden
 * @beta */
export interface EditStateFor {
  id: string
  type: string
  transactionSyncLock: TransactionSyncLockState | null
  draft: SanityDocument | null
  published: SanityDocument | null
  version: SanityDocument | null
  /**
   * Whether live edit is enabled. This may be true for various reasons:
   *
   * - The schema type has live edit enabled.
   * - A version of the document is checked out.
   */
  liveEdit: boolean
  /**
   * Whether the schema type has live edit enabled.
   */
  liveEditSchemaType: boolean
  ready: boolean
  /**
   * When editing a version, the short name of the release the document belongs to (or an agent /
   * anonymous bundle name), matched by consumers against active release names. Never an opaque
   * variant scope hash: documents carrying full `_system` metadata are classified from
   * `_system.release` (normalized from the `_.releases.<name>` reference), so drafts- and
   * published-scoped variants report `undefined` while release-scoped versions — variant or not —
   * report their release. Until the first snapshot arrives, the bundle segment is reported as-is.
   */
  release: string | undefined
  /**
   * When editing a version, the bundle segment of the version document id
   * (`versions.<scopeId>.<groupId>`): a release id, an agent/anonymous bundle name, or an opaque
   * variant scope hash. `undefined` when editing the base draft/published pair.
   */
  scopeId: string | undefined
}
const LOCKED: TransactionSyncLockState = {enabled: true}
const NOT_LOCKED: TransactionSyncLockState = {enabled: false}

/**
 * Classifies `EditStateFor.release` from a version snapshot.
 *
 * Documents carrying the full `_system` metadata (`_system.group` present) are classified from
 * `_system.release`, which is authoritative: a reference to the release document
 * (`_.releases.<name>`), normalized here to the short release name every consumer matches
 * against. Version documents without a release reference (e.g. drafts- or published-scoped
 * variants) report `undefined`.
 *
 * Unmigrated documents (no `_system.group`) can only be plain release versions, so the bundle
 * segment of their id (`scopeId`) is the release name.
 */
function classifyRelease(
  versionSnapshot: SanityDocument | null,
  scopeId: string | undefined,
): string | undefined {
  if (!versionSnapshot || !versionSnapshot._system?.group) {
    return scopeId
  }
  const releaseRef = versionSnapshot._system.release?._ref
  if (!releaseRef) {
    return undefined
  }
  return getReleaseIdFromReleaseDocumentId(releaseRef)
}

// How long to keep the pipeline alive after the last subscriber unsubscribes.
// Subscriber churn (e.g. a React commit that unsubscribes every consumer before
// the replacements subscribe) can momentarily drop the refcount to zero. A bare
// teardown would make the next subscriber re-enter the cold-start path: the SWR
// cache replays with `fromCache: true`, which emits `ready: false` and flips the
// form read-only until fresh snapshots arrive — silently swallowing keystrokes
// typed in that window. The invariant: a momentary zero-subscriber gap on a
// warm, healthy document pair must never surface as `ready: false`.
const TEARDOWN_GRACE_PERIOD = 1_000

/** @internal */
export const editState = memoize(
  (
    ctx: {
      client: SanityClient
      schema: Schema
      /**
       * @deprecated Does nothing. Preserved to avoid breaking changes.
       * Will be removed in the next major version.
       */
      serverActionsEnabled?: Observable<boolean>
      extraOptions?: DocumentStoreExtraOptions
    },
    idPair: IdPair,
    typeName: string,
  ): Observable<EditStateFor> => {
    const liveEditSchemaType = isLiveEditEnabled(ctx.schema, typeName)
    const liveEdit = typeof idPair.versionId !== 'undefined' || liveEditSchemaType
    const scopeId = idPair.versionId ? getVersionFromId(idPair.versionId) : undefined

    return snapshotPair(ctx.client, idPair, typeName, undefined, ctx.extraOptions).pipe(
      switchMap((versions) =>
        combineLatest([
          versions.draft.snapshots$,
          versions.published.snapshots$,
          versions.transactionsPendingEvents$.pipe(
            map((ev: PendingMutationsEvent) => (ev.phase === 'begin' ? LOCKED : NOT_LOCKED)),
            startWith(NOT_LOCKED),
          ),
          typeof versions.version === 'undefined' ? of(null) : versions.version.snapshots$,
        ]),
      ),
      swr(`${idPair.publishedId}-${idPair.draftId}-${idPair.versionId}`),
      measureFirstEmission(
        (durationMs, {fromCache, value: [draftSnapshot, publishedSnapshot, versionSnapshot]}) => {
          ctx.extraOptions?.onDocumentPairLoaded?.({
            durationMs,
            fromCache,
            hasPublished: Boolean(publishedSnapshot),
            hasDraft: Boolean(draftSnapshot),
            hasVersion: Boolean(versionSnapshot),
          })
        },
      ),
      // NOTE: `useEditState` deduplicates emissions downstream using shallow equality on
      // `draft`/`published`/`version` as well as `ready` and `transactionSyncLock`.
      // The map below preserves the snapshot identities and only allocates a new outer
      // wrapper while deriving those additional fields.
      //
      // A regression that clones any of these references — example. `draft: {...draftSnapshot}` — would silently
      // turn that dedupe into a no-op. We have regression tests for this.
      map(
        ({
          value: [draftSnapshot, publishedSnapshot, transactionSyncLock, versionSnapshot],
          fromCache,
        }) => ({
          id: idPair.publishedId,
          type: typeName,
          draft: draftSnapshot,
          published: publishedSnapshot,
          version: typeof idPair.versionId === 'undefined' ? null : versionSnapshot,
          liveEdit,
          liveEditSchemaType,
          ready: !fromCache,
          transactionSyncLock: fromCache ? null : transactionSyncLock,
          release: classifyRelease(versionSnapshot, scopeId),
          scopeId,
        }),
      ),
      startWith({
        id: idPair.publishedId,
        type: typeName,
        draft: null,
        published: null,
        version: null,
        liveEdit,
        liveEditSchemaType,
        ready: false,
        transactionSyncLock: null,
        release: scopeId,
        scopeId,
      }),
      // Unlike `publishReplay(1) + refCount()`, this resets the replay subject
      // when the pipeline is torn down, so a later cold subscriber won't get a
      // stale `ready: true` replayed before the cold-start emissions (and an
      // error won't be replayed forever).
      share({
        connector: () => new ReplaySubject(1),
        resetOnRefCountZero: () => timer(TEARDOWN_GRACE_PERIOD),
      }),
    )
  },
  (ctx, idPair, typeName) => memoizeKeyGen(ctx.client, idPair, typeName),
)
