import {takeSnapshot} from '@chromatic-com/vitest'
import {type ReleaseDocument, type SanityDocument} from '@sanity/client'
import {defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {type ReactNode, useMemo} from 'react'
import {BehaviorSubject} from 'rxjs'
import type * as SanityExports from 'sanity'
import {
  type EditStateFor,
  type PerspectiveContextValue,
  type SystemVariant,
  useCanvasCompanionDoc,
  useDocumentStore,
  useDocumentVersions,
  useOnlyHasVersions,
  useSchema,
  useWorkspace,
} from 'sanity'
import {
  ActiveWorkspaceMatcherContext,
  DocumentPaneContext,
  DocumentPaneInfoContext,
  PaneRouterContext,
  PerspectiveContext,
  ResolvedPanesContext,
} from 'sanity/_singletons'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import type * as UseCanvasNavigateModule from '../../../../../../core/canvas/useCanvasNavigate'
import {useCanvasNavigate} from '../../../../../../core/canvas/useCanvasNavigate'
import {type WorkspaceSummary} from '../../../../../../core/config/types'
import {type TargetDocumentState} from '../../../../../../core/hooks/useTargetDocumentState'
import {type VersionInfoDocumentStub} from '../../../../../../core/releases/store/types'
import type * as UseActiveReleasesModule from '../../../../../../core/releases/store/useActiveReleases'
import {useActiveReleases} from '../../../../../../core/releases/store/useActiveReleases'
import type * as UseArchivedReleasesModule from '../../../../../../core/releases/store/useArchivedReleases'
import {useArchivedReleases} from '../../../../../../core/releases/store/useArchivedReleases'
import {type PaneRouterContextValue} from '../../../../../components/paneRouter/types'
import {type Panes} from '../../../../../structureResolvers/useResolvedPanes'
import {type PaneNode} from '../../../../../types'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {ArchivedReleaseDocumentBanner} from '../ArchivedReleaseDocumentBanner'
import {CanvasLinkedBanner} from '../CanvasLinkedBanner'
import {ChooseNewDocumentDestinationBanner} from '../ChooseNewDocumentDestinationBanner'
import {DeletedDocumentBanners} from '../DeletedDocumentBanners'
import {DeprecatedDocumentTypeBanner} from '../DeprecatedDocumentTypeBanner'
import {DocumentNotInReleaseBanner} from '../DocumentNotInReleaseBanner'
import {DocumentNotInVariantBanner} from '../DocumentNotInVariantBanner'
import {InsufficientPermissionBanner} from '../InsufficientPermissionBanner'
import {ObsoleteDraftBanner} from '../ObsoleteDraftBanner'
import {OpenReleaseToEditBanner} from '../OpenReleaseToEditBanner'
import {ReferenceChangedBanner} from '../ReferenceChangedBanner'
import {RevisionNotFoundBanner} from '../RevisionNotFoundBanner'
import {ScheduledDraftOverrideBanner} from '../ScheduledDraftOverrideBanner'
import {ScheduledReleaseBanner} from '../ScheduledReleaseBanner'
import {SeeDraftBanner} from '../SeeDraftBanner'
import {UnpublishedDocumentBanner} from '../UnpublishedDocumentBanner'

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof SanityExports>()
  return {
    ...actual,
    useCanvasCompanionDoc: vi.fn(actual.useCanvasCompanionDoc),
    useDocumentStore: vi.fn(actual.useDocumentStore),
    useDocumentVersions: vi.fn(actual.useDocumentVersions),
    useOnlyHasVersions: vi.fn(actual.useOnlyHasVersions),
  }
})

// The banners import these @internal hooks from their declaring modules, so that is where the
// mocks go; a mock of the `sanity` barrel would not reach them.
vi.mock('../../../../../../core/releases/store/useActiveReleases', async (importOriginal) => {
  const actual = await importOriginal<typeof UseActiveReleasesModule>()
  return {...actual, useActiveReleases: vi.fn(actual.useActiveReleases)}
})
vi.mock('../../../../../../core/releases/store/useArchivedReleases', async (importOriginal) => {
  const actual = await importOriginal<typeof UseArchivedReleasesModule>()
  return {...actual, useArchivedReleases: vi.fn(actual.useArchivedReleases)}
})
vi.mock('../../../../../../core/canvas/useCanvasNavigate', async (importOriginal) => {
  const actual = await importOriginal<typeof UseCanvasNavigateModule>()
  return {...actual, useCanvasNavigate: vi.fn(actual.useCanvasNavigate)}
})

