import {useElementSize} from '@sanity/ui'
import {type ReactNode, useContext, useMemo, useState} from 'react'
import {PaneLayoutContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable, testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DocumentToolbar} from '../../document-layout/DocumentToolbar'
import {type DocumentActionsPlacement} from '../../statusBar/documentActionsPlacement'
import {DocumentPanel} from '../DocumentPanel'

vi.mock('../../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: () => ({params: {}, index: 0, BackLink: 'a'}),
}))

vi.mock('../../../../useStructureTool', () => ({
  useStructureTool: () => ({features: {resizablePanes: true, splitPanes: true, backButton: false}}),
}))

vi.mock('../../../../hasObsoleteDraft', () => ({
  hasObsoleteDraft: () => ({result: false}),
}))

// `isPermissionsLoading` short-circuits every banner, keeping the measured column to the
// sub-header, the toolbar and the scroll container.
vi.mock('../../useDocumentPane', () => ({
  useDocumentPane: () => ({
    activeViewId: 'form',
    connectionState: 'connected',
    displayed: {_id: 'doc-1', _type: 'book'},
    documentId: 'doc-1',
    documentType: 'book',
    editState: {ready: true, draft: null, published: null, version: undefined},
    inspector: null,
    value: {_id: 'doc-1', _type: 'book', _createdAt: '2020-01-01T00:00:00Z'},
    views: [{id: 'form', type: 'form'}],
    ready: true,
    schemaType: {name: 'book'},
    permissions: {granted: true},
    isPermissionsLoading: true,
    targetDocumentState: {status: 'ready', targetDocument: {_id: 'doc-1'}},
  }),
}))

// The real sub-header needs the whole document pane and workspace stack. What matters to this
// layout is the `position: sticky; top: 0` its `PaneHeader` root carries, so render that.
vi.mock('../header/DocumentPanelSubHeader', async () => {
  const {PaneHeader} = await import('../../../../components/pane/PaneHeader')

  return {
    DocumentPanelSubHeader: function MockDocumentPanelSubHeader() {
      return <PaneHeader title="Sub header" />
    },
  }
})

vi.mock('../documentViews/FormView', () => ({
  FormView: function MockFormView(formViewProps: {hidden?: boolean}) {
    return (
      <div data-testid="form-content" hidden={formViewProps.hidden} style={{height: 3000}}>
        Form content
      </div>
    )
  },
}))

vi.mock('../../statusBar/DocumentStatusBar', () => ({
  DocumentStatusBar: function MockDocumentStatusBar() {
    return (
      <div data-testid="document-status-bar" style={{height: 40}}>
        Status bar
      </div>
    )
  },
}))

const {settleChromaticEndState} = testHelpers()

const SCHEMA_TYPES = [{name: 'book', type: 'document', fields: [{name: 'title', type: 'string'}]}]

const SCROLL_DISTANCE = 400

interface HarnessProps {
  placement: DocumentActionsPlacement
  collapsed: boolean
}

// `PaneLayout` only reports a collapsed layout when it is given a `minWidth`, which the browser
// test wrapper does not do, so the narrow layout is forced through the context instead.
function CollapsedPaneLayout(props: {children: ReactNode}) {
  const {children} = props
  const paneLayout = useContext(PaneLayoutContext)
  const value = useMemo(
    () => (paneLayout ? {...paneLayout, collapsed: true} : paneLayout),
    [paneLayout],
  )

  return <PaneLayoutContext.Provider value={value}>{children}</PaneLayoutContext.Provider>
}

function PlacementHarness(props: HarnessProps) {
  const {placement, collapsed} = props
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)
  const [toolbarElement, setToolbarElement] = useState<HTMLDivElement | null>(null)
  const [, setActionsBoxElement] = useState<HTMLDivElement | null>(null)
  const toolbarSize = useElementSize(toolbarElement)

  // Wide layout: the pane is a fixed-height flex column and the form's own scroll container
  // scrolls. Collapsed layout: nothing inside the pane scrolls, so an ancestor does, which is
  // where the sticky positioning of the toolbar and the sub-header has to hold.
  const viewportStyle = collapsed
    ? ({height: 600, overflow: 'auto'} as const)
    : ({height: 600, display: 'flex', flexDirection: 'column'} as const)

  const panel = (
    <div data-testid="harness-viewport" style={viewportStyle}>
      <DocumentPanel
        headerHeight={0}
        isInspectOpen={false}
        rootElement={null}
        setDocumentPanelPortalElement={setPortalElement}
        toolbarHeight={toolbarSize?.border.height ?? null}
        toolbarPlacement={placement}
        toolbar={
          <DocumentToolbar
            documentPanelPortalElement={portalElement}
            placement={placement}
            ref={setToolbarElement}
            setActionsBoxElement={setActionsBoxElement}
          />
        }
      />
    </div>
  )

  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      {collapsed ? <CollapsedPaneLayout>{panel}</CollapsedPaneLayout> : panel}
    </TestWrapper>
  )
}

function onlyElement(testId: string): HTMLElement {
  const matches = window.document.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`)
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one [data-testid="${testId}"], found ${matches.length}`)
  }
  return matches[0]!
}

function countOf(testId: string): number {
  return window.document.querySelectorAll(`[data-testid="${testId}"]`).length
}

function boxOf(element: HTMLElement): {top: number; bottom: number; height: number} {
  const rect = element.getBoundingClientRect()
  return {
    top: Math.round(rect.top),
    bottom: Math.round(rect.bottom),
    height: Math.round(rect.height),
  }
}

