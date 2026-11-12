import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {type ReleaseDocument} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import {Card, PortalProvider} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ComponentType, useMemo, useRef, useState} from 'react'
import {BehaviorSubject} from 'rxjs'
import {PerspectiveContext} from 'sanity/_singletons'
import {Text} from 'ui5'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'
import {
  type ActorRefFromLogic,
  createActor,
  forwardTo,
  fromObservable,
  fromPromise,
  sendTo,
  setup,
} from 'xstate'

import {isShown, testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {type PerspectiveContextValue} from '../../../perspective/types'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
  scheduledRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {type ReleasesReducerState} from '../../../releases/store/reducer'
import {type VariantStoreState} from '../../../variants/store/reducer'
import {type SystemVariant} from '../../../variants/types'
import {deletionMachine, type ReferringDocuments} from '../../machines/deletionMachine'
import {type VariantSet} from '../../machines/documentGroupInventoryMachine'
import {selectionMachine, type Variant} from '../../machines/selectionMachine'
import {variantCreationMachine} from '../../machines/variantCreationMachine'
import {type DocumentGroupInventoryComponents} from '../../types'
import {contrastRatio, parseColor} from '../../utils/contrast'
import {
  getRowToggle,
  getSetSelection,
  type RangeAnchor,
  SELECTION_BLOCKED_REASON_KEYS,
} from '../../utils/selection'
import {Body} from '../Body'
import {ConfirmDeleteDialog} from '../ConfirmDeleteDialog'
import {Container} from '../Container'
import {CreateVariant} from '../CreateVariant/CreateVariant'
import {MIN_MENU_WIDTH} from '../CreateVariant/CreateVariantPicker'
import {DocumentGroupEntry} from '../DocumentGroupEntry'
import {DocumentGroupSet} from '../DocumentGroupSet'
import {InventoryHeader} from '../InventoryHeader'
import {VariantCheckbox} from '../VariantSet/VariantCheckbox'

const PUBLISHED_ID = 'panels-document'
const DOCUMENT_TYPE = 'author'
const PORTAL_NAME = 'panels-dialog-portal'
const GROUP = {_ref: PUBLISHED_ID, _weak: true} as const

const SCHEMA_TYPES = [
  defineType({
    name: DOCUMENT_TYPE,
    type: 'document',
    fields: [defineField({name: 'name', type: 'string'})],
  }),
]

const SUMMER_SALE: SystemVariant = {
  _id: '_.variants.summer-sale',
  _type: 'system.variant',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  conditions: {},
  priority: 0,
  metadata: {title: 'Summer sale'},
}

// No `metadata.title`, so the panel falls back to the id suffix.
const VIP_USERS: SystemVariant = {
  _id: '_.variants.vip-users',
  _type: 'system.variant',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  conditions: {},
  priority: 0,
}

const VARIANT_DEFINITIONS: VariantStoreState = {
  state: 'loaded',
  variants: new Map([
    [SUMMER_SALE._id, SUMMER_SALE],
    [VIP_USERS._id, VIP_USERS],
  ]),
}

const RELEASES: ReleasesReducerState = {
  state: 'loaded',
  releases: new Map<string, ReleaseDocument>([
    [activeASAPRelease._id, activeASAPRelease],
    [activeScheduledRelease._id, activeScheduledRelease],
    [activeUndecidedRelease._id, activeUndecidedRelease],
  ]),
}

function variant(
  id: string,
  name: string,
  system: Partial<Variant['document']['_system']> = {},
): Variant {
  return {
    id,
    name,
    document: {
      _id: id,
      _rev: 'rev',
      _createdAt: '2026-01-01T00:00:00.000Z',
      _updatedAt: '2026-01-01T00:00:00.000Z',
      _type: DOCUMENT_TYPE,
      _system: {group: GROUP, ...system},
    },
  }
}

const PUBLISHED = variant(PUBLISHED_ID, 'Published')
const DRAFT = variant(`drafts.${PUBLISHED_ID}`, 'Draft', {bundleId: 'drafts'})
// The "Summer sale" variant already exists in the ASAP release, so `CreateVariant`
// does not offer that release as a target for it.
const SUMMER_SALE_IN_ASAP = variant(
  `versions.${activeASAPRelease.name}.${PUBLISHED_ID}`,
  'Summer sale',
  {
    bundleId: activeASAPRelease.name,
    release: {_ref: activeASAPRelease._id, _weak: true},
    variants: [{_ref: SUMMER_SALE._id, _key: 'summer-sale'}],
  },
)
const VARIANTS = [PUBLISHED, DRAFT, SUMMER_SALE_IN_ASAP]

// The versions as the inventory groups them while Content Variants is switched on: a set per
// bundle, its versions named after their variant.
const VERSION_SETS: VariantSet[] = [
  {
    key: 'published',
    name: 'Published',
    bundle: {type: 'perspective', perspective: 'published'},
    variants: [{...PUBLISHED, name: 'Default'}],
  },
  {
    key: 'drafts',
    name: 'Draft',
    bundle: {type: 'perspective', perspective: 'drafts'},
    variants: [{...DRAFT, name: 'Default'}],
  },
  {
    key: activeASAPRelease._id,
    name: activeASAPRelease.metadata.title,
    bundle: {type: 'perspective', perspective: activeASAPRelease},
    variants: [SUMMER_SALE_IN_ASAP],
  },
]

const REFERRING_DOCUMENTS: ReferringDocuments = {
  isLoading: false,
  totalCount: 4,
  projectIds: ['abc123'],
  datasetNames: ['production'],
  hasUnknownDatasetNames: false,
  internalReferences: {
    totalCount: 3,
    references: [
      {_id: 'referrer-a', _type: DOCUMENT_TYPE},
      {_id: 'referrer-b', _type: 'unknownType'},
    ],
  },
  crossDatasetReferences: {
    totalCount: 1,
    references: [{projectId: 'abc123', datasetName: 'production', documentId: 'remote-doc'}],
  },
}

/** Strong and weak links, as the reference query marks them once it has read the referrers. */
const REQUIRED_REFERRING_DOCUMENTS: ReferringDocuments = {
  ...REFERRING_DOCUMENTS,
  totalCount: 2,
  internalReferences: {
    totalCount: 2,
    references: [
      {_id: 'referrer-b', _type: DOCUMENT_TYPE, required: false},
      {_id: 'referrer-a', _type: DOCUMENT_TYPE, required: true},
    ],
  },
  crossDatasetReferences: {totalCount: 0, references: []},
}

const OPTIONAL_REFERRING_DOCUMENTS: ReferringDocuments = {
  ...REQUIRED_REFERRING_DOCUMENTS,
  totalCount: 1,
  internalReferences: {
    totalCount: 1,
    references: [{_id: 'referrer-b', _type: DOCUMENT_TYPE, required: false}],
  },
}

const COMPONENTS: DocumentGroupInventoryComponents = {
  DocTitle: ({document}) => <>{document._id === PUBLISHED_ID ? 'Ursula K. Le Guin' : 'Untitled'}</>,
  ReferencePreviewLink: ({value}) => (
    <Card padding={2} radius={2} data-testid={`reference-${value._id}`}>
      <Text size={1} as="div" trim={true}>
        {value._id}
      </Text>
    </Card>
  ),
  VersionsPreviewList: ({documentVersions}) => (
    <Card padding={3} radius={2} border data-testid="versions-preview-list">
      <Text size={1} as="div" trim={true}>
        {documentVersions.join(', ')}
      </Text>
    </Card>
  ),
  CompareVersionsAction: () => (
    <Card padding={2} radius={2} border data-testid="compare-versions-action">
      <Text size={1} as="div" trim={true}>
        Compare versions
      </Text>
    </Card>
  ),
}

/**
 * Stand-in for `documentGroupInventoryMachine`: spawns the three child machines
 * the panels read from and relays the same child-to-child events the real
 * parent does (selection changes reach the deletion machine, an active deletion
 * locks the selection). The store-backed actors are replaced with fixtures.
 */
const harnessMachine = setup({
  types: {} as {
    input: {referringDocuments: ReferringDocuments}
    context: {
      selectionRef: ActorRefFromLogic<typeof selectionMachine>
      deletionRef: ActorRefFromLogic<typeof deletionMachine>
      variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
    }
    events:
      | {type: 'selection.changed'; selectedIds: Set<string>}
      | {type: 'deletion.activated'}
      | {type: 'deletion.deactivated'}
      | {type: 'variantCreation.activated'}
      | {type: 'variantCreation.deactivated'}
  },
}).createMachine({
  id: 'documentGroupInventoryPanelsHarness',
  context: ({spawn, input}) => ({
    selectionRef: spawn(selectionMachine, {input: undefined}),
    deletionRef: spawn(
      deletionMachine.provide({
        actors: {
          referringDocuments: fromObservable(() => new BehaviorSubject(input.referringDocuments)),
        },
      }),
      {input: undefined},
    ),
    variantCreationRef: spawn(
      variantCreationMachine.provide({
        actors: {
          variants: fromObservable(() => new BehaviorSubject(VARIANT_DEFINITIONS)),
          releases: fromObservable(() => new BehaviorSubject(RELEASES)),
          // Never settles, so a confirmed creation stays in `active.creating`.
          createVariant: fromPromise(() => new Promise<void>(() => {})),
        },
      }),
      {input: {enabled: true}},
    ),
  }),
  on: {
    'selection.changed': {actions: forwardTo(({context}) => context.deletionRef)},
    'deletion.activated': {
      actions: sendTo(({context}) => context.selectionRef, {type: 'selection.lock'}),
    },
    'deletion.deactivated': {
      actions: sendTo(({context}) => context.selectionRef, {type: 'selection.unlock'}),
    },
  },
})

type HarnessActor = ReturnType<typeof createActor<typeof harnessMachine>>

let harness: HarnessActor | undefined

function startHarness(referringDocuments: ReferringDocuments = REFERRING_DOCUMENTS) {
  harness = createActor(harnessMachine, {input: {referringDocuments}}).start()
  const {selectionRef, deletionRef, variantCreationRef} = harness.getSnapshot().context
  selectionRef.send({type: 'variants.changed', variants: VARIANTS, loaded: true})
  return {selectionRef, deletionRef, variantCreationRef}
}

afterEach(() => {
  harness?.stop()
  harness = undefined
})

function PanelFrame({children}: {children: React.ReactNode}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card border radius={3} style={{width: 'fit-content'}}>
        <Container>{children}</Container>
      </Card>
    </TestWrapper>
  )
}

