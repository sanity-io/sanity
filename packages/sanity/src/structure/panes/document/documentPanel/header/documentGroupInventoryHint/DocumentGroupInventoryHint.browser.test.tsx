import {type SanityDocument} from '@sanity/types'
import {PortalProvider} from '@sanity/ui'
import {type ReactNode, useMemo, useState} from 'react'
import {of} from 'rxjs'
import {
  createDocumentPreviewStore,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  defineType,
  DocumentGroupInventoryAction,
  type DocumentPreviewStore,
  type EditStateFor,
  useClient,
  useResourceCache,
  type VersionInfoDocumentStub,
} from 'sanity'
import {DocumentPaneContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../../../constants'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {useDocumentGroupInventoryTarget} from '../../../useDocumentGroupInventoryTarget'
import {DocumentGroupInventoryHint} from './DocumentGroupInventoryHint'

const {settleChromaticEndState} = testHelpers()

const SESSION_COUNT_KEY = 'studio.document-group-inventory.hint.session-count'
const HAS_DISPLAYED_KEY = 'studio.document-group-inventory.hint.has-displayed'

const settingsType = defineType({
  name: 'settings',
  type: 'document',
  fields: [{name: 'title', type: 'string'}],
})

/**
 * Swaps the workspace's document preview store for one that answers version lookups from
 * `versions`, mirroring what the API would report for the document group. Everything else is the
 * real store on the mock client.
 */
function SeedDocumentVersions(props: {versions: VersionInfoDocumentStub[]; children: ReactNode}) {
  const {versions, children} = props
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const resourceCache = useResourceCache()

  // Seeded before the children's first render: the version lookups below cache their
  // observables per document id on first use, so a later swap would go unnoticed.
  const [seeded] = useState(() => {
    const store: DocumentPreviewStore = {
      ...createDocumentPreviewStore({client}),
      unstable_observeVersionDocumentIds: () => of(versions.map((version) => version._id)),
      observePaths: (value) =>
        of(('_id' in value && versions.find((version) => version._id === value._id)) || null),
    }
    resourceCache.set({namespace: 'documentPreviewStore', dependencies: [client], value: store})
    return true
  })

  return seeded ? children : null
}

/**
 * The target the hint points at: the "Manage versions" action in the pane footer, mounted on
 * the same predicate as the hint (as `DocumentStatusBarActions` does), with the inventory popover
 * content replaced by a marker.
 */
function FooterInventoryAction(props: {
  isDocumentGroupInventoryActive: boolean
  setIsDocumentGroupInventoryActive: (active: boolean) => void
}) {
  const target = useDocumentGroupInventoryTarget()

  if (!target.isAvailable) return null

  return (
    <DocumentGroupInventoryAction
      documentId={target.documentId}
      portalElementName={DOCUMENT_PANEL_PORTAL_ELEMENT}
      isDocumentGroupInventoryActive={props.isDocumentGroupInventoryActive}
      setIsDocumentGroupInventoryActive={props.setIsDocumentGroupInventoryActive}
    >
      <div data-testid="inventory-popover-content">Inventory for {target.documentId}</div>
    </DocumentGroupInventoryAction>
  )
}

type PaneValue = Omit<
  DocumentPaneContextValue,
  'isDocumentGroupInventoryActive' | 'setIsDocumentGroupInventoryActive'
>

function Harness(props: {versions: VersionInfoDocumentStub[]; pane: PaneValue}) {
  const {versions, pane} = props
  const [isDocumentGroupInventoryActive, setIsDocumentGroupInventoryActive] = useState(false)
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const portalElements = useMemo(
    () => ({[DOCUMENT_PANEL_PORTAL_ELEMENT]: portalElement}),
    [portalElement],
  )

  const paneValue = useMemo(
    (): DocumentPaneContextValue => ({
      ...pane,
      isDocumentGroupInventoryActive,
      setIsDocumentGroupInventoryActive,
    }),
    [pane, isDocumentGroupInventoryActive],
  )

  return (
    <TestWrapper
      schemaTypes={[settingsType]}
      betaFeatures={{documentGroupInventory: {enabled: true}}}
    >
      <SeedDocumentVersions versions={versions}>
        <DocumentPaneContext.Provider value={paneValue}>
          <PortalProvider __unstable_elements={portalElements}>
            <div data-testid="document-target-badges">
              <DocumentGroupInventoryHint />
            </div>
            <FooterInventoryAction
              isDocumentGroupInventoryActive={isDocumentGroupInventoryActive}
              setIsDocumentGroupInventoryActive={setIsDocumentGroupInventoryActive}
            />
            <div ref={setPortalElement} />
          </PortalProvider>
        </DocumentPaneContext.Provider>
      </SeedDocumentVersions>
    </TestWrapper>
  )
}

const NO_SIBLINGS = {published: undefined, draft: undefined, version: undefined}

const EMPTY_EDIT_STATE: EditStateFor = {
  id: 'deletedSettings',
  type: 'settings',
  transactionSyncLock: {enabled: false},
  draft: null,
  published: null,
  version: null,
  liveEdit: false,
  liveEditSchemaType: false,
  ready: true,
  release: undefined,
  scopeId: undefined,
}

// `useDocumentVersions` caches its observables per published id for the lifetime of the module,
// so every case gets its own document id to keep the cases independent.

/** A singleton whose document was deleted (or never created): no draft, no published, no versions. */
const DELETED_SINGLETON_PANE = {
  documentId: 'deletedSettings',
  documentType: 'settings',
  // `DocumentPaneProvider` falls back to an id/type stub when no document exists.
  displayed: {_id: 'deletedSettings', _type: 'settings'},
  isDeleted: true,
  editState: EMPTY_EDIT_STATE,
  targetDocumentState: {
    status: 'ready',
    targetDocument: undefined,
    scopeId: undefined,
    variant: undefined,
    siblings: NO_SIBLINGS,
  },
  revisionNotFound: false,
} as DocumentPaneContextValue

/** A document with a draft, the everyday case. */
const DRAFT_STUB: VersionInfoDocumentStub = {
  _id: 'drafts.settings',
  _type: 'settings',
  _rev: 'rev-1',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _system: {bundleId: 'drafts', group: {_ref: 'settings', _weak: true}},
}

const DRAFT_DOCUMENT: SanityDocument = {
  _id: 'drafts.settings',
  _type: 'settings',
  _rev: 'rev-1',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  title: 'Settings',
}

const DRAFT_PANE = {
  documentId: 'settings',
  documentType: 'settings',
  displayed: DRAFT_DOCUMENT,
  isDeleted: false,
  editState: {...EMPTY_EDIT_STATE, id: 'settings', draft: DRAFT_DOCUMENT},
  targetDocumentState: {
    status: 'ready',
    targetDocument: DRAFT_STUB,
    scopeId: undefined,
    variant: undefined,
    siblings: {...NO_SIBLINGS, draft: DRAFT_STUB},
  },
  revisionNotFound: false,
} as DocumentPaneContextValue

const hint = () => page.getByRole('button', {name: 'Where did the version buttons go?'})
const manageVersions = () => page.getByTestId('action-document-group-inventory')
const inventoryContent = () => page.getByTestId('inventory-popover-content')

describe('DocumentGroupInventoryHint', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('is not shown for a deleted singleton, where there is no inventory to open', async () => {
    await render(<Harness versions={[]} pane={DELETED_SINGLETON_PANE} />)

    await expect.element(page.getByTestId('document-target-badges')).toBeInTheDocument()
    // The hint status and the version lookup both resolve asynchronously; wait as long as the
    // normal case needs to show the hint so this is not a race against a pending lookup.
    await new Promise((resolve) => setTimeout(resolve, 500))

    await expect.element(hint()).not.toBeInTheDocument()
    await expect.element(manageVersions()).not.toBeInTheDocument()
    // A hidden hint does not use up one of the sessions it is shown for.
    expect(localStorage.getItem(SESSION_COUNT_KEY)).toBeNull()
    expect(sessionStorage.getItem(HAS_DISPLAYED_KEY)).toBeNull()

    await settleChromaticEndState()
  })

  it('is shown for a document with versions, and pressing it opens the inventory', async () => {
    await render(<Harness versions={[DRAFT_STUB]} pane={DRAFT_PANE} />)

    // The hint and the action it points at mount together.
    await expect.element(hint()).toBeVisible()
    await expect.element(manageVersions()).toBeVisible()
    // @sanity/ui renders popover content lazily: nothing is mounted until it first opens.
    await expect.element(inventoryContent()).not.toBeInTheDocument()

    await hint().click()

    await expect.element(inventoryContent()).toHaveTextContent('Inventory for drafts.settings')
    await expect.element(inventoryContent()).toBeVisible()
    // Pressing the hint dismisses it for future sessions.
    await expect.poll(() => localStorage.getItem(SESSION_COUNT_KEY)).toBe('-1')

    await settleChromaticEndState()
  })
})
