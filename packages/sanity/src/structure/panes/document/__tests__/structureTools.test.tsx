import {renderHook} from '@testing-library/react'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {usePaneRouter} from '../../../components/paneRouter/usePaneRouter'
import {useStructureTool} from '../../../useStructureTool'
import {useStructureTools} from '../structureTools'
import {useDocumentPane} from '../useDocumentPane'

vi.mock('../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(),
}))

vi.mock('../../../useStructureTool', () => ({
  useStructureTool: vi.fn(),
}))

vi.mock('../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

const mockUsePaneRouter = vi.mocked(usePaneRouter)
const mockUseStructureTool = vi.mocked(useStructureTool)
const mockUseDocumentPane = vi.mocked(useDocumentPane)

function BackLink({children}: {children?: ReactNode}) {
  return <a href="#close">{children ?? 'close'}</a>
}

const TWO_VIEWS = [
  {id: 'form', type: 'form'},
  {id: 'preview', type: 'component'},
]

function setHost(options: {
  features?: Partial<ReturnType<typeof useStructureTool>['features']>
  paneRouter?: Partial<ReturnType<typeof usePaneRouter>>
  documentPane?: Partial<ReturnType<typeof useDocumentPane>>
}) {
  mockUseStructureTool.mockReturnValue({
    features: {backButton: false, splitViews: true, ...options.features},
  } as ReturnType<typeof useStructureTool>)

  mockUsePaneRouter.mockReturnValue({
    index: 0,
    hasGroupSiblings: false,
    ...options.paneRouter,
  } as ReturnType<typeof usePaneRouter>)

  mockUseDocumentPane.mockReturnValue({
    documentId: 'doc-1',
    views: TWO_VIEWS,
    ...options.documentPane,
  } as unknown as ReturnType<typeof useDocumentPane>)
}

function contributedTools() {
  return renderHook(() => useStructureTools()).result.current
}

function contributedIds() {
  return contributedTools().map((tool) => tool.id)
}

describe('useStructureTools', () => {
  beforeEach(() => {
    setHost({})
  })

  it('contributes only the close-pane-group button under a Presentation-shaped host', () => {
    setHost({paneRouter: {BackLink}})

    expect(contributedIds()).toEqual(['closePaneGroup'])
  })

  it('contributes nothing when the host supplies no back link either', () => {
    setHost({paneRouter: {BackLink: undefined}})

    expect(contributedIds()).toEqual([])
  })

  it('contributes the split pane button only when the host can split and the document has more than one view', () => {
    setHost({documentPane: {onPaneSplit: vi.fn()}})
    expect(contributedIds()).toEqual(['splitPane'])

    setHost({documentPane: {onPaneSplit: vi.fn(), views: [{id: 'form', type: 'form'}]} as never})
    expect(contributedIds()).toEqual([])
  })

  it('withholds the split pane button when the host cannot split views', () => {
    setHost({features: {splitViews: false}, documentPane: {onPaneSplit: vi.fn()}})

    expect(contributedIds()).toEqual([])
  })

  it('contributes the focus mode button only when the host lays panes out', () => {
    expect(contributedIds()).toEqual([])

    setHost({documentPane: {onSetMaximizedPane: vi.fn()}})
    expect(contributedIds()).toEqual(['focusMode'])
  })

  it('contributes the close pane button only when the split pane has siblings', () => {
    setHost({documentPane: {onPaneSplit: vi.fn()}, paneRouter: {hasGroupSiblings: true}})

    expect(contributedIds()).toEqual(['splitPane', 'closePane'])
  })

  it('withholds the close-pane-group button while the back button is showing', () => {
    setHost({features: {backButton: true}, paneRouter: {index: 1, BackLink}})
    expect(contributedIds()).toEqual([])

    setHost({features: {backButton: true}, paneRouter: {index: 0, BackLink}})
    expect(contributedIds()).toEqual(['closePaneGroup'])
  })

  it('contributes no back button, which the structure header reads from the router itself', () => {
    setHost({features: {backButton: true}, paneRouter: {index: 1}})

    expect(contributedIds()).toEqual([])
  })

  it('places every contribution in the header, with a renderer', () => {
    setHost({
      documentPane: {onPaneSplit: vi.fn(), onSetMaximizedPane: vi.fn()},
      paneRouter: {hasGroupSiblings: true},
    })

    const tools = contributedTools()

    expect(tools.map((tool) => tool.id)).toEqual(['splitPane', 'focusMode', 'closePane'])
    expect(tools.every((tool) => tool.placement === 'header')).toBe(true)
    expect(tools.every((tool) => typeof tool.render === 'function')).toBe(true)
  })
})