function ConfirmDeleteDialogHarness({
  deletionRef,
  selectionRef,
}: {
  deletionRef: ActorRefFromLogic<typeof deletionMachine>
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
}) {
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const portalElements = useMemo(() => ({[PORTAL_NAME]: portalElement}), [portalElement])

  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <PortalProvider __unstable_elements={portalElements}>
        <div ref={setPortalElement} />
        {portalElement && (
          <ConfirmDeleteDialog
            documentId={PUBLISHED_ID}
            documentType={DOCUMENT_TYPE}
            deletionRef={deletionRef}
            selectionRef={selectionRef}
            portalElementName={PORTAL_NAME}
            components={COMPONENTS}
          />
        )}
      </PortalProvider>
    </TestWrapper>
  )
}

const CREATE_VARIANT_TITLE_DOCUMENT = {_id: PUBLISHED_ID, _type: DOCUMENT_TYPE}

/**
 * Renders the form above the inventory's scrolling body, in place of the inventory header, as
 * `DocumentGroupInventory` does while a variant is being created. The frame gets an
 * inspector-like size, so the pickers' popovers have room to open.
 */
const CreateVariantHarness: ComponentType<{
  variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
  sets?: VariantSet[]
  /** The width of the inspector-like frame; the selects fill it, less the card's padding. */
  width?: number
  /** The studio's perspective, for the variant selected in it. The wrapper's own when absent. */
  perspective?: PerspectiveContextValue
}> = ({variantCreationRef, sets = VERSION_SETS, width = 360, perspective}) => {
  const form = (
    <CreateVariant
      variantCreationRef={variantCreationRef}
      sets={sets}
      documentTitle={<COMPONENTS.DocTitle document={CREATE_VARIANT_TITLE_DOCUMENT} />}
    />
  )
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card border radius={3} style={{display: 'flex', width, height: 480}}>
        <Container>
          {perspective ? (
            <PerspectiveContext.Provider value={perspective}>{form}</PerspectiveContext.Provider>
          ) : (
            form
          )}
          <Body />
        </Container>
      </Card>
    </TestWrapper>
  )
}

/** The perspective with a variant selected in the studio (the variant pill), in Drafts or a release. */
function perspectiveWith({
  variant,
  release,
}: {
  variant?: SystemVariant
  release?: ReleaseDocument
}): PerspectiveContextValue {
  const releaseId = release?.name
  const variantNames = variant ? [variant._id.replace('_.variants.', '')] : []
  return {
    selectedPerspectiveName: releaseId,
    selectedReleaseId: releaseId,
    selectedPerspective: release ?? 'drafts',
    perspectiveStack: releaseId ? [releaseId, 'drafts'] : ['drafts'],
    excludedPerspectives: [],
    selectedVariantNames: variantNames,
    selectedVariants: variant ? [variant] : [],
    // oxlint-disable-next-line typescript/no-deprecated -- the context value still carries it
    selectedVariantName: variantNames[0],
    // oxlint-disable-next-line typescript/no-deprecated -- the context value still carries it
    selectedVariant: variant,
    bundle: releaseId ?? 'drafts',
  }
}

const $variantTrigger = page.getByTestId('create-variant-variant-menu-button')
const $targetTrigger = page.getByTestId('create-variant-target-menu-button')
const $baseTrigger = page.getByTestId('create-variant-base-menu-button')
const $variantMenu = page.getByTestId('create-variant-variant-menu')
const $targetMenu = page.getByTestId('create-variant-target-menu')
const $baseMenu = page.getByTestId('create-variant-base-menu')

