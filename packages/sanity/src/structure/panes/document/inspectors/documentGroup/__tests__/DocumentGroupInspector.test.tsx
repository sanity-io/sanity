import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  type ComponentType,
  type ReactNode,
  type RefAttributes,
  use,
  useImperativeHandle,
} from 'react'
import {EMPTY} from 'rxjs'
import {
  DocumentGroupInventory,
  type DocumentGroupInventoryHandle,
  type DocumentGroupInventoryProps,
  type SanityDocument,
  type SystemVariant,
  type TargetDocumentState,
  usePerspective,
  type VersionInfoDocumentStub,
} from 'sanity'
import {PaneLayoutContext, PaneRouterContext} from 'sanity/_singletons'
import {test as baseTest, describe, expect, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {useTestDocumentGroupInventoryHandle} from '../../../../../../../test/testUtils/useTestDocumentGroupInventoryHandle'
import {type PaneLayoutContextValue} from '../../../../../components/pane/types'
import {useDocumentPerspectiveList} from '../../../../../hooks/useDocumentPerspectiveList'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {useDocumentPane} from '../../../useDocumentPane'
import {CompareVersionsAction} from '../CompareVersionsAction'
import {DocumentGroupInspector} from '../DocumentGroupInspector'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  DocumentGroupInventory: vi.fn(() => <div data-testid="document-group-inventory" />),
  usePerspective: vi.fn(),
}))

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../../../hooks/useDocumentPerspectiveList', () => ({
  useDocumentPerspectiveList: vi.fn(() => ({})),
}))

vi.mock('../../../../../components/confirmDeleteDialog/useReferringDocuments', () => ({
  referringDocuments: vi.fn(() => EMPTY),
}))

const mockUseDocumentPane = useDocumentPane as MockedFunction<typeof useDocumentPane>
const mockUsePerspective = usePerspective as MockedFunction<typeof usePerspective>
const mockUseDocumentPerspectiveList = useDocumentPerspectiveList as MockedFunction<
  typeof useDocumentPerspectiveList
>
type InventoryProps = DocumentGroupInventoryProps &
  RefAttributes<DocumentGroupInventoryHandle | null>

const mockDocumentGroupInventory = DocumentGroupInventory as MockedFunction<
  ComponentType<InventoryProps>
>

// Stands in for the inventory: runs the real inventory machine and exposes it through the handle,
// without rendering the inventory itself.
function FakeDocumentGroupInventory(
  props: InventoryProps & {onHandle: (handle: DocumentGroupInventoryHandle) => void},
) {
  const {ref, onHandle} = props
  const handle = useTestDocumentGroupInventoryHandle()

  useImperativeHandle(ref, () => {
    onHandle(handle)
    return handle
  }, [handle, onHandle])

  return <div data-testid="document-group-inventory" />
}

const BASE_TARGET_DOCUMENT_STATE: TargetDocumentState = {
  status: 'ready',
  targetDocument: undefined,
  scopeId: undefined,
  variant: undefined,
  siblings: {published: undefined, draft: undefined, version: undefined},
}

function buildDocumentPaneValue({
  displayed = {_id: 'drafts.doc-123', _type: 'author'},
  version,
  draft = {_id: 'drafts.doc-123', _type: 'author'},
  liveEdit = false,
  targetDocumentState = BASE_TARGET_DOCUMENT_STATE,
}: {
  displayed?: DocumentPaneContextValue['displayed']
  version?: SanityDocument
  draft?: Partial<SanityDocument> | null
  liveEdit?: boolean
  targetDocumentState?: TargetDocumentState
} = {}): DocumentPaneContextValue {
  return {
    displayed,
    targetDocumentState,
    editState: {
      id: 'doc-123',
      type: 'author',
      transactionSyncLock: {enabled: false},
      liveEdit,
      ready: true,
      draft,
      published: {_id: 'doc-123', _type: 'author'},
      version,
    },
  } as DocumentPaneContextValue
}

function lastInventoryProps(): DocumentGroupInventoryProps {
  const props = mockDocumentGroupInventory.mock.lastCall?.[0]

  if (typeof props === 'undefined') {
    throw new Error('Expected `DocumentGroupInventory` to have rendered')
  }

  return props
}

// The version the inventory marks as open: `selectedId` defaults to `documentId` there.
function markedVersionId(): string | null {
  const {selectedId, documentId} = lastInventoryProps()
  return selectedId === undefined ? documentId : selectedId
}

