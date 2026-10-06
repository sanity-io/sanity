import {act, render, screen} from '@testing-library/react'
import {type ReactNode, Suspense, use} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {NEVER, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../../test/mocks/mockSanityClient'
import {useClient} from '../../../hooks/useClient'
import {useWorkspace} from '../../../studio/workspace'
import {
  cachedUsedScheduledPublishing,
  type HasUsedScheduledPublishing,
  useHasUsedScheduledPublishingObservable,
} from './useHasUsedScheduledPublishing'

vi.mock('../../../hooks/useClient', () => ({useClient: vi.fn()}))
vi.mock('../../../studio/workspace', () => ({useWorkspace: vi.fn()}))

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const useClientMock = vi.mocked(useClient)
const useWorkspaceMock = vi.mocked(useWorkspace)

const requestCallback = vi.fn()

beforeEach(() => {
  cachedUsedScheduledPublishing.clear()
  useWorkspaceMock.mockReturnValue({
    projectId: 'mock-project-id',
    dataset: 'mock-data-set',
  } as ReturnType<typeof useWorkspace>)
  useClientMock.mockReturnValue(createMockSanityClientAsClient({requestCallback}))
})

function Leaf({promise}: {promise: ObservablePromise<HasUsedScheduledPublishing>}) {
  return <div data-testid="used">{use(promise).used ? 'used' : 'not-used'}</div>
}

function Parent(props: {explicitEnabled?: boolean; isWorkspaceEnabled?: boolean}) {
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
    await mount(<Parent explicitEnabled isWorkspaceEnabled />)

    expect(screen.getByTestId('used')).toHaveTextContent('used')
    expect(requestCallback).not.toHaveBeenCalled()
  })

  it('reports not used without probing when the workspace disabled the feature', async () => {
    await mount(<Parent isWorkspaceEnabled={false} />)

    expect(screen.getByTestId('used')).toHaveTextContent('not-used')
    expect(requestCallback).not.toHaveBeenCalled()
  })

  it('probes for existing schedules otherwise and reports the answer', async () => {
    requestCallback.mockReturnValue({statusCode: 200, data: {schedules: [{id: 'sch-1'}]}})

    await mount(<Parent isWorkspaceEnabled />)

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

    await mount(<Parent isWorkspaceEnabled />)
    expect(screen.getByTestId('fallback')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByTestId('used')).toHaveTextContent('not-used')
  })

  it('does not cache a subscriber timeout, so a late answer still reaches the next reader', async () => {
    vi.useFakeTimers()
    const response$ = new Subject<{schedules: {id: string}[]}>()
    const client = createMockSanityClientAsClient()
    vi.spyOn(client.observable, 'request').mockReturnValue(response$.asObservable())
    useClientMock.mockReturnValue(client)

    await mount(<Parent isWorkspaceEnabled />)
    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByTestId('used')).toHaveTextContent('not-used')

    // The probe was never aborted, so the answer it eventually gives is the cached one
    await act(async () => {
      response$.next({schedules: [{id: 'sch-1'}]})
      response$.complete()
    })
    await mount(<Parent isWorkspaceEnabled />)

    // `getByText` is an exact match, so the first probe's `not-used` does not satisfy it
    expect(screen.getByText('used')).toBeInTheDocument()
  })

  it('reports not used when the probe finds nothing', async () => {
    requestCallback.mockReturnValue({statusCode: 200, data: {schedules: []}})

    await mount(<Parent isWorkspaceEnabled />)

    expect(screen.getByTestId('used')).toHaveTextContent('not-used')
  })
})