describe('CreateVariant', () => {
  it('starts with no variant, Add to on the current perspective and Start from on the nearest version, and creates nothing until confirmed', async () => {
    // Confirming swaps the button for a spinner, so archive the form before the click.
    configure({disableAutoSnapshot: true})
    const {settleChromaticEndState} = testHelpers()
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} />)

    await expect
      .element(page.getByRole('heading', {name: 'New variant of Ursula K. Le Guin'}))
      .toBeVisible()
    await expect.element(page.getByText('Variant', {exact: true})).toBeVisible()
    await expect.element($variantTrigger).toHaveTextContent('Choose who sees it')
    await expect.element(page.getByText('Add to', {exact: true})).toBeVisible()
    await expect.element($targetTrigger).toHaveTextContent('Drafts')
    await expect.element(page.getByText('Start from', {exact: true})).toBeVisible()
    await expect.element($baseTrigger).toHaveTextContent('Nearest version')
    // Every select shows a glyph, the empty Variant select too.
    // The glyph's box is zero high (it does not set the select's height), so check what it paints.
    for (const field of ['variant', 'target', 'base']) {
      const $glyph = page.getByTestId(`create-variant-${field}-menu-glyph`)
      await expect.element($glyph).toBeInTheDocument()
      const ink = $glyph.element().querySelector('svg')?.getBoundingClientRect()
      expect(ink?.width).toBeGreaterThan(0)
      expect(ink?.height).toBeGreaterThan(0)
    }
    await expect.element(page.getByRole('button', {name: 'Cancel'})).toBeEnabled()

    // Create variant waits for a variant.
    const $create = page.getByRole('button', {name: 'Create variant'})
    await expect.element($create).toBeDisabled()
    expect(variantCreationRef.getSnapshot().matches({active: 'configuring'})).toBe(true)

    await settleChromaticEndState()
    await takeSnapshot('defaults')

    await userEvent.click($variantTrigger)
    await userEvent.click($variantMenu.getByRole('menuitemradio', {name: 'Summer sale'}))
    await expect.element($variantTrigger).toHaveTextContent('Summer sale')
    await expect.element($create).toBeEnabled()
    await expect.element($variantMenu).not.toBeVisible()
    await settleChromaticEndState()

    await userEvent.click($create)
    const snapshot = variantCreationRef.getSnapshot()
    expect(snapshot.matches({active: 'creating'})).toBe(true)
    expect(snapshot.context.selectedVariantId).toBe(SUMMER_SALE._id)
    expect(snapshot.context.selectedBundle).toEqual({type: 'drafts'})
    // The nearest version is resolved when the variant is created.
    expect(snapshot.context.selectedBaseId).toBeUndefined()
  })

  it('offers every version to start from, and keeps a picked one when the target changes', async () => {
    const {settleChromaticEndState} = testHelpers()
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} />)

    await userEvent.click($baseTrigger)
    // "Nearest version" comes first, in a section of its own.
    const [$nearest, $firstVersion] = $baseMenu.getByRole('menuitemradio').all()
    await expect.element($nearest).toMatchTextContent('Nearest version')
    expect($firstVersion.element().previousElementSibling).toBe(
      $baseMenu.element().querySelector('[data-ui="MenuDivider"]'),
    )
    await expect
      .element($baseMenu.getByRole('menuitemradio', {name: 'Default · Published'}))
      .toBeVisible()
    await expect
      .element($baseMenu.getByRole('menuitemradio', {name: 'Default · Draft'}))
      .toBeVisible()
    await expect
      .element(
        $baseMenu.getByRole('menuitemradio', {
          name: `Summer sale · ${activeASAPRelease.metadata.title}`,
        }),
      )
      .toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect.element($baseMenu).not.toBeVisible()

    await userEvent.click($targetTrigger)
    await userEvent.click(
      $targetMenu.getByRole('menuitemradio', {name: activeUndecidedRelease.metadata.title}),
    )
    await expect.element($baseTrigger).toMatchTextContent('Nearest version')

    await userEvent.click($baseTrigger)
    await userEvent.click($baseMenu.getByRole('menuitemradio', {name: 'Default · Published'}))
    await expect.element($baseTrigger).toMatchTextContent('Default · Published')

    await userEvent.click($targetTrigger)
    await userEvent.click($targetMenu.getByRole('menuitemradio', {name: 'Drafts'}))
    await expect.element($baseTrigger).toMatchTextContent('Default · Published')
    expect(variantCreationRef.getSnapshot().context.selectedBaseId).toBe(PUBLISHED.id)

    // Picking "Nearest version" again drops the picked version.
    await userEvent.click($baseTrigger)
    await userEvent.click($baseMenu.getByRole('menuitemradio', {name: 'Nearest version'}))
    await expect.element($baseTrigger).toMatchTextContent('Nearest version')
    expect(variantCreationRef.getSnapshot().context.selectedBaseId).toBeUndefined()
    await expect.element($baseMenu).not.toBeVisible()

    await expect.element($targetMenu).not.toBeVisible()
    await settleChromaticEndState()
  })

  it('does not offer the proposed changes as a version to start from', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    const proposedChanges = variant(`versions.agent-abc123.${PUBLISHED_ID}`, 'Proposed changes', {
      bundleId: 'agent-abc123',
    })

    void render(
      <CreateVariantHarness
        variantCreationRef={variantCreationRef}
        sets={[
          {
            key: 'studio:content-agent',
            name: 'Content Agent',
            bundle: {type: 'agent'},
            variants: [proposedChanges],
          },
          ...VERSION_SETS,
        ]}
      />,
    )

    await userEvent.click($baseTrigger)
    await expect
      .element($baseMenu.getByRole('menuitemradio', {name: 'Default · Published'}))
      .toBeVisible()
    await expect.element($baseMenu.getByText(/Proposed changes/)).not.toBeInTheDocument()
  })

  it('offers the open releases not holding the variant, and falls back when one does', async () => {
    const {settleChromaticEndState} = testHelpers()
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} />)

    await userEvent.click($variantTrigger)
    await userEvent.click($variantMenu.getByRole('menuitemradio', {name: 'Summer sale'}))
    await expect.element($variantMenu).not.toBeVisible()

    await userEvent.click($targetTrigger)
    await expect.element($targetMenu).toBeVisible()
    await expect.element($targetMenu.getByRole('menuitemradio', {name: 'Drafts'})).toBeVisible()
    await expect
      .element(
        $targetMenu.getByRole('menuitemradio', {name: activeScheduledRelease.metadata.title}),
      )
      .toBeVisible()
    await expect
      .element(
        $targetMenu.getByRole('menuitemradio', {name: activeUndecidedRelease.metadata.title}),
      )
      .toBeVisible()
    // Already holds a "Summer sale" variant.
    await expect
      .element($targetMenu.getByRole('menuitemradio', {name: activeASAPRelease.metadata.title}))
      .not.toBeInTheDocument()
    await userEvent.click($targetMenu.getByRole('menuitemradio', {name: 'Drafts'}))

    // "vip-users" exists in no release yet, so the ASAP release can be picked for it.
    await userEvent.click($variantTrigger)
    await userEvent.click($variantMenu.getByRole('menuitemradio', {name: 'vip-users'}))
    await expect.element($variantTrigger).toMatchTextContent('vip-users')
    await userEvent.click($targetTrigger)
    await userEvent.click(
      $targetMenu.getByRole('menuitemradio', {name: activeASAPRelease.metadata.title}),
    )
    await expect.element($targetTrigger).toMatchTextContent(activeASAPRelease.metadata.title)
    expect(variantCreationRef.getSnapshot().context.selectedBundle).toEqual({
      type: 'release',
      releaseId: activeASAPRelease._id,
    })

    // Switching back to "Summer sale" falls back to the current perspective, Drafts.
    await userEvent.click($variantTrigger)
    await userEvent.click($variantMenu.getByRole('menuitemradio', {name: 'Summer sale'}))
    await expect.element($targetTrigger).toMatchTextContent('Drafts')
    expect(variantCreationRef.getSnapshot().matches({active: 'configuring'})).toBe(true)

    // The menu animates out after a pick; settling while it is still visible would wait for it.
    await expect.element($variantMenu).not.toBeVisible()
    await settleChromaticEndState()
  })

  it('narrows the options with the filter, and clears it when the menu closes', async () => {
    const {settleChromaticEndState} = testHelpers()
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} />)

    await userEvent.click($targetTrigger)
    const $filter = $targetMenu.getByPlaceholder('Search…')
    await expect.element($filter).toBeVisible()

    await userEvent.type($filter, 'undecided')
    await expect
      .element(
        $targetMenu.getByRole('menuitemradio', {name: activeUndecidedRelease.metadata.title}),
      )
      .toBeVisible()
    await expect
      .element($targetMenu.getByRole('menuitemradio', {name: 'Drafts'}))
      .not.toBeInTheDocument()

    await userEvent.clear($filter)
    await userEvent.type($filter, 'zzz')
    await expect
      .element($targetMenu.getByTestId('create-variant-target-menu-no-matches'))
      .toHaveTextContent('Nothing matches "zzz"')

    await userEvent.keyboard('{Escape}')
    await expect.element($targetMenu).not.toBeVisible()
    await userEvent.click($targetTrigger)
    await expect.element($targetMenu.getByPlaceholder('Search…')).toHaveValue('')
    await expect.element($targetMenu.getByLabelText('Search…')).toHaveValue('')
    await expect.element($targetMenu.getByRole('menuitemradio', {name: 'Drafts'})).toBeVisible()
    await expect
      .element($targetMenu.getByRole('menuitemradio', {name: 'Drafts'}))
      .toHaveAttribute('aria-checked', 'true')
    await expect
      .element(
        $targetMenu.getByRole('menuitemradio', {name: activeUndecidedRelease.metadata.title}),
      )
      .toHaveAttribute('aria-checked', 'false')

    // The filter only narrows the list; the current option is unchanged.
    await userEvent.keyboard('{Escape}')
    await expect.element($targetMenu).not.toBeVisible()
    await expect.element($targetTrigger).toMatchTextContent('Drafts')

    await settleChromaticEndState()
  })

  it('focuses the filter each time the menu opens, by pointer or keyboard', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} />)

    const $filter = $targetMenu.getByPlaceholder('Search…')

    await userEvent.click($targetTrigger)
    await expect.element($filter).toHaveFocus()

    // The arrow keys still move from the filter into the options.
    await userEvent.keyboard('{ArrowDown}')
    await expect.element($targetMenu.getByRole('menuitemradio', {name: 'Drafts'})).toHaveFocus()

    // The menu stays mounted while closed, so the filter is focused again on the next open.
    await userEvent.keyboard('{Escape}')
    await expect.element($targetMenu).not.toBeVisible()
    // Keep the pointer off the options, which take focus when hovered.
    await userEvent.hover(page.getByRole('heading', {name: 'New variant of Ursula K. Le Guin'}))

    const openFromKeyboard = async (key: string) => {
      // Focus the trigger explicitly: whether closing the menu hands focus back to it is the menu's
      // behaviour, and Firefox does not always do it. This test is about what keyboard opening does.
      $targetTrigger.element().focus()
      await expect.element($targetTrigger).toHaveFocus()
      await userEvent.keyboard(key)
      await expect.element($filter).toHaveFocus()
      await userEvent.keyboard('{Escape}')
      await expect.element($targetMenu).not.toBeVisible()
    }

    await openFromKeyboard('{Enter}')
    await openFromKeyboard('{ArrowDown}')
    await openFromKeyboard('{ArrowUp}')
  })

  it('cancels the creation', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} />)

    await userEvent.click(page.getByRole('button', {name: 'Cancel'}))
    expect(variantCreationRef.getSnapshot().matches('idle')).toBe(true)
  })

  it('closes on Escape, and an open menu takes the first Escape', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} />)

    await userEvent.click($targetTrigger)
    await expect.element($targetMenu).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect.element($targetMenu).not.toBeVisible()
    expect(variantCreationRef.getSnapshot().matches({active: 'configuring'})).toBe(true)

    $targetTrigger.element().focus()
    await userEvent.keyboard('{Escape}')
    expect(variantCreationRef.getSnapshot().matches('idle')).toBe(true)
  })

  it('takes the focus when it opens, so Escape closes it without a click into the form', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} />)

    await expect.element($variantTrigger).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(variantCreationRef.getSnapshot().matches('idle')).toBe(true)
  })

  it('opens a menu from its select only, not from the field title or the space beside it', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} />)

    const fields = [
      {title: 'create-variant-variant-menu-title', $trigger: $variantTrigger, $menu: $variantMenu},
      {title: 'create-variant-target-menu-title', $trigger: $targetTrigger, $menu: $targetMenu},
      {title: 'create-variant-base-menu-title', $trigger: $baseTrigger, $menu: $baseMenu},
    ]
    // A menu that never opened is not mounted yet; one that closed is hidden. Neither is open.
    const isOpen = ($menu: typeof $variantMenu) =>
      $menu.elements().some((element) => element.checkVisibility())
    for (const {title, $trigger, $menu} of fields) {
      const $title = page.getByTestId(title)
      await userEvent.click($title)
      await expect.poll(() => isOpen($menu)).toBe(false)

      // The empty space right of the title, on the same line.
      const titleBox = $title.element().getBoundingClientRect()
      const triggerBox = $trigger.element().getBoundingClientRect()
      await userEvent.click($title, {
        position: {x: triggerBox.right - titleBox.left - 4, y: titleBox.height / 2},
      })
      await expect.poll(() => isOpen($menu)).toBe(false)

      await userEvent.click($trigger)
      await expect.element($menu).toBeVisible()
      await userEvent.keyboard('{Escape}')
      await expect.element($menu).not.toBeVisible()
    }
    // The select is still named by its title.
    await expect.element(page.getByRole('button', {name: /^Add to/})).toBeVisible()
  })

  it('starts Variant on the variant selected in the studio when the document has no version of it yet', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(
      <CreateVariantHarness
        variantCreationRef={variantCreationRef}
        perspective={perspectiveWith({variant: VIP_USERS})}
      />,
    )

    await expect.element($variantTrigger).toHaveTextContent('vip-users')
    await expect.element($targetTrigger).toHaveTextContent('Drafts')
    const $create = page.getByRole('button', {name: 'Create variant'})
    await expect.element($create).toBeEnabled()

    await userEvent.click($create)
    const snapshot = variantCreationRef.getSnapshot()
    expect(snapshot.matches({active: 'creating'})).toBe(true)
    expect(snapshot.context.selectedVariantId).toBe(VIP_USERS._id)
    expect(snapshot.context.selectedBundle).toEqual({type: 'drafts'})
  })

  it('leaves Variant empty while Default is selected', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(
      <CreateVariantHarness
        variantCreationRef={variantCreationRef}
        perspective={perspectiveWith({})}
      />,
    )

    await expect.element($variantTrigger).toHaveTextContent('Choose who sees it')
    await expect.element(page.getByRole('button', {name: 'Create variant'})).toBeDisabled()
  })

  it('leaves Variant empty when the selected variant already has a version in the Add to bundle', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    // Summer sale already has a version in the ASAP release, the release in view.
    void render(
      <CreateVariantHarness
        variantCreationRef={variantCreationRef}
        perspective={perspectiveWith({variant: SUMMER_SALE, release: activeASAPRelease})}
      />,
    )

    await expect.element($targetTrigger).toHaveTextContent(activeASAPRelease.metadata.title)
    await expect.element($variantTrigger).toHaveTextContent('Choose who sees it')
    await expect.element(page.getByRole('button', {name: 'Create variant'})).toBeDisabled()
  })

  it('clears the pre-filled Variant when Add to moves to a bundle that already has that variant', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    // Summer sale has no draft yet, but has a version in the ASAP release.
    void render(
      <CreateVariantHarness
        variantCreationRef={variantCreationRef}
        perspective={perspectiveWith({variant: SUMMER_SALE})}
      />,
    )

    await expect.element($variantTrigger).toHaveTextContent('Summer sale')
    const $create = page.getByRole('button', {name: 'Create variant'})
    await expect.element($create).toBeEnabled()

    await userEvent.click($targetTrigger)
    await userEvent.click(
      $targetMenu.getByRole('menuitemradio', {name: activeASAPRelease.metadata.title}),
    )
    await expect.element($targetTrigger).toHaveTextContent(activeASAPRelease.metadata.title)
    await expect.element($variantTrigger).toHaveTextContent('Choose who sees it')
    await expect.element($create).toBeDisabled()

    // Back in Drafts, where it has no version, the selected variant is offered again.
    await userEvent.click($targetTrigger)
    await userEvent.click($targetMenu.getByRole('menuitemradio', {name: 'Drafts'}))
    await expect.element($variantTrigger).toHaveTextContent('Summer sale')
  })

  it('opens every menu at the top of its list, and goes back to the top when the search changes', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    // Enough versions that the Start from list scrolls inside its 320px menu.
    const manyVersions = Array.from({length: 14}, (_, index) =>
      variant(`versions.r${index}.${PUBLISHED_ID}`, `Version ${index + 1}`, {
        bundleId: `r${index}`,
      }),
    )
    void render(
      <CreateVariantHarness
        variantCreationRef={variantCreationRef}
        sets={[
          ...VERSION_SETS,
          {
            key: 'many',
            name: 'Many',
            bundle: {type: 'perspective', perspective: 'drafts'},
            variants: manyVersions,
          },
        ]}
      />,
    )

    const listScroller = () => {
      // The element that scrolls: the list under the pinned search field.
      const candidates = [...$baseMenu.element().querySelectorAll<HTMLElement>('*')]
      return candidates.find((element) => element.scrollHeight > element.clientHeight + 1)
    }

    await userEvent.click($baseTrigger)
    await expect.element($baseMenu).toBeVisible()
    await expect.poll(() => listScroller()).toBeTruthy()
    const $list = listScroller()!
    $list.scrollTop = 200
    await expect.poll(() => $list.scrollTop).toBeGreaterThan(0)

    // Closed and opened again: back at the top, with the search field still focused.
    await userEvent.keyboard('{Escape}')
    await expect.element($baseMenu).not.toBeVisible()
    await userEvent.click($baseTrigger)
    await expect.element($baseMenu).toBeVisible()
    await expect.poll(() => listScroller()?.scrollTop).toBe(0)
    await expect.element($baseMenu.getByPlaceholder('Find')).toHaveFocus()

    // Scrolled, then the search changes: back at the top.
    listScroller()!.scrollTop = 200
    await expect.poll(() => listScroller()?.scrollTop).toBeGreaterThan(0)
    await userEvent.type($baseMenu.getByPlaceholder('Find'), 'Version')
    await expect.poll(() => listScroller()?.scrollTop).toBe(0)
  })

  it('names the version Nearest version copies from on its second line', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} />)

    await userEvent.click($baseTrigger)
    await expect
      .element($baseMenu.getByRole('menuitemradio', {name: /Nearest version/}))
      .toMatchTextContent('Copies from Default in Drafts')
  })

  it('opens each menu as wide as its select, from its left edge', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} width={480} />)

    await userEvent.click($variantTrigger)
    await expect.element($variantMenu).toBeVisible()
    const select = $variantTrigger.element().getBoundingClientRect()
    expect(select.width).toBeGreaterThan(MIN_MENU_WIDTH)
    await expect
      .poll(() => Math.round($variantMenu.element().getBoundingClientRect().width))
      .toBe(Math.round(select.width))
    expect(Math.round($variantMenu.element().getBoundingClientRect().left)).toBe(
      Math.round(select.left),
    )
  })

  it('never opens a menu narrower than 288px, from the left edge of a narrower select', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} width={280} />)

    await userEvent.click($targetTrigger)
    await expect.element($targetMenu).toBeVisible()
    const select = $targetTrigger.element().getBoundingClientRect()
    expect(select.width).toBeLessThan(MIN_MENU_WIDTH)
    await expect
      .poll(() => Math.round($targetMenu.element().getBoundingClientRect().width))
      .toBe(MIN_MENU_WIDTH)
    expect(Math.round($targetMenu.element().getBoundingClientRect().left)).toBe(
      Math.round(select.left),
    )
  })

  it('keeps a 288px menu inside the viewport when the select sits against its right edge', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(
      <div style={{position: 'fixed', top: 0, right: 0}}>
        <CreateVariantHarness variantCreationRef={variantCreationRef} width={280} />
      </div>,
    )

    await userEvent.click($variantTrigger)
    await expect.element($variantMenu).toBeVisible()
    const select = $variantTrigger.element().getBoundingClientRect()
    // Less room right of the select than the menu needs.
    expect(window.innerWidth - select.left).toBeLessThan(MIN_MENU_WIDTH)
    await expect
      .poll(() => Math.round($variantMenu.element().getBoundingClientRect().width))
      .toBe(MIN_MENU_WIDTH)
    const menu = $variantMenu.element().getBoundingClientRect()
    expect(menu.right).toBeLessThanOrEqual(window.innerWidth)
    // Shifted left to fit, so it starts left of the select instead of on its edge.
    expect(menu.left).toBeLessThan(select.left)
  })

  it('sets the select text at the size of the menu rows', async () => {
    configure({disableAutoSnapshot: true})
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} />)

    const fontSize = (element: Element) => getComputedStyle(element).fontSize
    const $value = page.getByTestId('create-variant-target-menu-value')
    await expect.element($value).toBeVisible()
    const valueText = $value.element().querySelector('span') ?? $value.element()

    await userEvent.click($targetTrigger)
    const $row = $targetMenu.getByRole('menuitemradio', {name: 'Drafts'})
    await expect.element($row).toBeVisible()
    const rowText = $row.element().querySelector('[data-ui="Text"] span')
    expect(rowText).not.toBeNull()
    expect(fontSize(valueText)).toBe(fontSize(rowText!))
    expect(fontSize(valueText)).toBe('13px')
    // The select is the height of the Variants tool's "Create variant definition" dialog inputs.
    expect(Math.round($targetTrigger.element().getBoundingClientRect().height)).toBe(33)
  })
})

