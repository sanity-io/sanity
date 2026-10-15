import {ResourceProvider} from '@sanity/sdk-react'
import {act, renderHook, waitFor} from '@testing-library/react'
import {type ComponentType, type ReactNode, StrictMode, useContext} from 'react'
import {DocumentHistoryContext} from 'sanity/_singletons'
import {beforeAll, expect, it, onTestFinished, vi} from 'vitest'

import {stubMessageBusHost} from '../../../../test/testUtils/stubMessageBusHost'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {useDocumentViewHistory} from '../../form/useDocumentViewHistory'
import {type DocumentHistoryHandle} from '../../hooks/useDocumentHistoryRecorder'
import {useDocumentOperationWithHistory} from '../../hooks/useDocumentOperationWithHistory'
import {type EditStateFor} from '../../store/document/document-pair/editState'
import {GUARDED} from '../../store/document/document-pair/operations/helpers'
import {type OperationsAPI} from '../../store/document/document-pair/operations/types'
import {DocumentHistoryProvider} from '../DocumentHistoryProvider'

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

const LOADING: EditStateFor = {
  id: 'book-1',
  type: 'book',
  transactionSyncLock: null,
  draft: null,
  published: null,
  version: null,
  liveEdit: false,
  liveEditSchemaType: false,
  ready: false,
  release: undefined,
  scopeId: undefined,
}

const DRAFT_DOCUMENT = {
  _id: 'drafts.book-1',
  _type: 'book',
  _createdAt: '',
  _updatedAt: '',
  _rev: '1',
}

const DRAFT: EditStateFor = {...LOADING, ready: true, draft: DRAFT_DOCUMENT}

let TestProvider: ComponentType<{children?: ReactNode}>

beforeAll(async () => {
  TestProvider = await createTestProvider()
})

// StrictMode runs mount effects twice, which must not record or send an event twice.
function Wrapper({children}: {children: ReactNode}) {
  return (
    <StrictMode>
      <TestProvider>
        <ResourceProvider projectId="test" dataset="test" fallback={null}>
          <DocumentHistoryProvider>{children}</DocumentHistoryProvider>
        </ResourceProvider>
      </TestProvider>
    </StrictMode>
  )
}

function operations() {
  const executed: string[] = []
  const operation = (name: string): {disabled: false; execute: () => void} => ({
    disabled: false,
    execute: () => {
      executed.push(name)
    },
  })
  const api: OperationsAPI = {
    ...GUARDED,
    patch: operation('patch'),
    delete: operation('delete'),
    del: operation('del'),
  }
  return {api, executed}
}

async function renderOperations(api: OperationsAPI) {
  const view = renderHook(
    () => useDocumentOperationWithHistory({api, publishedDocId: 'book-1', docTypeName: 'book'}),
    {wrapper: Wrapper},
  )
  await waitFor(() => expect(view.result.current).toBeDefined())
  return view
}

function stubHistoryHost() {
  const host = stubMessageBusHost()
  host.publish('applications.capabilities', {history: true})
  return {host, activity: host.capture('applications.activity')}
}

it('records only the first edit, even when edits run in the same render', async () => {
  const {activity} = stubHistoryHost()
  const {api, executed} = operations()
  const {result} = await renderOperations(api)

  act(() => {
    result.current.patch.execute([])
    result.current.patch.execute([])
  })
  act(() => result.current.patch.execute([]))

  await waitFor(() => expect(activity).toEqual([activityFor('edited', 'book-1')]))
  expect(executed).toEqual(['patch', 'patch', 'patch'])
})

it('records every delete', async () => {
  const {activity} = stubHistoryHost()
  const {result} = await renderOperations(operations().api)

  act(() => {
    result.current.delete.execute()
    result.current.del.execute()
  })

  await waitFor(() =>
    expect(activity).toEqual([activityFor('deleted', 'book-1'), activityFor('deleted', 'book-1')]),
  )
})

it('sends an event recorded before the host has answered once it does', async () => {
  const host = stubMessageBusHost()
  const activity = host.capture('applications.activity')
  const {result} = await renderOperations(operations().api)

  act(() => result.current.patch.execute([]))
  act(() => host.publish('applications.capabilities', {history: true}))

  await waitFor(() => expect(activity).toEqual([activityFor('edited', 'book-1')]))
})

it('drops an event the SDK fails to send and keeps recording', async () => {
  const {activity} = stubHistoryHost()
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  onTestFinished(() => error.mockRestore())
  const {result} = renderHook(() => useContext(DocumentHistoryContext), {wrapper: Wrapper})
  const withoutResource: DocumentHistoryHandle = {
    documentId: 'book-1',
    documentType: 'book',
    resourceType: 'studio',
    resourceId: '',
  }
  const withResource: DocumentHistoryHandle = {
    ...withoutResource,
    resourceId: 'mock-project-id.mock-data-set',
    schemaName: 'default',
  }

  // The SDK throws for a studio resource without an id.
  act(() => result.current?.(withoutResource, 'viewed'))
  act(() => result.current?.(withResource, 'viewed'))

  await waitFor(() => expect(activity).toEqual([activityFor('viewed', 'book-1')]))
})

it('leaves the operations untouched without a host', async () => {
  const {api} = operations()

  const {result} = await renderOperations(api)

  expect(result.current).toBe(api)
})

it('records one view once the document exists, under the document on screen', async () => {
  const {activity} = stubHistoryHost()
  const {rerender} = renderHook((editState: EditStateFor) => useDocumentViewHistory({editState}), {
    wrapper: Wrapper,
    initialProps: LOADING,
  })

  rerender(DRAFT)
  await waitFor(() => expect(activity).toEqual([activityFor('viewed', 'drafts.book-1')]))

  rerender({...DRAFT, draft: {...DRAFT_DOCUMENT, _rev: '2'}})

  expect(activity).toEqual([activityFor('viewed', 'drafts.book-1')])
})
