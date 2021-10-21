import {act, renderHook} from '@testing-library/react-hooks'
import {asyncScheduler, defer, of} from 'rxjs'
import {observeOn} from 'rxjs/operators'
import {useDocumentType} from '../useDocumentType'
import {versionedClient} from '../../../../client/versionedClient'

jest.mock('../../../../client/versionedClient', () => {
  return {
    versionedClient: {
      observable: {
        fetch: jest.fn(),
      },
    },
  }
})

beforeEach(() => {
  ;(versionedClient.observable.fetch as jest.Mock).mockReset()

  function shouldNotBeCalled() {
    throw new Error('client.fetch() should not be called')
  }

  ;(versionedClient.observable.fetch as jest.Mock).mockImplementation(shouldNotBeCalled)
})

test('should return passed document type if already resolved', () => {
  const {result, rerender} = renderHook(() => useDocumentType('grrm', 'author'))
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
  const response = defer(() => of(['book']).pipe(observeOn(asyncScheduler)))
  ;(versionedClient.observable.fetch as jest.Mock).mockReturnValue(response)

  const {result, waitForNextUpdate} = renderHook(() => useDocumentType('asoiaf-got', undefined))
  expect(result.current).toEqual({isLoaded: false, documentType: undefined})

  await waitForNextUpdate()

  expect(result.current).toEqual({isLoaded: true, documentType: 'book'})
})

test('should return correct document type on argument transition', () => {
  let documentType = 'book'
  const {result, rerender} = renderHook(() => useDocumentType('abc123', documentType))
  expect(result.current).toEqual({isLoaded: true, documentType: 'book'})

  documentType = 'author'
  rerender()

  expect(versionedClient.observable.fetch).not.toHaveBeenCalled()
  expect(result.current).toEqual({isLoaded: true, documentType: 'author'})
})

test('should return correct document type on document ID transition', async () => {
  const responseGrrm = defer(() => of(['author']).pipe(observeOn(asyncScheduler)))
  const responseGot = defer(() => of(['book']).pipe(observeOn(asyncScheduler)))
  ;(versionedClient.observable.fetch as jest.Mock).mockImplementation((_query, params) => {
    return params.documentId === 'grrm' ? responseGrrm : responseGot
  })

  let documentId = 'grrm'
  const {result, rerender, waitForNextUpdate} = renderHook(() =>
    useDocumentType(documentId, undefined)
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