describe('ConfirmDeleteDialog', () => {
  it('warns about incoming references when a published version is selected', async () => {
    const {settleChromaticEndState} = testHelpers()
    const {selectionRef, deletionRef} = startHarness()
    selectionRef.send({type: 'selection.add', variantId: PUBLISHED.id})
    selectionRef.send({type: 'selection.add', variantId: DRAFT.id})
    deletionRef.send({type: 'delete.request'})

    void render(
      <ConfirmDeleteDialogHarness deletionRef={deletionRef} selectionRef={selectionRef} />,
    )

    const $dialog = page.getByRole('dialog')
    await expect.element($dialog).toBeVisible()
    await expect
      .element($dialog.getByText('Delete 2 versions, including the Default?'))
      .toBeVisible()
    await expect
      .element($dialog.getByTestId('versions-preview-list'))
      .toHaveTextContent(`${PUBLISHED.id}, ${DRAFT.id}`)
    // Fixture: 3 internal + 1 cross-dataset reference, one internal referrer of an
    // unknown type (falls back to the "Preview unavailable" row).
    await expect.element($dialog.getByText(/4 documents refer to/)).toBeVisible()
    await expect.element($dialog.getByTestId('reference-referrer-a')).toBeVisible()
    await expect.element($dialog.getByText('Preview unavailable')).toBeVisible()
    await expect.element($dialog.getByText('1 other reference not show')).toBeVisible()
    // The info icon's tooltip is reachable by keyboard, and its text is the icon's name
    const $info = $dialog.getByTestId('other-reference-count-info')
    await expect.element($info).toHaveAttribute('tabindex', '0')
    await expect.element($info).toHaveAccessibleName(/.+/)
    // WebKit reports the truncated text spans inside the `<summary>` as not
    // visible, so check the summary lines through the details element's text.
    const $crossDataset = $dialog.getByTestId('cross-dataset-references')
    await expect.element($crossDataset).toBeVisible()
    await expect.element($crossDataset).toMatchTextContent('1 document in another dataset')
    await expect.element($crossDataset).toMatchTextContent('Dataset: production')
    await expect.element($dialog.getByRole('button', {name: 'Delete', exact: true})).toBeEnabled()

    await settleChromaticEndState()
  })

  it('expands the cross-dataset reference table', async () => {
    const {settleChromaticEndState} = testHelpers()
    const {selectionRef, deletionRef} = startHarness()
    selectionRef.send({type: 'selection.add', variantId: PUBLISHED.id})
    deletionRef.send({type: 'delete.request'})

    void render(
      <ConfirmDeleteDialogHarness deletionRef={deletionRef} selectionRef={selectionRef} />,
    )

    const $dialog = page.getByRole('dialog')
    await expect.element($dialog.getByText('Delete the Default document?')).toBeVisible()
    await userEvent.click($dialog.getByText('Dataset: production'))
    await expect.element($dialog.getByText('Project ID')).toBeVisible()
    await expect.element($dialog.getByText('remote-doc')).toBeVisible()
    await expect.element($dialog.getByRole('button', {name: 'Delete', exact: true})).toBeEnabled()

    await settleChromaticEndState()
  })
})

