import {type SanityClient} from '@sanity/client'
import {of} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
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

function committedActions(actionRequest: ReturnType<typeof createDocumentClient>['actionRequest']) {
  return JSON.stringify(actionRequest.mock.calls)
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
      const {client, actionRequest} = createDocumentClient('autocommit-handover')
      const ctx = {client, historyStore: {} as any, schema}

      let operations: OperationsAPI | undefined
      const outgoing = editOperations(
        ctx,
        {publishedId: 'task-1', draftId: 'drafts.task-1'},
        'tasks.task',
      ).subscribe((value) => {
        operations = value
      })
      await vi.advanceTimersByTimeAsync(0)

      // The first edit is committed right away and opens the autocommit throttle window
      operations?.patch.execute([{set: {title: 'first edit'}}], {
        _id: 'task-1',
        _type: 'tasks.task',
      })
      await vi.advanceTimersByTimeAsync(0)
      expect(committedActions(actionRequest)).toContain('first edit')

      // Navigating to another document: the outgoing form flushes its last edit while unmounting,
      // the incoming document subscribes when it commits, and the outgoing subscription is
      // released after that (react-rx tears it down on the next tick).
      operations?.patch.execute([{set: {description: 'last edit'}}])
      const incoming = editOperations(
        ctx,
        {publishedId: 'task-2', draftId: 'drafts.task-2'},
        'tasks.task',
      ).subscribe()
      outgoing.unsubscribe()

      await vi.advanceTimersByTimeAsync(1_000)
      expect(committedActions(actionRequest)).toContain('last edit')

      incoming.unsubscribe()
    })
  })
})
