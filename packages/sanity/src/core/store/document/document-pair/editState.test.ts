import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {of, Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createSchema} from '../../../schema'
import {type PendingMutationsEvent} from '../types'
import {editState, type EditStateFor} from './editState'
import {snapshotPair} from './snapshotPair'

vi.mock('./snapshotPair', () => ({snapshotPair: vi.fn()}))

const mockedSnapshotPair = vi.mocked(snapshotPair)

const schema = createSchema({
  name: 'default',
  types: [{name: 'book', type: 'document', fields: [{name: 'title', type: 'string'}]}],
})

function createCtx() {
  return {
    client: createMockSanityClient() as any as SanityClient,
    schema,
    serverActionsEnabled: of(false),
  }
}

/**
 * Regression test for the upstream invariant that `useEditState`'s shallow
 * deduplication (see `packages/sanity/src/core/hooks/useEditState.ts`) depends on:
 * when `combineLatest` re-emits because `transactionsPendingEvents$` toggles, the
 * `draft`/`published`/`version` references on the emitted `EditStateFor` must be
 * the same object identities as the previous emission.
 *
 * This specifically guards against a refactor that clones or recreates those
 * snapshot refs during transaction-sync re-emissions (for example by rebuilding
 * the emitted `EditStateFor` with fresh `draft`/`published`/`version` objects),
 * which would make `useEditState`'s shallow dedupe silently become a no-op.
 */
describe('editState — snapshot identity preservation', () => {
  beforeEach(() => {
    mockedSnapshotPair.mockReset()
  })

  it('reuses draft/published/version refs across transactionSyncLock re-emissions', () => {
    const draft$ = new Subject<SanityDocument | null>()
    const published$ = new Subject<SanityDocument | null>()
    const version$ = new Subject<SanityDocument | null>()
    const transactionsPendingEvents$ = new Subject<PendingMutationsEvent>()

    mockedSnapshotPair.mockReturnValue(
      of({
        draft: {snapshots$: draft$.asObservable()},
        published: {snapshots$: published$.asObservable()},
        version: {snapshots$: version$.asObservable()},
        transactionsPendingEvents$,
      }) as any,
    )

    // Unique id per test run avoids the editState/swr memoize caches.
    const publishedId = `book-${Math.random().toString(36).slice(2)}`
    const idPair = {
      publishedId,
      draftId: `drafts.${publishedId}`,
      versionId: `versions.rel.${publishedId}`,
    }

    const emissions: EditStateFor[] = []
    const sub = editState(createCtx(), idPair, 'book').subscribe((value) => {
      emissions.push(value)
    })

    const draftDoc: SanityDocument = {
      _id: idPair.draftId,
      _type: 'book',
      _rev: 'r1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
    }
    const publishedDoc: SanityDocument = {
      _id: publishedId,
      _type: 'book',
      _rev: 'r1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
    }
    const versionDoc: SanityDocument = {
      _id: idPair.versionId,
      _type: 'book',
      _rev: 'r1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
    }

    draft$.next(draftDoc)
    published$.next(publishedDoc)
    version$.next(versionDoc)

    // Force re-emissions via combineLatest by toggling the lock. Snapshot refs
    // upstream are unchanged, so each emission's draft/published/version should
    // carry the exact same object identity.
    transactionsPendingEvents$.next({type: 'pending', phase: 'begin'})
    transactionsPendingEvents$.next({type: 'pending', phase: 'end'})
    transactionsPendingEvents$.next({type: 'pending', phase: 'begin'})

    sub.unsubscribe()

    // Drop the `startWith(...)` placeholder; everything after must satisfy the
    // identity contract.
    const realEmissions = emissions.slice(1)
    expect(realEmissions.length).toBeGreaterThanOrEqual(2)

    for (const emission of realEmissions) {
      expect(emission.draft).toBe(draftDoc)
      expect(emission.published).toBe(publishedDoc)
      expect(emission.version).toBe(versionDoc)
    }
  })

  it('emits a new draft reference when the upstream draft snapshot changes', () => {
    const draft$ = new Subject<SanityDocument | null>()
    const published$ = new Subject<SanityDocument | null>()
    const transactionsPendingEvents$ = new Subject<PendingMutationsEvent>()

    mockedSnapshotPair.mockReturnValue(
      of({
        draft: {snapshots$: draft$.asObservable()},
        published: {snapshots$: published$.asObservable()},
        transactionsPendingEvents$,
      }) as any,
    )

    const publishedId = `book-${Math.random().toString(36).slice(2)}`
    const idPair = {publishedId, draftId: `drafts.${publishedId}`}

    const emissions: EditStateFor[] = []
    const sub = editState(createCtx(), idPair, 'book').subscribe((value) => {
      emissions.push(value)
    })

    const draftA: SanityDocument = {
      _id: idPair.draftId,
      _type: 'book',
      _rev: 'r1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
    }
    const draftB: SanityDocument = {...draftA, _rev: 'r2', title: 'changed'} as SanityDocument

    draft$.next(draftA)
    published$.next(null)
    draft$.next(draftB)

    sub.unsubscribe()

    const realEmissions = emissions.slice(1)
    // First real emission is after all combineLatest inputs are ready; second is
    // after the second draft$ emission.
    expect(realEmissions).toHaveLength(2)
    expect(realEmissions[0].draft).toBe(draftA)
    expect(realEmissions[1].draft).toBe(draftB)
  })
})
