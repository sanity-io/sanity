import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react'
import {of, Subject} from 'rxjs'
import {useRouter} from 'sanity/router'

import {useKeyValueStore} from '../../../store/_legacy/datastores'
import {type SeenAnnouncementsState, useSeenAnnouncements} from '../useSeenAnnouncements'

jest.mock('../../../store/_legacy/datastores', () => ({
  useKeyValueStore: jest.fn(),
}))

const useKeyValueStoreMock = useKeyValueStore as jest.Mock
jest.mock('sanity/router', () => ({
  useRouter: jest.fn().mockReturnValue({state: {}}),
}))
const useRouterMock = useRouter as jest.Mock

describe('useSeenAnnouncements', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test('should return "loading" initially and update when observable emits', async () => {
    const observable = new Subject<string[]>()
    const getKeyMock = jest.fn().mockReturnValue(observable)
    const setKeyMock = jest.fn()
    useKeyValueStoreMock.mockReturnValue({getKey: getKeyMock, setKey: setKeyMock})

    const {result} = renderHook(() => useSeenAnnouncements())
    const seenAnnouncements$ = result.current[0]
    const seenAnnouncements = ['announcement1', 'announcement2']

    const expectedStates: SeenAnnouncementsState[] = [
      {value: null, error: null, loading: true},
      {value: seenAnnouncements, error: null, loading: false},
    ]
    const emissions: SeenAnnouncementsState[] = []

    seenAnnouncements$.subscribe((state) => {
      emissions.push(state)
    })

    act(() => {
      observable.next(seenAnnouncements)
    })
    expect(emissions).toEqual(expectedStates)
  })
  test('should handle errors on the keyValueStore', async () => {
    const observable = new Subject<string[]>()
    const getKeyMock = jest.fn().mockReturnValue(observable)
    const setKeyMock = jest.fn()

    useKeyValueStoreMock.mockReturnValue({getKey: getKeyMock, setKey: setKeyMock})

    const {result} = renderHook(() => useSeenAnnouncements())
    const seenAnnouncements$ = result.current[0]

    const emissions: SeenAnnouncementsState[] = []

    seenAnnouncements$.subscribe((state) => {
      emissions.push(state)
    })

    const error = new Error('An error occurred')
    act(() => {
      observable.error(error)
    })
    const expectedStates: SeenAnnouncementsState[] = [
      {value: null, error: null, loading: true},
      {value: null, error: error, loading: false},
    ]
    expect(emissions).toEqual(expectedStates)
  })

  test('should call the getKey function with the correct key when the hook is called', () => {
    const observable = new Subject()
    const getKeyMock = jest.fn().mockImplementation(() => observable)

    const setKeyMock = jest.fn().mockReturnValue(of([]))

    useKeyValueStoreMock.mockReturnValue({getKey: getKeyMock, setKey: setKeyMock})

    renderHook(() => useSeenAnnouncements())

    expect(getKeyMock).toHaveBeenCalledWith('studio.announcement.seen')
  })

  test('should call setKey with the correct arguments when setSeenAnnouncements is called', () => {
    const newSeenAnnouncements = ['announcement1', 'announcement2']
    const getKeyMock = jest.fn().mockImplementation(() => of([]))
    const setKeyMock = jest.fn().mockReturnValue(of([]))

    useKeyValueStoreMock.mockReturnValue({getKey: getKeyMock, setKey: setKeyMock})
    const {result} = renderHook(() => useSeenAnnouncements())
    const [_, setSeenAnnouncements] = result.current

    act(() => {
      setSeenAnnouncements(newSeenAnnouncements)
    })

    expect(setKeyMock).toHaveBeenCalledWith('studio.announcement.seen', newSeenAnnouncements)
  })
  describe('should reset states when the param is provided', () => {
    test('when a reset value is provided', async () => {
      useRouterMock.mockReturnValue({
        state: {_searchParams: [['reset-announcements', 'foo,bar']]},
      })
      const getKeyMock = jest.fn().mockImplementation(() => of([]))
      const setKeyMock = jest.fn().mockReturnValue(of([]))

      useKeyValueStoreMock.mockReturnValue({getKey: getKeyMock, setKey: setKeyMock})
      renderHook(() => useSeenAnnouncements())

      await waitFor(() => {
        expect(setKeyMock).toHaveBeenCalledWith('studio.announcement.seen', ['foo', 'bar'])
      })
    })
    test('when no reset value is provided', async () => {
      useRouterMock.mockReturnValue({
        state: {_searchParams: [['reset-announcements', '']]},
      })
      const getKeyMock = jest.fn().mockImplementation(() => of([]))
      const setKeyMock = jest.fn().mockReturnValue(of([]))

      useKeyValueStoreMock.mockReturnValue({getKey: getKeyMock, setKey: setKeyMock})
      renderHook(() => useSeenAnnouncements())

      await waitFor(() => {
        expect(setKeyMock).toHaveBeenCalledWith('studio.announcement.seen', [])
      })
    })

    test('when the reset key is not provided', async () => {
      useRouterMock.mockReturnValue({
        state: {_searchParams: []},
      })
      const getKeyMock = jest.fn().mockImplementation(() => of([]))
      const setKeyMock = jest.fn().mockReturnValue(of([]))

      useKeyValueStoreMock.mockReturnValue({getKey: getKeyMock, setKey: setKeyMock})
      renderHook(() => useSeenAnnouncements())

      await waitFor(() => {
        expect(setKeyMock).not.toHaveBeenCalled()
      })
    })
  })
})
