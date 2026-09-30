import {type SanityClient} from '@sanity/client'
import {act, render, screen} from '@testing-library/react'
import {type ReactNode, Suspense, use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useSource} from '../../studio/source'
import {useClient} from '../useClient'
import {
  FEATURES,
  type SettledFeatures,
  useFeatureEnabled,
  useFeatureEnabledPromise,
} from '../useFeatureEnabled'

vi.mock('../useClient', () => ({useClient: vi.fn()}))
vi.mock('../../studio/source', () => ({useSource: vi.fn()}))

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const useClientMock = vi.mocked(useClient)
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const useSourceMock = vi.mocked(useSource)

let requestCount = 0
let response$: Subject<string[]>

beforeEach(() => {
  requestCount = 0
  response$ = new Subject<string[]>()
  // A fresh project id per test: the feature request is cached per project for the lifetime of
  // the module, exactly like the studio keeps it for the lifetime of the page.
  const projectId = `project-${Math.random().toString(36).slice(2)}`
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  useSourceMock.mockReturnValue({projectId} as ReturnType<typeof useSource>)
  useClientMock.mockReturnValue({
    observable: {
      request: () => {
        requestCount++
        return response$.asObservable()
      },
    },
  } as unknown as SanityClient)
})

// A mount that suspends has to happen inside an awaited async `act`, otherwise React never
// resumes the parked tree (see "Testing components that suspend via `use()`" in AGENTS.md).
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

/** The shape of the fix: hook in the parent, boundary in between, `use()` in the child. */
function Parent({featureKey}: {featureKey: string}) {
  const promise = useFeatureEnabledPromise(featureKey)
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

describe('useFeatureEnabledPromise', () => {
  it('suspends the child until the feature list arrives, then commits the settled answer once', async () => {
    await mount(<Parent featureKey={FEATURES.sanityTasks} />)

    expect(screen.getByTestId('fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('settled')).not.toBeInTheDocument()
    // The parent committed, so the request has started.
    expect(requestCount).toBe(1)
    const rendersWhileSuspended = onLeafRender.mock.calls.length

    await act(async () => {
      response$.next(['sanityTasks'])
      response$.complete()
    })

    expect(screen.getByTestId('settled')).toHaveTextContent('enabled')
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument()
    // One committed render with the answer: no pre-answer paint to replace.
    expect(onLeafRender.mock.calls.length - rendersWhileSuspended).toBe(1)
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
})
