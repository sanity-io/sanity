import {type SanityClient} from '@sanity/client'
import {of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  createMockSanityClientAsClient,
  getDocumentEditActions,
} from '../../../../../test/mocks/mockSanityClient'
import {createSchema} from '../../../schema/createSchema'
import {type HistoryStore} from '../../history/createHistoryStore'
import {editOperations} from './editOperations'
import {type OperationsAPI} from './operations/types'

const schema = createSchema({
  name: 'default',
  types: [
    {
      name: 'tasks.task',
      title: 'Task',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
  ],
})

function createDocumentClient(dataset: string) {
  const actionRequest = vi.fn(() => of({transactionId: `action-${dataset}`}))

  const client = {
    config: () => ({
      apiHost: 'mock.api.sanity.io',
      projectId: 'mock-project-id',
      dataset,
    }),
    observable: {
      action: actionRequest,
      getDocuments: vi.fn(() => of([null, null])),
      listen: vi.fn(() => of({type: 'welcome'})),
    },
    dataRequest: vi.fn(() => Promise.resolve({transactionId: `tx-${dataset}`})),
    withConfig: vi.fn(),
  }

  client.withConfig.mockReturnValue(client)

  return {client: client as unknown as SanityClient, actionRequest}
}

/** Subscribes to a document's operations the way a document pane does while it is open */
function openDocument(client: SanityClient, id: string, historyStore: Partial<HistoryStore> = {}) {
  let operations: OperationsAPI | undefined
  const subscription = editOperations(
    {client, historyStore: historyStore as HistoryStore, schema},
    {publishedId: id, draftId: `drafts.${id}`},
    'tasks.task',
  ).subscribe((value) => {
    operations = value
  })

  return {
    patch: (patches: unknown[]) =>
      operations?.patch.execute(patches, {_id: id, _type: 'tasks.task'}),
    restore: (revision: string) => operations?.restore.execute(revision),
    close: () => subscription.unsubscribe(),
  }
}

describe('operationEvents', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('only executes operations for the originating document store', async () => {
    const clientA = createDocumentClient('dataset-a')
    const clientB = createDocumentClient('dataset-b')
    const idPair = {publishedId: 'task-1', draftId: 'drafts.task-1'}

    let operationsA: OperationsAPI | undefined
    let operationsB: OperationsAPI | undefined

    const subscriptionA = editOperations(
      {
        client: clientA.client,
        historyStore: {} as any,
        schema,
      },
      idPair,
      'tasks.task',
    ).subscribe((value) => {
      operationsA = value
    })

    const subscriptionB = editOperations(
      {
        client: clientB.client,
        historyStore: {} as any,
        schema,
      },
      idPair,
      'tasks.task',
    ).subscribe((value) => {
      operationsB = value
    })

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(operationsA?.patch.disabled).toBe(false)
    expect(operationsB?.patch.disabled).toBe(false)

    operationsA?.patch.execute([{set: {title: 'hello'}}], {_id: 'task-1', _type: 'tasks.task'})
    operationsA?.commit.execute()

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Called with sanity.action.document.create and then with sanity.action.document.edit
    expect(clientA.actionRequest).toHaveBeenCalledTimes(2)
    expect(clientB.actionRequest).not.toHaveBeenCalled()

    subscriptionA.unsubscribe()
    subscriptionB.unsubscribe()
  })

  describe('autocommit', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('commits the last patch of a document that is handed over to another document within the autocommit interval', async () => {
      const client = createMockSanityClientAsClient({}, {dataset: 'autocommit-handover'})
      const outgoing = openDocument(client, 'task-1')
      await vi.advanceTimersByTimeAsync(0)

      // The first edit is committed right away and opens the autocommit throttle window
      outgoing.patch([{set: {title: 'first edit'}}])
      await vi.advanceTimersByTimeAsync(0)
      expect(getDocumentEditActions(client)).toContainEqual({
        draftId: 'drafts.task-1',
        patch: {set: {title: 'first edit'}},
      })

      // Navigating to another document: the outgoing form flushes its last edit while unmounting,
      // the incoming document subscribes when it commits, and the outgoing subscription is
      // released after that (react-rx tears it down on the next tick).
      outgoing.patch([{set: {description: 'last edit'}}])
      const incoming = openDocument(client, 'task-2')
      outgoing.close()

      await vi.advanceTimersByTimeAsync(1_000)
      expect(getDocumentEditActions(client)).toContainEqual({
        draftId: 'drafts.task-1',
        patch: {set: {description: 'last edit'}},
      })

      incoming.close()
    })

    it('commits the last patch of a document that is closed within the autocommit interval', async () => {
      const client = createMockSanityClientAsClient({}, {dataset: 'autocommit-close'})
      const document = openDocument(client, 'task-1')
      await vi.advanceTimersByTimeAsync(0)

      document.patch([{set: {title: 'first edit'}}])
      await vi.advanceTimersByTimeAsync(0)
      expect(getDocumentEditActions(client)).toContainEqual({
        draftId: 'drafts.task-1',
        patch: {set: {title: 'first edit'}},
      })

      document.patch([{set: {description: 'last edit'}}])
      document.close()

      await vi.advanceTimersByTimeAsync(1_000)
      expect(getDocumentEditActions(client)).toContainEqual({
        draftId: 'drafts.task-1',
        patch: {set: {description: 'last edit'}},
      })
    })

    it('commits the pending patch of a document when another document is patched within the autocommit interval', async () => {
      const client = createMockSanityClientAsClient({}, {dataset: 'autocommit-per-document'})
      const first = openDocument(client, 'task-1')
      const second = openDocument(client, 'task-2')
      await vi.advanceTimersByTimeAsync(0)

      first.patch([{set: {title: 'first edit'}}])
      await vi.advanceTimersByTimeAsync(0)
      expect(getDocumentEditActions(client)).toContainEqual({
        draftId: 'drafts.task-1',
        patch: {set: {title: 'first edit'}},
      })

      first.patch([{set: {description: 'last edit in task-1'}}])
      second.patch([{set: {title: 'edit in task-2'}}])

      await vi.advanceTimersByTimeAsync(1_000)
      expect(getDocumentEditActions(client)).toContainEqual({
        draftId: 'drafts.task-1',
        patch: {set: {description: 'last edit in task-1'}},
      })
      expect(getDocumentEditActions(client)).toContainEqual({
        draftId: 'drafts.task-2',
        patch: {set: {title: 'edit in task-2'}},
      })

      first.close()
      second.close()
    })
  })

  describe('operations in flight', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('cancels an operation in flight when another operation on the same document starts', async () => {
      const client = createMockSanityClientAsClient({}, {dataset: 'operations-in-flight'})
      const pendingRestore = new Subject<void>()
      const historyStore = {restore: vi.fn(() => pendingRestore)}
      const document = openDocument(client, 'task-1', historyStore)
      const otherDocument = openDocument(client, 'task-2', historyStore)
      await vi.advanceTimersByTimeAsync(0)

      document.restore('revision-1')
      await vi.advanceTimersByTimeAsync(10_000)
      expect(pendingRestore.observed).toBe(true)

      otherDocument.patch([{set: {title: 'edit in task-2'}}])
      expect(pendingRestore.observed).toBe(true)

      document.patch([{set: {title: 'edit in task-1'}}])
      expect(pendingRestore.observed).toBe(false)

      document.close()
      otherDocument.close()
    })
  })
})
