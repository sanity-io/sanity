import {act, renderHook} from '@testing-library/react'
import {beforeEach, expect, it, onTestFinished, vi} from 'vitest'

import {useManageFavorite, type UseManageFavoriteProps} from '../useManageFavorite'

const {comlinkStore, fetch} = vi.hoisted(() => {
  const fetchMock = vi.fn<(type: string, payload: {eventType?: string}) => Promise<unknown>>()
  return {fetch: fetchMock, comlinkStore: {node: {fetch: fetchMock}}}
})

vi.mock('../../store/datastores', () => ({useComlinkStore: () => comlinkStore}))

const DOCUMENT: UseManageFavoriteProps = {
  documentId: 'book-1',
  documentType: 'book',
  resourceType: 'studio',
  projectId: 'project',
  dataset: 'dataset',
  schemaName: 'default',
}

beforeEach(() => {
  fetch.mockReset()
  vi.useFakeTimers()
  onTestFinished(() => {
    vi.useRealTimers()
  })
})

function writes() {
  return fetch.mock.calls
    .filter(([type]) => type === 'dashboard/v1/events/favorite/mutate')
    .map(([, payload]) => payload.eventType)
}

it('treats a Dashboard that does not answer within 3 seconds as not favorited', async () => {
  fetch.mockReturnValue(new Promise(() => {}))
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  onTestFinished(() => error.mockRestore())
  const {result} = renderHook(() => useManageFavorite(DOCUMENT))
  await act(() => vi.advanceTimersByTimeAsync(2999))
  expect(result.current.isReady).toBe(false)

  await act(() => vi.advanceTimersByTimeAsync(1))

  expect(result.current).toMatchObject({isReady: true, isFavorited: false})
})

it('writes the last toggle once it settles, and nothing for a toggle back', async () => {
  fetch.mockImplementation(async (type) =>
    type === 'dashboard/v1/events/favorite/query' ? {isFavorited: false} : {success: true},
  )
  const {result} = renderHook(() => useManageFavorite(DOCUMENT))
  await act(() => vi.advanceTimersByTimeAsync(0))

  act(() => result.current.favorite())
  act(() => result.current.unfavorite())
  act(() => result.current.favorite())
  await act(() => vi.advanceTimersByTimeAsync(749))
  expect(writes()).toEqual([])
  await act(() => vi.advanceTimersByTimeAsync(1))
  expect(writes()).toEqual(['added'])

  act(() => result.current.unfavorite())
  act(() => result.current.favorite())
  await act(() => vi.advanceTimersByTimeAsync(750))

  expect(writes()).toEqual(['added'])
  expect(result.current.isFavorited).toBe(true)
})
