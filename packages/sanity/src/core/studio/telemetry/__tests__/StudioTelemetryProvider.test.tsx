import type * as SanityTelemetry from '@sanity/telemetry'
/* eslint-disable import/first */
// Regular imports first
import {render} from '@testing-library/react'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Disable console.logging of telemetry events in tests
import.meta.env.SANITY_STUDIO_DEBUG_TELEMETRY = ''

// Mocks (these get hoisted automatically by vitest)
vi.mock('@sanity/telemetry', async () => {
  const actual = await vi.importActual<typeof SanityTelemetry>('@sanity/telemetry')
  return {
    ...actual,
    createBatchedStore: vi.fn(),
    createSessionId: vi.fn(),
  }
})
vi.mock('@sanity/telemetry/react', () => ({
  TelemetryProvider: ({children}: {children: ReactNode}) => children,
  DeferredTelemetryProvider: ({children}: {children: ReactNode}) => children,
}))
vi.mock('../../../hooks')
vi.mock('../../workspace')
vi.mock('../../../store/project/useProjectOrganizationId')
vi.mock('sanity/router')
vi.mock('../../../environment', () => ({
  isProd: false,
  isDev: true,
}))
vi.mock('../../../version', () => ({
  SANITY_VERSION: '3.0.0-test',
}))
vi.mock('../PerformanceTelemetry', () => ({
  PerformanceTelemetryTracker: ({children}: {children: ReactNode}) => children,
}))

// Import mocked modules AFTER vi.mock declarations
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {createBatchedStore, createSessionId, SessionId} from '@sanity/telemetry'
import {DeferredTelemetryProvider} from '@sanity/telemetry/react'
import {useRouterState} from 'sanity/router'

import {useClient} from '../../../hooks'
import {useProjectOrganizationId} from '../../../store/project/useProjectOrganizationId'
import {WorkspaceFeaturesObserved} from '../../__telemetry__/featureAvailability.telemetry'
import {StudioLoaded} from '../../__telemetry__/studioLoaded.telemetry'
import {useWorkspace} from '../../workspace'
import {StudioTelemetryProvider} from '../StudioTelemetryProvider'
/* eslint-enable import/first */

