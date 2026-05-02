import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of, Subject} from 'rxjs'
import {skip, take, toArray} from 'rxjs/operators'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {documentEditState} from './documentEditState'
import {documentSnapshot} from './documentSnapshot'

vi.mock('./documentSnapshot', () => ({documentSnapshot: vi.fn()}))

const mockDocumentSnapshot = documentSnapshot as Mock<typeof documentSnapshot>

function getContext() {
  return {
    client: createMockSanityClient() as unknown as SanityClient,
  }
}

function mockSnapshot() {
  const snapshots$ = new Subject<any>()
  const transactionsPendingEvents$ = new Subject<any>()

  mockDocumentSnapshot.mockReturnValue(
    of({
      document: {snapshots$},
      transactionsPendingEvents$,
    } as any),
  )

  return {snapshots$, transactionsPendingEvents$}
}

describe('documentEditState', () => {
  beforeEach(() => {
    mockDocumentSnapshot.mockReset()
  })

  it('starts as not ready and emits the resolved document snapshot', async () => {
    const {snapshots$, transactionsPendingEvents$} = mockSnapshot()
    const states = firstValueFrom(
      documentEditState('drafts.example-id', getContext() as any).pipe(take(2), toArray()),
    )

    snapshots$.next({_id: 'drafts.example-id', _type: 'movie', _rev: 'rev1'})
    transactionsPendingEvents$.next({type: 'pending', phase: 'begin'})

    await expect(states).resolves.toMatchObject([
      {
        id: 'drafts.example-id',
        snapshot: null,
        draft: null,
        published: null,
        version: null,
        ready: false,
        transactionSyncLock: null,
      },
      {
        id: 'drafts.example-id',
        snapshot: {_id: 'drafts.example-id', _type: 'movie', _rev: 'rev1'},
        draft: null,
        published: null,
        version: null,
        ready: true,
        transactionSyncLock: {enabled: false},
      },
    ])
  })

  it('exposes the release id for version documents', async () => {
    const {snapshots$} = mockSnapshot()
    const state = firstValueFrom(
      documentEditState('versions.release-id.example-id', getContext() as any).pipe(
        skip(1),
        take(1),
      ),
    )

    snapshots$.next({_id: 'versions.release-id.example-id', _type: 'movie'})

    await expect(state).resolves.toMatchObject({
      release: 'release-id',
      snapshot: {_id: 'versions.release-id.example-id', _type: 'movie'},
    })
  })

  it('leaves release undefined for non-version documents', async () => {
    const {snapshots$} = mockSnapshot()
    const state = firstValueFrom(
      documentEditState('example-id', getContext() as any).pipe(skip(1), take(1)),
    )

    snapshots$.next({_id: 'example-id', _type: 'movie'})

    await expect(state).resolves.toMatchObject({
      release: undefined,
    })
  })

  it('locks while transactions are pending', async () => {
    const {snapshots$, transactionsPendingEvents$} = mockSnapshot()
    const states = firstValueFrom(
      documentEditState('drafts.locked-id', getContext() as any).pipe(skip(1), take(2), toArray()),
    )

    snapshots$.next({_id: 'drafts.locked-id', _type: 'movie'})
    transactionsPendingEvents$.next({type: 'pending', phase: 'begin'})

    await expect(states).resolves.toMatchObject([
      {transactionSyncLock: {enabled: false}},
      {transactionSyncLock: {enabled: true}},
    ])
  })
})
