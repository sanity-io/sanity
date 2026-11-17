import {type ReleaseDocument} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import {type ReactNode} from 'react'
import {
  type EditStateFor,
  getVersionFromId,
  LocaleProvider,
  type PerspectiveContextValue,
  useActiveReleases,
  useArchivedReleases,
  useDocumentVersions,
  type VersionInfoDocumentStub,
} from 'sanity'
import {
  DocumentPaneContext,
  DocumentPaneInfoContext,
  PaneRouterContext,
  PerspectiveContext,
  SingleDocReleaseContext,
} from 'sanity/_singletons'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {type PaneRouterContextValue} from '../../../../../../components/paneRouter/types'
import {type DocumentPaneContextValue} from '../../../../DocumentPaneContext'
import {DocumentPerspectiveList} from '../DocumentPerspectiveList'

// Mocked at the module so the core hooks that read releases and versions see the fixtures too.
vi.mock('../../../../../../../core/releases/store/useActiveReleases', async (importOriginal) => {
  const actual = await importOriginal<{useActiveReleases: typeof useActiveReleases}>()
  return {...actual, useActiveReleases: vi.fn(actual.useActiveReleases)}
})
vi.mock('../../../../../../../core/releases/store/useArchivedReleases', async (importOriginal) => {
  const actual = await importOriginal<{useArchivedReleases: typeof useArchivedReleases}>()
  return {...actual, useArchivedReleases: vi.fn(actual.useArchivedReleases)}
})
vi.mock('../../../../../../../core/releases/hooks/useDocumentVersions', async (importOriginal) => {
  const actual = await importOriginal<{useDocumentVersions: typeof useDocumentVersions}>()
  return {...actual, useDocumentVersions: vi.fn(actual.useDocumentVersions)}
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
const UPDATED_AT = '2025-01-03T12:00:00Z'
const FAR_FUTURE = '2099-06-15T12:00:00.000Z'

function release(
  id: string,
  metadata: Partial<ReleaseDocument['metadata']> & {title: string},
  overrides: Partial<ReleaseDocument> = {},
): ReleaseDocument {
  return {
    _id: `_.releases.${id}`,
    _type: 'system.release',
    _rev: `rev-${id}`,
    _createdAt: CREATED_AT,
    _updatedAt: UPDATED_AT,
    name: id,
    state: 'active',
    metadata: {releaseType: 'asap', ...metadata},
    ...overrides,
  }
}

const springRelease = release('rSpring', {title: 'Spring launch'})
const holidayRelease = release(
  'rHoliday',
  {title: 'Holiday campaign', releaseType: 'scheduled', intendedPublishAt: FAR_FUTURE},
  {state: 'scheduled', publishAt: FAR_FUTURE},
)
const undecidedRelease = release('rUndecided', {
  title: 'Someday maybe',
  releaseType: 'undecided',
})

function doc(id: string) {
  return {_id: id, _type: 'article', _createdAt: CREATED_AT, _updatedAt: UPDATED_AT, _rev: 'rev-1'}
}

function versionStub(id: string): VersionInfoDocumentStub {
  const bundleId = getVersionFromId(id)
  const releaseRef = releaseIds.has(bundleId ?? '')
    ? {release: {_ref: `_.releases.${bundleId}`, _weak: true as const}}
    : {}
  return {
    ...doc(id),
    _system: {bundleId, group: {_ref: DOCUMENT_ID, _weak: true}, ...releaseRef},
  }
}

const releaseIds = new Set([springRelease.name, holidayRelease.name, undecidedRelease.name])

const versionIds = [
  DOCUMENT_ID,
  `drafts.${DOCUMENT_ID}`,
  `versions.rSpring.${DOCUMENT_ID}`,
  `versions.rHoliday.${DOCUMENT_ID}`,
  `versions.sCopyEdit.${DOCUMENT_ID}`,
]

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

function releasePerspective(releaseDocument: ReleaseDocument): PerspectiveContextValue {
  const releaseId = releaseDocument.name
  return {
    ...draftsPerspective,
    selectedPerspectiveName: releaseId,
    selectedReleaseId: releaseId,
    selectedPerspective: releaseDocument,
    perspectiveStack: [releaseId, 'drafts'],
    bundle: releaseId,
  }
}

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

const singleDocRelease = {onSetScheduledDraftPerspective: noop}

function editState(overrides: Partial<EditStateFor>): EditStateFor {
  return {
    id: DOCUMENT_ID,
    type: 'article',
    transactionSyncLock: null,
    draft: null,
    published: null,
    version: null,
    liveEdit: false,
    liveEditSchemaType: false,
    ready: true,
    release: undefined,
    scopeId: undefined,
    ...overrides,
  }
}

interface ListHarnessProps {
  children: ReactNode
  perspective: PerspectiveContextValue
  pane: Partial<DocumentPaneContextValue>
}

function ListHarness(props: ListHarnessProps) {
  const {children, perspective, pane} = props
  const value = {
    documentId: DOCUMENT_ID,
    documentType: 'article',
    ...pane,
  } as DocumentPaneContextValue

  return (
    <LocaleProvider>
      <PerspectiveContext value={perspective}>
        <SingleDocReleaseContext value={singleDocRelease}>
          <PaneRouterContext value={paneRouter}>
            <DocumentPaneInfoContext value={value}>
              <DocumentPaneContext value={value}>
                <div style={{display: 'flex', gap: 4}}>{children}</div>
              </DocumentPaneContext>
            </DocumentPaneInfoContext>
          </PaneRouterContext>
        </SingleDocReleaseContext>
      </PerspectiveContext>
    </LocaleProvider>
  )
}

function mockDocument(ids: string[]) {
  const releases = [springRelease, holidayRelease, undecidedRelease]
  vi.mocked(useActiveReleases).mockReturnValue({
    data: releases,
    byId: new Map(releases.map((item) => [item._id, item])),
    error: undefined,
    loading: false,
    dispatch: noop,
  })
  vi.mocked(useArchivedReleases).mockReturnValue({data: [], error: undefined, loading: false})
  vi.mocked(useDocumentVersions).mockReturnValue({
    data: ids,
    versions: ids.map(versionStub),
    error: null,
    loading: false,
  })
}

afterEach(() => {
  vi.mocked(useActiveReleases).mockReset()
  vi.mocked(useArchivedReleases).mockReset()
  vi.mocked(useDocumentVersions).mockReset()
})

describe('document perspective list', () => {
  it('lists published, draft and release chips with the release version selected', async () => {
    mockDocument(versionIds)
    const springVersion = doc(`versions.rSpring.${DOCUMENT_ID}`)

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <ListHarness
          perspective={releasePerspective(springRelease)}
          pane={{
            displayed: springVersion,
            editState: editState({
              published: doc(DOCUMENT_ID),
              draft: doc(`drafts.${DOCUMENT_ID}`),
              version: springVersion,
            }),
          }}
        >
          <DocumentPerspectiveList />
        </ListHarness>
      </TestWrapper>,
    )

    for (const name of ['Published', 'Draft', 'Spring launch', 'Holiday campaign']) {
      await expect.element(page.getByRole('button', {name, exact: true})).toBeVisible()
    }
    await expect
      .element(page.getByRole('button', {name: 'Someday maybe', exact: true}))
      .not.toBeInTheDocument()
    await expect.element(page.getByRole('button', {name: '+1 version'})).toBeVisible()
    await settleChromaticEndState()
  })

  it('shows a new document being created in a release', async () => {
    mockDocument([])
    const newVersion = {_id: `versions.rUndecided.${DOCUMENT_ID}`, _type: 'article'}

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <ListHarness
          perspective={releasePerspective(undecidedRelease)}
          pane={{displayed: newVersion, editState: editState({})}}
        >
          <DocumentPerspectiveList />
        </ListHarness>
      </TestWrapper>,
    )

    await expect
      .element(page.getByRole('button', {name: 'Someday maybe', exact: true}))
      .toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Published', exact: true})).toBeDisabled()
    await settleChromaticEndState()
  })
})
