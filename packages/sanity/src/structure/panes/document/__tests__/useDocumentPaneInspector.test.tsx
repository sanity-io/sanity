import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type PaneMenuItem} from '../../../types'
import {
  HISTORY_INSPECTOR_NAME,
  INSPECT_ACTION_PREFIX,
  VALIDATION_INSPECTOR_NAME,
} from '../constants'
import {useDocumentPaneInspector} from '../useDocumentPaneInspector'

const mockLog = vi.fn()

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({log: mockLog}),
}))

const historyInspector = {name: HISTORY_INSPECTOR_NAME}
const validationInspector = {name: VALIDATION_INSPECTOR_NAME}

const mockSource = {
  document: {inspectors: vi.fn(() => [historyInspector, validationInspector])},
  beta: {eventsAPI: {documents: false}},
}

vi.mock('sanity', () => ({
  useSource: () => mockSource,
}))

vi.mock('../../../useStructureTool', () => ({
  useStructureTool: () => ({features: {reviewChanges: true}}),
}))

function setup(initialParams: Record<string, string | undefined> = {}) {
  const paramsHolder = {current: {...initialParams}}
  const setParams = vi.fn()

  const view = renderHook(
    ({params}: {params: Record<string, string | undefined>}) =>
      useDocumentPaneInspector({
        documentId: 'doc-1',
        documentType: 'article',
        params,
        setParams,
      }),
    {initialProps: {params: paramsHolder.current}},
  )

  // Round-trip params back through a rerender, matching how the pane router propagates them.
  setParams.mockImplementation((next: Record<string, string | undefined>) => {
    paramsHolder.current = {...paramsHolder.current, ...next}
    view.rerender({params: paramsHolder.current})
  })

  return {...view, setParams}
}

function inspectMenuItem(inspectorName: string): PaneMenuItem {
  return {action: `${INSPECT_ACTION_PREFIX}${inspectorName}`} as PaneMenuItem
}

describe('useDocumentPaneInspector telemetry', () => {
  beforeEach(() => {
    mockSource.beta.eventsAPI.documents = false
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('logs a status-line open when the status button opens the pane', () => {
    const {result} = setup()

    act(() => result.current.handleHistoryOpen('status_line'))

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Document History Inspector Opened'}),
      {tab: 'review', path: 'status_line', eventsApi: false},
    )
  })

  it('logs a change-indicator open with the path it is given', () => {
    const {result} = setup()

    act(() => result.current.handleHistoryOpen('change_indicator'))

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Document History Inspector Opened'}),
      {tab: 'review', path: 'change_indicator', eventsApi: false},
    )
  })

  it('defaults handleHistoryOpen attribution to status-line', () => {
    const {result} = setup()

    act(() => result.current.handleHistoryOpen())

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Document History Inspector Opened'}),
      {tab: 'review', path: 'status_line', eventsApi: false},
    )
  })

  it('logs a pane-menu open with the tab left at the current param', () => {
    const {result} = setup()

    act(() => {
      result.current.handleInspectorAction(inspectMenuItem(HISTORY_INSPECTOR_NAME))
    })

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Document History Inspector Opened'}),
      {tab: 'history', path: 'pane_menu', eventsApi: false},
    )
  })

  it('logs a url open when mounted with the inspector already open', () => {
    setup({inspect: HISTORY_INSPECTOR_NAME, changesInspectorTab: 'review'})

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Document History Inspector Opened'}),
      {tab: 'review', path: 'url', eventsApi: false},
    )
  })

  it('reports eventsApi true when the events-API implementation is active', () => {
    mockSource.beta.eventsAPI.documents = true
    const {result} = setup()

    act(() => result.current.handleHistoryOpen('status_line'))

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Document History Inspector Opened'}),
      {tab: 'review', path: 'status_line', eventsApi: true},
    )
  })

  it('does not log when the pane closes', () => {
    const {result} = setup()

    act(() => result.current.handleHistoryOpen('status_line'))
    mockLog.mockClear()

    act(() => result.current.handleHistoryClose())

    expect(mockLog).not.toHaveBeenCalled()
  })

  it('does not log when a different inspector opens', () => {
    const {result} = setup()

    act(() => {
      result.current.handleInspectorAction(inspectMenuItem(VALIDATION_INSPECTOR_NAME))
    })

    expect(mockLog).not.toHaveBeenCalled()
  })

  it('does not double-fire when the handler sets both the inspector and the params', () => {
    const {result} = setup()

    act(() => result.current.handleHistoryOpen('status_line'))

    expect(mockLog).toHaveBeenCalledTimes(1)
  })
})
