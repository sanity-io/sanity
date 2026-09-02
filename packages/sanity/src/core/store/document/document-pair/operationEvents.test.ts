import {type SanityClient} from '@sanity/client'
import {NEVER, of, throwError} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

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

    void operationsA?.patch.execute([{set: {title: 'hello'}}], {_id: 'task-1', _type: 'tasks.task'})
    void operationsA?.commit.execute()

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Called with sanity.action.document.create and then with sanity.action.document.edit
    expect(clientA.actionRequest).toHaveBeenCalledTimes(2)
    expect(clientB.actionRequest).not.toHaveBeenCalled()

    subscriptionA.unsubscribe()
    subscriptionB.unsubscribe()
  })

  describe('execute() outcome promise', () => {
    // Each test uses its own dataset so it gets its own memoized operationEvents pipeline.
    async function setup(dataset: string, historyStore: Partial<HistoryStore>) {
      const {client} = createDocumentClient(dataset)
      const idPair = {publishedId: 'task-1', draftId: 'drafts.task-1'}

      let operations: OperationsAPI | undefined
      const subscription = editOperations(
        {client, historyStore: historyStore as HistoryStore, schema},
        idPair,
        'tasks.task',
      ).subscribe((value) => {
        operations = value
      })

      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(operations?.restore.disabled).toBe(false)

      return {operations: operations!, subscription}
    }

    it('resolves with a success outcome when this call completes', async () => {
      const {operations, subscription} = await setup('outcome-success', {
        restore: vi.fn(() => of(undefined)),
      })

      await expect(operations.restore.execute('rev-1')).resolves.toEqual({type: 'success'})

      subscription.unsubscribe()
    })

    it('resolves with an error outcome when this call fails', async () => {
      const {operations, subscription} = await setup('outcome-error', {
        restore: vi.fn(() => throwError(() => new Error('restore failed'))),
      })

      await expect(operations.restore.execute('rev-1')).resolves.toEqual({
        type: 'error',
        error: new Error('restore failed'),
      })

      subscription.unsubscribe()
    })

    it('resolves with a cancelled outcome when superseded by a newer operation', async () => {
      const {operations, subscription} = await setup('outcome-cancelled', {
        restore: vi.fn(() => NEVER),
      })

      const inFlight = operations.restore.execute('rev-1')
      // A newer operation on the same document drops the in-flight restore (switchMap).
      void operations.patch.execute([{set: {title: 'hello'}}], {_id: 'task-1', _type: 'tasks.task'})

      await expect(inFlight).resolves.toEqual({type: 'cancelled'})

      subscription.unsubscribe()
    })

    it('resolves with a cancelled outcome when the executor is torn down mid-flight', async () => {
      const {operations, subscription} = await setup('outcome-teardown', {
        restore: vi.fn(() => NEVER),
      })

      const inFlight = operations.restore.execute('rev-1')
      await new Promise((resolve) => setTimeout(resolve, 0))
      subscription.unsubscribe()

      await expect(inFlight).resolves.toEqual({type: 'cancelled'})
    })
  })
})
