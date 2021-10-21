import {act, renderHook} from '@testing-library/react-hooks'
import {asyncScheduler, defer, of} from 'rxjs'
import {observeOn} from 'rxjs/operators'
import {useDocumentType} from '../useDocumentType'

function shouldNotBeCalled() {
  throw new Error('client.fetch() should not be called')
}

test('should return passed document type if already resolved', () => {
  const client = {observable: {fetch: jest.fn().mockImplementation(shouldNotBeCalled)}}
  const {result, rerender} = renderHook(() => useDocumentType('grrm', 'author', {client}))
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
  const client = {observable: {fetch: jest.fn().mockReturnValue(response)}}
  const {result, waitForNextUpdate} = renderHook(() =>
    useDocumentType('asoiaf-got', undefined, {client})
  )
  expect(result.current).toEqual({isLoaded: false, documentType: undefined})

  await waitForNextUpdate()

  expect(result.current).toEqual({isLoaded: true, documentType: 'book'})
})

/**
 * @todo add tests for:
 * - Transition from one document ID to a different one
 * - Transition from an undefined specified type to a specified type
 * - Transition from a specified type to a different specified type
 * - Transition from a specified type to an undefined specified type
 */
