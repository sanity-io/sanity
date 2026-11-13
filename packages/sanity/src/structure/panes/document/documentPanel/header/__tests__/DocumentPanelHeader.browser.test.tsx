import {defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {type WorkspaceOptions, useSchema} from 'sanity'
import {DocumentPaneContext, PaneRouterContext, StructureToolContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type PaneRouterContextValue} from '../../../../../components/paneRouter/types'
import {type StructureToolContextValue} from '../../../../../types'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {DocumentPanelHeader} from '../DocumentPanelHeader'

function WideChipRow() {
  return <div style={{flex: 'none', width: 600, height: 25}}>Chips</div>
}

vi.mock('../perspective/DocumentPerspectiveList', () => ({DocumentPerspectiveList: WideChipRow}))
vi.mock('../DocumentPanelNavigation/DocumentPanelNavigation', () => ({
  DocumentPanelNavigation: WideChipRow,
}))
vi.mock('../CopyDocumentActions', () => ({CopyDocumentActions: () => null}))
vi.mock('../DocumentGroupInventoryButton', () => ({DocumentGroupInventoryButton: () => null}))

const {settleChromaticEndState} = testHelpers()

const schemaTypes = [
  defineType({
    name: 'article',
    type: 'document',
    fields: [defineField({name: 'title', type: 'string'})],
  }),
]

function noop() {}

const paneRouter: PaneRouterContextValue = {
  index: 0,
  groupIndex: 0,
  siblingIndex: 0,
  payload: undefined,
  params: {},
  hasGroupSiblings: false,
  groupLength: 1,
  routerPanesState: [],
  BackLink: () => null,
  ChildLink: () => null,
  ReferenceChildLink: () => null,
  handleEditReference: noop,
  ParameterizedLink: () => null,
  replaceCurrent: noop,
  closeCurrentAndAfter: noop,
  closeCurrent: noop,
  duplicateCurrent: noop,
  setView: noop,
  setParams: noop,
  setPayload: noop,
  navigateIntent: noop,
  createPathWithParams: () => '',
}

const structureTool = {
  features: {
    backButton: false,
    resizablePanes: false,
    reviewChanges: false,
    splitPanes: false,
    splitViews: false,
  },
} as StructureToolContextValue

function HeaderHarness() {
  const schemaType = useSchema().get('article') as ObjectSchemaType
  // Only the fields the header reads
  const documentPane: Partial<DocumentPaneContextValue> = {
    documentId: 'article-1',
    documentType: 'article',
    schemaType,
    connectionState: 'connected',
    editState: null,
    menuItemGroups: [],
    views: [],
    unstable_languageFilter: [],
    onMenuAction: noop,
    onPaneClose: noop,
    onSetMaximizedPane: noop,
  }

  return (
    <StructureToolContext value={structureTool}>
      <PaneRouterContext value={paneRouter}>
        <DocumentPaneContext value={documentPane as DocumentPaneContextValue}>
          <div style={{width: 320}}>
            <DocumentPanelHeader menuItems={[]} />
          </div>
        </DocumentPaneContext>
      </PaneRouterContext>
    </StructureToolContext>
  )
}

describe('document panel header', () => {
  it.each<[string, string, WorkspaceOptions['beta']]>([
    ['perspective list', 'document-perspective-list', undefined],
    [
      'document panel navigation',
      'document-panel-navigation',
      {documentGroupInventory: {enabled: true}},
    ],
  ])(
    'hides the scrollbar of the %s when its chips overflow',
    async (_name, testId, betaFeatures) => {
      await render(
        <TestWrapper schemaTypes={schemaTypes} betaFeatures={betaFeatures}>
          <HeaderHarness />
        </TestWrapper>,
      )

      const scroller = page.getByTestId(testId)
      await expect.element(scroller).toBeVisible()
      const element = scroller.element() as HTMLElement

      expect(element.scrollWidth).toBeGreaterThan(element.clientWidth)
      // Firefox only reads `scrollbar-width` from the element that scrolls. Headless Firefox
      // computes `none` for every element, so chromium and webkit are the runs that catch this.
      expect(getComputedStyle(element).scrollbarWidth).toBe('none')
      await settleChromaticEndState()
    },
  )
})
