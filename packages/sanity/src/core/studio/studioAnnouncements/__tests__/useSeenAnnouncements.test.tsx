import {renderHook, waitFor} from '@testing-library/react'
import {useRouter} from 'sanity/router'
import {beforeEach, describe, expect, type Mock, test, vi} from 'vitest'

import {useStudioPreference} from '../../../store/preferences/useStudioPreference'
import {useSeenAnnouncements} from '../useSeenAnnouncements'

vi.mock('../../../store/preferences/useStudioPreference', () => ({
  useStudioPreference: vi.fn(),
}))
vi.mock('sanity/router', () => ({
  useRouter: vi.fn().mockReturnValue({state: {}}),
}))

const useStudioPreferenceMock = useStudioPreference as Mock
const useRouterMock = useRouter as Mock
const set = vi.fn()

function stored(value: string[] | undefined, status: 'pending' | 'success' | 'error') {
  useStudioPreferenceMock.mockReturnValue({value, status, set})
}

describe('useSeenAnnouncements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRouterMock.mockReturnValue({state: {}})
  })

  test('is unknown until the preference is read, and empty when nothing is stored', () => {
    stored(undefined, 'pending')
    expect(renderHook(() => useSeenAnnouncements()).result.current[0]).toBeUndefined()

    stored(undefined, 'error')
    expect(renderHook(() => useSeenAnnouncements()).result.current[0]).toBeUndefined()

    stored(undefined, 'success')
    expect(renderHook(() => useSeenAnnouncements()).result.current[0]).toEqual([])

    stored(['announcement1'], 'success')
    expect(renderHook(() => useSeenAnnouncements()).result.current[0]).toEqual(['announcement1'])
    expect(useStudioPreferenceMock).toHaveBeenCalledWith('studio.announcement.seen')
  })

  test.each([
    ['foo,bar', ['foo', 'bar']],
    ['', []],
  ])('resets the seen announcements to %j from the URL', async (param, expected) => {
    stored([], 'success')
    useRouterMock.mockReturnValue({state: {_searchParams: [['reset-announcements', param]]}})
    renderHook(() => useSeenAnnouncements())
    await waitFor(() => expect(set).toHaveBeenCalledWith(expected))
  })

  test('leaves them alone without the reset parameter', () => {
    stored([], 'success')
    renderHook(() => useSeenAnnouncements())
    expect(set).not.toHaveBeenCalled()
  })
})