const PANE_LAYOUT: PaneLayoutContextValue = {
  collapse: () => undefined,
  collapsed: false,
  expand: () => undefined,
  expandedElement: null,
  mount: () => () => undefined,
  resize: () => undefined,
  resizing: false,
  panes: [],
}

const COLLAPSED_PANE_LAYOUT: PaneLayoutContextValue = {...PANE_LAYOUT, collapsed: true}

const test = baseTest
  .extend('TestProvider', {scope: 'file'}, () =>
    createTestProvider({
      resources: [structureUsEnglishLocaleBundle],
      config: {
        beta: {
          documentGroupInventory: {enabled: true},
        },
      },
    }),
  )
  .extend('VariantsTestProvider', {scope: 'file'}, () =>
    createTestProvider({
      resources: [structureUsEnglishLocaleBundle],
      config: {beta: {variants: {enabled: true}}},
    }),
  )
  .extend('variantsEnabled', () => false)
  .extend('documentPaneValue', () => buildDocumentPaneValue())
  .extend('layoutCollapsed', () => false)
  .extend('selectedVariantNames', (): string[] => [])
  .extend('selectedPerspective', (): string | undefined => undefined)
  .extend(
    'renderInspector',
    ({
      TestProvider,
      VariantsTestProvider,
      variantsEnabled,
      documentPaneValue,
      layoutCollapsed,
      selectedVariantNames,
      selectedPerspective,
    }) => {
      const onInventoryHandle = vi.fn<(handle: DocumentGroupInventoryHandle) => void>()

      mockUseDocumentPane.mockReturnValue(documentPaneValue)
      mockUsePerspective.mockReturnValue({
        selectedVariantNames,
        selectedPerspective,
      } as unknown as ReturnType<typeof usePerspective>)
      mockUseDocumentPerspectiveList.mockReturnValue({} as never)
      mockDocumentGroupInventory.mockImplementation(function MockDocumentGroupInventory(
        props: InventoryProps,
      ) {
        return <FakeDocumentGroupInventory {...props} onHandle={onInventoryHandle} />
      })

      function lastInventoryHandle(): DocumentGroupInventoryHandle {
        const handle = onInventoryHandle.mock.lastCall?.[0]

        if (typeof handle === 'undefined') {
          throw new Error('Expected `DocumentGroupInventory` to have exposed its handle')
        }

        return handle
      }

      const paneLayout = layoutCollapsed ? COLLAPSED_PANE_LAYOUT : PANE_LAYOUT

      const closeCurrentAndAfter = vi.fn()

      // The default pane router, with the one method the inspector calls observed.
      function PaneRouter({children}: {children: ReactNode}) {
        const paneRouter = use(PaneRouterContext)
        return (
          <PaneRouterContext value={{...paneRouter, closeCurrentAndAfter}}>
            {children}
          </PaneRouterContext>
        )
      }

      const Provider = variantsEnabled ? VariantsTestProvider : TestProvider
      const Wrapper: ComponentType<{children: ReactNode}> = ({children}) => {
        return (
          <Provider>
            <PaneRouter>
              <PaneLayoutContext.Provider value={paneLayout}>{children}</PaneLayoutContext.Provider>
            </PaneRouter>
          </Provider>
        )
      }

      // The test provider renders a spinner until the locale resources have loaded.
      return async () => {
        const onClose = vi.fn()

        render(
          <DocumentGroupInspector documentId="doc-123" documentType="author" onClose={onClose} />,
          {wrapper: Wrapper},
        )

        await screen.findByRole('heading', {name: 'Document inventory'})

        return {onClose, lastInventoryHandle, closeCurrentAndAfter}
      }
    },
  )