const {settleChromaticEndState} = testHelpers()

const article = defineType({
  name: 'article',
  type: 'document',
  title: 'Article',
  fields: [defineField({name: 'title', type: 'string'})],
})

const legacyArticle = defineType({
  name: 'legacyArticle',
  type: 'document',
  title: 'Legacy article',
  deprecated: {reason: 'Use the Article type instead.'},
  fields: [defineField({name: 'title', type: 'string'})],
})

const schemaTypes = [article, legacyArticle]

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
const summerRelease = release('rSummer', {title: 'Summer sale'})
const autumnRelease = release('rAutumn', {title: 'Autumn refresh'})
const scheduledRelease = release(
  'rScheduled',
  {title: 'Holiday campaign', releaseType: 'scheduled', intendedPublishAt: FAR_FUTURE},
  {state: 'scheduled', publishAt: FAR_FUTURE},
)
const scheduledDraftRelease = release(
  'rScheduledDraft',
  {
    title: 'Scheduled draft',
    releaseType: 'scheduled',
    intendedPublishAt: FAR_FUTURE,
    cardinality: 'one',
  },
  {state: 'scheduled', publishAt: FAR_FUTURE},
)
const archivedRelease = release('rWinter', {title: 'Winter campaign'}, {state: 'archived'})
const publishedRelease = release('rLaunch', {title: 'Product launch'}, {state: 'published'})
const archivedScheduledDraft = release(
  'rArchivedDraft',
  {title: 'Archived scheduled draft', cardinality: 'one'},
  {state: 'archived'},
)

const alphaVariant = {
  _id: '_.variants.alpha-audience',
  _type: 'system.variant',
  _createdAt: CREATED_AT,
  _updatedAt: CREATED_AT,
  _rev: 'rev-alpha-audience',
  conditions: {audience: 'alpha', locale: 'en-US'},
  priority: 2,
  metadata: {title: 'Alpha audience', description: []},
} as SystemVariant

function stub(id: string, bundleId: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: `rev-${bundleId}`,
    _type: 'article',
    _createdAt: CREATED_AT,
    _updatedAt: UPDATED_AT,
    _system: {bundleId, group: {_ref: DOCUMENT_ID, _weak: true}},
  } as VersionInfoDocumentStub
}

function readyState(siblings: {
  published?: VersionInfoDocumentStub
  draft?: VersionInfoDocumentStub
}): TargetDocumentState {
  return {
    status: 'ready',
    targetDocument: siblings.draft ?? siblings.published,
    scopeId: undefined,
    variant: undefined,
    siblings: {published: siblings.published, draft: siblings.draft, version: undefined},
  }
}

const publishedStub = stub(DOCUMENT_ID, 'published')
const draftStub = stub(`drafts.${DOCUMENT_ID}`, 'drafts')

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

