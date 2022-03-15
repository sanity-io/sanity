import {SanityClient} from '@sanity/client'
import {act, renderHook} from '@testing-library/react-hooks'
import React, {createContext, useContext} from 'react'
import {asyncScheduler, defer, of} from 'rxjs'
import {observeOn} from 'rxjs/operators'
import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createConfig} from '../../../../config'
import {SanityProvider} from '../../../../sanity'
import {useDocumentType} from '../useDocumentType'
import {useClient} from '../../../../client/useClient'

const useClientMock = useClient as jest.Mock

const TestContext = createContext<{client: SanityClient} | null>(null)

// Wrap all module functions with jest.fn
jest.mock('../../../../client/useClient')

function createWrapperComponent(client: SanityClient) {
  const config = createConfig({
    sources: [
      {
        name: 'test',
        title: 'Test',
        projectId: 'foo',
        dataset: 'test',
        schemaTypes: [],
      },
    ],
  })

  function WrapperComponent({children}: any) {
    return (
      <TestContext.Provider value={{client}}>
        <SanityProvider config={config}>{children}</SanityProvider>
      </TestContext.Provider>
    )
  }

  return WrapperComponent
}

beforeEach(() => {
  useClientMock.mockImplementation(() => {
    const ctx = useContext(TestContext)

    if (!ctx) {
      throw new Error('Test: missing context value')
    }

    return ctx.client
  })
})

test('should return passed document type if already resolved', () => {
  const client = createMockSanityClient()
  const wrapper = createWrapperComponent(client as any)

  const {result, rerender} = renderHook(() => useDocumentType('grrm', 'author'), {wrapper})

  expect(result.current).toEqual({isLoaded: true, documentType: 'author'})

  act(() => {
    rerender()
  })

  // Should be referentially the same
  const first = result.all[0]
  for (const value of result.all) {
    expect(value).toBe(first)
  }
})

test('should resolve document type from API on undefined type (with loading state)', async () => {
  const client = createMockSanityClient()
  const response = defer(() => of(['book']).pipe(observeOn(asyncScheduler)))

  client.observable.fetch = () => response

  const {result, waitForNextUpdate} = renderHook(() => useDocumentType('asoiaf-got', undefined), {
    wrapper: createWrapperComponent(client as any),
  })

  expect(result.current).toEqual({isLoaded: false, documentType: undefined})

  await waitForNextUpdate()

  expect(result.current).toEqual({isLoaded: true, documentType: 'book'})
})

test('should return correct document type on argument transition', () => {
  const client = createMockSanityClient()

  let documentType = 'book'

  const {result, rerender} = renderHook(() => useDocumentType('abc123', documentType), {
    wrapper: createWrapperComponent(client as any),
  })

  expect(result.current).toEqual({isLoaded: true, documentType: 'book'})

  documentType = 'author'
  rerender()

  // expect(client.observable.fetch).not.toHaveBeenCalled()
  expect(client.$log.calls.filter((args) => args[0] === 'observable.fetch')).toHaveLength(0)

  expect(result.current).toEqual({isLoaded: true, documentType: 'author'})
})

test('should return correct document type on document ID transition', async () => {
  const client = createMockSanityClient()

  const responseGrrm = defer(() => of(['author']).pipe(observeOn(asyncScheduler)))
  const responseGot = defer(() => of(['book']).pipe(observeOn(asyncScheduler)))

  client.observable.fetch = (_query, params) =>
    params.documentId === 'grrm' ? responseGrrm : responseGot

  let documentId = 'grrm'
  const {result, rerender, waitForNextUpdate} = renderHook(
    () => useDocumentType(documentId, undefined),
    {wrapper: createWrapperComponent(client as any)}
  )

  // First lookup (author)
  expect(result.current).toEqual({isLoaded: false, documentType: undefined})
  await waitForNextUpdate()
  expect(result.current).toEqual({isLoaded: true, documentType: 'author'})

  // Change to look up a book instead
  documentId = 'agot'
  rerender()

  // Second lookup (book)
  expect(result.current).toEqual({isLoaded: false, documentType: undefined})
  await waitForNextUpdate()
  expect(result.current).toEqual({isLoaded: true, documentType: 'book'})
})

test.todo('Transition from an undefined specified type to a specified type')
test.todo('Transition from a specified type to an undefined specified type')