describe('ConfirmDeleteDialog, option C', () => {
  it('blocks the Default while required links point at it, and offers the other versions', async () => {
    const {settleChromaticEndState} = testHelpers()
    const {selectionRef, deletionRef} = startHarness(REQUIRED_REFERRING_DOCUMENTS)
    selectionRef.send({type: 'selection.add', variantId: PUBLISHED.id})
    selectionRef.send({type: 'selection.add', variantId: DRAFT.id})
    deletionRef.send({type: 'delete.request'})

    void render(
      <ConfirmDeleteDialogHarness deletionRef={deletionRef} selectionRef={selectionRef} />,
    )

    const $dialog = page.getByRole('dialog')
    await expect
      .element($dialog.getByText('Delete 2 versions, including the Default?'))
      .toBeVisible()
    await expect
      .element($dialog.getByTestId('default-blocked'))
      .toMatchTextContent("The Default document can't be deleted yet: 1 document needs it")
    // Required links lead the list.
    await expect
      .element($dialog.getByTestId('internal-references').getByRole('listitem').first())
      .toMatchTextContent('referrer-a')
    await expect
      .element($dialog.getByTestId('reference-tag-referrer-a'))
      .toHaveTextContent('Required')
    await expect
      .element($dialog.getByTestId('reference-tag-referrer-b'))
      .toHaveTextContent('Optional')
    await expect
      .element($dialog.getByRole('button', {name: 'Delete 1 other version', exact: true}))
      .toBeEnabled()

    await settleChromaticEndState()
  })

  it('names the Default, its optional links and the variants that stay', async () => {
    const {settleChromaticEndState} = testHelpers()
    const {selectionRef, deletionRef} = startHarness(OPTIONAL_REFERRING_DOCUMENTS)
    selectionRef.send({type: 'selection.add', variantId: PUBLISHED.id})
    deletionRef.send({type: 'delete.request'})

    void render(
      <ConfirmDeleteDialogHarness deletionRef={deletionRef} selectionRef={selectionRef} />,
    )

    const $dialog = page.getByRole('dialog')
    await expect.element($dialog.getByText('Delete the Default document?')).toBeVisible()
    await expect
      .element($dialog.getByTestId('optional-links'))
      .toMatchTextContent('1 document links to “Ursula K. Le Guin” with an optional link.')
    await expect.element($dialog.getByText('1 variant stays. It loses its Default.')).toBeVisible()
    await expect.element($dialog.getByRole('button', {name: 'Delete', exact: true})).toBeEnabled()

    await settleChromaticEndState()
  })

  it('says that deleting variants breaks no links', async () => {
    const {settleChromaticEndState} = testHelpers()
    const {selectionRef, deletionRef} = startHarness(REQUIRED_REFERRING_DOCUMENTS)
    selectionRef.send({type: 'selection.add', variantId: SUMMER_SALE_IN_ASAP.id})
    deletionRef.send({type: 'delete.request'})

    void render(
      <ConfirmDeleteDialogHarness deletionRef={deletionRef} selectionRef={selectionRef} />,
    )

    const $dialog = page.getByRole('dialog')
    await expect.element($dialog.getByText('Delete 1 version')).toBeVisible()
    await expect.element($dialog.getByText('Nothing links to these versions')).toBeVisible()
    await expect.element($dialog.getByTestId('default-blocked')).not.toBeInTheDocument()
    await expect.element($dialog.getByRole('button', {name: 'Delete', exact: true})).toBeEnabled()

    await settleChromaticEndState()
  })
})

