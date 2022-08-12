import type {SanityClient} from '@sanity/client'
import {act, renderHook} from '@testing-library/react-hooks'
import {asyncScheduler, defer, of} from 'rxjs'
import {delay, observeOn, tap} from 'rxjs/operators'
import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createConfig} from '../../../../config'
import {useDocumentType} from '../useDocumentType'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'

function createWrapperComponent(client: SanityClient) {
  const config = createConfig({
    projectId: 'foo',
    dataset: 'test',
  })

  return createTestProvider({
    client,
    config,
  })
}

test('should return passed document type if already resolved', async () => {
  const client = createMockSanityClient()
  const wrapper = await createWrapperComponent(client as any)

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

  client.observable.fetch = jest.fn().mockReturnValueOnce(response)

  const {result, waitForNextUpdate} = renderHook(() => useDocumentType('asoiaf-got', undefined), {
    wrapper: await createWrapperComponent(client as any),
  })

  expect(result.current).toEqual({isLoaded: false, documentType: undefined})

  await waitForNextUpdate()

  expect(result.current).toEqual({isLoaded: true, documentType: 'book'})
  expect(client.observable.fetch).toHaveBeenCalledTimes(1)
})

test('should return correct document type on document type transition', async () => {
  const client = createMockSanityClient()
  client.observable.fetch = jest.fn()

  let documentType = 'book'

  const {result, rerender} = renderHook(() => useDocumentType('abc123', documentType), {
    wrapper: await createWrapperComponent(client as any),
  })

  // At this point, it is a book
  expect(result.current).toEqual({isLoaded: true, documentType: 'book'})
  expect(client.observable.fetch).not.toHaveBeenCalled()

  // Now switch the document type variable to an author and rerender
  documentType = 'author'
  rerender()

  // We should still not have triggered a request, since we explicitly passed it a type,
  // but the _value_ should be different now
  expect(client.observable.fetch).not.toHaveBeenCalled()
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
    {wrapper: await createWrapperComponent(client as any)}
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

test('should return correct document type when transitioning from undefined type to specified type', async () => {
  const client = createMockSanityClient()

  const responseGrrm = defer(() => of(['author']).pipe(observeOn(asyncScheduler)))

  client.observable.fetch = jest.fn().mockReturnValue(responseGrrm)

  // eslint-disable-next-line no-undef-init
  let documentType: string | undefined = undefined

  const {result, rerender, waitForNextUpdate} = renderHook(
    () => useDocumentType('grrm', documentType),
    {wrapper: await createWrapperComponent(client as any)}
  )

  // First lookup - undefined type specified, but is an author
  expect(result.current).toEqual({isLoaded: false, documentType: undefined})
  await waitForNextUpdate()
  expect(result.current).toEqual({isLoaded: true, documentType: 'author'})
  expect(client.observable.fetch).toHaveBeenCalled()

  // Now lets say we for some reason decide that document type is something else
  documentType = 'person'
  rerender()

  // We shouldn't need to look anything up, since the value is passed
  expect(result.current).toEqual({isLoaded: true, documentType: 'person'})

  // Should not have been called again on updated document type
  expect(client.observable.fetch).toHaveBeenCalledTimes(1)
})

test('should return correct document type when transitioning from specified to undefined type', async () => {
  const client = createMockSanityClient()

  const responseGrrm = defer(() => of(['person']).pipe(observeOn(asyncScheduler)))

  client.observable.fetch = jest.fn().mockReturnValue(responseGrrm)

  // eslint-disable-next-line no-undef-init
  let documentType: string | undefined = 'author'

  const {result, rerender, waitForNextUpdate} = renderHook(
    () => useDocumentType('grrm', documentType),
    {wrapper: await createWrapperComponent(client as any)}
  )

  // First lookup - specified type, so is an author
  expect(result.current).toEqual({isLoaded: true, documentType: 'author'})
  expect(client.observable.fetch).not.toHaveBeenCalled()

  // Now lets say we for some reason decide that we don't know the document type
  documentType = undefined
  rerender()

  // We must look up the type, thus loading state
  expect(result.current).toEqual({isLoaded: false, documentType: undefined})
  await waitForNextUpdate()
  expect(result.current).toEqual({isLoaded: true, documentType: 'person'})

  // Should have been called only once (when transitioning)
  expect(client.observable.fetch).toHaveBeenCalledTimes(1)
})

test('should cancel ongoing requests when transitioning document ID', async () => {
  const client = createMockSanityClient()

  const hasResolvedFirst = jest.fn()
  const responseDelayedGrrm = defer(() =>
    of(['person']).pipe(observeOn(asyncScheduler), delay(5000), tap(hasResolvedFirst))
  )
  const responseGot = defer(() => of(['book']).pipe(observeOn(asyncScheduler)))

  client.observable.fetch = jest
    .fn()
    .mockReturnValueOnce(responseDelayedGrrm)
    .mockReturnValueOnce(responseGot)

  let documentId = 'grrm'
  const {result, rerender, waitForNextUpdate} = renderHook(
    () => useDocumentType(documentId, undefined),
    {wrapper: await createWrapperComponent(client as any)}
  )

  // First lookup - must be looked up
  expect(result.current).toEqual({isLoaded: false, documentType: undefined})
  expect(client.observable.fetch).toHaveBeenCalled()

  // Now, before the request has time to resolve, switch the ID
  documentId = 'agot'
  rerender()

  // Should still be in loading state
  expect(result.current).toEqual({isLoaded: false, documentType: undefined})
  await waitForNextUpdate()
  expect(result.current).toEqual({isLoaded: true, documentType: 'book'})

  // Should have been called twice (once for each document ID)
  expect(client.observable.fetch).toHaveBeenCalledTimes(2)

  // Should never have resolved the first one
  expect(hasResolvedFirst).not.toHaveBeenCalled()
})
