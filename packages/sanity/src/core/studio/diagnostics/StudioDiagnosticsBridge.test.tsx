import {render} from '@testing-library/react'
import {StrictMode} from 'react'
import {RenderStudioOptionsContext} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {studioRequestPerformance} from './requestPerformance'
import {
  STUDIO_DIAGNOSTICS_BRIDGE_KEY,
  StudioDiagnosticsBridge,
  type StudioDiagnosticsBridgeApi,
} from './StudioDiagnosticsBridge'

const mocks = vi.hoisted(() => ({
  gatherStudioDiagnostics: vi.fn(),
}))

vi.mock('../../hooks/useClient', () => ({useClient: () => ({})}))
vi.mock('./gatherStudioDiagnostics', () => ({
  gatherStudioDiagnostics: mocks.gatherStudioDiagnostics,
}))
vi.mock('../workspace', () => ({
  useWorkspace: () => ({
    basePath: '/',
    currentUser: null,
    dataset: 'production',
    name: 'default',
    projectId: 'project-id',
    schema: {
      get: (name: string) =>
        ({
          article: {
            jsonType: 'object',
            name: 'article',
            type: {jsonType: 'object', name: 'document'},
          },
          categoryLabel: {jsonType: 'string', name: 'categoryLabel'},
          seo: {jsonType: 'object', name: 'seo'},
        })[name],
      getLocalTypeNames: () => ['article', 'seo', 'categoryLabel'],
    },
    title: 'Default',
  }),
}))
vi.mock('../workspaces/useWorkspaces', () => ({
  useWorkspaces: () => [
    {dataset: 'production', projectId: 'project-id'},
    {dataset: 'production', projectId: 'project-id'},
    {dataset: 'staging', projectId: 'other-project'},
  ],
}))

const strictModeDisabled = {reactStrictMode: false}

function getBridge(): StudioDiagnosticsBridgeApi | undefined {
  return (window as Window & {[STUDIO_DIAGNOSTICS_BRIDGE_KEY]?: StudioDiagnosticsBridgeApi})[
    STUDIO_DIAGNOSTICS_BRIDGE_KEY
  ]
}

describe('StudioDiagnosticsBridge', () => {
  beforeEach(() => {
    mocks.gatherStudioDiagnostics.mockReset()
    mocks.gatherStudioDiagnostics.mockResolvedValue({diagnosticVersion: 1})
  })

  afterEach(() => {
    expect(getBridge()).toBeUndefined()
  })

  it('installs a window API that gathers diagnostics with the workspace wiring', async () => {
    const {unmount} = render(
      <StrictMode>
        <StudioDiagnosticsBridge />
      </StrictMode>,
    )

    const bridge = getBridge()
    expect(bridge).toBeDefined()
    expect(mocks.gatherStudioDiagnostics).not.toHaveBeenCalled()

    await expect(bridge!.gather()).resolves.toEqual({diagnosticVersion: 1})
    expect(mocks.gatherStudioDiagnostics).toHaveBeenCalledTimes(1)
    expect(mocks.gatherStudioDiagnostics).toHaveBeenCalledWith(
      expect.objectContaining({
        getRequestHistory: studioRequestPerformance.getSnapshot,
        requestTimeout: undefined,
        schema: {documentTypes: 1, objectTypes: 1, primitiveTypes: 1},
        studio: expect.objectContaining({
          dataset: 'production',
          projectId: 'project-id',
          reactStrictMode: undefined,
          uniqueTargetCount: 2,
          workspaceCount: 3,
        }),
        user: null,
      }),
    )

    unmount()
  })

  it('reports the strict mode setting renderStudio was called with', async () => {
    const {unmount} = render(
      <RenderStudioOptionsContext.Provider value={strictModeDisabled}>
        <StudioDiagnosticsBridge />
      </RenderStudioOptionsContext.Provider>,
    )

    await getBridge()!.gather()
    expect(mocks.gatherStudioDiagnostics).toHaveBeenCalledWith(
      expect.objectContaining({studio: expect.objectContaining({reactStrictMode: false})}),
    )

    unmount()
  })

  it('forwards a request timeout override to the gatherer', async () => {
    const {unmount} = render(<StudioDiagnosticsBridge />)

    await getBridge()!.gather({requestTimeout: 1234})
    expect(mocks.gatherStudioDiagnostics).toHaveBeenCalledWith(
      expect.objectContaining({requestTimeout: 1234}),
    )

    unmount()
  })

  it('removes the window API when unmounted', () => {
    const {unmount} = render(<StudioDiagnosticsBridge />)
    expect(getBridge()).toBeDefined()

    unmount()
    expect(getBridge()).toBeUndefined()
  })
})
