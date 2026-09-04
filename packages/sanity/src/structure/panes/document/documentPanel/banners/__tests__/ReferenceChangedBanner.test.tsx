import {type SanityDocument} from '@sanity/types'
import {act, render, screen} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {BehaviorSubject} from 'rxjs'
import {type DocumentStore, type EditStateFor, useDocumentStore, usePerspective} from 'sanity'
import {ResolvedPanesProvider} from 'sanity/_singletons'
import {test as baseTest, describe, expect, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {LOADING_PANE} from '../../../../../constants'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {type Panes} from '../../../../../structureResolvers/useResolvedPanes'
import {type PaneNode} from '../../../../../types'
import {ReferenceChangedBanner} from '../ReferenceChangedBanner'

vi.mock('sanity', async () => {
  const sanity = await vi.importActual('sanity')
  return {
    ...sanity,
    useDocumentStore: vi.fn(),
    usePerspective: vi.fn(),
  }
})

vi.mock('../../../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(),
}))

const {usePaneRouter} = vi.mocked(
  await import('../../../../../components/paneRouter/usePaneRouter'),
)

const mockUseDocumentStore = useDocumentStore as Mock<typeof useDocumentStore>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>

const PARENT_ID = 'parent-doc'
const PARENT_TYPE = 'article'
const CHILD_ID = 'child-doc'
const OTHER_ID = 'other-doc'
const RELEASE_ID = 'rSummer'
const REF_FIELD = 'featured'

const DRAFTS_PERSPECTIVE: ReturnType<typeof usePerspective> = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts',
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
  selectedVariantName: undefined,
  selectedVariant: undefined,
  bundle: 'drafts',
}

/** A release perspective, which is what scopes the parent to its version layer. */
const RELEASE_PERSPECTIVE: ReturnType<typeof usePerspective> = {
  ...DRAFTS_PERSPECTIVE,
  selectedPerspectiveName: RELEASE_ID,
  selectedReleaseId: RELEASE_ID,
  perspectiveStack: [RELEASE_ID, 'drafts'],
  bundle: RELEASE_ID,
}

/** The parent pane as the structure resolver hands it over, with its type already resolved. */
const PARENT_PANE = {
  id: 'parent-pane',
  type: 'document',
  options: {id: PARENT_ID, type: PARENT_TYPE},
} as PaneNode

/** The implicit root pane the structure resolver puts in front of every router pane group. */
const ROOT_PANE = {
  id: 'root',
  type: 'list',
  title: 'Content',
} as PaneNode

/** The pane rendering the banner. */
const CHILD_PANE = {
  id: 'child-pane',
  type: 'document',
  options: {id: CHILD_ID, type: 'child-type'},
} as PaneNode

function BackLink({children}: PropsWithChildren) {
  return <a href="/back">{children}</a>
}

function parentSnapshot(refId: string | undefined): SanityDocument {
  return {
    _id: PARENT_ID,
    _type: PARENT_TYPE,
    _rev: 'parent-rev',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-02T00:00:00Z',
    ...(refId ? {[REF_FIELD]: {_type: 'reference', _ref: refId}} : {}),
  }
}

