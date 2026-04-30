import {act, renderHook, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {of} from 'rxjs'
import {DocumentDivergencesContext, type DocumentDivergencesContextValue} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {ActedOnDivergence, InspectedDivergence} from '../__telemetry__/divergence.telemetry'
import {type ReachableDivergence} from '../divergenceNavigator'
import {type Divergence, type DivergenceAtPath} from '../readDocumentDivergences'
import {useDivergenceController} from './useDivergenceController'

type UpstreamSnapshot =
  | {isLoading: true; value?: never}
  | {
      isLoading: false
      value?: {value: unknown; document: Record<string, unknown>}
    }

const mockTelemetryLog = vi.fn()
const mockPatchExecute = vi.fn()
const upstreamSnapshotRef: {current: UpstreamSnapshot} = {current: {isLoading: true}}

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({log: mockTelemetryLog}),
}))

vi.mock('../../hooks/useClient', () => ({useClient: () => ({})}))

vi.mock('../../hooks/useDocumentOperation', () => ({
  useDocumentOperation: () => ({patch: {execute: mockPatchExecute}}),
}))

vi.mock('../../store/datastores', () => ({
  useDocumentStore: () => ({pair: {editState: () => of({ready: false})}}),
}))

vi.mock('../../store/events/getDocumentAtRevision', () => ({
  getDocumentAtRevision: () => of(null),
}))

vi.mock('react-rx', () => ({
  useObservable: (_observable: unknown, initial: unknown) => upstreamSnapshotRef.current ?? initial,
}))

const emptySnapshots = {
  subjectHead: undefined,
  upstreamHead: undefined,
  upstreamAtFork: undefined,
}

const setDivergence: Divergence = {
  path: 'alpha',
  effect: 'set',
  documentId: 'upstream-doc',
  documentType: 'article',
  subjectId: 'drafts.doc-1',
  sinceRevisionId: 'upstream-doc@rev-1',
  isAddressable: true,
  status: 'unresolved',
  snapshots: emptySnapshots,
}

const setDivergenceAtPath: DivergenceAtPath = ['alpha', setDivergence]

const SET_DIVERGENCE: ReachableDivergence = {
  ...setDivergence,
  isComposite: false,
  divergences: [setDivergenceAtPath],
  schemaType: {name: 'string', jsonType: 'string'},
}

function buildEnabledContextValue({
  divergenceCount,
  beginSession,
}: {
  divergenceCount: number
  beginSession: () => string
}): DocumentDivergencesContextValue {
  return {
    enabled: true,
    beginSession,
    focusDivergence: vi.fn(),
    blurDivergence: vi.fn(),
    blurFocusedDivergence: vi.fn(),
    state: {
      focusedDivergence: undefined,
      previousDivergence: undefined,
      nextDivergence: undefined,
      state: 'ready',
      upstreamId: 'upstream',
      allDivergences: [],
      divergences: Array.from({length: divergenceCount}, (_, index) => [
        `alpha-${index}`,
        SET_DIVERGENCE,
      ]),
      divergencesByNode: {},
    },
  }
}

function buildWrapper(
  divergencesValue: DocumentDivergencesContextValue | null,
): (props: {children: ReactNode}) => ReactNode {
  function Wrapper({children}: {children: ReactNode}) {
    return (
      <DocumentDivergencesContext.Provider value={divergencesValue}>
        {children}
      </DocumentDivergencesContext.Provider>
    )
  }
  return Wrapper
}

function findLoggedCall(event: unknown) {
  return mockTelemetryLog.mock.calls.find((call) => call[0] === event)
}

async function waitForInspectedDivergence(): Promise<void> {
  await waitFor(() => {
    expect(findLoggedCall(InspectedDivergence)).toBeDefined()
  })
}

describe('useDivergenceController', () => {
  beforeEach(() => {
    mockTelemetryLog.mockReset()
    mockPatchExecute.mockReset()
    upstreamSnapshotRef.current = {isLoading: true}
  })

  it('logs null sessionId and null divergenceCount when no provider is mounted', async () => {
    renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {
      wrapper: buildWrapper(null),
    })

    await waitForInspectedDivergence()
    expect(findLoggedCall(InspectedDivergence)?.[1]).toEqual({
      sessionId: null,
      divergenceCount: null,
    })
  })

  it('logs null sessionId and null divergenceCount when the provider is disabled', async () => {
    renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {
      wrapper: buildWrapper({enabled: false, beginSession: () => null}),
    })

    await waitForInspectedDivergence()
    expect(findLoggedCall(InspectedDivergence)?.[1]).toEqual({
      sessionId: null,
      divergenceCount: null,
    })
  })

  it('logs the minted session id and divergenceCount from context state', async () => {
    const beginSession = vi.fn((): string => 'session-A')

    renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {
      wrapper: buildWrapper(buildEnabledContextValue({divergenceCount: 3, beginSession})),
    })

    await waitForInspectedDivergence()
    expect(beginSession).toHaveBeenCalled()
    expect(findLoggedCall(InspectedDivergence)?.[1]).toEqual({
      sessionId: 'session-A',
      divergenceCount: 3,
    })
    expect(beginSession.mock.invocationCallOrder[0]).toBeLessThan(
      mockTelemetryLog.mock.invocationCallOrder[0],
    )
  })

  it('mints a fresh session id when divergences resurface after a zero-count window', async () => {
    const firstSession = vi.fn((): string => 'session-1')
    const {unmount} = renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {
      wrapper: buildWrapper(
        buildEnabledContextValue({divergenceCount: 1, beginSession: firstSession}),
      ),
    })
    await waitForInspectedDivergence()
    expect(findLoggedCall(InspectedDivergence)?.[1]).toMatchObject({sessionId: 'session-1'})

    // Why: divergences resurfacing after a zero-count window remounts the
    // panel. Controller mount is what Vash calls "first inspection."
    unmount()
    mockTelemetryLog.mockReset()
    const secondSession = vi.fn((): string => 'session-2')

    renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {
      wrapper: buildWrapper(
        buildEnabledContextValue({divergenceCount: 2, beginSession: secondSession}),
      ),
    })
    await waitForInspectedDivergence()
    expect(findLoggedCall(InspectedDivergence)?.[1]).toMatchObject({
      sessionId: 'session-2',
      divergenceCount: 2,
    })
  })

  it.each([
    ['markResolved', 'mark-resolved'],
    ['takeUpstreamValue', 'take-upstream-value'],
  ] as const)('logs ActedOnDivergence with the active session for %s', async (method, action) => {
    upstreamSnapshotRef.current = {
      isLoading: false,
      value: {
        value: 'alpha-value',
        document: {_id: 'upstream-doc', _rev: 'rev-1', alpha: 'alpha-value'},
      },
    }

    const beginSession = vi.fn((): string => 'session-action')
    const {result} = renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {
      wrapper: buildWrapper(buildEnabledContextValue({divergenceCount: 1, beginSession})),
    })

    mockTelemetryLog.mockClear()
    await act(async () => {
      await result.current[method]()
    })

    expect(findLoggedCall(ActedOnDivergence)?.[1]).toEqual({
      action,
      sessionId: 'session-action',
      divergenceCount: 1,
    })
    expect(beginSession.mock.invocationCallOrder[0]).toBeLessThan(
      mockTelemetryLog.mock.invocationCallOrder[0],
    )
    expect(mockPatchExecute).toHaveBeenCalled()
  })
})
