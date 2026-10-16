import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {NEVER, Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createSchema} from '../../../schema/createSchema'
import {type IdPair} from '../types'
import {editOperations} from './editOperations'
import {operationArgs} from './operationArgs'
import {operationEvents} from './operationEvents'
import {GUARDED} from './operations/helpers'
import {type OperationArgs, type OperationsAPI} from './operations/types'

vi.mock('./operationArgs', () => ({operationArgs: vi.fn()}))
vi.mock('./operationEvents', () => ({operationEvents: vi.fn(() => NEVER)}))

const mockedOperationArgs = vi.mocked(operationArgs)

const schema = createSchema({
  name: 'default',
  types: [{name: 'book', type: 'document', fields: [{name: 'title', type: 'string'}]}],
})

function createCtx() {
  return {
    client: createMockSanityClient() as unknown as SanityClient,
    historyStore: {} as OperationArgs['historyStore'],
    schema,
  }
}

function doc(id: string, rev: string): SanityDocument {
  return {
    _id: id,
    _type: 'book',
    _rev: rev,
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
  }
}

function createArgs(
  ctx: ReturnType<typeof createCtx>,
  idPair: IdPair,
  snapshots: OperationArgs['snapshots'],
): OperationArgs {
  return {
    ...ctx,
    typeName: 'book',
    idPair,
    snapshots,
    draft: {} as OperationArgs['draft'],
    published: {} as OperationArgs['published'],
    // oxlint-disable-next-line no-deprecated -- still a required field of OperationArgs
    serverActionsEnabled: true,
  }
}

describe('editOperations', () => {
  beforeEach(() => {
    mockedOperationArgs.mockReset()
    vi.mocked(operationEvents).mockReturnValue(NEVER)
  })

  it('emits the guard first and then one api per change in disabled state', () => {
    const ctx = createCtx()
    const publishedId = `book-${Math.random().toString(36).slice(2)}`
    const idPair: IdPair = {publishedId, draftId: `drafts.${publishedId}`}
    const args$ = new Subject<OperationArgs>()
    mockedOperationArgs.mockReturnValue(args$.asObservable())

    const emissions: OperationsAPI[] = []
    const subscription = editOperations(ctx, idPair, 'book').subscribe((api) => emissions.push(api))

    expect(emissions).toEqual([GUARDED])

    args$.next(createArgs(ctx, idPair, {draft: doc(idPair.draftId, 'r1'), published: null}))
    args$.next(createArgs(ctx, idPair, {draft: doc(idPair.draftId, 'r2'), published: null}))
    args$.next(createArgs(ctx, idPair, {draft: doc(idPair.draftId, 'r3'), published: null}))

    expect(emissions).toHaveLength(2)
    expect(emissions[1].publish.disabled).toBe(false)

    args$.next(createArgs(ctx, idPair, {draft: null, published: doc(publishedId, 'r4')}))

    expect(emissions).toHaveLength(3)
    expect(emissions[2].publish.disabled).toBe('ALREADY_PUBLISHED')

    subscription.unsubscribe()
  })
})
