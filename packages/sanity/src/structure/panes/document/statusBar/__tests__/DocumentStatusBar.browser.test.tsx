import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {type ReactNode} from 'react'
import {of} from 'rxjs'
import type * as SanityExports from 'sanity'
import {
  type Chunk,
  type DocumentGroupEvent,
  type EditStateFor,
  EventsProvider,
  type EventsStore,
  LocaleProvider,
  type PerspectiveContextValue,
  type SanityDocument,
  type TimelineState,
  type TimelineStore,
  useActiveReleases,
  useArchivedReleases,
  useDocumentVersions,
  useSchema,
  useSyncState,
  type VersionInfoDocumentStub,
} from 'sanity'
import {
  DocumentActionsStateContext,
  DocumentPaneContext,
  DocumentPaneInfoContext,
  PaneRouterContext,
  PerspectiveContext,
  SingleDocReleaseContext,
} from 'sanity/_singletons'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type PaneRouterContextValue} from '../../../../components/paneRouter/types'
import {type ResolvedAction} from '../../../../components/RenderActionCollectionState'
import {type DocumentPaneContextValue} from '../../DocumentPaneContext'
import {DocumentStatusBarActions} from '../DocumentStatusBarActions'
import {DocumentStatusLine} from '../DocumentStatusLine'
import {RevisionStatusLine} from '../RevisionStatusLine'

// Mocked at the module so the core hooks that read releases and versions see the fixtures too.
vi.mock('../../../../../core/releases/store/useActiveReleases', async (importOriginal) => {
  const actual = await importOriginal<{useActiveReleases: typeof useActiveReleases}>()
  return {...actual, useActiveReleases: vi.fn(actual.useActiveReleases)}
})
vi.mock('../../../../../core/releases/store/useArchivedReleases', async (importOriginal) => {
  const actual = await importOriginal<{useArchivedReleases: typeof useArchivedReleases}>()
  return {...actual, useArchivedReleases: vi.fn(actual.useArchivedReleases)}
})
vi.mock('../../../../../core/releases/hooks/useDocumentVersions', async (importOriginal) => {
  const actual = await importOriginal<{useDocumentVersions: typeof useDocumentVersions}>()
  return {...actual, useDocumentVersions: vi.fn(actual.useDocumentVersions)}
})
// The sync state reads the document pair's consistency over the network; the status line only
// needs a settled answer.
vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof SanityExports>()
  return {...actual, useSyncState: vi.fn(actual.useSyncState)}
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
const AUTHOR = 'doug'
const CREATED_AT = '2020-06-15T12:00:00.000Z'
const PUBLISHED_AT = '2020-07-20T12:00:00.000Z'

const published: SanityDocument = {
  _id: DOCUMENT_ID,
  _type: 'article',
  _createdAt: CREATED_AT,
  _updatedAt: PUBLISHED_AT,
  _rev: 'rev-published',
  title: 'Hello world',
}

const editState: EditStateFor = {
  id: DOCUMENT_ID,
  type: 'article',
  transactionSyncLock: null,
  draft: null,
  published,
  version: null,
  liveEdit: false,
  liveEditSchemaType: false,
  ready: true,
  release: undefined,
  scopeId: undefined,
}

const publishEvent: DocumentGroupEvent = {
  id: 'rev-published',
  type: 'publishDocumentVersion',
  timestamp: PUBLISHED_AT,
  author: AUTHOR,
  documentVariantType: 'published',
  documentId: DOCUMENT_ID,
  revisionId: 'rev-published',
  versionId: `drafts.${DOCUMENT_ID}`,
  versionRevisionId: 'rev-draft',
  publishCause: 'document.publish',
}

const createEvent: DocumentGroupEvent = {
  id: 'rev-draft',
  type: 'createDocumentVersion',
  timestamp: CREATED_AT,
  author: AUTHOR,
  documentVariantType: 'draft',
  documentId: DOCUMENT_ID,
  versionId: `drafts.${DOCUMENT_ID}`,
  versionRevisionId: 'rev-draft',
}

function noop() {}

function eventsStore(
  events: DocumentGroupEvent[],
  overrides: Partial<EventsStore> = {},
): EventsStore {
  return {
    events,
    nextCursor: null,
    loading: false,
    error: null,
    revision: null,
    sinceRevision: null,
    findRangeForRevision: () => [null, null],
    findRangeForSince: () => [null, null],
    loadMoreEvents: noop,
    getChangesList: () => of({diff: null, loading: false, error: null}),
    expandEvent: () => Promise.resolve(),
    lastNonDeletedRevId: null,
    getDocumentAtRevision: () => of(null),
    ...overrides,
  }
}