const publishedPerspective: PerspectiveContextValue = {
  ...draftsPerspective,
  selectedPerspectiveName: 'published',
  selectedPerspective: 'published',
  perspectiveStack: ['published'],
  bundle: 'published',
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

interface BannerHarnessProps {
  children: ReactNode
  typeName?: string
  pane?: Partial<DocumentPaneContextValue>
  perspective?: PerspectiveContextValue
  router?: Partial<PaneRouterContextValue>
  panes?: Panes
}

function BannerHarness(props: BannerHarnessProps) {
  const {children, typeName = 'article', pane, perspective, router, panes} = props
  const schemaType = useSchema().get(typeName) as ObjectSchemaType
  const workspace = useWorkspace()
  // The banners' history and URL hooks only read these fields of the active workspace.
  const activeWorkspace = {
    type: 'workspace-summary',
    name: workspace.name,
    basePath: workspace.basePath,
    projectId: workspace.projectId,
    dataset: workspace.dataset,
  } as WorkspaceSummary
  const value = {
    documentId: DOCUMENT_ID,
    documentType: typeName,
    schemaType,
    ready: true,
    value: {_id: DOCUMENT_ID, _type: typeName, _createdAt: CREATED_AT, _rev: 'rev-1'},
    displayed: {_id: DOCUMENT_ID, _type: typeName},
    targetDocumentState: readyState({published: publishedStub}),
    ...pane,
  } as DocumentPaneContextValue

  return (
    <ActiveWorkspaceMatcherContext value={{activeWorkspace, setActiveWorkspace: noop}}>
      <PerspectiveContext value={perspective ?? draftsPerspective}>
        <PaneRouterContext value={{...paneRouter, ...router}}>
          <ResolvedPanesContext value={panes ?? null}>
            <DocumentPaneInfoContext value={value}>
              <DocumentPaneContext value={value}>{children}</DocumentPaneContext>
            </DocumentPaneInfoContext>
          </ResolvedPanesContext>
        </PaneRouterContext>
      </PerspectiveContext>
    </ActiveWorkspaceMatcherContext>
  )
}

function mockReleases(active: ReleaseDocument[], archived: ReleaseDocument[] = []) {
  vi.mocked(useActiveReleases).mockReturnValue({
    data: active,
    byId: new Map(active.map((item) => [item._id, item])),
    error: undefined,
    loading: false,
    dispatch: noop,
  })
  vi.mocked(useArchivedReleases).mockReturnValue({
    data: archived,
    error: undefined,
    loading: false,
  })
}

afterEach(() => {
  vi.mocked(useActiveReleases).mockReset()
  vi.mocked(useArchivedReleases).mockReset()
  vi.mocked(useCanvasCompanionDoc).mockReset()
  vi.mocked(useCanvasNavigate).mockReset()
  vi.mocked(useDocumentStore).mockReset()
  vi.mocked(useDocumentVersions).mockReset()
  vi.mocked(useOnlyHasVersions).mockReset()
})

describe('document panel banners', () => {
  it('flags a deprecated type and a missing revision', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness typeName="legacyArticle" pane={{revisionNotFound: true}}>
          <DeprecatedDocumentTypeBanner />
          <RevisionNotFoundBanner />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByText('Use the Article type instead.')).toBeVisible()
    await expect
      .element(page.getByText(/couldn't find the document revision selected/))
      .toBeVisible()
    await settleChromaticEndState()
  })

  it('describes archived, published and archived scheduled-draft releases', async () => {
    mockReleases([], [archivedRelease, publishedRelease, archivedScheduledDraft])

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness router={{params: {historyVersion: 'rWinter'}}}>
          <ArchivedReleaseDocumentBanner />
        </BannerHarness>
        <BannerHarness>
          <ArchivedReleaseDocumentBanner releaseId="rLaunch" />
        </BannerHarness>
        <BannerHarness router={{params: {archivedRelease: 'true'}}}>
          <ArchivedReleaseDocumentBanner releaseId="rArchivedDraft" />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByText('Winter campaign')).toBeVisible()
    await expect.element(page.getByText('Product launch')).toBeVisible()
    await expect.element(page.getByText('This scheduled draft is archived')).toBeVisible()
    await expect
      .element(page.getByRole('button', {name: 'Go back to published version'}).first())
      .toBeVisible()
    await settleChromaticEndState()
  })

  it('asks for a new destination when the perspective cannot hold a new document', async () => {
    mockReleases([springRelease, scheduledRelease])

    function Destinations() {
      const schemaType = useSchema().get('article') as ObjectSchemaType
      return (
        <>
          <ChooseNewDocumentDestinationBanner
            schemaType={schemaType}
            selectedPerspective="published"
            reason="PUBLISHED_NOT_WRITEABLE"
          />
          <ChooseNewDocumentDestinationBanner
            schemaType={schemaType}
            selectedPerspective="drafts"
            reason="DRAFTS_NOT_WRITEABLE"
          />
          <ChooseNewDocumentDestinationBanner
            schemaType={schemaType}
            selectedPerspective={scheduledRelease}
            reason="RELEASE_NOT_ACTIVE"
          />
        </>
      )
    }

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness>
          <Destinations />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect
      .poll(() => page.getByTestId('choose-new-document-destination-banner').elements().length)
      .toBe(3)
    await expect.element(page.getByText('Holiday campaign')).toBeVisible()
    await settleChromaticEndState()
  })

  it('shows the deleted document and archived release banners', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness pane={{isDeleted: true, isDeleting: false}}>
          <DeletedDocumentBanners />
        </BannerHarness>
        <BannerHarness perspective={releasePerspective(archivedRelease)}>
          <DeletedDocumentBanners />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByTestId('deleted-document-banner')).toBeVisible()
    await expect.element(page.getByTestId('deleted-release-banner')).toBeVisible()
    await settleChromaticEndState()
  })

  it('offers to add the document to an active release but not a scheduled one', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness>
          <DocumentNotInReleaseBanner documentId={DOCUMENT_ID} currentRelease={springRelease} />
          <DocumentNotInReleaseBanner
            documentId={DOCUMENT_ID}
            currentRelease={scheduledRelease}
            isScheduledRelease
          />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByText('Spring launch')).toBeVisible()
    await expect.element(page.getByText('Holiday campaign')).toBeVisible()
    await expect
      .poll(() => page.getByRole('button', {name: 'Add to release'}).elements().length)
      .toBe(1)
    await settleChromaticEndState()
  })

  it('offers to add the document to the selected variant', async () => {
    vi.mocked(useDocumentVersions).mockReturnValue({
      data: [],
      versions: [],
      loading: false,
      error: null,
    })

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness
          perspective={{
            ...draftsPerspective,
            selectedVariantNames: ['alpha-audience'],
            selectedVariants: [alphaVariant],
          }}
        >
          <DocumentNotInVariantBanner />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByText('Alpha audience')).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Create variant'})).toBeEnabled()
    await settleChromaticEndState()
  })

  it('explains missing update and create permissions', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness>
          <InsufficientPermissionBanner requiredPermission="update" />
          <InsufficientPermissionBanner requiredPermission="create" />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect.poll(() => page.getByTestId('permission-check-banner').elements().length).toBe(2)
    await expect.element(page.getByText(/permission to edit this document/)).toBeVisible()
    await expect.element(page.getByText(/permission to publish this document/)).toBeVisible()
    await settleChromaticEndState()
  })

  it('offers to resolve an obsolete draft', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness
          pane={{targetDocumentState: readyState({published: publishedStub, draft: draftStub})}}
        >
          <ObsoleteDraftsFixture />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect.poll(() => page.getByTestId('live-edit-type-banner').elements().length).toBe(2)
    await expect.element(page.getByRole('button', {name: 'Compare draft'}).first()).toBeEnabled()
    await settleChromaticEndState()
  })

  it('links to the release that holds the only versions of the document', async () => {
    const versionId = `versions.rSpring.${DOCUMENT_ID}`
    mockReleases([springRelease, summerRelease, autumnRelease])
    vi.mocked(useOnlyHasVersions).mockReturnValue(true)
    vi.mocked(useDocumentVersions).mockImplementation(({documentId}) => ({
      data:
        documentId === versionId
          ? [versionId]
          : [versionId, `versions.rSummer.${DOCUMENT_ID}`, `versions.rAutumn.${DOCUMENT_ID}`],
      versions: [],
      loading: false,
      error: null,
    }))

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness>
          <OpenReleaseToEditBanner documentId={versionId} isPinnedDraftOrPublished />
        </BannerHarness>
        <BannerHarness>
          <OpenReleaseToEditBanner
            documentId={`versions.rSpring.${DOCUMENT_ID}-other`}
            isPinnedDraftOrPublished
          />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect
      .poll(() => page.getByTestId('open-release-to-edit-banner').elements().length)
      .toBe(2)
    await expect.element(page.getByText(/and 2 more releases/)).toBeVisible()
    await settleChromaticEndState()
  })

  it('warns when the parent document changed or removed the reference', async () => {
    const parentPane = {
      id: 'parent-pane',
      type: 'document',
      options: {id: 'parent-1', type: 'article'},
    } as PaneNode
    const panes = {
      paneDataItems: [
        {
          active: false,
          childItemId: DOCUMENT_ID,
          index: 1,
          itemId: 'parent-1',
          groupIndex: 1,
          key: 'parent',
          pane: parentPane,
          params: {},
          path: 'parent-1',
          payload: undefined,
          selected: false,
          siblingIndex: 0,
          maximized: false,
        },
      ],
      routerPanes: [],
      resolvedPanes: [],
      maximizedPane: null,
      setMaximizedPane: noop,
    } as Panes

    function editStateFor(featured: string | undefined): EditStateFor {
      return {
        id: 'parent-1',
        type: 'article',
        transactionSyncLock: null,
        draft: null,
        published: {
          _id: 'parent-1',
          _type: 'article',
          _rev: 'rev-parent',
          _createdAt: CREATED_AT,
          _updatedAt: UPDATED_AT,
          ...(featured ? {featured: {_type: 'reference', _ref: featured}} : {}),
        } as SanityDocument,
        version: null,
        liveEdit: false,
        liveEditSchemaType: false,
        ready: true,
        release: undefined,
        scopeId: undefined,
      }
    }

    const parentEditState$ = new BehaviorSubject(editStateFor('article-2'))
    const {useDocumentStore: useRealDocumentStore} =
      await vi.importActual<typeof SanityExports>('sanity')
    vi.mocked(useDocumentStore).mockImplementation(function useDocumentStoreWithParent() {
      const store = useRealDocumentStore()
      return useMemo(
        () => ({...store, pair: {...store.pair, editState: () => parentEditState$}}),
        [store],
      )
    })

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness
          router={{
            params: {parentRefPath: 'featured'},
            routerPanesState: [[], [{id: DOCUMENT_ID}]],
          }}
          panes={panes}
        >
          <ReferenceChangedBanner />
        </BannerHarness>
      </TestWrapper>,
    )
    await expect.element(page.getByRole('button', {name: 'Reload reference'})).toBeVisible()
    await settleChromaticEndState()
    await takeSnapshot('reference-changed')

    parentEditState$.next(editStateFor(undefined))

    await expect.element(page.getByRole('link', {name: 'Close reference'})).toBeVisible()
    await settleChromaticEndState()
  })

  it('shows scheduled release and scheduled draft override banners', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness>
          <ScheduledReleaseBanner currentRelease={scheduledRelease} />
          <ScheduledReleaseBanner currentRelease={scheduledDraftRelease} />
          <ScheduledDraftOverrideBanner
            releaseId="_.releases.rScheduledDraft"
            draftDocument={null}
          />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect.poll(() => page.getByTestId('scheduled-release-banner').elements().length).toBe(2)
    await expect
      .poll(() => page.getByRole('button', {name: 'Pause to edit'}).elements().length)
      .toBe(1)
    await expect.element(page.getByText(/A scheduled draft for this document exists/)).toBeVisible()
    await settleChromaticEndState()
  })

  it('points to the draft from the published perspective', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness
          perspective={publishedPerspective}
          pane={{targetDocumentState: readyState({published: publishedStub, draft: draftStub})}}
        >
          <SeeDraftBanner />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByTestId('see-draft-banner')).toBeVisible()
    await settleChromaticEndState()
  })

  it('warns that the release will unpublish the document', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness
          perspective={releasePerspective(springRelease)}
          pane={{
            value: {
              _id: `versions.rSpring.${DOCUMENT_ID}`,
              _type: 'article',
              _createdAt: CREATED_AT,
              _updatedAt: CREATED_AT,
              _rev: 'rev-1',
              _system: {delete: true},
            },
          }}
        >
          <UnpublishedDocumentBanner />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByText('Spring launch')).toBeVisible()
    await settleChromaticEndState()
  })

  it('shows the canvas link for a locked and an editable document', async () => {
    vi.mocked(useCanvasNavigate).mockReturnValue({isAvailable: true, openCanvas: noop})
    vi.mocked(useCanvasCompanionDoc).mockImplementation((documentId) => ({
      isLinked: true,
      isLockedByCanvas: documentId === DOCUMENT_ID,
      loading: false,
      companionDoc: {
        _id: `companion-${documentId}`,
        canvasDocumentId: 'canvas-1',
        studioDocumentId: documentId,
        isStudioDocumentEditable: documentId !== DOCUMENT_ID,
      },
    }))

    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <BannerHarness>
          <CanvasLinkedBanner />
        </BannerHarness>
        <BannerHarness pane={{displayed: {_id: 'drafts.article-2', _type: 'article'}}}>
          <CanvasLinkedBanner />
        </BannerHarness>
      </TestWrapper>,
    )

    await expect
      .poll(() => page.getByRole('button', {name: 'Edit in Canvas'}).elements().length)
      .toBe(2)
    await settleChromaticEndState()
  })
})

function ObsoleteDraftsFixture() {
  const schemaType = useSchema().get('article') as ObjectSchemaType
  const displayed = {_id: DOCUMENT_ID, _type: 'article'}
  return (
    <>
      <ObsoleteDraftBanner
        displayed={displayed}
        documentId={DOCUMENT_ID}
        schemaType={schemaType}
        i18nKey="banners.obsolete-draft.draft-model-inactive.text"
      />
      <ObsoleteDraftBanner
        displayed={displayed}
        documentId={DOCUMENT_ID}
        schemaType={schemaType}
        i18nKey="banners.live-edit-draft-banner.text"
        isEditBlocking
      />
    </>
  )
}