function boxSignature(...elements: HTMLElement[]): string {
  return elements.map((element) => JSON.stringify(boxOf(element))).join('|')
}

async function renderPlacement(placement: DocumentActionsPlacement, collapsed = false) {
  await render(<PlacementHarness placement={placement} collapsed={collapsed} />)
  await expect.element(page.getByTestId('document-status-bar')).toBeVisible()

  const bar = onlyElement('document-status-bar')
  const scroller = onlyElement('document-panel-scroller')
  const formContent = onlyElement('form-content')
  const subHeader = onlyElement('pane-header')
  const viewport = onlyElement('harness-viewport')

  await expectStable(() => boxSignature(bar, scroller, subHeader))

  return {bar, scroller, formContent, subHeader, viewport}
}

async function scrollBy(container: HTMLElement, distance: number) {
  container.scrollTop = distance
  await expect.poll(() => container.scrollTop).toBe(distance)
}

describe('document actions bar placement', () => {
  it('puts the bar before the scroll container at the top placement', async () => {
    const {bar, scroller} = await renderPlacement('top')

    expect(bar.compareDocumentPosition(scroller) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(boxOf(bar).height).toBeGreaterThan(0)
    expect(boxOf(bar).bottom).toBeLessThanOrEqual(boxOf(scroller).top)

    await settleChromaticEndState()
  })

  it('puts the bar after the scroll container at the bottom placement', async () => {
    const {bar, scroller} = await renderPlacement('bottom')

    expect(bar.compareDocumentPosition(scroller) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
    expect(boxOf(bar).height).toBeGreaterThan(0)
    expect(boxOf(bar).top).toBeGreaterThanOrEqual(boxOf(scroller).bottom)

    await settleChromaticEndState()
  })

  it('leaves the bar and the sub-header in place while the form scrolls at the top placement', async () => {
    const {bar, scroller, formContent, subHeader} = await renderPlacement('top')
    const barBefore = boxOf(bar)
    const subHeaderBefore = boxOf(subHeader)
    const formBefore = boxOf(formContent)

    await scrollBy(scroller, SCROLL_DISTANCE)
    await expectStable(() => boxSignature(bar, subHeader, formContent))

    expect(boxOf(formContent).top).toBe(formBefore.top - SCROLL_DISTANCE)
    expect(boxOf(bar)).toEqual(barBefore)
    expect(boxOf(subHeader)).toEqual(subHeaderBefore)

    await settleChromaticEndState()
  })

  it('leaves the bar and the sub-header in place while the form scrolls at the bottom placement', async () => {
    const {bar, scroller, formContent, subHeader} = await renderPlacement('bottom')
    const barBefore = boxOf(bar)
    const subHeaderBefore = boxOf(subHeader)
    const formBefore = boxOf(formContent)

    await scrollBy(scroller, SCROLL_DISTANCE)
    await expectStable(() => boxSignature(bar, subHeader, formContent))

    expect(boxOf(formContent).top).toBe(formBefore.top - SCROLL_DISTANCE)
    expect(boxOf(bar)).toEqual(barBefore)
    expect(boxOf(subHeader)).toEqual(subHeaderBefore)

    await settleChromaticEndState()
  })

  it('sticks the bar to the top of a collapsed layout that scrolls', async () => {
    const {bar, formContent, subHeader, viewport} = await renderPlacement('top', true)
    const barBefore = boxOf(bar)
    const subHeaderBefore = boxOf(subHeader)
    const formBefore = boxOf(formContent)

    await scrollBy(viewport, SCROLL_DISTANCE)
    await expectStable(() => boxSignature(bar, subHeader, formContent))

    expect(boxOf(formContent).top).toBe(formBefore.top - SCROLL_DISTANCE)
    expect(boxOf(bar)).toEqual(barBefore)
    expect(boxOf(subHeader)).toEqual(subHeaderBefore)
    expect(boxOf(subHeader).bottom).toBeLessThanOrEqual(boxOf(bar).top)

    await settleChromaticEndState()
  })

  it('sticks the bar to the bottom of a collapsed layout that scrolls', async () => {
    const {bar, formContent, subHeader, viewport} = await renderPlacement('bottom', true)
    const barBefore = boxOf(bar)
    const subHeaderBefore = boxOf(subHeader)
    const formBefore = boxOf(formContent)

    await scrollBy(viewport, SCROLL_DISTANCE)
    await expectStable(() => boxSignature(bar, subHeader, formContent))

    expect(boxOf(formContent).top).toBe(formBefore.top - SCROLL_DISTANCE)
    expect(boxOf(bar)).toEqual(barBefore)
    expect(boxOf(subHeader)).toEqual(subHeaderBefore)
    expect(boxOf(subHeader).bottom).toBeLessThanOrEqual(boxOf(bar).top)

    await settleChromaticEndState()
  })

  it('leaves no pane footer behind at the top placement', async () => {
    await renderPlacement('top')

    expect(countOf('document-status-bar')).toBe(1)
    expect(countOf('document-toolbar')).toBe(1)
    expect(countOf('pane-footer')).toBe(0)

    await settleChromaticEndState()
  })

  it('leaves no top toolbar behind at the bottom placement', async () => {
    await renderPlacement('bottom')

    expect(countOf('document-status-bar')).toBe(1)
    expect(countOf('document-toolbar')).toBe(0)
    expect(countOf('pane-footer')).toBe(1)

    await settleChromaticEndState()
  })
})