function InventoryHeaderHarness(
  props: ReturnType<typeof startHarness> & {
    components: DocumentGroupInventoryComponents | undefined
  },
) {
  return (
    <PanelFrame>
      <InventoryHeader {...props} />
    </PanelFrame>
  )
}

describe('InventoryHeader', () => {
  it('starts variant creation from the header', async () => {
    // Starting creation empties the header, so archive it before the click.
    configure({disableAutoSnapshot: true})
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness()
    const {variantCreationRef} = refs

    void render(<InventoryHeaderHarness {...refs} components={COMPONENTS} />)

    const $createVariant = page.getByRole('button', {name: 'Create variant'})
    await expect.element($createVariant).toBeVisible()
    await expect.element(page.getByTestId('compare-versions-action')).toBeVisible()
    await settleChromaticEndState()
    await takeSnapshot('nothing-selected')

    await userEvent.click($createVariant)
    expect(variantCreationRef.getSnapshot().matches('active')).toBe(true)
    await expect.element($createVariant).not.toBeInTheDocument()
  })

  it('counts the selection and offers deletion from the header once a version is selected', async () => {
    configure({disableAutoSnapshot: true})
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness()
    const {selectionRef, deletionRef} = refs

    void render(<InventoryHeaderHarness {...refs} components={COMPONENTS} />)

    await expect.element(page.getByRole('button', {name: 'Create variant'})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Delete'})).not.toBeInTheDocument()
    await expect.element(page.getByText(/selected$/)).not.toBeInTheDocument()

    selectionRef.send({type: 'selection.add', variantId: DRAFT.id})

    const $delete = page.getByRole('button', {name: 'Delete', exact: true})
    await expect.element($delete).toBeVisible()
    await expect.element(page.getByText('1 selected', {exact: true})).toBeVisible()

    selectionRef.send({type: 'selection.add', variantId: PUBLISHED.id})
    await expect.element(page.getByText('2 selected', {exact: true})).toBeVisible()
    await settleChromaticEndState()
    await takeSnapshot('two-selected')

    await userEvent.click($delete)
    expect(deletionRef.getSnapshot().matches('active')).toBe(true)
  })

  it('swaps the group actions for clear while versions are selected', async () => {
    // The selected header is archived by the test above, and this one ends
    // back on the empty header.
    configure({disableAutoSnapshot: true})
    const refs = startHarness()
    const {selectionRef} = refs
    selectionRef.send({type: 'selection.add', variantId: DRAFT.id})
    selectionRef.send({type: 'selection.add', variantId: PUBLISHED.id})

    void render(<InventoryHeaderHarness {...refs} components={COMPONENTS} />)

    const $clear = page.getByRole('button', {name: 'Clear', exact: true})
    await expect.element($clear).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Create variant'})).not.toBeInTheDocument()
    await expect.element(page.getByTestId('compare-versions-action')).not.toBeInTheDocument()

    await userEvent.click($clear)

    expect(selectionRef.getSnapshot().context.selectedIds.size).toBe(0)
    await expect.element(page.getByRole('button', {name: 'Create variant'})).toBeVisible()
    await expect.element(page.getByTestId('compare-versions-action')).toBeVisible()
    await expect.element(page.getByText(/selected$/)).not.toBeInTheDocument()
  })

  it('renders no compare versions action without the consumer components of manage mode', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness()

    void render(<InventoryHeaderHarness {...refs} components={undefined} />)

    await expect.element(page.getByRole('button', {name: 'Create variant'})).toBeVisible()
    await expect.element(page.getByTestId('compare-versions-action')).not.toBeInTheDocument()

    await settleChromaticEndState()
  })
})

const DRAFT_VIP = variant(`versions.drafts-vip.${PUBLISHED_ID}`, 'VIP users', {
  bundleId: 'drafts',
  variants: [{_ref: VIP_USERS._id, _key: 'vip-users'}],
})
const DRAFT_SUMMER = variant(`versions.drafts-summer.${PUBLISHED_ID}`, 'Summer sale', {
  bundleId: 'drafts',
  variants: [{_ref: SUMMER_SALE._id, _key: 'summer-sale'}],
})
// Core locks a version in a scheduled release, so it cannot be selected for deletion.
const IN_SCHEDULED_RELEASE = variant(
  `versions.${scheduledRelease.name}.${PUBLISHED_ID}`,
  'Default',
  {bundleId: scheduledRelease.name, release: {_ref: scheduledRelease._id, _weak: true}},
)

const SELECTION_SETS: VariantSet[] = [
  {
    key: 'published',
    name: 'Published',
    bundle: {type: 'perspective', perspective: 'published'},
    variants: [{...PUBLISHED, name: 'Default'}],
  },
  {
    key: 'drafts',
    name: 'Draft',
    bundle: {type: 'perspective', perspective: 'drafts'},
    variants: [{...DRAFT, name: 'Default'}, DRAFT_VIP, DRAFT_SUMMER],
  },
  {
    key: scheduledRelease._id,
    name: scheduledRelease.metadata.title,
    bundle: {type: 'perspective', perspective: scheduledRelease},
    variants: [IN_SCHEDULED_RELEASE],
  },
]
const SELECTION_VARIANTS = SELECTION_SETS.flatMap((set) => set.variants)
const SELECTION_RELEASES = new Map<string, ReleaseDocument>([
  [scheduledRelease._id, scheduledRelease],
])

const SCHEDULED_REASON =
  'This version is in a scheduled release. Unschedule the release to delete it.'

/**
 * The inventory panel at 300px: the header, then every set and its rows, wired to a real selection
 * machine through the same helpers the inventory's `Select` uses.
 */
function SelectionPanel({
  refs,
  onOpen = () => undefined,
  scheme = 'light',
}: {
  refs: ReturnType<typeof startHarness>
  onOpen?: (entry: Variant) => void
  scheme?: 'light' | 'dark'
}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card
        scheme={scheme}
        style={{display: 'flex', flexDirection: 'column', width: 300, height: 600}}
        data-testid="selection-panel"
      >
        <Container>
          <InventoryHeader {...refs} components={COMPONENTS} />
          <Body>
            <SelectionSets selectionRef={refs.selectionRef} onOpen={onOpen} />
          </Body>
        </Container>
      </Card>
    </TestWrapper>
  )
}

function SelectionSets({
  selectionRef,
  onOpen,
}: {
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
  onOpen: (entry: Variant) => void
}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const selectedIds = useSelector(selectionRef, ({context}) => context.selectedIds)
  const rangeAnchorRef = useRef<RangeAnchor>(null)

  return SELECTION_SETS.map((set) => {
    const selection = getSetSelection({
      variants: set.variants,
      selectedIds,
      getRelease: ({document}) =>
        document._system.release
          ? SELECTION_RELEASES.get(document._system.release._ref)
          : undefined,
    })

    const toggle = (variantId: string, shiftKey: boolean) => {
      const next = getRowToggle({
        setKey: set.key,
        selectableIds: selection.selectableIds,
        selectedIds,
        anchor: rangeAnchorRef.current,
        variantId,
        shiftKey,
      })
      selectionRef.send(next.event)
      rangeAnchorRef.current = next.anchor
    }

    return (
      <DocumentGroupSet
        key={set.key}
        name={set.name}
        bundle={set.bundle}
        selectionState={selection.state}
        blockedReason={
          selection.groupBlockedReason
            ? t(SELECTION_BLOCKED_REASON_KEYS[selection.groupBlockedReason])
            : undefined
        }
        onCheckedChange={(checked) =>
          selectionRef.send({
            type: checked ? 'selection.addMany' : 'selection.removeMany',
            variantIds: selection.selectableIds,
          })
        }
      >
        {set.variants.map((entry) => {
          const blocked = selection.blockedReasons.get(entry.id)

          return (
            <DocumentGroupEntry
              key={entry.id}
              variant={entry}
              releases={SELECTION_RELEASES}
              onPrimaryAction={() => onOpen(entry)}
              onToggleSelection={blocked ? undefined : () => toggle(entry.id, false)}
              selectionBlockedReason={
                blocked ? t(SELECTION_BLOCKED_REASON_KEYS[blocked]) : undefined
              }
              leading={
                <VariantCheckbox
                  label={t('document-group.select-version', {name: entry.name})}
                  tabbable={false}
                  checked={selectedIds.has(entry.id)}
                  blockedReason={blocked ? t(SELECTION_BLOCKED_REASON_KEYS[blocked]) : undefined}
                  onChange={(_checked, {shiftKey}) => toggle(entry.id, shiftKey)}
                />
              }
            />
          )
        })}
      </DocumentGroupSet>
    )
  })
}

