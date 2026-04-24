import {act, render} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  DiffViewDocumentSelectionChanged,
  DiffViewEntered,
  DiffViewExited,
} from '../__telemetry__/diffView.telemetry'
import {DiffViewDocumentLayout} from './DiffViewDocumentLayout'

const mockTelemetryLog = vi.hoisted(() => vi.fn())

type OnActiveChanged = (
  previousState: {isActive: boolean; documents?: unknown} | undefined,
  state: {isActive: boolean; documents?: unknown},
) => void

interface CapturedCallbacks {
  onActiveChanged?: OnActiveChanged
  onTargetDocumentsChanged?: OnActiveChanged
}

const capturedCallbacks: CapturedCallbacks = vi.hoisted(() => ({}))

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({log: mockTelemetryLog}),
}))

vi.mock('@sanity/ui', () => ({
  useToast: () => ({push: vi.fn()}),
}))

vi.mock('sanity', () => ({
  getDocumentVariantType: (id: string) => (id.startsWith('drafts.') ? 'draft' : 'published'),
  useTranslation: () => ({t: (key: string) => key}),
  useWorkspace: () => ({advancedVersionControl: {enabled: true}}),
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
}))

vi.mock('../components/DiffView', () => ({
  DiffView: () => null,
}))

vi.mock('../hooks/useDiffViewState', () => ({
  selectActiveTransition: (
    previousState: {isActive: boolean} | undefined,
    state: {isActive: boolean},
  ) => {
    if (!previousState?.isActive && state.isActive) return 'entered'
    if (previousState?.isActive && !state.isActive) return 'exited'
    return undefined
  },
  useDiffViewState: vi.fn((options: CapturedCallbacks = {}) => {
    capturedCallbacks.onActiveChanged = options.onActiveChanged
    capturedCallbacks.onTargetDocumentsChanged = options.onTargetDocumentsChanged
    return {isActive: false}
  }),
}))

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const activeState = {
  isActive: true as const,
  state: 'ready',
  mode: 'version',
  documents: {
    previous: {type: 'article', id: 'drafts.doc-1'},
    next: {type: 'article', id: 'doc-2'},
  },
}

const inactiveState = {isActive: false as const}

const selectionChangedState = {
  ...activeState,
  documents: {
    previous: activeState.documents.previous,
    next: {type: 'article', id: 'doc-3'},
  },
}

function renderLayout(documentType = 'article') {
  render(
    <DiffViewDocumentLayout documentId="doc-1" documentType={documentType}>
      <span />
    </DiffViewDocumentLayout>,
  )
}

function findLoggedCall(event: unknown) {
  return mockTelemetryLog.mock.calls.find((call) => call[0] === event)
}

describe('DiffViewDocumentLayout', () => {
  beforeEach(() => {
    mockTelemetryLog.mockReset()
    capturedCallbacks.onActiveChanged = undefined
    capturedCallbacks.onTargetDocumentsChanged = undefined
  })

  it('logs DiffViewEntered with a uuid-shaped sessionId and the provided documentType', () => {
    renderLayout()

    act(() => {
      capturedCallbacks.onActiveChanged?.(undefined, activeState)
    })

    const enteredCall = findLoggedCall(DiffViewEntered)
    expect(enteredCall).toBeDefined()
    expect(enteredCall?.[1].sessionId).toMatch(UUID_PATTERN)
    expect(enteredCall?.[1].documentType).toBe('article')
  })

  it('attaches the same sessionId to subsequent DiffViewDocumentSelectionChanged events in the same session', () => {
    renderLayout()

    act(() => {
      capturedCallbacks.onActiveChanged?.(undefined, activeState)
    })
    act(() => {
      capturedCallbacks.onTargetDocumentsChanged?.(activeState, selectionChangedState)
    })

    const enteredCall = findLoggedCall(DiffViewEntered)
    const selectionChangedCall = findLoggedCall(DiffViewDocumentSelectionChanged)

    expect(enteredCall?.[1].sessionId).toMatch(UUID_PATTERN)
    expect(selectionChangedCall?.[1].sessionId).toBe(enteredCall?.[1].sessionId)
    expect(selectionChangedCall?.[1].documentType).toBe('article')
  })

  it('emits DiffViewExited with the active sessionId still attached before it clears', () => {
    renderLayout()

    act(() => {
      capturedCallbacks.onActiveChanged?.(undefined, activeState)
    })
    act(() => {
      capturedCallbacks.onActiveChanged?.(activeState, inactiveState)
    })

    const enteredCall = findLoggedCall(DiffViewEntered)
    const exitedCall = findLoggedCall(DiffViewExited)

    expect(exitedCall).toBeDefined()
    expect(exitedCall?.[1].sessionId).toBe(enteredCall?.[1].sessionId)
    expect(exitedCall?.[1].documentType).toBe('article')
  })

  it('produces a different sessionId when re-entering diff view', () => {
    renderLayout()

    act(() => {
      capturedCallbacks.onActiveChanged?.(undefined, activeState)
    })
    act(() => {
      capturedCallbacks.onActiveChanged?.(activeState, inactiveState)
    })
    act(() => {
      capturedCallbacks.onActiveChanged?.(inactiveState, activeState)
    })

    const enteredCalls = mockTelemetryLog.mock.calls.filter((call) => call[0] === DiffViewEntered)

    expect(enteredCalls).toHaveLength(2)
    expect(enteredCalls[0][1].sessionId).toMatch(UUID_PATTERN)
    expect(enteredCalls[1][1].sessionId).toMatch(UUID_PATTERN)
    expect(enteredCalls[1][1].sessionId).not.toBe(enteredCalls[0][1].sessionId)
  })

  it('passes the documentType prop to all emitted events', () => {
    renderLayout('book')

    act(() => {
      capturedCallbacks.onActiveChanged?.(undefined, activeState)
    })
    act(() => {
      capturedCallbacks.onTargetDocumentsChanged?.(activeState, selectionChangedState)
    })
    act(() => {
      capturedCallbacks.onActiveChanged?.(activeState, inactiveState)
    })

    const documentTypes = mockTelemetryLog.mock.calls.map((call) => call[1].documentType)
    expect(documentTypes.length).toBeGreaterThanOrEqual(3)
    documentTypes.forEach((documentType) => {
      expect(documentType).toBe('book')
    })
  })
})
