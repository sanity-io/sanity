import {ResourceProvider} from '@sanity/sdk-react'
import {type ApplicationActivity} from '@sanity/sdk/dashboard'
import {act, renderHook, waitFor} from '@testing-library/react'
import {type ComponentType, type ReactNode} from 'react'
import {Subject} from 'rxjs'
import {type OperationError, type OperationSuccess} from 'sanity'
import {beforeAll, beforeEach, expect, it, vi} from 'vitest'

import {stubMessageBusHost} from '../../../../../test/testUtils/stubMessageBusHost'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useDocumentHistory} from '../useDocumentHistory'

let operationEvents: Subject<OperationSuccess | OperationError>
const followedDocuments: string[][] = []

// Stands in for the document store, which stays the same object across renders like the real one.
const documentStore = {
  pair: {
    operationEvents: (id: string, type: string) => {
      followedDocuments.push([id, type])
      return operationEvents
    },
  },
}

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentStore: () => documentStore,
}))

const ID_PAIR = {draftId: 'drafts.book-1', publishedId: 'book-1'}

function operation(op: OperationSuccess['op']): OperationSuccess {
  return {type: 'success', op, id: 'book-1', idPair: ID_PAIR}
}

function failedOperation(op: OperationError['op']): OperationError {
  return {type: 'error', op, id: 'book-1', idPair: ID_PAIR, error: new Error('failed')}
}

// The resource is the mock workspace's project, dataset and name; the SDK sends a studio as a dataset.
function activityFor(eventType: string, id: string) {
  return {
    kind: 'document',
    eventType,
    document: {
      id,
      type: 'book',
      resource: {id: 'mock-project-id.mock-data-set', type: 'dataset', schemaName: 'default'},
    },
  }
}

let TestProvider: ComponentType<{children?: ReactNode}>

beforeAll(async () => {
  TestProvider = await createTestProvider()
})

beforeEach(() => {
  operationEvents = new Subject()
  followedDocuments.length = 0
})

function StudioWrapper({children}: {children: ReactNode}) {
  return (
    <TestProvider>
      <ResourceProvider projectId="test" dataset="test" fallback={null}>
        {children}
      </ResourceProvider>
    </TestProvider>
  )
}

// Resolves once the SDK instance lets the hook render.
async function renderHistory(displayedId: string | undefined) {
  const view = renderHook(
    (id: string | undefined) => {
      useDocumentHistory({documentId: 'book-1', documentType: 'book', displayedId: id})
      return true
    },
    {wrapper: StudioWrapper, initialProps: displayedId},
  )
  await waitFor(() => expect(view.result.current).toBe(true))
  return view
}

function stubHistoryHost() {
  const host = stubMessageBusHost()
  host.publish('applications.capabilities', {history: true})
  return {host, activity: host.capture('applications.activity')}
}

it('records one view once the document exists, even when the document on screen changes', async () => {
  const {activity} = stubHistoryHost()
  const {rerender} = await renderHistory(undefined)
  expect(activity).toEqual([])

  rerender('drafts.book-1')
  rerender('versions.summer.book-1')

  await waitFor(() => expect(activity).toEqual([activityFor('viewed', 'drafts.book-1')]))
})

it('records the first successful edit and every successful delete under the published id', async () => {
  const {activity} = stubHistoryHost()
  await renderHistory('drafts.book-1')

  for (const event of [
    failedOperation('patch'),
    failedOperation('delete'),
    operation('patch'),
    operation('patch'),
    operation('delete'),
    operation('del'),
  ]) {
    act(() => operationEvents.next(event))
  }

  await waitFor(() =>
    expect(activity).toEqual([
      activityFor('viewed', 'drafts.book-1'),
      activityFor('edited', 'book-1'),
      activityFor('deleted', 'book-1'),
      activityFor('deleted', 'book-1'),
    ]),
  )
  expect(followedDocuments).toEqual([['book-1', 'book']])
})

it('records the first edit only once while the document on screen changes', async () => {
  const {activity} = stubHistoryHost()
  const {rerender} = await renderHistory(undefined)

  act(() => operationEvents.next(operation('patch')))
  rerender('drafts.book-1')
  act(() => operationEvents.next(operation('patch')))

  await waitFor(() =>
    expect(activity).toEqual([
      activityFor('edited', 'book-1'),
      activityFor('viewed', 'drafts.book-1'),
    ]),
  )
})

it('records an operation that completes before the host has published its capabilities', async () => {
  const host = stubMessageBusHost()
  const activity: ApplicationActivity[] = host.capture('applications.activity')
  await renderHistory(undefined)

  act(() => operationEvents.next(operation('patch')))
  host.publish('applications.capabilities', {history: true})

  await waitFor(() => expect(activity).toEqual([activityFor('edited', 'book-1')]))
})

it('does not follow operations without a host', async () => {
  await renderHistory('drafts.book-1')

  expect(operationEvents.observed).toBe(false)
})
