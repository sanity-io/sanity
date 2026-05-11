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
  sessionId,
  divergenceCount,
}: {
  sessionId: string
  divergenceCount: number
}): DocumentDivergencesContextValue {
  return {
    enabled: true,
    sessionId,
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
      wrapper: buildWrapper({enabled: false, sessionId: null}),
    })

    await waitForInspectedDivergence()
    expect(findLoggedCall(InspectedDivergence)?.[1]).toEqual({
      sessionId: null,
      divergenceCount: null,
    })
  })

  it('reads sessionId and divergenceCount from the enabled provider context', async () => {
    renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {
      wrapper: buildWrapper(buildEnabledContextValue({sessionId: 'session-A', divergenceCount: 3})),
    })

    await waitForInspectedDivergence()
    expect(findLoggedCall(InspectedDivergence)?.[1]).toEqual({
      sessionId: 'session-A',
      divergenceCount: 3,
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

    const {result} = renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {
      wrapper: buildWrapper(
        buildEnabledContextValue({sessionId: 'session-action', divergenceCount: 1}),
      ),
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
    expect(mockPatchExecute).toHaveBeenCalled()
  })
})
