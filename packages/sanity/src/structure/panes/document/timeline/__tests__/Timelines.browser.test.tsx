import {type ReleaseDocument} from '@sanity/client'
import {type SchemaTypeDefinition} from '@sanity/types'
import {type ReactNode} from 'react'
import {
  type Chunk,
  type DocumentGroupEvent,
  LocaleProvider,
  type PublishDocumentVersionEvent,
  useAllReleases,
} from 'sanity'
import {PaneRouterContext} from 'sanity/_singletons'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type PaneRouterContextValue} from '../../../../components/paneRouter/types'
import {EventsTimeline} from '../events/EventsTimeline'
import {PublishedEventMenu} from '../events/PublishedEventMenu'
import {Timeline} from '../timeline'

// Mocked at the module so the core event row that renders the release badge sees the fixture too.
vi.mock('../../../../../core/releases/store/useAllReleases', async (importOriginal) => {
  const actual = await importOriginal<{useAllReleases: typeof useAllReleases}>()
  return {...actual, useAllReleases: vi.fn(actual.useAllReleases)}
})

const {settleChromaticEndState} = testHelpers()

const DOCUMENT_ID = 'article-1'
const DRAFT_ID = `drafts.${DOCUMENT_ID}`
const AUTHOR = 'doug'
const CREATED_AT = '2020-06-15T12:00:00.000Z'
const EDITED_AT = '2020-07-01T12:00:00.000Z'
const PUBLISHED_AT = '2020-07-20T12:00:00.000Z'
const LIST_MAX_HEIGHT = '400px'

const schemaTypes: SchemaTypeDefinition[] = []

