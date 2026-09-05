import {act, renderHook} from '@testing-library/react'
import {StrictMode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type PaneMenuItem} from '../../../types'
import {
  DocumentHistoryInspectorOpened,
  DocumentHistoryInspectorTabChanged,
  type DocumentHistoryOpenPath,
} from '../__telemetry__/documentPanes.telemetry'
import {
  HISTORY_INSPECTOR_NAME,
  INSPECT_ACTION_PREFIX,
  VALIDATION_INSPECTOR_NAME,
} from '../constants'
import {changesInspector} from '../inspectors/changes'
import {useDocumentPaneInspector} from '../useDocumentPaneInspector'

const mockLog = vi.fn()

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({log: mockLog}),
}))

const validationInspector = {name: VALIDATION_INSPECTOR_NAME}

const mockSource = {
  document: {inspectors: () => [changesInspector, validationInspector]},
}

// The real changesInspector is used below, and it reaches for useTranslation in its menu item.
vi.mock('sanity', () => ({
  useSource: () => mockSource,
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../../../useStructureTool', () => ({
  useStructureTool: () => ({features: {reviewChanges: true}}),
}))

// The inspector's own onOpen / onClose rewrite the tab params, so the real ones are under test here.
vi.mock('../inspectors/changes/ChangesTabs', () => ({ChangesTabs: () => null}))

function setup(initialParams: Record<string, string | undefined> = {}) {
  const paramsHolder = {current: {...initialParams}}
  const setParams = vi.fn()

  // The real router navigates on a `setTimeout`, so params land a tick after the handler ran.
  setParams.mockImplementation((next: Record<string, string | undefined>) => {
    paramsHolder.current = {...paramsHolder.current, ...next}
  })

  const view = renderHook(
    ({params}: {params: Record<string, string | undefined>}) =>
      useDocumentPaneInspector({
        documentId: 'doc-1',
        documentType: 'article',
        params,
        setParams,
      }),
    {initialProps: {params: paramsHolder.current}, wrapper: StrictMode},
  )

  const flushParams = () => view.rerender({params: paramsHolder.current})

  const setParamsExternally = (next: Record<string, string | undefined>) => {
    paramsHolder.current = {...paramsHolder.current, ...next}
    flushParams()
  }

  return {...view, setParams, flushParams, setParamsExternally}
}

function inspectMenuItem(inspectorName: string): PaneMenuItem {
  return {action: `${INSPECT_ACTION_PREFIX}${inspectorName}`} as PaneMenuItem
}

describe('useDocumentPaneInspector telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(['status_line', 'change_indicator'] satisfies DocumentHistoryOpenPath[])(
    'logs a %s open with the path it is given',
    (path) => {
      const {result} = setup()

      act(() => result.current.handleHistoryOpen(path))

      expect(mockLog).toHaveBeenCalledTimes(1)
      expect(mockLog).toHaveBeenCalledWith(DocumentHistoryInspectorOpened, {
        tab: 'review',
        path,
      })
    },
  )

  it('logs a pane-menu open with the tab left at the current param', () => {
    const {result} = setup()

    act(() => {
      result.current.handleInspectorAction(inspectMenuItem(HISTORY_INSPECTOR_NAME))
    })

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith(DocumentHistoryInspectorOpened, {
      tab: 'history',
      path: 'pane_menu',
    })
  })

  it('logs a url open when mounted with the inspector already open', () => {
    setup({inspect: HISTORY_INSPECTOR_NAME, changesInspectorTab: 'review'})

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith(DocumentHistoryInspectorOpened, {
      tab: 'review',
      path: 'url',
    })
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

  it('does not log a tab change when the tab param lands after the pane opened on review', () => {
    const {result, flushParams} = setup()

    act(() => result.current.handleHistoryOpen('status_line'))

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith(DocumentHistoryInspectorOpened, {
      tab: 'review',
      path: 'status_line',
    })

    flushParams()

    expect(mockLog).toHaveBeenCalledTimes(1)
  })

  it('logs one tab change per switch, each against the tab it left', () => {
    const {result, flushParams, setParamsExternally} = setup({
      inspect: HISTORY_INSPECTOR_NAME,
      changesInspectorTab: 'history',
    })
    mockLog.mockClear()

    act(() => result.current.handleHistoryOpen('status_line'))
    flushParams()

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenLastCalledWith(DocumentHistoryInspectorTabChanged, {
      tab: 'review',
      previousTab: 'history',
    })

    setParamsExternally({changesInspectorTab: 'history'})

    expect(mockLog).toHaveBeenCalledTimes(2)
    expect(mockLog).toHaveBeenLastCalledWith(DocumentHistoryInspectorTabChanged, {
      tab: 'history',
      previousTab: 'review',
    })
  })

  it('logs a tab change when the tab list writes the tab param', () => {
    const {setParamsExternally} = setup({
      inspect: HISTORY_INSPECTOR_NAME,
      changesInspectorTab: 'history',
    })
    mockLog.mockClear()

    setParamsExternally({changesInspectorTab: 'review'})

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith(DocumentHistoryInspectorTabChanged, {
      tab: 'review',
      previousTab: 'history',
    })

    setParamsExternally({changesInspectorTab: 'history'})

    expect(mockLog).toHaveBeenCalledTimes(2)
    expect(mockLog).toHaveBeenLastCalledWith(DocumentHistoryInspectorTabChanged, {
      tab: 'history',
      previousTab: 'review',
    })
  })

  it('does not log a tab change while the pane is closed', () => {
    const {setParamsExternally} = setup({changesInspectorTab: 'history'})

    setParamsExternally({changesInspectorTab: 'review'})

    expect(mockLog).not.toHaveBeenCalled()
  })

  it('does not carry the previous tab across a close and reopen', () => {
    const {result, flushParams} = setup()

    act(() => result.current.handleHistoryOpen('status_line'))
    flushParams()
    act(() => result.current.handleHistoryClose())
    flushParams()
    mockLog.mockClear()

    act(() => {
      result.current.handleInspectorAction(inspectMenuItem(HISTORY_INSPECTOR_NAME))
    })
    flushParams()

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith(DocumentHistoryInspectorOpened, {
      tab: 'history',
      path: 'pane_menu',
    })
  })

  it('reports the tab the reopen writes when another inspector was shown in between', () => {
    const {result, flushParams} = setup()

    act(() => result.current.handleHistoryOpen('status_line'))
    flushParams()

    act(() => {
      result.current.handleInspectorAction(inspectMenuItem(VALIDATION_INSPECTOR_NAME))
    })
    flushParams()
    mockLog.mockClear()

    act(() => {
      result.current.handleInspectorAction(inspectMenuItem(HISTORY_INSPECTOR_NAME))
    })
    flushParams()

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith(DocumentHistoryInspectorOpened, {
      tab: 'history',
      path: 'pane_menu',
    })
  })
})