function startSelectionHarness() {
  const refs = startHarness()
  refs.selectionRef.send({type: 'variants.changed', variants: SELECTION_VARIANTS, loaded: true})
  return refs
}

function selectionSet(name: string): HTMLElement {
  const set = document.querySelector<HTMLElement>(`[data-variant-set="${name}"]`)
  if (!set) throw new Error(`Expected the "${name}" set to have rendered`)
  return set
}

function selectionRow(setName: string, rowName: string): HTMLElement {
  const row = selectionSet(setName).querySelector<HTMLElement>(`[data-variant-name="${rowName}"]`)
  if (!row) throw new Error(`Expected the "${rowName}" row in "${setName}" to have rendered`)
  return row
}

function rowCheckbox(setName: string, rowName: string): HTMLInputElement {
  return selectionRow(setName, rowName).querySelector<HTMLInputElement>('input[type="checkbox"]')!
}

function groupCheckbox(setName: string): HTMLInputElement {
  return selectionSet(setName).querySelector<HTMLInputElement>('header input[type="checkbox"]')!
}

function centreX(element: Element): number {
  const rect = element.getBoundingClientRect()
  return rect.left + rect.width / 2
}

function rgb(value: string) {
  const color = parseColor(value)
  if (!color) throw new Error(`Could not read the colour "${value}"`)
  return color
}

/** The colour of the 1px border Sanity UI draws as an inset box shadow on the checkbox's box. */
function checkboxBorder(checkbox: HTMLInputElement) {
  const shadow = getComputedStyle(checkbox.nextElementSibling!).boxShadow
  return rgb(/(rgba?\([^)]*\)|color\([^)]*\))/.exec(shadow)![1])
}

/** The background painted behind an element: its own, or the nearest ancestor's. */
function background(element: HTMLElement) {
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    const value = getComputedStyle(node).backgroundColor
    if (!/^rgba\(.*,\s*0\)$/.test(value) && value !== 'transparent') return rgb(value)
  }
  return rgb('#ffffff')
}

/** The contrast of a checkbox's border against the row behind it. */
function railContrast(checkbox: HTMLInputElement, row: HTMLElement) {
  return contrastRatio(checkboxBorder(checkbox), background(row))
}

function textContrast(text: HTMLElement, row: HTMLElement) {
  return contrastRatio(rgb(getComputedStyle(text).color), background(row))
}

function selected(refs: ReturnType<typeof startHarness>): string[] {
  return [...refs.selectionRef.getSnapshot().context.selectedIds].toSorted()
}