const springRelease: ReleaseDocument = {
  _id: '_.releases.rSpring',
  _type: 'system.release',
  _rev: 'rev-spring',
  _createdAt: CREATED_AT,
  _updatedAt: CREATED_AT,
  name: 'rSpring',
  state: 'active',
  metadata: {title: 'Spring', releaseType: 'asap'},
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

const draftPublishEvent: PublishDocumentVersionEvent = {
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

const releasePublishEvent: PublishDocumentVersionEvent = {
  ...draftPublishEvent,
  id: 'rev-release-published',
  revisionId: 'rev-release-published',
  versionId: `versions.rSpring.${DOCUMENT_ID}`,
  versionRevisionId: undefined,
  releaseId: 'rSpring',
  publishCause: 'release.publish',
}

const publishedEvents = [draftPublishEvent, editEvent, createEvent]

// Seen from the draft: the publish squashes the edits it contains until the row is expanded.
const draftPublishWithChildren: PublishDocumentVersionEvent = {
  ...draftPublishEvent,
  documentVariantType: 'draft',
  documentId: DRAFT_ID,
  creationEvent: {...createEvent, parentId: 'rev-published'},
}
const draftEvents: DocumentGroupEvent[] = [
  draftPublishWithChildren,
  {...editEvent, parentId: 'rev-published'},
  {...createEvent, parentId: 'rev-published'},
]

const noEvents: DocumentGroupEvent[] = []

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
const publishedChunks: Chunk[] = [
  publishChunk,
  chunk(1, 'editDraft', 'rev-edited-2', EDITED_AT),
  chunk(2, 'editDraft', 'rev-edited-1', EDITED_AT),
  chunk(3, 'create', 'rev-created', CREATED_AT),
]
const noChunks: Chunk[] = []

function noop() {}

// The expand control is an icon-only button whose label lives in its tooltip, so it has no
// accessible name to query by; the chevron it renders carries the expanded state.
function expandButton() {
  const button = document.querySelector('[data-expanded]')?.closest('button')
  if (!button) throw new Error('The expand button is not rendered')
  return page.elementLocator(button)
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

function TimelineHarness({children}: {children: ReactNode}) {
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <LocaleProvider>
        <PaneRouterContext value={paneRouter}>{children}</PaneRouterContext>
      </LocaleProvider>
    </TestWrapper>
  )
}

function mockReleases(releases: ReleaseDocument[]) {
  vi.mocked(useAllReleases).mockReturnValue({
    data: releases,
    map: new Map(releases.map((release) => [release._id, release])),
    error: undefined,
    loading: false,
  })
}

afterEach(() => {
  vi.mocked(useAllReleases).mockReset()
})

describe('EventsTimeline', () => {
  it('lists the document events with the publish row selected', async () => {
    mockReleases([])

    await render(
      <TimelineHarness>
        <EventsTimeline
          events={publishedEvents}
          hasMoreEvents={false}
          selectedEventId={draftPublishEvent.id}
          onLoadMore={noop}
          onSelect={noop}
          fetchEventChildren={() => Promise.resolve()}
          listMaxHeight={LIST_MAX_HEIGHT}
        />
      </TimelineHarness>,
    )

    const list = page.getByRole('listbox', {name: 'Document revisions'})
    await expect.element(list).toBeVisible()
    await expect.element(page.getByTestId('timeline-item-button').nth(2)).toBeVisible()
    await expect.element(list).toMatchTextContent(/Published/)
    await expect.element(list).toMatchTextContent(/Draft/)
    await expect.element(list).toMatchTextContent(/Jul 20, 2020/)
    await expect.element(list).toMatchTextContent(/Edited/)
    await expect.element(list).toMatchTextContent(/Draft created/)
    await expect.element(page.getByRole('button', {name: 'Open action menu'})).toBeVisible()
    await settleChromaticEndState()
  })

  it('expands the edits a draft publish squashed', async () => {
    mockReleases([])
    const fetchEventChildren = vi.fn(() => Promise.resolve())

    await render(
      <TimelineHarness>
        <EventsTimeline
          events={draftEvents}
          hasMoreEvents={false}
          onLoadMore={noop}
          onSelect={noop}
          fetchEventChildren={fetchEventChildren}
          listMaxHeight={LIST_MAX_HEIGHT}
        />
      </TimelineHarness>,
    )

    const list = page.getByRole('listbox', {name: 'Document revisions'})
    await expect.element(page.getByTestId('timeline-item-button').nth(1)).toBeVisible()
    await expect.element(list).not.toMatchTextContent(/Edited/)

    await expandButton().click()

    await expect.element(list).toMatchTextContent(/Edited/)
    await expect.element(page.getByTestId('timeline-item-button').nth(2)).toBeVisible()
    expect(fetchEventChildren).toHaveBeenCalledTimes(1)
    await settleChromaticEndState()
  })

  it('explains an empty history', async () => {
    mockReleases([])

    await render(
      <TimelineHarness>
        <EventsTimeline
          events={noEvents}
          hasMoreEvents={false}
          onLoadMore={noop}
          onSelect={noop}
          fetchEventChildren={() => Promise.resolve()}
          listMaxHeight={LIST_MAX_HEIGHT}
        />
      </TimelineHarness>,
    )

    await expect.element(page.getByText('No document history')).toBeVisible()
    await settleChromaticEndState()
  })
})

describe('PublishedEventMenu', () => {
  it('offers to open the draft behind a draft publish', async () => {
    mockReleases([])

    await render(
      <TimelineHarness>
        <PublishedEventMenu event={draftPublishEvent} />
      </TimelineHarness>,
    )

    await page.getByRole('button', {name: 'Open action menu'}).click()

    const item = page.getByRole('menuitem', {name: /Open draft document/})
    await expect.element(item).toBeVisible()
    await expect.element(item).toBeEnabled()
    await settleChromaticEndState()
    await expect.element(item).toBeVisible()
  })

  it('links a release publish to its release', async () => {
    mockReleases([springRelease])

    await render(
      <TimelineHarness>
        <PublishedEventMenu event={releasePublishEvent} />
      </TimelineHarness>,
    )

    await page.getByRole('button', {name: 'Open action menu'}).click()

    await expect.element(page.getByRole('menuitem', {name: /Open Spring release/})).toBeVisible()
    await expect
      .element(page.getByRole('menuitem', {name: /Inspect Spring document/}))
      .toBeVisible()
    await settleChromaticEndState()
    await expect.element(page.getByRole('menuitem', {name: /Open Spring release/})).toBeVisible()
  })
})

describe('Timeline (legacy)', () => {
  it('collapses the edits behind a publish until expanded', async () => {
    await render(
      <TimelineHarness>
        <Timeline
          chunks={publishedChunks}
          hasMoreChunks={false}
          lastChunk={publishChunk}
          onLoadMore={noop}
          onSelect={noop}
          listMaxHeight={LIST_MAX_HEIGHT}
        />
      </TimelineHarness>,
    )

    const list = page.getByRole('listbox', {name: 'Document revisions'})
    await expect.element(page.getByTestId('timeline-item-button').nth(1)).toBeVisible()
    await expect.element(list).toMatchTextContent(/Published/)
    await expect.element(list).toMatchTextContent(/Created/)
    await expect.element(list).not.toMatchTextContent(/Edited/)

    await expandButton().click()

    await expect.element(list).toMatchTextContent(/Edited/)
    await expect.element(page.getByTestId('timeline-item-button').nth(3)).toBeVisible()
    await settleChromaticEndState()
  })

  it('explains an empty history', async () => {
    await render(
      <TimelineHarness>
        <Timeline
          chunks={noChunks}
          hasMoreChunks={false}
          onLoadMore={noop}
          onSelect={noop}
          listMaxHeight={LIST_MAX_HEIGHT}
        />
      </TimelineHarness>,
    )

    await expect.element(page.getByText('No document history')).toBeVisible()
    await settleChromaticEndState()
  })
})