describe('StudioTelemetryProvider', () => {
  let capturedStoreOptions: {
    sendEvents?: (batch: unknown[]) => Promise<void>
    sendBeacon?: (batch: unknown[]) => boolean
  }

  const mockLog = vi.fn()

  const mockClient = {
    config: () => ({projectId: 'test-project', token: 'test-token'}),
    request: vi.fn().mockResolvedValue({}),
    getUrl: vi.fn((path: string) => `https://api.sanity.io${path}`),
  }

  const mockWorkspace = {
    name: 'test-workspace',
    projectId: 'test-project',
    dataset: 'test-dataset',
    advancedVersionControl: {enabled: true},
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(createSessionId).mockReturnValue('test-session-id' as SessionId)
    vi.mocked(useClient).mockReturnValue(mockClient as never)
    vi.mocked(useWorkspace).mockReturnValue(mockWorkspace as never)
    vi.mocked(useProjectOrganizationId).mockReturnValue({
      value: 'org-123',
    } as never)
    vi.mocked(useRouterState).mockImplementation(((selector: (state: {tool?: string}) => unknown) =>
      selector({tool: 'desk'})) as any)

    // Capture store options when createBatchedStore is called
    vi.mocked(createBatchedStore).mockImplementation((_sessionId, options) => {
      capturedStoreOptions = options as typeof capturedStoreOptions
      return {
        logger: {
          log: mockLog,
        },
      } as never
    })
  })

  it('enriches events with context in sendEvents callback', async () => {
    render(
      <DeferredTelemetryProvider>
        <StudioTelemetryProvider>
          <div>Test Child</div>
        </StudioTelemetryProvider>
      </DeferredTelemetryProvider>,
    )

    // Verify createBatchedStore was called
    expect(createBatchedStore).toHaveBeenCalled()

    // Get the captured sendEvents callback
    const {sendEvents} = capturedStoreOptions
    expect(sendEvents).toBeDefined()

    // Create test batch of events
    const testBatch = [
      {name: 'Test Event 1', properties: {foo: 'bar'}},
      {name: 'Test Event 2', properties: {baz: 'qux'}},
    ]

    // Call sendEvents
    await sendEvents!(testBatch)

    // Verify client.request was called with enriched batch
    expect(mockClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: '/intake/batch',
        method: 'POST',
        json: true,
        body: expect.objectContaining({
          projectId: 'test-project',
          batch: expect.arrayContaining([
            expect.objectContaining({
              name: 'Test Event 1',
              properties: {foo: 'bar'},
              context: expect.objectContaining({
                // Static context
                studioVersion: '3.0.0-test',
                environment: 'development',
                // Dynamic context
                orgId: 'org-123',
                activeWorkspace: 'test-workspace',
                activeProjectId: 'test-project',
                activeDataset: 'test-dataset',
                activeTool: 'desk',
              }),
            }),
          ]),
        }),
      }),
    )
  })

  it('enriches events with context in sendBeacon callback', () => {
    // Mock navigator.sendBeacon
    const mockSendBeacon = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', {
      ...navigator,
      sendBeacon: mockSendBeacon,
      userAgent: 'test-user-agent',
    })

    render(
      <DeferredTelemetryProvider>
        <StudioTelemetryProvider>
          <div>Test Child</div>
        </StudioTelemetryProvider>
      </DeferredTelemetryProvider>,
    )

    // Get the captured sendBeacon callback
    const {sendBeacon} = capturedStoreOptions
    expect(sendBeacon).toBeDefined()

    // Create test batch
    const testBatch = [{name: 'Beacon Event', properties: {test: true}}]

    // Call sendBeacon
    const result = sendBeacon!(testBatch)

    expect(result).toBe(true)
    expect(mockSendBeacon).toHaveBeenCalledWith(
      'https://api.sanity.io/intake/batch',
      expect.stringContaining('"context"'),
    )

    // Parse the JSON to verify structure
    const sentData = JSON.parse(mockSendBeacon.mock.calls[0][1])
    expect(sentData.batch[0].context).toMatchObject({
      orgId: 'org-123',
      activeWorkspace: 'test-workspace',
      activeTool: 'desk',
    })

    vi.unstubAllGlobals()
  })

  it('updates context when workspace changes', async () => {
    const {rerender} = render(
      <DeferredTelemetryProvider>
        <StudioTelemetryProvider>
          <div>Test Child</div>
        </StudioTelemetryProvider>
      </DeferredTelemetryProvider>,
    )

    // Change workspace
    vi.mocked(useWorkspace).mockReturnValue({
      name: 'new-workspace',
      projectId: 'new-project',
      dataset: 'new-dataset',
    } as never)

    // Re-render to trigger context update
    rerender(
      <DeferredTelemetryProvider>
        <StudioTelemetryProvider>
          <div>Test Child</div>
        </StudioTelemetryProvider>
      </DeferredTelemetryProvider>,
    )

    // The context ref should be updated - verify by calling sendEvents
    const testBatch = [{name: 'Test Event'}]
    await capturedStoreOptions.sendEvents!(testBatch)

    expect(mockClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          batch: expect.arrayContaining([
            expect.objectContaining({
              context: expect.objectContaining({
                activeWorkspace: 'new-workspace',
                activeProjectId: 'new-project',
                activeDataset: 'new-dataset',
              }),
            }),
          ]),
        }),
      }),
    )
  })

  it('updates context when activeTool changes', async () => {
    const {rerender} = render(
      <DeferredTelemetryProvider>
        <StudioTelemetryProvider>
          <div>Test Child</div>
        </StudioTelemetryProvider>
      </DeferredTelemetryProvider>,
    )

    // Change active tool
    vi.mocked(useRouterState).mockImplementation(((selector: (state: {tool?: string}) => unknown) =>
      selector({tool: 'vision'})) as any)

    rerender(
      <DeferredTelemetryProvider>
        <StudioTelemetryProvider>
          <div>Test Child</div>
        </StudioTelemetryProvider>
      </DeferredTelemetryProvider>,
    )

    const testBatch = [{name: 'Test Event'}]
    await capturedStoreOptions.sendEvents!(testBatch)

    expect(mockClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          batch: expect.arrayContaining([
            expect.objectContaining({
              context: expect.objectContaining({
                activeTool: 'vision',
              }),
            }),
          ]),
        }),
      }),
    )
  })

  it('handles null orgId gracefully', async () => {
    vi.mocked(useProjectOrganizationId).mockReturnValue({
      value: null,
    } as never)

    render(
      <DeferredTelemetryProvider>
        <StudioTelemetryProvider>
          <div>Test Child</div>
        </StudioTelemetryProvider>
      </DeferredTelemetryProvider>,
    )

    const testBatch = [{name: 'Test Event'}]
    await capturedStoreOptions.sendEvents!(testBatch)

    expect(mockClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          batch: expect.arrayContaining([
            expect.objectContaining({
              context: expect.objectContaining({
                orgId: null,
              }),
            }),
          ]),
        }),
      }),
    )
  })

  it('includes screen dimensions in context', async () => {
    // Mock window properties
    vi.stubGlobal('window', {
      ...window,
      devicePixelRatio: 2,
      innerHeight: 800,
      innerWidth: 1200,
      screen: {
        height: 1080,
        width: 1920,
      },
    })

    render(
      <DeferredTelemetryProvider>
        <StudioTelemetryProvider>
          <div>Test Child</div>
        </StudioTelemetryProvider>
      </DeferredTelemetryProvider>,
    )

    const testBatch = [{name: 'Test Event'}]
    await capturedStoreOptions.sendEvents!(testBatch)

    expect(mockClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          batch: expect.arrayContaining([
            expect.objectContaining({
              context: expect.objectContaining({
                screen: expect.objectContaining({
                  density: 2,
                  innerHeight: 800,
                  innerWidth: 1200,
                  height: 1080,
                  width: 1920,
                }),
              }),
            }),
          ]),
        }),
      }),
    )

    vi.unstubAllGlobals()
  })

  it('emits WorkspaceFeaturesObserved with the advancedVersionControl flag enabled', () => {
    render(
      <DeferredTelemetryProvider>
        <StudioTelemetryProvider>
          <div>Test Child</div>
        </StudioTelemetryProvider>
      </DeferredTelemetryProvider>,
    )

    expect(mockLog).toHaveBeenCalledWith(WorkspaceFeaturesObserved, {
      advancedVersionControlEnabled: true,
    })
  })

  it('emits WorkspaceFeaturesObserved with the flag disabled when advancedVersionControl is undefined', () => {
    vi.mocked(useWorkspace).mockReturnValue({
      name: 'test-workspace',
      projectId: 'test-project',
      dataset: 'test-dataset',
    } as never)

    render(
      <DeferredTelemetryProvider>
        <StudioTelemetryProvider>
          <div>Test Child</div>
        </StudioTelemetryProvider>
      </DeferredTelemetryProvider>,
    )

    expect(mockLog).toHaveBeenCalledWith(WorkspaceFeaturesObserved, {
      advancedVersionControlEnabled: false,
    })
  })

  it('emits StudioLoaded once on mount with studio version and environment metadata', () => {
    render(
      <DeferredTelemetryProvider>
        <StudioTelemetryProvider>
          <div>Test Child</div>
        </StudioTelemetryProvider>
      </DeferredTelemetryProvider>,
    )

    const studioLoadedCalls = mockLog.mock.calls.filter(([event]) => event === StudioLoaded)
    expect(studioLoadedCalls).toHaveLength(1)

    expect(mockLog).toHaveBeenCalledWith(
      StudioLoaded,
      expect.objectContaining({
        studioVersion: '3.0.0-test',
        environment: 'development',
        reactVersion: expect.any(String),
        userAgent: expect.any(String),
        screenDensity: expect.any(Number),
        screenHeight: expect.any(Number),
        screenWidth: expect.any(Number),
        screenInnerHeight: expect.any(Number),
        screenInnerWidth: expect.any(Number),
      }),
    )
  })
})
