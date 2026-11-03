import {diffInput, wrap} from '@sanity/diff'
import {defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {type ReactNode} from 'react'
import {of} from 'rxjs'
import {
  type AnnotationDetails,
  type Chunk,
  type DocumentGroupEvent,
  EventsProvider,
  type EventsStore,
  LocaleProvider,
  type ObjectDiff,
  type PerspectiveContextValue,
  type SanityDocument,
  type TimelineState,
  type TimelineStore,
  useSchema,
  type WorkspaceSummary,
} from 'sanity'
import {
  ActiveWorkspaceMatcherContext,
  DocumentPaneContext,
  DocumentPaneInfoContext,
  PaneRouterContext,
  PerspectiveContext,
} from 'sanity/_singletons'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type PaneRouterContextValue} from '../../../../../components/paneRouter/types'
import {HISTORY_INSPECTOR_NAME} from '../../../constants'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {ChangesInspector} from '../ChangesInspector'
import {ChangesTabs} from '../ChangesTabs'
import {EventsInspector} from '../EventsInspector'

const {settleChromaticEndState} = testHelpers()

const article = defineType({
  name: 'article',
  type: 'document',
  title: 'Article',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({
      name: 'author',
      type: 'object',
      fields: [
        defineField({name: 'name', type: 'string'}),
        defineField({name: 'role', type: 'string'}),
      ],
    }),
  ],
})

const schemaTypes = [article]

const DOCUMENT_ID = 'article-1'
const DRAFT_ID = `drafts.${DOCUMENT_ID}`
const AUTHOR = 'doug'
const CREATED_AT = '2020-06-15T12:00:00.000Z'
const EDITED_AT = '2020-07-01T12:00:00.000Z'
const PUBLISHED_AT = '2020-07-20T12:00:00.000Z'

const previous: SanityDocument = {
  _id: DOCUMENT_ID,
  _type: 'article',
  _createdAt: CREATED_AT,
  _updatedAt: CREATED_AT,
  _rev: 'rev-created',
  title: 'Old title',
  author: {name: 'Ann', role: 'Editor'},
}

const current: SanityDocument = {
  ...previous,
  _updatedAt: PUBLISHED_AT,
  _rev: 'rev-published',
  title: 'New title',
  author: {name: 'Anna', role: 'Writer'},
}

const annotation: AnnotationDetails = {author: AUTHOR, timestamp: PUBLISHED_AT}
const rootDiff = diffInput(wrap(previous, annotation), wrap(current, annotation)) as ObjectDiff

const publishEvent: DocumentGroupEvent = {
  id: 'rev-published',
  type: 'publishDocumentVersion',
  timestamp: PUBLISHED_AT,
  author: AUTHOR,
  documentVariantType: 'published',
  documentId: DOCUMENT_ID,
  revisionId: 'rev-published',
  versionId: DRAFT_ID,
  versionRevisionId: 'rev-edited',
  publishCause: 'document.publish',
}

const editEvent: DocumentGroupEvent = {
  id: 'rev-edited',
  type: 'editDocumentVersion',
  timestamp: EDITED_AT,
  author: AUTHOR,
  contributors: [AUTHOR],
  documentVariantType: 'draft',
  documentId: DRAFT_ID,
  revisionId: 'rev-edited',
  transactions: [
    {type: 'editTransaction', author: AUTHOR, timestamp: EDITED_AT, revisionId: 'rev-edited'},
  ],
}

const createEvent: DocumentGroupEvent = {
  id: 'rev-created',
  type: 'createDocumentVersion',
  timestamp: CREATED_AT,
  author: AUTHOR,
  documentVariantType: 'draft',
  documentId: DRAFT_ID,
  versionId: DRAFT_ID,
  versionRevisionId: 'rev-created',
}

const events = [publishEvent, editEvent, createEvent]

function noop() {}

function eventsStore(overrides: Partial<EventsStore> = {}): EventsStore {
  return {
    events,
    nextCursor: null,
    loading: false,
    error: null,
    revision: {revisionId: publishEvent.id, loading: false, document: current},
    sinceRevision: {revisionId: createEvent.id, loading: false, document: previous},
    findRangeForRevision: () => [null, null],
    findRangeForSince: () => [null, null],
    loadMoreEvents: noop,
    getChangesList: () => of({diff: rootDiff, loading: false, error: null}),
    expandEvent: () => Promise.resolve(),
    lastNonDeletedRevId: publishEvent.id,
    getDocumentAtRevision: () => of(null),
    ...overrides,
  }
}

