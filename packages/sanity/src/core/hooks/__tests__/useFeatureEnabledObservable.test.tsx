import {act, render, screen} from '@testing-library/react'
import {type ReactNode, Suspense, use} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {defer, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../test/mocks/mockSanityClient'
import {useSource} from '../../studio/source'
import {useClient} from '../useClient'
import {
  FEATURES,
  prefetchFeatures,
  type SettledFeatures,
  useFeatureEnabled,
  useFeatureEnabledObservable,
} from '../useFeatureEnabled'

vi.mock('../useClient', () => ({useClient: vi.fn()}))
vi.mock('../../studio/source', () => ({useSource: vi.fn()}))

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const useClientMock = vi.mocked(useClient)
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const useSourceMock = vi.mocked(useSource)

let requestCount = 0
let response$: Subject<string[]>
let projectId: string
let client: ReturnType<typeof createMockSanityClientAsClient>

beforeEach(() => {
  requestCount = 0
  response$ = new Subject<string[]>()
  // The feature request is cached per project for the lifetime of the module
  projectId = `project-${Math.random().toString(36).slice(2)}`
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  useSourceMock.mockReturnValue({projectId} as ReturnType<typeof useSource>)
  client = createMockSanityClientAsClient()
  // `getFeatures` caches the request observable per project, so counting the calls that build it
  // would pass with the `shareReplay()` removed; count subscriptions, which is what sends a request
  vi.spyOn(client.observable, 'request').mockImplementation(() =>
    defer(() => {
      requestCount++
      return response$.asObservable()
    }),
  )
  useClientMock.mockReturnValue(client)
})

// A mount that suspends must happen inside an awaited async `act` (see AGENTS.md)
async function mount(ui: ReactNode) {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the mount suspends
  await act(async () => {
    render(ui)
  })
}

const onLeafRender = vi.fn()
function Leaf({promise}: {promise: ObservablePromise<SettledFeatures>}) {
  onLeafRender()
  const {enabled, error} = use(promise)
  return (
    <div data-testid="settled">
      {enabled ? 'enabled' : 'disabled'}
      {error ? ` error:${error.message}` : ''}
    </div>
  )
}

/** Promise made in the parent, boundary in between, `use()` in the child */
function Parent({featureKey}: {featureKey: string}) {
  const promise = useObservablePromise(useFeatureEnabledObservable(featureKey))
  return (
    <Suspense fallback={<div data-testid="fallback" />}>
      <Leaf promise={promise} />
    </Suspense>
  )
}

function LoadingConsumer({featureKey}: {featureKey: string}) {
  const {enabled, isLoading} = useFeatureEnabled(featureKey)
  return <div data-testid="loading-hook">{isLoading ? 'loading' : enabled ? 'on' : 'off'}</div>
}

describe('useFeatureEnabledObservable', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('suspends the child until the feature list arrives, then commits the settled answer once', async () => {
    await mount(<Parent featureKey={FEATURES.sanityTasks} />)

    expect(screen.getByTestId('fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('settled')).not.toBeInTheDocument()
    expect(requestCount).toBe(1)
    const rendersWhileSuspended = onLeafRender.mock.calls.length

    await act(async () => {
      response$.next(['sanityTasks'])
      response$.complete()
    })

    expect(screen.getByTestId('settled')).toHaveTextContent('enabled')
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument()
    // One committed render, with the answer
    expect(onLeafRender.mock.calls.length - rendersWhileSuspended).toBe(1)
  })

  it('settles a request that never answers as a timeout error after 10 seconds', async () => {
    vi.useFakeTimers()

    await mount(<Parent featureKey={FEATURES.sanityTasks} />)
    expect(screen.getByTestId('fallback')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(9_999)
    })
    expect(screen.getByTestId('fallback')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByTestId('settled')).toHaveTextContent(
      "disabled error:Timed out after 10s waiting for the project's feature list (/features)",
    )
  })

  it('settles a failed request as disabled with the error instead of rejecting', async () => {
    await mount(<Parent featureKey={FEATURES.sanityTasks} />)

    await act(async () => {
      response$.error(new Error('offline'))
    })

    expect(screen.getByTestId('settled')).toHaveTextContent('disabled error:offline')
  })

  it('shares one request with useFeatureEnabled', async () => {
    await mount(
      <>
        <LoadingConsumer featureKey={FEATURES.studioComments} />
        <Parent featureKey={FEATURES.studioComments} />
      </>,
    )

    await act(async () => {
      response$.next(['studioComments'])
      response$.complete()
    })

    expect(screen.getByTestId('settled')).toHaveTextContent('enabled')
    expect(screen.getByTestId('loading-hook')).toHaveTextContent('on')
    expect(requestCount).toBe(1)
  })

  it('keeps a consumer on the answer it got, even after the request failed and was retried', async () => {
    let rerender!: ReturnType<typeof render>['rerender']
    await act(async () => {
      rerender = render(<Parent featureKey={FEATURES.sanityTasks} />).rerender
    })
    await act(async () => {
      response$.error(new Error('offline'))
    })
    expect(screen.getByTestId('settled')).toHaveTextContent('disabled error:offline')

    // A re-render of the consumer does not pick up a fresh attempt (that would suspend it again)
    rerender(<Parent featureKey={FEATURES.sanityTasks} />)
    expect(screen.getByTestId('settled')).toHaveTextContent('disabled error:offline')
    expect(requestCount).toBe(1)
  })
})

describe('prefetchFeatures', () => {
  it('starts the request once, which the consumers then share instead of requesting again', async () => {
    // The auth probe's client, on the auth API version: the cache is per project, not per client
    prefetchFeatures({projectId, client: client.withConfig({apiVersion: '2026-05-04'})})
    expect(requestCount).toBe(1)

    await mount(<Parent featureKey={FEATURES.sanityTasks} />)
    expect(screen.getByTestId('fallback')).toBeInTheDocument()

    await act(async () => {
      response$.next(['sanityTasks'])
      response$.complete()
    })

    expect(screen.getByTestId('settled')).toHaveTextContent('enabled')
    expect(requestCount).toBe(1)
  })

  it('does not keep a failed request, so the consumers that mount later retry with their client', async () => {
    prefetchFeatures({projectId, client})
    expect(requestCount).toBe(1)

    // The credentials the prefetch used were rejected (not logged in yet)
    response$.error(new Error('Unauthorized'))
    response$ = new Subject<string[]>()

    await mount(<Parent featureKey={FEATURES.sanityTasks} />)
    expect(requestCount).toBe(2)

    await act(async () => {
      response$.next(['sanityTasks'])
      response$.complete()
    })

    expect(screen.getByTestId('settled')).toHaveTextContent('enabled')
  })
})