/* oxlint-disable typescript/no-deprecated -- the status line still renders the deprecated legacy document timeline */
const publishChunk: Chunk = {
  index: 0,
  id: 'rev-published',
  type: 'publish',
  start: 0,
  end: 1,
  startTimestamp: PUBLISHED_AT,
  endTimestamp: PUBLISHED_AT,
  authors: new Set([AUTHOR]),
  draftState: 'missing',
  publishedState: 'present',
}

function timelineStore(chunks: Chunk[]): TimelineStore {
  const state: TimelineState = {
    chunks,
    diff: null,
    hasMoreChunks: false,
    isLoading: false,
    isPristine: chunks.length === 0,
    lastNonDeletedRevId: chunks[0]?.id ?? null,
    onOlderRevision: false,
    realRevChunk: null,
    revTime: null,
    selectionState: 'inactive',
    sinceAttributes: null,
    sinceTime: null,
    timelineDisplayed: null,
    timelineReady: true,
  }
  return {
    findRangeForRev: () => [null, null],
    findRangeForSince: (since) => [since.id, null],
    loadMore: noop,
    getSnapshot: () => state,
    subscribe: () => noop,
  }
}
/* oxlint-enable typescript/no-deprecated */

const publishedStub = {
  _id: DOCUMENT_ID,
  _rev: 'rev-published',
  _type: 'article',
  _createdAt: CREATED_AT,
  _updatedAt: PUBLISHED_AT,
  _system: {bundleId: 'published', group: {_ref: DOCUMENT_ID, _weak: true}},
} as VersionInfoDocumentStub

const PUBLISH_ACTION: ResolvedAction = {
  label: 'Publish',
  icon: PublishIcon,
  onHandle: noop,
  action: 'publish',
  shortcut: 'Ctrl+Alt+P',
  title: 'Publish the latest changes',
}
const UNPUBLISH_ACTION: ResolvedAction = {
  label: 'Unpublish',
  icon: UnpublishIcon,
  onHandle: noop,
  action: 'unpublish',
}
const DELETE_ACTION: ResolvedAction = {
  label: 'Delete',
  icon: TrashIcon,
  onHandle: noop,
  action: 'delete',
  tone: 'critical',
}

const ALL_ACTIONS = [PUBLISH_ACTION, UNPUBLISH_ACTION, DELETE_ACTION]
const PUBLISH_AND_DELETE = [PUBLISH_ACTION, DELETE_ACTION]

const publishedEvents = eventsStore([publishEvent, createEvent])
const noEvents = eventsStore([])
const draftRevisionSelected = eventsStore([publishEvent, createEvent], {
  revision: {revisionId: 'rev-draft', loading: false, document: published},
})

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

function BackLink({children}: {children?: ReactNode}) {
  return <a href="#back">{children}</a>
}

const paneRouter: PaneRouterContextValue = {
  index: 1,
  groupIndex: 1,
  siblingIndex: 0,
  payload: undefined,
  params: {},
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

const singleDocRelease = {onSetScheduledDraftPerspective: noop}

interface StatusBarHarnessProps {
  children: ReactNode
  pane?: Partial<DocumentPaneContextValue>
  router?: Partial<PaneRouterContextValue>
}

function StatusBarHarness(props: StatusBarHarnessProps) {
  const {children, pane, router} = props
  const schemaType = useSchema().get('article') as ObjectSchemaType
  const value = {
    documentId: DOCUMENT_ID,
    documentType: 'article',
    schemaType,
    ready: true,
    connectionState: 'connected',
    value: published,
    displayed: published,
    editState,
    isDocumentGroupInventoryActive: false,
    setIsDocumentGroupInventoryActive: noop,
    onHistoryOpen: noop,
    onHistoryClose: noop,
    inspector: null,
    targetDocumentState: {
      status: 'ready',
      targetDocument: published,
      scopeId: undefined,
      variant: undefined,
      siblings: {published, draft: undefined, version: undefined},
    },
    ...pane,
  } as DocumentPaneContextValue

  return (
    <LocaleProvider>
      <PerspectiveContext value={draftsPerspective}>
        <SingleDocReleaseContext value={singleDocRelease}>
          <PaneRouterContext value={{...paneRouter, ...router}}>
            <DocumentPaneInfoContext value={value}>
              <DocumentPaneContext value={value}>{children}</DocumentPaneContext>
            </DocumentPaneInfoContext>
          </PaneRouterContext>
        </SingleDocReleaseContext>
      </PerspectiveContext>
    </LocaleProvider>
  )
}

function mockStores() {
  vi.mocked(useActiveReleases).mockReturnValue({
    data: [],
    byId: new Map(),
    error: undefined,
    loading: false,
    dispatch: noop,
  })
  vi.mocked(useArchivedReleases).mockReturnValue({data: [], error: undefined, loading: false})
  vi.mocked(useDocumentVersions).mockReturnValue({
    data: [DOCUMENT_ID],
    versions: [publishedStub],
    error: null,
    loading: false,
  })
  vi.mocked(useSyncState).mockReturnValue({isSyncing: false})
}

afterEach(() => {
  vi.mocked(useActiveReleases).mockReset()
  vi.mocked(useArchivedReleases).mockReset()
  vi.mocked(useDocumentVersions).mockReset()
  vi.mocked(useSyncState).mockReset()
})

describe('DocumentStatusBarActions', () => {
  it('renders the primary action as a button and the rest in a menu', async () => {
    mockStores()

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <StatusBarHarness>
          <DocumentActionsStateContext.Provider value={ALL_ACTIONS}>
            <DocumentStatusBarActions />
          </DocumentActionsStateContext.Provider>
        </StatusBarHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByTestId('action-publish')).toBeEnabled()
    await expect.element(page.getByTestId('action-menu-button')).toBeEnabled()

    await page.getByTestId('action-menu-button').click()

    await expect.element(page.getByTestId('action-Unpublish')).toBeVisible()
    await expect.element(page.getByTestId('action-Delete')).toBeVisible()
    await settleChromaticEndState()
    await expect.element(page.getByTestId('action-Delete')).toBeVisible()
  })

  it('disables the actions while the document is reconnecting', async () => {
    mockStores()

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <StatusBarHarness pane={{connectionState: 'reconnecting'}}>
          <DocumentActionsStateContext.Provider value={PUBLISH_AND_DELETE}>
            <DocumentStatusBarActions />
          </DocumentActionsStateContext.Provider>
        </StatusBarHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByTestId('action-publish')).toBeDisabled()
    await expect.element(page.getByTestId('action-menu-button')).toBeDisabled()
    await settleChromaticEndState()
  })
})