describe('Inventory selection', () => {
  it('lines the group icons and the row marks up in one column', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SelectionPanel refs={startSelectionHarness()} />)

    await expect
      .element(page.getByRole('button', {name: 'VIP users', exact: true}))
      .toBeInTheDocument()
    await settleChromaticEndState()

    const mark = selectionRow('Draft', 'VIP users').querySelector('.variant-mark svg')!
    for (const setName of ['Published', 'Draft', scheduledRelease.metadata.title]) {
      const icon = selectionSet(setName).querySelector('header .variant-set-icon svg')!
      expect(Math.abs(centreX(icon) - centreX(mark))).toBeLessThanOrEqual(1)
    }
    // 12px padding, the 17px checkbox, an 8px gap, then the middle of the 21px column
    expect(
      Math.abs(centreX(mark) - selectionSet('Draft').getBoundingClientRect().left - 47.5),
    ).toBeLessThanOrEqual(1)
  })

  it('keeps an empty checkbox quiet at rest at 3:1, and at full contrast on hover and focus', async () => {
    const refs = startSelectionHarness()
    void render(<SelectionPanel refs={refs} />)

    await expect
      .element(page.getByRole('button', {name: 'VIP users', exact: true}))
      .toBeInTheDocument()
    const vipRow = selectionRow('Draft', 'VIP users')
    const summerRow = selectionRow('Draft', 'Summer sale')
    const vip = rowCheckbox('Draft', 'VIP users')
    const summer = rowCheckbox('Draft', 'Summer sale')

    // At rest: the quietest border that still meets WCAG 1.4.11, on rows and on group headers
    const rest = railContrast(vip, vipRow)
    expect(rest).toBeGreaterThanOrEqual(3)
    expect(rest).toBeLessThan(3.3)
    expect(
      railContrast(groupCheckbox('Draft'), selectionSet('Draft').querySelector('header')!),
    ).toBeGreaterThanOrEqual(3)
    // Not faded: the control itself stays fully opaque
    expect(getComputedStyle(vip.closest('.selection-checkbox')!).opacity).toBe('1')

    // Row hover
    await userEvent.hover(page.elementLocator(vipRow))
    await expect.poll(() => railContrast(vip, vipRow)).toBeGreaterThan(rest + 2)
    expect(railContrast(summer, summerRow)).toBeLessThan(3.3)

    // Keyboard focus on the row
    await userEvent.unhover(page.elementLocator(vipRow))
    ;(summerRow.querySelector('.primary-action') as HTMLButtonElement).focus()
    await expect.poll(() => railContrast(summer, summerRow)).toBeGreaterThan(rest + 2)
    await expect.poll(() => railContrast(vip, vipRow)).toBeLessThan(3.3)
  })

  it.each(['light', 'dark'] as const)(
    'tints a checked row lightly and keeps its text at 4.5:1 or more, in %s mode',
    async (scheme) => {
      const refs = startSelectionHarness()
      void render(<SelectionPanel refs={refs} scheme={scheme} />)

      await expect
        .element(page.getByRole('button', {name: 'VIP users', exact: true}))
        .toBeInTheDocument()
      const row = selectionRow('Draft', 'VIP users')
      const panel = page.getByTestId('selection-panel').element() as HTMLElement
      const plain = background(panel)

      refs.selectionRef.send({type: 'selection.add', variantId: DRAFT_VIP.id})
      await expect.poll(() => rowCheckbox('Draft', 'VIP users').checked).toBe(true)
      await userEvent.hover(page.getByTestId('chromatic-pointer-park'))

      // A light tint: close to the panel's own background, not the saturated selection colour
      const tint = background(row)
      expect(tint).not.toEqual(plain)
      expect(contrastRatio(tint, plain)).toBeLessThan(1.3)

      const title = row.querySelector<HTMLElement>('[data-testid="version-title"]')!
      const meta = row.querySelector<HTMLElement>('[data-testid="version-secondary-line"]')!
      expect(textContrast(title, row)).toBeGreaterThanOrEqual(4.5)
      expect(textContrast(meta, row)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('draws a visible focus ring on the row, its tab stop', async () => {
    const refs = startSelectionHarness()
    void render(<SelectionPanel refs={refs} />)

    const $group = page.getByRole('checkbox', {name: 'Select all in Draft'})
    await expect.element($group).toBeVisible()
    ;($group.element() as HTMLInputElement).focus()
    await userEvent.tab()

    const row = selectionRow('Draft', 'Default')
    await expect.element(page.elementLocator(row.querySelector('.primary-action')!)).toHaveFocus()
    const style = getComputedStyle(row)
    expect(style.outlineStyle).toBe('solid')
    expect(style.outlineWidth).toBe('2px')
    expect(contrastRatio(rgb(style.outlineColor), background(row))).toBeGreaterThanOrEqual(3)
  })

  it('announces the selected count through a polite live region', async () => {
    const refs = startSelectionHarness()
    void render(<SelectionPanel refs={refs} />)

    // Mounted and empty before anything is selected, so the first count is announced
    const $status = page.getByRole('status')
    await expect.element($status).toBeInTheDocument()
    await expect.element($status).toHaveAttribute('aria-live', 'polite')
    await expect.element($status).toHaveTextContent('')

    await userEvent.click(page.getByRole('checkbox', {name: 'Select VIP users'}))
    await expect.element($status).toHaveTextContent('1 selected')
  })

  it('describes the row with the Served tooltip text, for keyboard and screen reader users', async () => {
    void render(
      <TestWrapper schemaTypes={SCHEMA_TYPES}>
        <DocumentGroupSet name="Draft" selectionState="unchecked" onCheckedChange={() => undefined}>
          <DocumentGroupEntry
            variant={DRAFT_VIP}
            releases={SELECTION_RELEASES}
            servedStatus="primary"
            onPrimaryAction={() => undefined}
          />
        </DocumentGroupSet>
      </TestWrapper>,
    )

    await expect
      .element(page.getByRole('button', {name: 'VIP users', exact: true}))
      .toHaveAccessibleDescription(/will see this version/)
  })

  it('selects every selectable row from the group checkbox, and shows a dash when only some are selected', async () => {
    const refs = startSelectionHarness()
    void render(<SelectionPanel refs={refs} />)

    const $group = page.getByRole('checkbox', {name: 'Select all in Draft'})
    await expect.element($group).toBeVisible()

    await userEvent.click($group)
    expect(selected(refs)).toEqual([DRAFT.id, DRAFT_SUMMER.id, DRAFT_VIP.id].toSorted())
    await expect.element($group).toBeChecked()
    expect(groupCheckbox('Draft').indeterminate).toBe(false)

    await userEvent.click(page.getByRole('checkbox', {name: 'Select VIP users'}))
    await expect.element($group).not.toBeChecked()
    await expect.poll(() => groupCheckbox('Draft').indeterminate).toBe(true)

    // From the partly checked state, the group checkbox selects the rest
    await userEvent.click($group)
    await expect.element($group).toBeChecked()
    expect(selected(refs)).toHaveLength(3)

    await userEvent.click($group)
    expect(selected(refs)).toEqual([])
    await expect.poll(() => groupCheckbox('Draft').indeterminate).toBe(false)
  })

  it('replaces the header row with the action bar while anything is checked', async () => {
    const refs = startSelectionHarness()
    void render(<SelectionPanel refs={refs} />)

    const $create = page.getByRole('button', {name: 'Create variant'})
    await expect.element($create).toBeVisible()
    await expect.element(page.getByText(/selected$/)).not.toBeInTheDocument()

    await userEvent.click(page.getByRole('checkbox', {name: 'Select VIP users'}))

    await expect.element(page.getByText('1 selected', {exact: true})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Delete', exact: true})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Clear', exact: true})).toBeVisible()
    await expect.element($create).not.toBeInTheDocument()

    await userEvent.click(page.getByRole('button', {name: 'Clear', exact: true}))

    expect(selected(refs)).toEqual([])
    await expect.element(page.getByText(/selected$/)).not.toBeInTheDocument()
    await expect.element($create).toBeVisible()
  })

  it('opens a version when its row is clicked, without selecting it', async () => {
    const refs = startSelectionHarness()
    const onOpen = vi.fn<(entry: Variant) => void>()
    void render(<SelectionPanel refs={refs} onOpen={onOpen} />)

    await userEvent.click(page.getByRole('button', {name: 'VIP users', exact: true}))

    expect(onOpen).toHaveBeenCalledExactlyOnceWith(DRAFT_VIP)
    expect(selected(refs)).toEqual([])
  })

  it('toggles the focused row with Space, while Enter still opens it', async () => {
    const refs = startSelectionHarness()
    const onOpen = vi.fn<(entry: Variant) => void>()
    void render(<SelectionPanel refs={refs} onOpen={onOpen} />)

    const $row = page.getByRole('button', {name: 'VIP users', exact: true})
    await expect.element($row).toBeInTheDocument()
    ;($row.element() as HTMLButtonElement).focus()

    await userEvent.keyboard(' ')
    await expect.poll(() => selected(refs)).toEqual([DRAFT_VIP.id])
    expect(onOpen).not.toHaveBeenCalled()
    await expect.element($row).toHaveFocus()

    await userEvent.keyboard(' ')
    await expect.poll(() => selected(refs)).toEqual([])

    await userEvent.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledExactlyOnceWith(DRAFT_VIP)
    expect(selected(refs)).toEqual([])
  })

  it('selects a range within the group with Shift-click', async () => {
    const refs = startSelectionHarness()
    void render(<SelectionPanel refs={refs} />)

    await expect
      .element(page.getByRole('button', {name: 'Summer sale', exact: true}))
      .toBeInTheDocument()

    await userEvent.click(page.elementLocator(rowCheckbox('Draft', 'Default')))
    await userEvent.keyboard('{Shift>}')
    await userEvent.click(page.elementLocator(rowCheckbox('Draft', 'Summer sale')))
    await userEvent.keyboard('{/Shift}')

    expect(selected(refs)).toEqual([DRAFT.id, DRAFT_SUMMER.id, DRAFT_VIP.id].toSorted())

    // A range never reaches into another group: Shift-click there toggles that row alone
    await userEvent.keyboard('{Shift>}')
    await userEvent.click(page.elementLocator(rowCheckbox('Published', 'Default')))
    await userEvent.keyboard('{/Shift}')

    expect(selected(refs)).toEqual(
      [PUBLISHED.id, DRAFT.id, DRAFT_SUMMER.id, DRAFT_VIP.id].toSorted(),
    )

    // Shift-click back on a checked row in the same group deselects the range
    await userEvent.click(page.elementLocator(rowCheckbox('Draft', 'Summer sale')))
    await userEvent.keyboard('{Shift>}')
    await userEvent.click(page.elementLocator(rowCheckbox('Draft', 'VIP users')))
    await userEvent.keyboard('{/Shift}')

    expect(selected(refs)).toEqual([PUBLISHED.id, DRAFT.id].toSorted())
  })

  it('keeps a disabled checkbox on a row that cannot be selected, with the reason in a tooltip', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startSelectionHarness()
    void render(<SelectionPanel refs={refs} />)

    const setName = scheduledRelease.metadata.title
    await expect.element(page.getByText(setName, {exact: true})).toBeVisible()

    const checkbox = rowCheckbox(setName, 'Default')
    expect(isShown(checkbox)).toBe(true)
    expect(checkbox.getAttribute('aria-disabled')).toBe('true')
    // Not natively disabled, so it still takes focus and shows its tooltip
    expect(checkbox.disabled).toBe(false)

    // The row is the keyboard's tab stop, and carries the reason as its description
    await expect
      .element(
        page.elementLocator(selectionRow(setName, 'Default').querySelector('.primary-action')!),
      )
      .toHaveAccessibleDescription(SCHEDULED_REASON)

    await userEvent.hover(page.elementLocator(checkbox))
    // Closed tooltips stay mounted, so look for the open one
    await expect
      .poll(() =>
        [...document.querySelectorAll('[data-ui="Tooltip"]')]
          .filter(isShown)
          .map((tooltip) => tooltip.textContent),
      )
      .toEqual([SCHEDULED_REASON])

    // A blocked checkbox reads as disabled, so the pointer has to be forced onto it
    await userEvent.click(page.elementLocator(checkbox), {force: true})
    expect(selected(refs)).toEqual([])
    expect(checkbox.checked).toBe(false)

    // Nothing in the group can be selected, so the group checkbox is blocked for the same reason
    expect(groupCheckbox(setName).getAttribute('aria-disabled')).toBe('true')
    await userEvent.click(page.elementLocator(groupCheckbox(setName)), {force: true})
    expect(selected(refs)).toEqual([])

    await settleChromaticEndState()
  })

  it('reaches the group checkbox by keyboard while nothing is selected', async () => {
    const refs = startSelectionHarness()
    void render(<SelectionPanel refs={refs} />)

    const $create = page.getByRole('button', {name: 'Create variant'})
    await expect.element($create).toBeVisible()
    ;($create.element() as HTMLButtonElement).focus()

    await userEvent.tab()
    await expect
      .element(page.getByRole('checkbox', {name: 'Select all in Published'}))
      .toHaveFocus()

    await userEvent.keyboard(' ')
    expect(selected(refs)).toEqual([PUBLISHED.id])
  })
})