function editStateFor(overrides: Partial<EditStateFor>): EditStateFor {
  return {
    id: PARENT_ID,
    type: PARENT_TYPE,
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

/**
 * The resolved pane tree the way `useResolvedPanes` builds it: the implicit root pane occupies
 * group 0, so each router pane group sits one index further along. The parent of the pane
 * rendering the banner is therefore at group 1, which is that pane's `usePaneRouter` `groupIndex`.
 */
function resolvedPanes(
  parentPane: PaneNode | typeof LOADING_PANE,
  parentPaneParams: Record<string, string> = {},
): Panes {
  const paneDataItems = [
    {groupIndex: 0, siblingIndex: 0, itemId: 'root', params: {}, pane: ROOT_PANE},
    {groupIndex: 1, siblingIndex: 0, itemId: PARENT_ID, params: parentPaneParams, pane: parentPane},
    {groupIndex: 2, siblingIndex: 0, itemId: CHILD_ID, params: {}, pane: CHILD_PANE},
  ]

  return {
    paneDataItems,
    routerPanes: [],
    resolvedPanes: paneDataItems.map((item) => item.pane),
    maximizedPane: null,
    setMaximizedPane: vi.fn(),
  } as unknown as Panes
}

interface RenderBannerOptions {
  perspective?: ReturnType<typeof usePerspective>
  parentPane?: PaneNode | typeof LOADING_PANE
  parentPaneParams?: Record<string, string>
}

interface ParentEditState {
  /**
   * Emits a new edit state for the parent, the way its buffered document does when the parent form
   * is patched. Starts out ready with no snapshot in any layer, which is what a parent that cannot
   * be read looks like.
   */
  emit: (overrides?: Partial<EditStateFor>) => void
  /**
   * The mocked `documentStore.pair.editState`, for asserting which document, type and version
   * layer the banner subscribes to.
   */
  spy: Mock<DocumentStore['pair']['editState']>
}

interface ReferenceChangedBannerFixtures {
  parentEditState: ParentEditState
  replaceCurrentSpy: Mock<ReturnType<typeof usePaneRouter>['replaceCurrent']>
  renderBanner: (options?: RenderBannerOptions) => Promise<void>
}

const test = baseTest.extend<ReferenceChangedBannerFixtures>({
  // oxlint-disable-next-line no-empty-pattern
  parentEditState: async ({}, consume) => {
    const editState$ = new BehaviorSubject(editStateFor({}))

    await consume({
      emit: (overrides = {}) => editState$.next(editStateFor(overrides)),
      spy: vi.fn(() => editState$),
    })
  },
  // oxlint-disable-next-line no-empty-pattern
  replaceCurrentSpy: async ({}, consume) => {
    await consume(vi.fn())
  },
  renderBanner: async ({parentEditState, replaceCurrentSpy}, consume) => {
    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
    let unmountBanner: (() => void) | undefined

    await consume(
      async ({
        perspective = DRAFTS_PERSPECTIVE,
        parentPane = PARENT_PANE,
        parentPaneParams,
      } = {}) => {
        mockUsePerspective.mockReturnValue(perspective)

        mockUseDocumentStore.mockReturnValue({
          pair: {editState: parentEditState.spy},
        } as unknown as ReturnType<typeof useDocumentStore>)

        usePaneRouter.mockReturnValue({
          params: {parentRefPath: REF_FIELD},
          groupIndex: 1,
          routerPanesState: [[{id: PARENT_ID}], [{id: CHILD_ID}]],
          replaceCurrent: replaceCurrentSpy,
          BackLink,
        } as unknown as ReturnType<typeof usePaneRouter>)

        unmountBanner = render(
          <ResolvedPanesProvider value={resolvedPanes(parentPane, parentPaneParams)}>
            <ReferenceChangedBanner />
          </ResolvedPanesProvider>,
          {wrapper},
        ).unmount

        // oxlint-disable-next-line testing-library/no-unnecessary-act -- settles a store subscription, not a Testing Library call
        await act(async () => {})
      },
    )

    unmountBanner?.()
    mockUsePerspective.mockReset()
    mockUseDocumentStore.mockReset()
    usePaneRouter.mockReset()
  },
})

test('reveals the banner as soon as the parent form patches the reference', async ({
  parentEditState,
  renderBanner,
}) => {
  // The point of reading the parent through its edit state: the parent pane applies patches
  // optimistically to its buffered document, so picking a reference (or creating one in place)
  // must show up here without waiting for the mutation to be committed, round-tripped and
  // re-fetched. The banner has to appear on the emission alone — nothing below waits for a timer,
  // so a debounce reintroduced between the edit state and the banner would fail here.
  parentEditState.emit({draft: parentSnapshot(CHILD_ID)})

  await renderBanner()

  // Pins the pane lookup to the parent document pane. `paneDataItems` and `usePaneRouter`'s
  // `groupIndex` are offset by the implicit root pane, so reading the parent one group too far up
  // resolves the root list pane instead, leaving the banner with no document type to watch and
  // permanently hidden.
  expect(parentEditState.spy).toHaveBeenCalledWith(PARENT_ID, PARENT_TYPE, undefined)

  expect(screen.queryByTestId('reference-changed-banner')).not.toBeInTheDocument()

  await act(async () => {
    parentEditState.emit({draft: parentSnapshot(OTHER_ID)})
  })

  expect(screen.getByText('This reference has changed since you opened it.')).toBeInTheDocument()
})

test('stays hidden until the parent document pair is ready', async ({
  parentEditState,
  renderBanner,
}) => {
  // An unready pair has null snapshots, which reads exactly like a removed reference. The banner
  // used to debounce emissions to ride out that window; `ready` reports it directly.
  parentEditState.emit({ready: false})

  await renderBanner()

  expect(screen.queryByTestId('reference-changed-banner')).not.toBeInTheDocument()

  await act(async () => {
    parentEditState.emit({draft: parentSnapshot(undefined)})
  })

  expect(
    screen.getByText('This reference has been removed since you opened it.'),
  ).toBeInTheDocument()
})

test('reads the parent at the scope the selected perspective resolves to', async ({
  parentEditState,
  renderBanner,
}) => {
  // The reference field has to be read from the document the parent pane is actually editing. Under
  // a release perspective that is the parent's release version, so the scope has to be threaded
  // into the pair checkout — reading the base pair instead would compare against the draft's
  // reference and warn (or stay silent) about a field the user is not looking at.
  parentEditState.emit({version: parentSnapshot(OTHER_ID)})

  await renderBanner({perspective: RELEASE_PERSPECTIVE})

  expect(parentEditState.spy).toHaveBeenCalledWith(PARENT_ID, PARENT_TYPE, RELEASE_ID)

  expect(screen.getByTestId('reference-changed-banner')).toBeInTheDocument()
})

test('stays hidden when no layer of the parent document can be read', async ({renderBanner}) => {
  // The parent pane reports the permission error itself; without this guard the missing snapshot
  // would be misread as "the reference was removed". The default edit state is exactly this:
  // ready, with nothing in any layer.
  await renderBanner({perspective: RELEASE_PERSPECTIVE})

  expect(screen.queryByTestId('reference-changed-banner')).not.toBeInTheDocument()
})

test('warns that the reference was removed when the parent is readable but the field is gone', async ({
  parentEditState,
  renderBanner,
}) => {
  parentEditState.emit({draft: parentSnapshot(undefined)})

  await renderBanner()

  expect(
    screen.getByText('This reference has been removed since you opened it.'),
  ).toBeInTheDocument()

  expect(screen.getByRole('link', {name: 'Close reference'})).toBeInTheDocument()
})

test('stays hidden while the parent reference still points at the open document', async ({
  parentEditState,
  renderBanner,
}) => {
  parentEditState.emit({draft: parentSnapshot(CHILD_ID)})

  await renderBanner()

  expect(screen.queryByTestId('reference-changed-banner')).not.toBeInTheDocument()
})

test('stays hidden while the parent pane is showing a historical revision', async ({
  parentEditState,
  renderBanner,
}) => {
  // Viewing the parent through history means its reference field is being read at an older
  // revision, so a mismatch says nothing about the reference having changed.
  parentEditState.emit({draft: parentSnapshot(OTHER_ID)})

  await renderBanner({parentPaneParams: {rev: 'parent-rev-1'}})

  expect(screen.queryByTestId('reference-changed-banner')).not.toBeInTheDocument()
})

test('stays hidden while the parent pane is still resolving', async ({
  parentEditState,
  renderBanner,
}) => {
  // The parent's document type comes from its resolved pane, so there is nothing to read (and
  // nothing to warn about) until the structure resolver has produced it.
  parentEditState.emit({draft: parentSnapshot(OTHER_ID)})

  await renderBanner({parentPane: LOADING_PANE})

  expect(screen.queryByTestId('reference-changed-banner')).not.toBeInTheDocument()
  expect(parentEditState.spy).not.toHaveBeenCalled()
})
