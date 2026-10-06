import {act, render, screen} from '@testing-library/react'
import {type ReactNode, Suspense, use} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {NEVER, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../../test/mocks/mockSanityClient'
import {useClient} from '../../../hooks/useClient'
import {
  cachedUsedScheduledPublishing,
  type HasUsedScheduledPublishing,
  prefetchUsedScheduledPublishing,
  useHasUsedScheduledPublishingObservable,
} from './useHasUsedScheduledPublishing'

vi.mock('../../../hooks/useClient', () => ({useClient: vi.fn()}))

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const useClientMock = vi.mocked(useClient)

const requestCallback = vi.fn()

beforeEach(() => {
  cachedUsedScheduledPublishing.clear()
  useClientMock.mockReturnValue(createMockSanityClientAsClient({requestCallback}))
})

function Leaf({promise}: {promise: ObservablePromise<HasUsedScheduledPublishing>}) {
  return <div data-testid="used">{use(promise).used ? 'used' : 'not-used'}</div>
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
})

describe('prefetchUsedScheduledPublishing', () => {
  it('starts the probe once, which the hook then shares instead of probing again', async () => {
    requestCallback.mockReturnValue({statusCode: 200, data: {schedules: [{id: 'sch-1'}]}})
    const probeClient = createMockSanityClientAsClient({requestCallback}).withConfig({
      apiVersion: '2026-05-04',
    })

    prefetchUsedScheduledPublishing(probeClient)
    expect(requestCallback).toHaveBeenCalledTimes(1)

    await mount(<Parent />)

    expect(screen.getByTestId('used')).toHaveTextContent('used')
    expect(requestCallback).toHaveBeenCalledTimes(1)
  })

  it('does not keep a failed probe, so the hook retries with its own client', async () => {
    const response$ = new Subject<{schedules: unknown[]}>()
    const probeClient = createMockSanityClientAsClient()
    vi.spyOn(probeClient.observable, 'request').mockReturnValue(response$)

    prefetchUsedScheduledPublishing(probeClient)
    expect(cachedUsedScheduledPublishing.size).toBe(1)

    // The credentials the prefetch used were rejected
    response$.error(new Error('Unauthorized'))
    expect(cachedUsedScheduledPublishing.size).toBe(0)

    requestCallback.mockReturnValue({statusCode: 200, data: {schedules: [{id: 'sch-1'}]}})
    await mount(<Parent />)

    expect(screen.getByTestId('used')).toHaveTextContent('used')
    expect(requestCallback).toHaveBeenCalledTimes(1)
  })
})
