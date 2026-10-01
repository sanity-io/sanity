import {renderHook} from '@testing-library/react'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {usePaneRouter} from '../../../components/paneRouter/usePaneRouter'
import {type View} from '../../../structureBuilder/types'
import {useStructureTool} from '../../../useStructureTool'
import {useStructureFeatures} from '../structureFeatures'

vi.mock('../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(),
}))

vi.mock('../../../useStructureTool', () => ({
  useStructureTool: vi.fn(),
}))

const mockUsePaneRouter = vi.mocked(usePaneRouter)
const mockUseStructureTool = vi.mocked(useStructureTool)

function BackLink({children}: {children?: ReactNode}) {
  return <a href="#close">{children ?? 'close'}</a>
}

const TWO_VIEWS = [
  {id: 'form', type: 'form'},
  {id: 'preview', type: 'component'},
] as unknown as View[]

type PaneOptions = Parameters<typeof useStructureFeatures>[0]

let paneOptions: PaneOptions = {views: TWO_VIEWS}

function setHost(options: {
  features?: Partial<ReturnType<typeof useStructureTool>['features']>
  paneRouter?: Partial<ReturnType<typeof usePaneRouter>>
  pane?: Partial<PaneOptions>
}) {
  mockUseStructureTool.mockReturnValue({
    features: {backButton: false, splitViews: true, ...options.features},
  } as ReturnType<typeof useStructureTool>)

  mockUsePaneRouter.mockReturnValue({
    index: 0,
    hasGroupSiblings: false,
    ...options.paneRouter,
  } as ReturnType<typeof usePaneRouter>)

  paneOptions = {views: TWO_VIEWS, ...options.pane}
}

function contributedFeatures() {
  return renderHook(() => useStructureFeatures(paneOptions)).result.current
}

function contributedNames() {
  return contributedFeatures().map((feature) => feature.name)
}

describe('useStructureFeatures', () => {
  beforeEach(() => {
    setHost({})
  })

  it('contributes only the close-pane-group button under a Presentation-shaped host', () => {
    setHost({paneRouter: {BackLink}})

    expect(contributedNames()).toEqual(['closePaneGroup'])
  })

  it('contributes nothing when the host supplies no back link either', () => {
    setHost({paneRouter: {BackLink: undefined}})

    expect(contributedNames()).toEqual([])
  })

  it('contributes the split pane button only when the host can split and the document has more than one view', () => {
    setHost({pane: {onPaneSplit: vi.fn()}})
    expect(contributedNames()).toEqual(['splitPane'])

    setHost({pane: {onPaneSplit: vi.fn(), views: [{id: 'form', type: 'form'}] as never}})
    expect(contributedNames()).toEqual([])
  })

  it('withholds the split pane button when the host cannot split views', () => {
    setHost({features: {splitViews: false}, pane: {onPaneSplit: vi.fn()}})

    expect(contributedNames()).toEqual([])
  })

  it('contributes the focus mode button only when the host lays panes out', () => {
    expect(contributedNames()).toEqual([])

    setHost({pane: {onSetMaximizedPane: vi.fn()}})
    expect(contributedNames()).toEqual(['focusMode'])
  })

  it('contributes the close pane button only when the split pane has siblings', () => {
    setHost({pane: {onPaneSplit: vi.fn()}, paneRouter: {hasGroupSiblings: true}})

    expect(contributedNames()).toEqual(['splitPane', 'closePane'])
  })

  it('withholds the close-pane-group button while the back button is showing', () => {
    setHost({features: {backButton: true}, paneRouter: {index: 1, BackLink}})
    expect(contributedNames()).toEqual([])

    setHost({features: {backButton: true}, paneRouter: {index: 0, BackLink}})
    expect(contributedNames()).toEqual(['closePaneGroup'])
  })

  it('contributes no back button, which the structure header reads from the router itself', () => {
    setHost({features: {backButton: true}, paneRouter: {index: 1}})

    expect(contributedNames()).toEqual([])
  })

  it('places every contribution in the header, with a renderer', () => {
    setHost({
      pane: {onPaneSplit: vi.fn(), onSetMaximizedPane: vi.fn()},
      paneRouter: {hasGroupSiblings: true},
    })

    const features = contributedFeatures()

    expect(features.map((feature) => feature.name)).toEqual(['splitPane', 'focusMode', 'closePane'])
    expect(features.every((feature) => feature.toolbar?.placement === 'header')).toBe(true)
    expect(
      features.every(
        (feature) =>
          feature.toolbar?.placement === 'header' && typeof feature.toolbar.render === 'function',
      ),
    ).toBe(true)
  })
})
