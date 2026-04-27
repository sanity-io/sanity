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
const mockCreateUpsertResolutionMarkerPatches = vi.fn(() => [])
const mockCreateTakeFromUpstreamPatches = vi.fn(() => of([]))

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

vi.mock('../patches', () => ({
  createUpsertResolutionMarkerPatches: () => mockCreateUpsertResolutionMarkerPatches(),
  createTakeFromUpstreamPatches: () => mockCreateTakeFromUpstreamPatches(),
}))

vi.mock('../readDocumentDivergences', () => ({
  createDocumentRevisionMarker: () => ({}),
}))

vi.mock('../utils/hashData', () => ({
  hashData: async () => 'mock-hash',
}))

vi.mock('@sanity/mutate', () => ({
  SanityEncoder: {encodePatch: (patch: unknown) => patch},
}))

const SET_DIVERGENCE = {
  subjectId: 'drafts.doc-1',
  documentId: 'drafts.doc-1',
  documentType: 'article',
  sinceRevisionId: 'upstream-doc@rev-1',
  path: 'alpha',
  effect: 'set',
  divergences: [['alpha', {path: 'alpha', effect: 'set'}]],
  schemaType: {name: 'string'},
} as unknown as ReachableDivergence

function buildWrapper(
  divergencesValue: DocumentDivergencesContextValue | null,
  sessionId: string | null,
): (props: {children: ReactNode}) => ReactNode {
  const Wrapper = ({children}: {children: ReactNode}) => (
    <DocumentDivergencesContext.Provider value={divergencesValue}>
      <DiffViewSessionContext.Provider value={sessionId}>
        {children}
      </DiffViewSessionContext.Provider>
    </DocumentDivergencesContext.Provider>
  )
  Wrapper.displayName = 'Wrapper'
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
    mockCreateUpsertResolutionMarkerPatches.mockReset()
    mockCreateUpsertResolutionMarkerPatches.mockReturnValue([])
    mockCreateTakeFromUpstreamPatches.mockReset()
    mockCreateTakeFromUpstreamPatches.mockReturnValue(of([]))
    upstreamSnapshotRef.current = {isLoading: true}
  })

  it('logs InspectedDivergence with sessionId: null when rendered outside DiffViewSessionContext.Provider', async () => {
    const wrapper = ({children}: {children: ReactNode}) => (
      <DocumentDivergencesContext.Provider value={{enabled: false}}>
        {children}
      </DocumentDivergencesContext.Provider>
    )

    renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {wrapper})

    await waitForInspectedDivergence()
    expect(findLoggedCall(InspectedDivergence)?.[1]).toEqual({
      sessionId: null,
      divergenceCount: null,
    })
  })

  it('logs InspectedDivergence with the provided sessionId when rendered inside DiffViewSessionContext.Provider', async () => {
    const wrapper = buildWrapper({enabled: false}, 'test-session-id')
    renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {wrapper})

    await waitForInspectedDivergence()
    expect(findLoggedCall(InspectedDivergence)?.[1]).toEqual({
      sessionId: 'test-session-id',
      divergenceCount: null,
    })
  })

  it('reads divergenceCount from the enabled DocumentDivergencesContext state', async () => {
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
          ['alpha', {} as never],
          ['beta', {} as never],
          ['gamma', {} as never],
        ],
        divergencesByNode: {},
      },
    }

    const wrapper = buildWrapper(divergencesValue, 'session-abc')
    renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {wrapper})

    await waitForInspectedDivergence()
    expect(findLoggedCall(InspectedDivergence)?.[1]).toEqual({
      sessionId: 'session-abc',
      divergenceCount: 3,
    })
  })

  it('logs ActedOnDivergence when markResolved is invoked', async () => {
    upstreamSnapshotRef.current = {
      isLoading: false,
      value: {
        value: 'alpha-value',
        document: {_id: 'upstream-doc', _rev: 'rev-1', alpha: 'alpha-value'},
      },
    }

    const wrapper = buildWrapper({enabled: false}, 'session-happy')
    const {result} = renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {wrapper})

    mockTelemetryLog.mockClear()
    await act(async () => {
      await result.current.markResolved()
    })

    expect(findLoggedCall(ActedOnDivergence)?.[1]).toEqual({
      action: 'mark-resolved',
      sessionId: 'session-happy',
      divergenceCount: null,
    })
    expect(mockPatchExecute).toHaveBeenCalled()
  })

  it('logs ActedOnDivergence when takeUpstreamValue is invoked', async () => {
    upstreamSnapshotRef.current = {
      isLoading: false,
      value: {
        value: 'alpha-value',
        document: {_id: 'upstream-doc', _rev: 'rev-1', alpha: 'alpha-value'},
      },
    }

    const wrapper = buildWrapper({enabled: false}, 'session-take')
    const {result} = renderHook(() => useDivergenceController(SET_DIVERGENCE, [], false), {wrapper})

    mockTelemetryLog.mockClear()
    await act(async () => {
      await result.current.takeUpstreamValue()
    })

    expect(findLoggedCall(ActedOnDivergence)?.[1]).toEqual({
      action: 'take-upstream-value',
      sessionId: 'session-take',
      divergenceCount: null,
    })
    expect(mockPatchExecute).toHaveBeenCalled()
  })
})