const rangeSelected = eventsStore()
const sameRevisionSelected = eventsStore({
  sinceRevision: {revisionId: publishEvent.id, loading: false, document: current},
})
const nothingChanged = eventsStore({
  getChangesList: () => of({diff: null, loading: false, error: null}),
})

/* oxlint-disable typescript/no-deprecated -- the legacy inspector still reads the deprecated document timeline */
function chunk(index: number, type: Chunk['type'], id: string, timestamp: string): Chunk {
  return {
    index,
    id,
    type,
    start: index,
    end: index + 1,
    startTimestamp: timestamp,
    endTimestamp: timestamp,
    authors: new Set([AUTHOR]),
    draftState: type === 'publish' ? 'missing' : 'present',
    publishedState: type === 'publish' ? 'present' : 'missing',
  }
}

const publishChunk = chunk(0, 'publish', 'rev-published', PUBLISHED_AT)
const createChunk = chunk(2, 'create', 'rev-created', CREATED_AT)
const chunks = [publishChunk, chunk(1, 'editDraft', 'rev-edited', EDITED_AT), createChunk]

const legacyState: TimelineState = {
  chunks,
  diff: rootDiff,
  hasMoreChunks: false,
  isLoading: false,
  isPristine: false,
  lastNonDeletedRevId: publishChunk.id,
  onOlderRevision: false,
  realRevChunk: publishChunk,
  revTime: publishChunk,
  selectionState: 'range',
  sinceAttributes: null,
  sinceTime: createChunk,
  timelineDisplayed: null,
  timelineReady: true,
}

const legacyTimelineStore: TimelineStore = {
  findRangeForRev: () => [null, null],
  findRangeForSince: (since) => [since.id, null],
  loadMore: noop,
  getSnapshot: () => legacyState,
  subscribe: () => noop,
}

const legacyFeatures = {eventsAPI: {documents: false}}
/* oxlint-enable typescript/no-deprecated */

const draftsPerspective: PerspectiveContextValue = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts',
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
  selectedVariantNames: [],
  selectedVariants: [],
  // oxlint-disable-next-line typescript/no-deprecated -- the context value still carries it
  selectedVariantName: undefined,
  // oxlint-disable-next-line typescript/no-deprecated -- the context value still carries it
  selectedVariant: undefined,
  bundle: 'drafts',
}

// `useDocumentOperation` (the revert buttons) reads the active workspace; `TestWrapper` mounts
// no matcher.
const activeWorkspace = {
  activeWorkspace: {name: 'default', projectId: 'test', dataset: 'test'} as WorkspaceSummary,
  setActiveWorkspace: noop,
}

function BackLink({children}: {children?: ReactNode}) {
  return <a href="#back">{children}</a>
}

