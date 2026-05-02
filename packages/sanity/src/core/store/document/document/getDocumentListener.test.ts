import {firstValueFrom, of, throwError} from 'rxjs'
import {take, toArray} from 'rxjs/operators'
import {describe, expect, it, vi} from 'vitest'

import {OutOfSyncError} from '../utils/sequentializeListenerEvents'
import {getDocumentListener} from './getDocumentListener'

function createClient(events = of({type: 'welcome' as const})) {
  return {
    observable: {
      listen: vi.fn(() => events),
      getDocument: vi.fn(() => of({_id: 'example-id', _type: 'movie', _rev: 'rev1'})),
    },
  }
}

function mutation(previousRev: string, resultRev: string, total = 1) {
  return {
    type: 'mutation' as const,
    documentId: 'example-id',
    transactionId: `tx-${resultRev}`,
    mutations: [],
    effects: {apply: [], revert: []},
    previousRev,
    resultRev,
    transactionTotalEvents: total,
    transactionCurrentEvent: 1,
    visibility: 'transaction' as const,
    transition: 'update' as const,
  }
}

describe('getDocumentListener', () => {
  it('fetches the resolved document snapshot on welcome', async () => {
    const client = createClient()

    await expect(
      firstValueFrom(getDocumentListener(client as any, 'example-id', {tag: 'test'})),
    ).resolves.toEqual({
      type: 'snapshot',
      documentId: 'example-id',
      document: {_id: 'example-id', _type: 'movie', _rev: 'rev1'},
    })
    expect(client.observable.listen).toHaveBeenCalledWith(
      '*[_id == $id]',
      {id: 'example-id'},
      expect.objectContaining({tag: 'test', includeAllVersions: true}),
    )
    expect(client.observable.getDocument).toHaveBeenCalledWith('example-id', {
      tag: 'document.listener.fetch',
    })
  })

  it('passes non-reset listener events through after the initial snapshot', async () => {
    const events = of({type: 'welcome' as const}, mutation('rev1', 'rev2'))
    const client = createClient(events)

    await expect(
      firstValueFrom(getDocumentListener(client as any, 'example-id', {}).pipe(take(2), toArray())),
    ).resolves.toMatchObject([
      {type: 'snapshot', documentId: 'example-id'},
      {type: 'mutation', documentId: 'example-id', messageReceivedAt: expect.any(String)},
    ])
  })

  it('emits pending start while waiting for multi-event transactions', async () => {
    const first = mutation('rev1', 'rev2', 2)
    const second = {
      ...mutation('rev2', 'rev3', 2),
      transactionId: first.transactionId,
      transactionCurrentEvent: 2,
    }
    const client = createClient(of({type: 'welcome' as const}, first, second))

    await expect(
      firstValueFrom(getDocumentListener(client as any, 'example-id', {}).pipe(take(2), toArray())),
    ).resolves.toMatchObject([{type: 'snapshot'}, {type: 'pending', phase: 'begin'}])
  })

  it('buffers simple mutations while a multi-event transaction is unresolved', async () => {
    const multi = mutation('rev1', 'rev2', 2)
    const simple = mutation('rev2', 'rev3')
    const client = createClient(of({type: 'welcome' as const}, multi, simple))

    await expect(
      firstValueFrom(getDocumentListener(client as any, 'example-id', {}).pipe(toArray())),
    ).resolves.toMatchObject([{type: 'snapshot'}, {type: 'pending', phase: 'begin'}])
  })

  it('emits buffered mutations once all multi-event transaction entries are received', async () => {
    const first = mutation('rev1', 'rev2', 2)
    const second = {
      ...mutation('rev2', 'rev3', 2),
      documentId: 'other-id',
      transactionId: first.transactionId,
    }
    const client = createClient(of({type: 'welcome' as const}, first, second))

    await expect(
      firstValueFrom(getDocumentListener(client as any, 'example-id', {}).pipe(toArray())),
    ).resolves.toMatchObject([
      {type: 'snapshot'},
      {type: 'pending', phase: 'begin'},
      {type: 'mutation', documentId: 'example-id'},
      {type: 'mutation', documentId: 'other-id'},
      {type: 'pending', phase: 'end'},
    ])
  })

  it('reports and retries out-of-sync errors', async () => {
    const onSyncErrorRecovery = vi.fn()
    const outOfSync = new OutOfSyncError('out of sync', {
      base: {revision: 'rev1'},
      buffer: [],
      emitEvents: [],
    })
    const client = createClient(throwError(() => outOfSync))

    const subscription = getDocumentListener(client as any, 'example-id', {
      onSyncErrorRecovery,
    }).subscribe({error: () => undefined})

    await Promise.resolve()
    subscription.unsubscribe()

    expect(onSyncErrorRecovery).toHaveBeenCalledWith(outOfSync)
  })

  it('logs out-of-sync errors when no recovery callback is configured', async () => {
    const outOfSync = new OutOfSyncError('out of sync', {
      base: {revision: 'rev1'},
      buffer: [],
      emitEvents: [],
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const client = createClient(throwError(() => outOfSync))

    const subscription = getDocumentListener(client as any, 'example-id', {}).subscribe({
      error: () => undefined,
    })

    await Promise.resolve()
    subscription.unsubscribe()

    expect(consoleError).toHaveBeenCalledWith(outOfSync)
    consoleError.mockRestore()
  })

  it('rethrows non-recoverable listener errors', async () => {
    const error = new Error('boom')
    const client = createClient(throwError(() => error))

    await expect(firstValueFrom(getDocumentListener(client as any, 'example-id', {}))).rejects.toBe(
      error,
    )
  })
})
