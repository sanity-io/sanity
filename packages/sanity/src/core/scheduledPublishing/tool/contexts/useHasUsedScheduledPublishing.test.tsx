import {type SanityClient} from '@sanity/client'
import {act, render, screen} from '@testing-library/react'
import {type ReactNode, Suspense, use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useClient} from '../../../hooks/useClient'
import {useWorkspace} from '../../../studio/workspace'
import {
  cachedUsedScheduledPublishing,
  type HasUsedScheduledPublishing,
  useHasUsedScheduledPublishingPromise,
} from './useHasUsedScheduledPublishing'

vi.mock('../../../hooks/useClient', () => ({useClient: vi.fn()}))
vi.mock('../../../studio/workspace', () => ({useWorkspace: vi.fn()}))

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const useClientMock = vi.mocked(useClient)
const useWorkspaceMock = vi.mocked(useWorkspace)

const requestMock = vi.fn()

beforeEach(() => {
  cachedUsedScheduledPublishing.clear()
  useWorkspaceMock.mockReturnValue({
    projectId: 'projectId',
    dataset: 'dataset',
  } as ReturnType<typeof useWorkspace>)
  useClientMock.mockReturnValue({
    config: () => ({dataset: 'dataset', projectId: 'projectId'}),
    observable: {request: requestMock},
  } as unknown as SanityClient)
})

function Leaf({promise}: {promise: ObservablePromise<HasUsedScheduledPublishing>}) {
  return <div data-testid="used">{use(promise).used ? 'used' : 'not-used'}</div>
}

function Parent(props: {explicitEnabled?: boolean; isWorkspaceEnabled?: boolean}) {
  const promise = useHasUsedScheduledPublishingPromise(props)
  return (
    <Suspense fallback={<div data-testid="fallback" />}>
      <Leaf promise={promise} />
    </Suspense>
  )
}

// A mount that suspends has to happen inside an awaited async `act`, otherwise React never
// resumes the parked tree (see "Testing components that suspend via `use()`" in AGENTS.md).
async function mount(ui: ReactNode) {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the mount suspends
  await act(async () => {
    render(ui)
  })
}

describe('useHasUsedScheduledPublishingPromise', () => {
  it('reports used without probing when the workspace opted in explicitly', async () => {
    await mount(<Parent explicitEnabled isWorkspaceEnabled />)

    expect(screen.getByTestId('used')).toHaveTextContent('used')
    expect(requestMock).not.toHaveBeenCalled()
  })

  it('reports not used without probing when the workspace disabled the feature', async () => {
    await mount(<Parent isWorkspaceEnabled={false} />)

    expect(screen.getByTestId('used')).toHaveTextContent('not-used')
    expect(requestMock).not.toHaveBeenCalled()
  })

  it('probes for existing schedules otherwise and reports the answer', async () => {
    requestMock.mockReturnValue(of({schedules: [{id: 'sch-1'}]}))

    await mount(<Parent isWorkspaceEnabled />)

    expect(screen.getByTestId('used')).toHaveTextContent('used')
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({url: '/schedules/projectId/dataset?limit=1'}),
    )
  })

  it('reports not used when the probe finds nothing', async () => {
    requestMock.mockReturnValue(of({schedules: []}))

    await mount(<Parent isWorkspaceEnabled />)

    expect(screen.getByTestId('used')).toHaveTextContent('not-used')
  })
})
