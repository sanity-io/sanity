import {render, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import type {StudioReadyMeasured as StudioReadyMeasuredType} from '../__telemetry__/bootstrap.telemetry'
import type {StudioLayoutComponent as StudioLayoutComponentType} from '../StudioLayout'

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(),
}))

vi.mock('../workspace', () => ({
  useWorkspace: vi.fn(),
}))

vi.mock('../networkCheck/useNetworkProtocolCheck', () => ({
  useNetworkProtocolCheck: vi.fn(),
}))

vi.mock('../studio-components-hooks', () => ({
  useLayoutComponent: vi.fn(),
  useNavbarComponent: () => () => <div data-testid="navbar" />,
  useActiveToolLayoutComponent:
    () =>
    ({activeTool}: {activeTool: {name: string}}) => (
      <div data-testid={`active-tool-${activeTool.name}`} />
    ),
}))

vi.mock('sanity/router', () => ({
  RouteScope: ({children}: {children: React.ReactNode}) => <>{children}</>,
  useRouter: () => ({navigateUrl: vi.fn()}),
  useRouterState: vi.fn(),
}))

vi.mock('sanity/_singletons', () => ({
  NavbarContext: {
    Provider: ({children}: {children: React.ReactNode}) => <>{children}</>,
  },
}))

vi.mock('../StudioErrorBoundary', () => ({
  StudioErrorBoundary: ({children}: {children: React.ReactNode}) => <>{children}</>,
}))

vi.mock('../screens/NoToolsScreen', () => ({
  NoToolsScreen: () => <div data-testid="no-tools" />,
}))

vi.mock('../screens/RedirectingScreen', () => ({
  RedirectingScreen: () => <div data-testid="redirecting" />,
}))

vi.mock('../screens/ToolNotFoundScreen', () => ({
  ToolNotFoundScreen: () => <div data-testid="tool-not-found" />,
}))

vi.mock('../../components/loadingBlock', () => ({
  LoadingBlock: () => <div data-testid="loading-block" />,
}))

vi.mock('../../limits/context/documents/DocumentLimitsUpsellPanel', () => ({
  DocumentLimitsUpsellPanel: () => null,
}))

vi.mock('../../limits/context/documents/isDocumentLimitError', () => ({
  isDocumentLimitError: () => false,
}))

vi.mock('../../config/isDefaultRouteTool', () => ({
  isDefaultRouteTool: () => true,
}))

type Tool = {
  name: string
  title: string
  component: React.ComponentType
}

const makeTool = (name: string): Tool => ({
  name,
  title: name,
  component: () => <div data-testid={`tool-${name}`} />,
})

describe('StudioLayoutComponent telemetry', () => {
  let telemetryLog: ReturnType<typeof vi.fn>
  let StudioLayoutComponent: typeof StudioLayoutComponentType
  let StudioReadyMeasured: typeof StudioReadyMeasuredType

  beforeEach(async () => {
    // Reset module graph so the module-level `studioReadyFired` guard
    // starts fresh each test.
    vi.resetModules()

    telemetryLog = vi.fn()

    const {useTelemetry} = await import('@sanity/telemetry/react')
    ;(useTelemetry as ReturnType<typeof vi.fn>).mockReturnValue({log: telemetryLog})
    ;({StudioLayoutComponent} = await import('../StudioLayout'))
    ;({StudioReadyMeasured} = await import('../__telemetry__/bootstrap.telemetry'))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const setupWorkspace = async (tools: Tool[], activeToolName: string | undefined) => {
    const {useWorkspace} = await import('../workspace')
    ;(useWorkspace as ReturnType<typeof vi.fn>).mockReturnValue({
      name: 'test-workspace',
      title: 'Test Workspace',
      tools,
    })
    const {useRouterState} = await import('sanity/router')
    ;(useRouterState as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: {tool?: string}) => unknown) => selector({tool: activeToolName}),
    )
  }

  it('fires Studio Ready Measured once when active tool resolves', async () => {
    await setupWorkspace([makeTool('structure'), makeTool('vision')], 'structure')

    render(<StudioLayoutComponent />)

    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })

    expect(telemetryLog).toHaveBeenCalledWith(
      StudioReadyMeasured,
      expect.objectContaining({
        activeToolName: 'structure',
        toolsCount: 2,
        durationMs: expect.any(Number),
      }),
    )
    expect(telemetryLog.mock.calls[0][1].durationMs).toBeGreaterThanOrEqual(0)
  })

  it('does not fire Studio Ready Measured when no active tool is resolved', async () => {
    await setupWorkspace([makeTool('structure')], undefined)

    render(<StudioLayoutComponent />)

    // Give effects a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(telemetryLog).not.toHaveBeenCalled()
  })

  it('fires Studio Ready Measured only once across re-renders', async () => {
    await setupWorkspace([makeTool('structure'), makeTool('vision')], 'structure')

    const {rerender} = render(<StudioLayoutComponent />)

    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })

    rerender(<StudioLayoutComponent />)
    rerender(<StudioLayoutComponent />)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(telemetryLog).toHaveBeenCalledTimes(1)
  })
})
