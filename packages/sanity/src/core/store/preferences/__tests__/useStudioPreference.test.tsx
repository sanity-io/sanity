import {userPreference} from '@sanity/sdk'
import {ResourceProvider} from '@sanity/sdk-react'
import {renderHook} from '@testing-library/react'
import {type ComponentType, type ReactNode} from 'react'
import {EMPTY} from 'rxjs'
import {afterEach, beforeAll, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useStudioPreference} from '../useStudioPreference'

vi.unmock('../useStudioPreference')

const PENDING_SNAPSHOT = {
  status: 'pending' as const,
  data: undefined,
  error: undefined,
  isFetching: false,
  dataUpdatedAt: undefined,
}

let TestProvider: ComponentType<{children?: ReactNode}>

beforeAll(async () => {
  TestProvider = await createTestProvider()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function Wrapper({children}: {children: ReactNode}) {
  return (
    <TestProvider>
      <ResourceProvider projectId="test" dataset="test" fallback={null}>
        {children}
      </ResourceProvider>
    </TestProvider>
  )
}

describe('useStudioPreference', () => {
  test('omits options when refetchInterval is not provided', () => {
    const getStateSpy = vi.spyOn(userPreference, 'getState').mockReturnValue({
      subscribe: () => () => {},
      getCurrent: () => PENDING_SNAPSHOT,
      observable: EMPTY,
    })

    renderHook(() => useStudioPreference('studio.announcement.seen'), {wrapper: Wrapper})

    expect(getStateSpy).toHaveBeenCalledTimes(1)
    expect(getStateSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      'studio.announcement.seen',
    )
  })

  test('forwards refetchInterval and keeps the subscription stable across inline option objects', () => {
    const subscribe = vi.fn(() => () => {})
    const getStateSpy = vi.spyOn(userPreference, 'getState').mockReturnValue({
      subscribe,
      getCurrent: () => PENDING_SNAPSHOT,
      observable: EMPTY,
    })

    const {rerender} = renderHook(
      ({refetchInterval}: {refetchInterval?: number | false}) =>
        useStudioPreference('studio.announcement.seen', {refetchInterval}),
      {
        wrapper: Wrapper,
        initialProps: {refetchInterval: false as number | false | undefined},
      },
    )

    expect(getStateSpy).toHaveBeenCalledTimes(1)
    expect(getStateSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      'studio.announcement.seen',
      {refetchInterval: false},
    )
    expect(subscribe).toHaveBeenCalledTimes(1)

    // Re-rendering with a new inline object literal carrying the same refetchInterval must not
    // re-create the state source or re-subscribe.
    rerender({refetchInterval: false})
    expect(getStateSpy).toHaveBeenCalledTimes(1)
    expect(subscribe).toHaveBeenCalledTimes(1)

    // Changing refetchInterval creates a new state source with the updated interval.
    rerender({refetchInterval: 30_000})
    expect(getStateSpy).toHaveBeenCalledTimes(2)
    expect(getStateSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.any(String),
      'studio.announcement.seen',
      {refetchInterval: 30_000},
    )
  })
})