const paneRouter: PaneRouterContextValue = {
  index: 1,
  groupIndex: 1,
  siblingIndex: 0,
  payload: undefined,
  params: {inspect: HISTORY_INSPECTOR_NAME},
  hasGroupSiblings: false,
  groupLength: 1,
  routerPanesState: [],
  BackLink,
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

const reviewTabRouter: PaneRouterContextValue = {
  ...paneRouter,
  params: {...paneRouter.params, changesInspectorTab: 'review'},
}

// The inspector sizes its lists from the height of their scroll container, so the harness gives
// it a bounded box the way the inspector panel does.
const inspectorBox = {height: 560, width: 380}

interface InspectorHarnessProps {
  children: ReactNode
  pane?: Partial<DocumentPaneContextValue>
  router?: PaneRouterContextValue
}

function InspectorHarness(props: InspectorHarnessProps) {
  const {children, pane, router = paneRouter} = props
  const schemaType = useSchema().get('article') as ObjectSchemaType
  const value = {
    documentId: DOCUMENT_ID,
    documentType: 'article',
    schemaType,
    ready: true,
    value: current,
    displayed: current,
    formState: null,
    timelineError: null,
    setTimelineRange: noop,
    ...pane,
  } as DocumentPaneContextValue

  return (
    <LocaleProvider>
      <ActiveWorkspaceMatcherContext value={activeWorkspace}>
        <PerspectiveContext value={draftsPerspective}>
          <PaneRouterContext value={router}>
            <DocumentPaneInfoContext value={value}>
              <DocumentPaneContext value={value}>
                <div style={inspectorBox}>{children}</div>
              </DocumentPaneContext>
            </DocumentPaneInfoContext>
          </PaneRouterContext>
        </PerspectiveContext>
      </ActiveWorkspaceMatcherContext>
    </LocaleProvider>
  )
}

describe('ChangesTabs', () => {
  it('opens on the history tab with the document events', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <InspectorHarness>
          <EventsProvider value={rangeSelected}>
            <ChangesTabs documentId={DOCUMENT_ID} documentType="article" onClose={noop} />
          </EventsProvider>
        </InspectorHarness>
      </TestWrapper>,
    )

    await expect
      .element(page.getByRole('tab', {name: 'History'}))
      .toHaveAttribute('aria-selected', 'true')
    await expect.element(page.getByRole('tab', {name: 'Review changes'})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Close history'})).toBeVisible()
    await expect.element(page.getByText(/Showing the history for the/)).toBeVisible()

    const list = page.getByRole('listbox', {name: 'Document revisions'})
    await expect.element(page.getByTestId('timeline-item-button').nth(2)).toBeVisible()
    await expect.element(list).toMatchTextContent(/Published/)
    await expect.element(list).toMatchTextContent(/Jul 20, 2020/)
    await settleChromaticEndState()
  })

  it('reviews the changes between the selected events', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <InspectorHarness router={reviewTabRouter}>
          <EventsProvider value={rangeSelected}>
            <ChangesTabs documentId={DOCUMENT_ID} documentType="article" onClose={noop} />
          </EventsProvider>
        </InspectorHarness>
      </TestWrapper>,
    )

    await expect
      .element(page.getByRole('tab', {name: 'Review changes'}))
      .toHaveAttribute('aria-selected', 'true')

    const pane = page.getByTestId('review-changes-pane')
    await expect.element(pane.getByText('From', {exact: true})).toBeVisible()
    await expect.element(pane.getByText('To', {exact: true})).toBeVisible()
    await expect
      .element(page.getByTestId('timeline-menu-open-button').first())
      .toMatchTextContent(/Draft created: Jun 15, 2020/)
    await expect
      .element(page.getByTestId('timeline-menu-open-button').last())
      .toMatchTextContent(/Published: Jul 20, 2020/)
    await expect.element(pane.getByText('Title', {exact: true})).toBeVisible()
    await expect.element(pane.getByText('Author', {exact: true})).toBeVisible()
    await expect.element(pane.getByText('Role', {exact: true})).toBeVisible()
    await settleChromaticEndState()
  })
})

describe('EventsInspector', () => {
  it('points out when both ends of the range are the same event', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <InspectorHarness router={reviewTabRouter}>
          <EventsProvider value={sameRevisionSelected}>
            <EventsInspector showChanges />
          </EventsProvider>
        </InspectorHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByRole('heading', {name: 'Same revision selected'})).toBeVisible()
    await settleChromaticEndState()
  })

  it('reports a range without changes', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <InspectorHarness router={reviewTabRouter}>
          <EventsProvider value={nothingChanged}>
            <EventsInspector showChanges />
          </EventsProvider>
        </InspectorHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByText('There are no changes')).toBeVisible()
    await settleChromaticEndState()
  })
})

describe('ChangesInspector (legacy)', () => {
  it('reviews the changes between the selected chunks', async () => {
    /* oxlint-disable typescript/no-deprecated -- opts into the deprecated legacy document timeline */
    await render(
      <TestWrapper schemaTypes={schemaTypes} betaFeatures={legacyFeatures}>
        <InspectorHarness router={reviewTabRouter} pane={{timelineStore: legacyTimelineStore}}>
          <ChangesInspector showChanges />
        </InspectorHarness>
      </TestWrapper>,
    )
    /* oxlint-enable typescript/no-deprecated */

    const pane = page.getByTestId('review-changes-pane')
    await expect.element(pane.getByText('From', {exact: true})).toBeVisible()
    await expect.element(pane.getByText('To', {exact: true})).toBeVisible()
    await expect
      .element(page.getByTestId('timeline-menu-open-button').first())
      .toMatchTextContent(/Jun 15, 2020/)
    await expect
      .element(page.getByTestId('timeline-menu-open-button').last())
      .toMatchTextContent(/Published: Jul 20, 2020/)
    await expect.element(pane.getByText('Title', {exact: true})).toBeVisible()
    await expect.element(pane.getByText('Author', {exact: true})).toBeVisible()
    await settleChromaticEndState()
  })
})
