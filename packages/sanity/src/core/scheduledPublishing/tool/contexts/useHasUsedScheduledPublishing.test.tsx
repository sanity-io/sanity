import {act, render, screen} from '@testing-library/react'
import {type ReactNode, Suspense, use} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {NEVER, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../../test/mocks/mockSanityClient'
import {useClient} from '../../../hooks/useClient'
import {
  cachedUsedScheduledPublishing,
  useHasUsedScheduledPublishingObservable,
} from './useHasUsedScheduledPublishing'

vi.mock('../../../hooks/useClient', () => ({useClient: vi.fn()}))

// oxlint-disable-next-line no-deprecated -- the hook identifier carries the deprecation of its versionless overload; this mocks the hook itself
const useClientMock = vi.mocked(useClient)

const requestCallback = vi.fn()

beforeEach(() => {
  cachedUsedScheduledPublishing.clear()
  useClientMock.mockReturnValue(createMockSanityClientAsClient({requestCallback}))
})

function Leaf({promise}: {promise: ObservablePromise<boolean>}) {
  return <div data-testid="used">{use(promise) ? 'used' : 'not-used'}</div>
}

function Parent(props: {explicitEnabled?: boolean}) {
  const promise = useObservablePromise(useHasUsedScheduledPublishingObservable(props))
  return (
    <Suspense fallback={<div data-testid="fallback" />}>
      <Leaf promise={promise} />
    </Suspense>
  )
}

// A mount that suspends must happen inside an awaited async `act` (see AGENTS.md)
async function mount(ui: ReactNode) {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the mount suspends
  await act(async () => {
    render(ui)
  })
}

describe('useHasUsedScheduledPublishingObservable', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports used without probing when the workspace opted in explicitly', async () => {
    await mount(<Parent explicitEnabled />)

    expect(screen.getByTestId('used')).toHaveTextContent('used')
    expect(requestCallback).not.toHaveBeenCalled()
  })

  it('probes for existing schedules otherwise and reports the answer', async () => {
    requestCallback.mockReturnValue({statusCode: 200, data: {schedules: [{id: 'sch-1'}]}})

    await mount(<Parent />)

    expect(screen.getByTestId('used')).toHaveTextContent('used')
    expect(requestCallback).toHaveBeenCalledWith(
      expect.objectContaining({url: '/schedules/mock-project-id/mock-data-set?limit=1'}),
    )
  })

  it('reports not used when the probe has not answered after 10 seconds', async () => {
    vi.useFakeTimers()
    const client = createMockSanityClientAsClient()
    vi.spyOn(client.observable, 'request').mockReturnValue(NEVER)
    useClientMock.mockReturnValue(client)

    await mount(<Parent />)
    expect(screen.getByTestId('fallback')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByTestId('used')).toHaveTextContent('not-used')
  })

  it('reports not used when the probe finds nothing', async () => {
    requestCallback.mockReturnValue({statusCode: 200, data: {schedules: []}})

    await mount(<Parent />)

    expect(screen.getByTestId('used')).toHaveTextContent('not-used')
  })

  it('reports not used when the probe fails, and probes once per dataset', async () => {
    const client = createMockSanityClientAsClient()
    const request = vi
      .spyOn(client.observable, 'request')
      .mockReturnValue(throwError(() => new Error('Forbidden')))
    useClientMock.mockReturnValue(client)

    await mount(
      <>
        <Parent />
        <Parent />
      </>,
    )

    expect(screen.getAllByTestId('used').map((node) => node.textContent)).toEqual([
      'not-used',
      'not-used',
    ])
    expect(request).toHaveBeenCalledTimes(1)
  })
})
