import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react'
import {of, Subject} from 'rxjs'

import {useKeyValueStore} from '../../../store/_legacy/datastores'
import {useSeenAnnouncements} from '../useSeenAnnouncements'

jest.mock('../../../store/_legacy/datastores', () => ({
  useKeyValueStore: jest.fn(),
}))

const useKeyValueStoreMock = useKeyValueStore as jest.Mock

describe('useSeenAnnouncements', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
  })
  test('should return "loading" initially and update when observable emits', async () => {
    const observable = new Subject<string[]>()
    const getKeyMock = jest.fn().mockReturnValue(observable)
    const setKeyMock = jest.fn()

    useKeyValueStoreMock.mockReturnValue({getKey: getKeyMock, setKey: setKeyMock})

    const {result} = renderHook(() => useSeenAnnouncements())
    expect(result.current[0]).toBe('loading')

    const seenAnnouncements = ['announcement1', 'announcement2']
    act(() => {
      observable.next(seenAnnouncements)
    })

    await waitFor(() => {
      expect(result.current[0]).toEqual(seenAnnouncements)
    })
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
    // Call the setSeenAnnouncements function
    act(() => {
      setSeenAnnouncements(newSeenAnnouncements)
    })

    expect(setKeyMock).toHaveBeenCalledWith('studio.announcement.seen', newSeenAnnouncements)
  })
})
