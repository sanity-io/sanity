import {act, render} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  DiffViewDocumentSelectionChanged,
  DiffViewEntered,
  DiffViewExited,
} from '../__telemetry__/diffView.telemetry'
import type * as UseDiffViewStateModule from '../hooks/useDiffViewState'
import {DiffViewDocumentLayout} from './DiffViewDocumentLayout'

const mockTelemetryLog = vi.hoisted(() => vi.fn())

type DiffViewStateLike = {isActive: boolean; documents?: unknown}
type StateChangeCallback = (
  previousState: DiffViewStateLike | undefined,
  state: DiffViewStateLike,
) => void

interface CapturedCallbacks {
  onActiveChanged?: StateChangeCallback
  onTargetDocumentsChanged?: StateChangeCallback
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

vi.mock('../hooks/useDiffViewState', async (importOriginal) => {
  const actual = await importOriginal<typeof UseDiffViewStateModule>()
  return {
    ...actual,
    useDiffViewState: vi.fn((options: CapturedCallbacks = {}) => {
      capturedCallbacks.onActiveChanged = options.onActiveChanged
      capturedCallbacks.onTargetDocumentsChanged = options.onTargetDocumentsChanged
      return {isActive: false}
    }),
  }
})

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

const reselectedState = {
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

function loggedCallsFor(event: unknown) {
  return mockTelemetryLog.mock.calls.filter((call) => call[0] === event)
}

describe('DiffViewDocumentLayout', () => {
  beforeEach(() => {
    mockTelemetryLog.mockReset()
    capturedCallbacks.onActiveChanged = undefined
    capturedCallbacks.onTargetDocumentsChanged = undefined
  })

  it('emits enter, selection-change, and exit events with a stable sessionId and documentType', () => {
    renderLayout('book')

    act(() => capturedCallbacks.onActiveChanged?.(undefined, activeState))
    act(() => capturedCallbacks.onTargetDocumentsChanged?.(activeState, reselectedState))
    act(() => capturedCallbacks.onActiveChanged?.(reselectedState, inactiveState))

    const [enteredCall] = loggedCallsFor(DiffViewEntered)
    const [selectionChangedCall] = loggedCallsFor(DiffViewDocumentSelectionChanged)
    const [exitedCall] = loggedCallsFor(DiffViewExited)

    const sessionId = enteredCall?.[1].sessionId
    expect(typeof sessionId).toBe('string')
    expect(sessionId).toBeTruthy()
    expect(selectionChangedCall?.[1].sessionId).toBe(sessionId)
    expect(exitedCall?.[1].sessionId).toBe(sessionId)

    for (const call of [enteredCall, selectionChangedCall, exitedCall]) {
      expect(call?.[1].documentType).toBe('book')
    }
  })

  it('assigns a fresh sessionId each time diff view is re-entered', () => {
    renderLayout()

    act(() => capturedCallbacks.onActiveChanged?.(undefined, activeState))
    act(() => capturedCallbacks.onActiveChanged?.(activeState, inactiveState))
    act(() => capturedCallbacks.onActiveChanged?.(inactiveState, activeState))

    const enteredCalls = loggedCallsFor(DiffViewEntered)
    expect(enteredCalls).toHaveLength(2)
    expect(enteredCalls[0][1].sessionId).toBeTruthy()
    expect(enteredCalls[1][1].sessionId).toBeTruthy()
    expect(enteredCalls[1][1].sessionId).not.toBe(enteredCalls[0][1].sessionId)
  })
})
