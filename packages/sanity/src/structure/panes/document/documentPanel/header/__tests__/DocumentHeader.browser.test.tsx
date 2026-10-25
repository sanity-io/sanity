import {ResourceProvider} from '@sanity/sdk-react'
import {defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {type ReactNode} from 'react'
import {useSchema} from 'sanity'
import {DocumentPaneContext, PaneRouterContext, ResolvedPanesContext} from 'sanity/_singletons'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {stubMessageBusHost} from '../../../../../../../test/testUtils/stubMessageBusHost'
import type * as UseValuePreviewModule from '../../../../../../core/preview/useValuePreview'
import {useValuePreview} from '../../../../../../core/preview/useValuePreview'
import type * as UseDocumentPreviewValuesModule from '../../../../../../core/tasks/hooks/useDocumentPreviewValues'
import {useDocumentPreviewValues} from '../../../../../../core/tasks/hooks/useDocumentPreviewValues'
import {type PaneRouterContextValue} from '../../../../../components/paneRouter/types'
import {type Panes} from '../../../../../structureResolvers/useResolvedPanes'
import {type PaneNode} from '../../../../../types'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {DocumentHeaderBreadcrumb} from '../DocumentHeaderBreadcrumb'
import {DocumentHeaderTitle} from '../DocumentHeaderTitle'
import {FavoriteToggle} from '../FavoriteToggle'

// The header imports these @internal hooks from their declaring modules, so that is where the
// mocks go; a mock of the `sanity` barrel would not reach it.
vi.mock('../../../../../../core/tasks/hooks/useDocumentPreviewValues', async (importOriginal) => {
  const actual = await importOriginal<typeof UseDocumentPreviewValuesModule>()
  return {...actual, useDocumentPreviewValues: vi.fn(actual.useDocumentPreviewValues)}
})
vi.mock('../../../../../../core/preview/useValuePreview', async (importOriginal) => {
  const actual = await importOriginal<typeof UseValuePreviewModule>()
  return {...actual, useValuePreview: vi.fn(actual.useValuePreview)}
})

const {settleChromaticEndState} = testHelpers()

const article = defineType({
  name: 'article',
  type: 'document',
  title: 'Article',
  fields: [defineField({name: 'title', type: 'string'})],
})

const schemaTypes = [article]

const DOCUMENT_ID = 'article-1'
const CREATED_AT = '2025-01-02T12:00:00Z'

const articleValue = {_id: DOCUMENT_ID, _type: 'article', _createdAt: CREATED_AT, _rev: 'rev-1'}

function noop() {}

const paneRouter: PaneRouterContextValue = {
  index: 1,
  groupIndex: 1,
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

const articlesListPane = {
  id: 'articles',
  type: 'documentList',
  title: 'Articles',
  options: {filter: '_type == "article"'},
} as PaneNode

const articleDocumentPane = {
  id: DOCUMENT_ID,
  type: 'document',
  options: {id: DOCUMENT_ID, type: 'article'},
} as PaneNode

function paneData(pane: PaneNode, index: number, maximized = false) {
  return {
    active: true,
    childItemId: null,
    groupIndex: index,
    index,
    itemId: pane.id,
    key: `${pane.id}-${index}`,
    pane,
    params: {},
    path: pane.id,
    payload: undefined,
    selected: false,
    siblingIndex: 0,
    maximized,
  }
}

const maximizedPanes: Panes = {
  paneDataItems: [paneData(articlesListPane, 0), paneData(articleDocumentPane, 1, true)],
  routerPanes: [],
  resolvedPanes: [articlesListPane, articleDocumentPane],
  maximizedPane: null,
  setMaximizedPane: noop,
}

interface HeaderHarnessProps {
  children: ReactNode
  pane?: Partial<DocumentPaneContextValue>
  panes?: Panes
}

function HeaderHarness(props: HeaderHarnessProps) {
  const {children, pane, panes} = props
  const schemaType = useSchema().get('article') as ObjectSchemaType
  const value = {
    documentId: DOCUMENT_ID,
    documentType: 'article',
    schemaType,
    connectionState: 'connected',
    index: 1,
    value: articleValue,
    formState: null,
    views: [],
    activeViewId: null,
    onFocus: noop,
    onPathOpen: noop,
    ...pane,
  } as DocumentPaneContextValue

  return (
    <PaneRouterContext value={paneRouter}>
      <ResolvedPanesContext value={panes ?? null}>
        <DocumentPaneContext value={value}>
          <div data-testid="header-title">{children}</div>
        </DocumentPaneContext>
      </ResolvedPanesContext>
    </PaneRouterContext>
  )
}

function previewOf(title: string | undefined, error?: Error) {
  return {isLoading: false, value: {title}, error}
}

afterEach(() => {
  vi.mocked(useDocumentPreviewValues).mockReset()
  vi.mocked(useValuePreview).mockReset()
})

describe('document header title', () => {
  it('shows new, untitled, titled, error and structure titles', async () => {
    vi.mocked(useValuePreview).mockImplementation(({value}) => {
      const title = (value as {title?: string} | undefined)?.title
      if (title === 'broken') return previewOf(undefined, new Error('Preview failed'))
      return previewOf(title)
    })

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <HeaderHarness pane={{value: undefined}}>
          <DocumentHeaderTitle />
        </HeaderHarness>
        <HeaderHarness>
          <DocumentHeaderTitle />
        </HeaderHarness>
        <HeaderHarness
          pane={{
            value: {...articleValue, title: 'Spring launch article'},
            formState: {readOnly: false} as DocumentPaneContextValue['formState'],
          }}
        >
          <DocumentHeaderTitle />
        </HeaderHarness>
        <HeaderHarness pane={{value: {...articleValue, title: 'broken'}}}>
          <DocumentHeaderTitle />
        </HeaderHarness>
        <HeaderHarness pane={{title: 'Structure pane title'}}>
          <DocumentHeaderTitle />
        </HeaderHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByText('New Article')).toBeVisible()
    await expect.element(page.getByText('Untitled')).toBeVisible()
    await expect
      .element(page.getByTestId('document-pane-title-field'))
      .toHaveTextContent('Spring launch article')
    await expect.element(page.getByText(/^Error: /)).toBeVisible()
    await expect.element(page.getByText('Structure pane title')).toBeVisible()
    await settleChromaticEndState()
  })

  it('shows a breadcrumb trail when a pane is maximized', async () => {
    vi.mocked(useDocumentPreviewValues).mockReturnValue({
      isLoading: false,
      value: {title: 'Spring launch article'},
    })

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <HeaderHarness panes={maximizedPanes}>
          <DocumentHeaderBreadcrumb
            paneDataItems={maximizedPanes.paneDataItems}
            currentPaneIndex={1}
          />
        </HeaderHarness>
      </TestWrapper>,
    )

    const breadcrumb = page.getByTestId('document-header-breadcrumb')
    await expect.element(breadcrumb.getByRole('button', {name: 'Articles'})).toBeVisible()
    await expect
      .element(breadcrumb.getByRole('button', {name: 'Spring launch article'}))
      .toBeVisible()
    await settleChromaticEndState()
  })
})

describe('favorite toggle', () => {
  it('shows favorited, not favorited and unavailable stars', async () => {
    const host = stubMessageBusHost()
    host.publish('applications.capabilities', {favorites: true})
    host.publish('favorites.documents', [
      {
        id: 'article-favorited',
        type: 'article',
        resource: {id: 'test.test', type: 'dataset', schemaName: 'default'},
      },
    ])

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <ResourceProvider projectId="test" dataset="test" fallback={null}>
          <FavoriteToggle documentId="article-favorited" documentType="article" documentExists />
          <FavoriteToggle documentId="article-other" documentType="article" documentExists />
          <FavoriteToggle documentId="article-new" documentType="article" documentExists={false} />
        </ResourceProvider>
      </TestWrapper>,
    )

    await expect.element(page.getByRole('button', {name: 'Remove from favorites'})).toBeEnabled()
    await expect
      .poll(() => page.getByRole('button', {name: 'Add to favorites'}).elements().length)
      .toBe(2)
    await expect.element(page.getByRole('button', {name: 'Add to favorites'}).last()).toBeDisabled()
    await settleChromaticEndState()
  })
})
