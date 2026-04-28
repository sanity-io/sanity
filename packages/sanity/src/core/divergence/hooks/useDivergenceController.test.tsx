import {act, renderHook, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {of} from 'rxjs'
import {
  DiffViewSessionContext,
  DocumentDivergencesContext,
  type DocumentDivergencesContextValue,
} from 'sanity/_singletons'
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

function buildWrapper(
  divergencesValue: DocumentDivergencesContextValue | null,
  sessionId: string | null,
): (props: {children: ReactNode}) => ReactNode {
  function Wrapper({children}: {children: ReactNode}) {
    return (
      <DocumentDivergencesContext.Provider value={divergencesValue}>
        <DiffViewSessionContext.Provider value={sessionId}>
          {children}
        </DiffViewSessionContext.Provider>
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

  it('logs InspectedDivergence with sessionId and divergenceCount from context (null when providers absent)', async () => {
    renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {
      wrapper: buildWrapper({enabled: false}, null),
    })

    await waitForInspectedDivergence()
    expect(findLoggedCall(InspectedDivergence)?.[1]).toEqual({
      sessionId: null,
      divergenceCount: null,
    })
  })

  it('reads sessionId and divergenceCount from the enabled DocumentDivergencesContext state', async () => {
    const divergencesValue: DocumentDivergencesContextValue = {
      enabled: true,
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
        divergences: [
          ['alpha', SET_DIVERGENCE],
          ['beta', SET_DIVERGENCE],
          ['gamma', SET_DIVERGENCE],
        ],
        divergencesByNode: {},
      },
    }

    renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {
      wrapper: buildWrapper(divergencesValue, 'session-abc'),
    })

    await waitForInspectedDivergence()
    expect(findLoggedCall(InspectedDivergence)?.[1]).toEqual({
      sessionId: 'session-abc',
      divergenceCount: 3,
    })
  })

  it.each([
    ['markResolved', 'mark-resolved'],
    ['takeUpstreamValue', 'take-upstream-value'],
  ] as const)('logs ActedOnDivergence when %s is invoked', async (method, action) => {
    upstreamSnapshotRef.current = {
      isLoading: false,
      value: {
        value: 'alpha-value',
        document: {_id: 'upstream-doc', _rev: 'rev-1', alpha: 'alpha-value'},
      },
    }

    const {result} = renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {
      wrapper: buildWrapper({enabled: false}, 'session-happy'),
    })

    mockTelemetryLog.mockClear()
    await act(async () => {
      await result.current[method]()
    })

    expect(findLoggedCall(ActedOnDivergence)?.[1]).toEqual({
      action,
      sessionId: 'session-happy',
      divergenceCount: null,
    })
    expect(mockPatchExecute).toHaveBeenCalled()
  })
})