describe('DocumentGroupInspector', () => {
  test('closes the document pane once a delete leaves no versions', async ({renderInspector}) => {
    const {closeCurrentAndAfter} = await renderInspector()
    const {onAllVersionsDeleted} = lastInventoryProps() as Extract<
      DocumentGroupInventoryProps,
      {mode: 'manage'}
    >

    act(() => onAllVersionsDeleted?.())

    expect(closeCurrentAndAfter).toHaveBeenCalledTimes(1)
  })

  test('renders the inspector header and closes the inspector from it', async ({
    renderInspector,
  }) => {
    const {onClose} = await renderInspector()

    await userEvent.click(screen.getByRole('button', {name: 'Close panel'}))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('puts the documents icon of the bottom bar button before the title', async ({
    renderInspector,
  }) => {
    await renderInspector()

    const heading = screen.getByRole('heading', {name: 'Document inventory'})
    const icon = heading.parentElement?.querySelector('[data-sanity-icon="documents"]')

    expect(icon).not.toBeNull()
    expect(icon?.compareDocumentPosition(heading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  test('renders the inventory in manage mode for the displayed document', async ({
    renderInspector,
  }) => {
    await renderInspector()

    expect(screen.getByTestId('document-group-inventory')).toBeInTheDocument()
    expect(lastInventoryProps()).toMatchObject({
      mode: 'manage',
      documentId: 'drafts.doc-123',
      documentType: 'author',
    })
  })

  test('lets the inventory scroll its own versions in the pane layout', async ({
    renderInspector,
  }) => {
    await renderInspector()

    expect(screen.getByTestId('document-group-inspector-content')).not.toHaveAttribute(
      'data-document-group-inventory-scroll',
    )
  })

  describe('when the pane layout is collapsed', () => {
    test.override('layoutCollapsed', () => true)

    test('leaves scrolling the versions to the page, which scrolls in that layout', async ({
      renderInspector,
    }) => {
      await renderInspector()

      expect(screen.getByTestId('document-group-inspector-content')).toHaveAttribute(
        'data-document-group-inventory-scroll',
        'ancestor',
      )
    })
  })

  test('gives the inventory the compare versions action for its header', async ({
    renderInspector,
  }) => {
    await renderInspector()

    expect(lastInventoryProps()).toMatchObject({
      components: expect.objectContaining({CompareVersionsAction}),
    })
  })

  describe('when the displayed document is going to unpublish in a release', () => {
    test.override('documentPaneValue', () =>
      buildDocumentPaneValue({
        displayed: {_id: 'doc-123', _type: 'author'},
        version: {
          _id: 'versions.release-1.doc-123',
          _type: 'author',
          _createdAt: '2026-10-20T00:00:00Z',
          _updatedAt: '2026-10-20T00:00:00Z',
          _rev: 'rev-1',
          _system: {delete: true},
        },
      }),
    )

    test('targets the version that is going to unpublish rather than the displayed document', async ({
      renderInspector,
    }) => {
      await renderInspector()

      expect(lastInventoryProps().documentId).toBe('versions.release-1.doc-123')
    })
  })

  test('renders the feedback action before the close button', async ({renderInspector}) => {
    await renderInspector()

    const feedbackButton = await screen.findByRole('button', {name: 'Send feedback to Sanity'})
    const closeButton = screen.getByRole('button', {name: 'Close panel'})

    expect(
      feedbackButton.compareDocumentPosition(closeButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  test('begins feedback in the inventory when the feedback action is pressed', async ({
    renderInspector,
  }) => {
    const {lastInventoryHandle} = await renderInspector()

    await userEvent.click(await screen.findByRole('button', {name: 'Send feedback to Sanity'}))

    expect(lastInventoryHandle().inventory.getSnapshot().matches('feedback')).toBe(true)
    expect(screen.getByRole('button', {name: 'Send feedback to Sanity'})).toBeDisabled()

    act(() => lastInventoryHandle().inventory.send({type: 'feedback.end'}))

    expect(screen.getByRole('button', {name: 'Send feedback to Sanity'})).toBeEnabled()
  })

  test('disables the feedback action while the inventory refuses to begin feedback', async ({
    renderInspector,
  }) => {
    const {lastInventoryHandle} = await renderInspector()

    const feedbackButton = await screen.findByRole('button', {name: 'Send feedback to Sanity'})
    expect(feedbackButton).toBeEnabled()

    const {inventory} = lastInventoryHandle()

    act(() =>
      inventory.getSnapshot().context.variantCreationRef.send({type: 'createVariant.request'}),
    )

    expect(inventory.getSnapshot().matches('creatingVariant')).toBe(true)
    expect(feedbackButton).toBeDisabled()
  })

  test('marks the displayed document as open when no variant is selected', async ({
    renderInspector,
  }) => {
    await renderInspector()

    expect(markedVersionId()).toBe('drafts.doc-123')
  })

  describe('when a variant is selected', () => {
    test.override('selectedVariantNames', () => ['returning-visitors'])

    describe('and its target document is still resolving', () => {
      // The pane displays the base draft while the variant target resolves.
      test.override('documentPaneValue', () =>
        buildDocumentPaneValue({targetDocumentState: {status: 'resolving'}}),
      )

      test('marks no version as open rather than the base draft', async ({renderInspector}) => {
        await renderInspector()

        expect(markedVersionId()).toBeNull()
      })
    })

    describe('and its target document has resolved', () => {
      test.override('documentPaneValue', () =>
        buildDocumentPaneValue({
          // The displayed document can still lag behind on the base draft.
          targetDocumentState: {
            ...BASE_TARGET_DOCUMENT_STATE,
            targetDocument: {
              _id: 'versions.scope-a.doc-123',
            } as VersionInfoDocumentStub,
            scopeId: 'scope-a',
          },
        }),
      )

      test('marks the variant target as open', async ({renderInspector}) => {
        await renderInspector()

        expect(markedVersionId()).toBe('versions.scope-a.doc-123')
      })
    })
  })

  describe('when the form is about to create a draft', () => {
    const DE_DE: SystemVariant = {
      _id: '_.variants.de-de',
      _type: 'system.variant',
      _rev: 'rev',
      _createdAt: '2026-01-01T00:00:00.000Z',
      _updatedAt: '2026-01-01T00:00:00.000Z',
      conditions: {locale: 'de-DE'},
      priority: 0,
      metadata: {title: 'de-DE'},
    }

    describe('for a variant with no draft yet, in Drafts', () => {
      test.override('selectedPerspective', () => 'drafts')
      test.override('selectedVariantNames', () => ['de-de'])
      test.override('documentPaneValue', () =>
        buildDocumentPaneValue({
          displayed: {_id: 'versions.p-de.doc-123', _type: 'author'},
          targetDocumentState: {
            status: 'variant-missing',
            variant: DE_DE,
            bundle: 'drafts',
            siblings: {
              published: {_id: 'versions.p-de.doc-123'} as VersionInfoDocumentStub,
              draft: undefined,
              version: undefined,
            },
            creatableTarget: {id: 'versions.d-de.doc-123', scopeId: 'd-de'},
          },
        }),
      )

      test('passes the draft as a ghost row, marked open', async ({renderInspector}) => {
        await renderInspector()

        expect(lastInventoryProps().pendingDraft).toEqual({
          id: 'versions.d-de.doc-123',
          variantId: '_.variants.de-de',
          name: 'de-DE',
        })
        expect(markedVersionId()).toBe('versions.d-de.doc-123')
      })
    })

    describe('for Default with no draft, in Drafts', () => {
      test.override('selectedPerspective', () => 'drafts')
      test.override('documentPaneValue', () =>
        buildDocumentPaneValue({displayed: {_id: 'doc-123', _type: 'author'}, draft: null}),
      )

      test('passes the draft as a ghost row named Draft, marked open, with variants off', async ({
        renderInspector,
      }) => {
        await renderInspector()

        expect(lastInventoryProps().pendingDraft).toEqual({id: 'drafts.doc-123', name: 'Draft'})
        expect(markedVersionId()).toBe('drafts.doc-123')
      })

      describe('with variants on', () => {
        test.override('variantsEnabled', () => true)

        test('names the ghost row Default', async ({renderInspector}) => {
          await renderInspector()

          expect(lastInventoryProps().pendingDraft).toEqual({
            id: 'drafts.doc-123',
            name: 'Default',
          })
        })
      })
    })

    describe('for a live-edit document', () => {
      test.override('selectedPerspective', () => 'drafts')
      test.override('documentPaneValue', () =>
        buildDocumentPaneValue({
          displayed: {_id: 'doc-123', _type: 'author'},
          draft: null,
          liveEdit: true,
        }),
      )

      test('passes no ghost row: live-edit documents have no drafts', async ({renderInspector}) => {
        await renderInspector()

        expect(lastInventoryProps().pendingDraft).toBeUndefined()
        expect(markedVersionId()).toBe('doc-123')
      })
    })

    describe('outside Drafts', () => {
      test.override('selectedPerspective', () => 'published')
      test.override('documentPaneValue', () =>
        buildDocumentPaneValue({displayed: {_id: 'doc-123', _type: 'author'}, draft: null}),
      )

      test('passes no ghost row', async ({renderInspector}) => {
        await renderInspector()

        expect(lastInventoryProps().pendingDraft).toBeUndefined()
      })
    })
  })

  describe('when the displayed document is not known yet', () => {
    test.override('documentPaneValue', () => ({
      ...buildDocumentPaneValue(),
      displayed: null,
      editState: null,
    }))

    test('does not render the inventory until the displayed document is known', async ({
      renderInspector,
    }) => {
      await renderInspector()

      expect(screen.queryByTestId('document-group-inventory')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', {name: 'Send feedback to Sanity'}),
      ).not.toBeInTheDocument()
    })
  })
})
