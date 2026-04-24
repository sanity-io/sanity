import {type SanityClient} from '@sanity/client'
import {of} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createSchema} from '../../../schema'
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
  const dataRequest = vi.fn(() => Promise.resolve({transactionId: `tx-${dataset}`}))

  const client = {
    config: () => ({
      apiHost: 'mock.api.sanity.io',
      projectId: 'mock-project-id',
      dataset,
    }),
    observable: {
      action: vi.fn(() => of({transactionId: `action-${dataset}`})),
      getDocuments: vi.fn(() => of([null, null])),
      listen: vi.fn(() => of({type: 'welcome'})),
    },
    dataRequest,
    withConfig: vi.fn(),
  }

  client.withConfig.mockReturnValue(client)

  return {client: client as unknown as SanityClient, dataRequest}
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
        serverActionsEnabled: of(false),
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
        serverActionsEnabled: of(false),
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

    expect(clientA.dataRequest).toHaveBeenCalledTimes(1)
    expect(clientB.dataRequest).not.toHaveBeenCalled()

    subscriptionA.unsubscribe()
    subscriptionB.unsubscribe()
  })
})