describe('DocumentStatusLine', () => {
  it('shows the latest event with its author', async () => {
    mockStores()

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <StatusBarHarness>
          <EventsProvider value={publishedEvents}>
            <DocumentStatusLine />
          </EventsProvider>
        </StatusBarHarness>
      </TestWrapper>,
    )

    const status = page.getByTestId('pane-footer-document-status')
    await expect.element(status).toMatchTextContent(/Last published/)
    await expect.element(status).toMatchTextContent(/Jul 20, 2020/)
    await expect.element(status.getByRole('img', {name: 'Doug'})).toBeVisible()
    await settleChromaticEndState()
  })

  it('falls back to the edit state when the document has no events', async () => {
    mockStores()

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <StatusBarHarness
          pane={{
            editState: {
              ...editState,
              published: null,
              draft: {...published, _id: `drafts.${DOCUMENT_ID}`, _createdAt: CREATED_AT},
            },
          }}
        >
          <EventsProvider value={noEvents}>
            <DocumentStatusLine />
          </EventsProvider>
        </StatusBarHarness>
      </TestWrapper>,
    )

    const status = page.getByTestId('pane-footer-document-status')
    await expect.element(status).toMatchTextContent(/Edited/)
    await expect.element(status).toMatchTextContent(/Jul 20, 2020/)
    await settleChromaticEndState()
  })

  it('reads the legacy timeline store when the events API is off', async () => {
    mockStores()

    await render(
      /* oxlint-disable typescript/no-deprecated -- opts into the deprecated legacy document timeline */
      <TestWrapper schemaTypes={schemaTypes} betaFeatures={{eventsAPI: {documents: false}}}>
        <StatusBarHarness pane={{timelineStore: timelineStore([publishChunk])}}>
          <DocumentStatusLine />
        </StatusBarHarness>
      </TestWrapper>,
      /* oxlint-enable typescript/no-deprecated */
    )

    const status = page.getByTestId('pane-footer-document-status')
    await expect.element(status).toMatchTextContent(/Last published/)
    await expect.element(status).toMatchTextContent(/Jul 20, 2020/)
    await expect.element(status.getByRole('img', {name: 'Doug'})).toBeVisible()
    await settleChromaticEndState()
  })
})

describe('RevisionStatusLine', () => {
  it('dates the selected revision from its event', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <StatusBarHarness>
          <EventsProvider value={draftRevisionSelected}>
            <RevisionStatusLine />
          </EventsProvider>
        </StatusBarHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByText(/Revision from/)).toBeVisible()
    await expect.element(page.getByText(/Jun 15, 2020/)).toBeVisible()
    await settleChromaticEndState()
  })

  it('reports a revision that could not be found', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <StatusBarHarness pane={{revisionNotFound: true}}>
          <RevisionStatusLine />
        </StatusBarHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByText('Revision not found')).toBeVisible()
    await settleChromaticEndState()
  })
})
