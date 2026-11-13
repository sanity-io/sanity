import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {type MultipleMutationResult, type ReleaseDocument} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import {Card, PortalProvider} from '@sanity/ui'
import {type ComponentType, useMemo, useState} from 'react'
import {BehaviorSubject} from 'rxjs'
import {Text} from 'ui5'
import {afterEach, describe, expect, it} from 'vitest'
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

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {type ReleasesReducerState} from '../../../releases/store/reducer'
import {getDocumentVersionVariantId} from '../../../util/getDocumentVersionVariant'
import {type VariantStoreState} from '../../../variants/store/reducer'
import {type SystemVariant} from '../../../variants/types'
import {deletionMachine, type ReferringDocuments} from '../../machines/deletionMachine'
import {type VariantSet} from '../../machines/documentGroupInventoryMachine'
import {selectionMachine, type Variant} from '../../machines/selectionMachine'
import {variantCreationMachine} from '../../machines/variantCreationMachine'
import {type DocumentGroupInventoryComponents} from '../../types'
import {Body} from '../Body'
import {ConfirmDeleteDialog} from '../ConfirmDeleteDialog'
import {Container} from '../Container'
import {CreateVariant} from '../CreateVariant/CreateVariant'
import {InventoryHeader} from '../InventoryHeader'

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

const DE_DE: SystemVariant = {...SUMMER_SALE, _id: '_.variants.de-DE', metadata: {title: 'de-DE'}}
const MEMBERS: SystemVariant = {
  ...SUMMER_SALE,
  _id: '_.variants.members',
  metadata: {title: 'Members'},
}
// Variant copies are named by their scope, never by the variant: the dialog must not show this id.
const DE_DE_DRAFT = variant(`versions.scope-de.${PUBLISHED_ID}`, 'de-DE', {
  bundleId: 'drafts',
  variants: [{_ref: DE_DE._id, _key: 'de-DE'}],
})
const DE_DE_PUBLISHED = variant(`versions.scope-de-published.${PUBLISHED_ID}`, 'de-DE', {
  variants: [{_ref: DE_DE._id, _key: 'de-DE'}],
})
const MEMBERS_DRAFT = variant(`versions.scope-members.${PUBLISHED_ID}`, 'Members', {
  bundleId: 'drafts',
  variants: [{_ref: MEMBERS._id, _key: 'members'}],
})
/** The Default's copies plus two variants: de-DE (a draft and a published copy) and Members. */
const WITH_VARIANTS = [
  {...PUBLISHED, name: 'Default'},
  {...DRAFT, name: 'Default'},
  DE_DE_DRAFT,
  DE_DE_PUBLISHED,
  MEMBERS_DRAFT,
]
/** The Default's copies and nothing else. */
const WITHOUT_VARIANTS = [
  {...PUBLISHED, name: 'Default'},
  {...DRAFT, name: 'Default'},
]

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

function internalOnly(
  references: NonNullable<ReferringDocuments['internalReferences']>['references'],
  totalCount = references.length,
): ReferringDocuments {
  return {
    isLoading: false,
    totalCount,
    projectIds: [],
    datasetNames: [],
    hasUnknownDatasetNames: false,
    internalReferences: {totalCount, references},
    crossDatasetReferences: {totalCount: 0, references: []},
  }
}

const NO_LINKS = internalOnly([])

/**
 * More referrers than the reference query reads (it lists 100), none of the listed ones required:
 * a required link may sit in the unread rest.
 */
const OVER_CAP_REFERRING_DOCUMENTS = internalOnly(
  Array.from({length: 100}, (_, index) => ({
    _id: `referrer-${String(index).padStart(3, '0')}`,
    _type: DOCUMENT_TYPE,
    required: false,
    failsLater: false,
  })),
  140,
)

/** A required link that only a release copy holds, next to an optional one. */
const RELEASE_COPY_REFERRING_DOCUMENTS = internalOnly([
  {_id: 'referrer-b', _type: DOCUMENT_TYPE, required: false, failsLater: false},
  {_id: 'versions.rp-release.referrer-r', _type: DOCUMENT_TYPE, required: false, failsLater: true},
])

/** Only links from other datasets. */
const CROSS_DATASET_REFERRING_DOCUMENTS: ReferringDocuments = {
  isLoading: false,
  totalCount: 2,
  projectIds: ['abc123'],
  datasetNames: ['production', 'staging'],
  hasUnknownDatasetNames: false,
  internalReferences: {totalCount: 0, references: []},
  crossDatasetReferences: {
    totalCount: 2,
    references: [
      {projectId: 'abc123', datasetName: 'production', documentId: 'remote-doc'},
      {projectId: 'abc123', datasetName: 'staging', documentId: 'remote-doc-2'},
    ],
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
          deleteVariants: fromPromise(async ({input: {ids}}) => {
            deletedIds.push(ids)
            return {} as MultipleMutationResult
          }),
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
/** What the harness's delete actor was asked to delete, one entry per confirmed delete. */
let deletedIds: string[][] = []

function startHarness(
  referringDocuments: ReferringDocuments = REFERRING_DOCUMENTS,
  variants: Variant[] = VARIANTS,
) {
  harness = createActor(harnessMachine, {input: {referringDocuments}}).start()
  const {selectionRef, deletionRef, variantCreationRef} = harness.getSnapshot().context
  selectionRef.send({type: 'variants.changed', variants, loaded: true})
  // What `documentGroupInventoryMachine` tells the deletion machine about the document group.
  deletionRef.send({
    type: 'versions.changed',
    versionIds: variants.map(({id}) => id),
    variantIds: [
      ...new Set(
        variants
          .map(({document}) => getDocumentVersionVariantId(document))
          .filter((variantId) => typeof variantId === 'string'),
      ),
    ],
  })
  return {selectionRef, deletionRef, variantCreationRef}
}

afterEach(() => {
  harness?.stop()
  harness = undefined
  deletedIds = []
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
}> = ({variantCreationRef, sets = VERSION_SETS}) => {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card border radius={3} style={{display: 'flex', width: 360, height: 480}}>
        <Container>
          <CreateVariant
            variantCreationRef={variantCreationRef}
            sets={sets}
            documentTitle={<COMPONENTS.DocTitle document={CREATE_VARIANT_TITLE_DOCUMENT} />}
          />
          <Body />
        </Container>
      </Card>
    </TestWrapper>
  )
}

const $variantTrigger = page.getByTestId('create-variant-variant-menu-button')
const $targetTrigger = page.getByTestId('create-variant-target-menu-button')
const $baseTrigger = page.getByTestId('create-variant-base-menu-button')
const $variantMenu = page.getByTestId('create-variant-variant-menu')
const $targetMenu = page.getByTestId('create-variant-target-menu')
const $baseMenu = page.getByTestId('create-variant-base-menu')

describe('CreateVariant', () => {
  it('shows the first variant and target, and creates nothing until confirmed', async () => {
    // Confirming swaps the button for a spinner, so archive the form before the click.
    configure({disableAutoSnapshot: true})
    const {settleChromaticEndState} = testHelpers()
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(<CreateVariantHarness variantCreationRef={variantCreationRef} />)

    await expect.element(page.getByRole('heading', {name: 'Create version'})).toBeVisible()
    await expect.element(page.getByText('A new version of Ursula K. Le Guin')).toBeVisible()
    await expect.element(page.getByText('Variant', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Who sees this version')).toBeVisible()
    await expect.element($variantTrigger).toMatchTextContent('Summer sale')
    await expect.element(page.getByText('Target', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Where it lives')).toBeVisible()
    await expect.element($targetTrigger).toMatchTextContent('Drafts')
    await expect.element(page.getByText('Document', {exact: true})).toBeVisible()
    await expect.element(page.getByText('What it starts from')).toBeVisible()
    await expect.element($baseTrigger).toMatchTextContent('Nearest version')
    await expect.element(page.getByRole('button', {name: 'Cancel'})).toBeEnabled()

    const $create = page.getByRole('button', {name: 'Create version'})
    await expect.element($create).toBeEnabled()
    expect(variantCreationRef.getSnapshot().matches({active: 'configuring'})).toBe(true)

    await settleChromaticEndState()

    await takeSnapshot('defaults')

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
    await expect.element($nearest).toHaveTextContent('Nearest version')
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

    // Switching back to "Summer sale" falls back to the first target.
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
    const $filter = $targetMenu.getByPlaceholder('Find')
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
    await expect.element($targetMenu.getByPlaceholder('Find')).toHaveValue('')
    await expect.element($targetMenu.getByLabelText('Find')).toHaveValue('')
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

    const $filter = $targetMenu.getByPlaceholder('Find')

    await userEvent.click($targetTrigger)
    await expect.element($filter).toHaveFocus()

    // The arrow keys still move from the filter into the options.
    await userEvent.keyboard('{ArrowDown}')
    await expect.element($targetMenu.getByRole('menuitemradio', {name: 'Drafts'})).toHaveFocus()

    // The menu stays mounted while closed, so the filter is focused again on the next open.
    await userEvent.keyboard('{Escape}')
    await expect.element($targetMenu).not.toBeVisible()
    // Keep the pointer off the options, which take focus when hovered.
    await userEvent.hover(page.getByRole('heading', {name: 'Create version'}))

    const openFromKeyboard = async (key: string) => {
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
})

const $dialog = page.getByRole('dialog')
const $cancel = $dialog.getByRole('button', {name: 'Cancel', exact: true})

function selectAndRequest(
  {selectionRef, deletionRef}: ReturnType<typeof startHarness>,
  ids: string[],
) {
  for (const id of ids) selectionRef.send({type: 'selection.add', variantId: id})
  deletionRef.send({type: 'delete.request'})
}

describe('ConfirmDeleteDialog', () => {
  it('falls back to the warning while the strength of the links is unknown', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness(REFERRING_DOCUMENTS, WITHOUT_VARIANTS)
    selectAndRequest(refs, [PUBLISHED.id, DRAFT.id])

    void render(
      <ConfirmDeleteDialogHarness
        deletionRef={refs.deletionRef}
        selectionRef={refs.selectionRef}
      />,
    )

    await expect
      .element($dialog.getByText('Delete 2 versions, including the Default?'))
      .toBeVisible()
    // Fixture: 3 internal + 1 cross-dataset reference, one internal referrer of an
    // unknown type (falls back to the "Preview unavailable" row).
    await expect.element($dialog.getByText(/4 documents refer to/)).toBeVisible()
    await expect.element($dialog.getByText(/You may not be able to delete/)).toBeVisible()
    await expect.element($dialog.getByTestId('reference-referrer-a')).toBeVisible()
    await expect.element($dialog.getByText('Preview unavailable')).toBeVisible()
    await expect.element($dialog.getByText('1 other reference not show')).toBeVisible()
    // WebKit reports the truncated text spans inside the `<summary>` as not
    // visible, so check the summary lines through the details element's text.
    const $crossDataset = $dialog.getByTestId('cross-dataset-references')
    await expect.element($crossDataset).toBeVisible()
    await expect.element($crossDataset).toMatchTextContent('1 document in another dataset')
    await expect.element($crossDataset).toMatchTextContent('Dataset: production')
    await expect
      .element($dialog.getByRole('button', {name: 'Delete 2 versions', exact: true}))
      .toBeEnabled()

    await settleChromaticEndState()
  })

  it('expands the cross-dataset reference table', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness(REFERRING_DOCUMENTS, WITHOUT_VARIANTS)
    selectAndRequest(refs, [PUBLISHED.id])

    void render(
      <ConfirmDeleteDialogHarness
        deletionRef={refs.deletionRef}
        selectionRef={refs.selectionRef}
      />,
    )

    await expect.element($dialog.getByText('Delete the Default document?')).toBeVisible()
    await userEvent.click($dialog.getByText('Dataset: production'))
    await expect.element($dialog.getByText('Project ID')).toBeVisible()
    await expect.element($dialog.getByText('remote-doc')).toBeVisible()
    await expect
      .element($dialog.getByRole('button', {name: 'Delete 1 version', exact: true}))
      .toBeEnabled()

    await settleChromaticEndState()
  })
})

describe('ConfirmDeleteDialog, open beta (option C)', () => {
  it('deletes variant versions without naming links, by variant and bundle (D2)', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness(REQUIRED_REFERRING_DOCUMENTS, WITH_VARIANTS)
    selectAndRequest(refs, [DE_DE_DRAFT.id])

    void render(
      <ConfirmDeleteDialogHarness
        deletionRef={refs.deletionRef}
        selectionRef={refs.selectionRef}
      />,
    )

    await expect.element($dialog.getByText('Delete 1 version?')).toBeVisible()
    const $row = $dialog.getByTestId(`delete-version-${DE_DE_DRAFT.id}`)
    await expect.element($row).toMatchTextContent('de-DE')
    await expect.element($row).toMatchTextContent('Draft')
    // The copy's raw scope id never shows.
    await expect.element($dialog).not.toMatchTextContent('scope-de')
    await expect.element($dialog.getByTestId('no-links')).toBeVisible()
    await expect.element($dialog.getByTestId('default-blocked')).not.toBeInTheDocument()
    await expect.element($dialog.getByTestId('internal-references')).not.toBeInTheDocument()
    // The safe action takes the initial focus.
    await expect.element($cancel).toHaveFocus()

    const $delete = $dialog.getByRole('button', {name: 'Delete 1 version', exact: true})
    await expect.element($delete).toBeEnabled()

    await settleChromaticEndState()
  })

  it('blocks the Default while variants exist, counting variants, not copies', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness(NO_LINKS, WITH_VARIANTS)
    selectAndRequest(refs, [PUBLISHED.id, DE_DE_DRAFT.id])

    void render(
      <ConfirmDeleteDialogHarness
        deletionRef={refs.deletionRef}
        selectionRef={refs.selectionRef}
      />,
    )

    // The title counts what the button deletes, out of what was selected.
    await expect.element($dialog.getByText('Delete 1 of 2 versions?')).toBeVisible()
    await expect
      .element($dialog.getByTestId('deletable-versions'))
      .toMatchTextContent(/Will be deleted.*de-DE.*Draft/)
    await expect
      .element($dialog.getByTestId('blocked-versions'))
      .toMatchTextContent(/Can't be deleted yet.*Default.*Published/)
    // de-DE has a draft and a published copy: one variant. With Members, two.
    await expect
      .element($dialog.getByTestId('blocked-by-variants'))
      .toHaveTextContent('2 variants exist. Delete the variants first.')
    await expect.element($dialog.getByTestId('blocked-by-links')).not.toBeInTheDocument()
    await expect.element($dialog.getByText(/variants stay/)).not.toBeInTheDocument()

    const $delete = $dialog.getByRole('button', {name: 'Delete 1 version', exact: true})
    await expect.element($delete).toBeEnabled()
    // The reason the Default stays is read with the button.
    const describedBy = $delete.element().getAttribute('aria-describedby')
    expect(describedBy).toBe($dialog.getByTestId('default-blocked').element().id)

    await settleChromaticEndState()
    await takeSnapshot('blocked-by-variants')

    await userEvent.click($delete)
    await expect.poll(() => deletedIds).toEqual([[DE_DE_DRAFT.id]])
  })

  it('blocks the Default while required links point at it, and lists them first', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness(REQUIRED_REFERRING_DOCUMENTS, WITHOUT_VARIANTS)
    selectAndRequest(refs, [PUBLISHED.id])

    void render(
      <ConfirmDeleteDialogHarness
        deletionRef={refs.deletionRef}
        selectionRef={refs.selectionRef}
      />,
    )

    await expect.element($dialog.getByText('Delete the Default document?')).toBeVisible()
    await expect
      .element($dialog.getByTestId('default-blocked'))
      .toMatchTextContent("The Default document can't be deleted yet")
    await expect
      .element($dialog.getByTestId('blocked-by-links'))
      .toHaveTextContent(
        '1 document links to it with a required link. Change or remove that link first.',
      )
    await expect.element($dialog.getByTestId('blocked-by-variants')).not.toBeInTheDocument()
    // Main's "You may not be able to delete" line no longer contradicts the notice.
    await expect.element($dialog.getByText(/You may not be able to delete/)).not.toBeInTheDocument()
    await expect.element($dialog.getByText(/Documents that link to/)).toBeVisible()
    await expect
      .element($dialog.getByTestId('internal-references').getByRole('listitem').first())
      .toMatchTextContent('referrer-a')
    await expect
      .element($dialog.getByTestId('reference-tag-referrer-a'))
      .toHaveTextContent('Required')
    await expect
      .element($dialog.getByTestId('reference-tag-referrer-b'))
      .toHaveTextContent('Optional')
    await expect.element($dialog.getByRole('button', {name: 'Delete', exact: true})).toBeDisabled()
    await expect.element($cancel).toHaveFocus()

    await settleChromaticEndState()
  })

  it('names both reasons, variants first, when variants and required links block the Default', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness(REQUIRED_REFERRING_DOCUMENTS, WITH_VARIANTS)
    selectAndRequest(refs, [PUBLISHED.id, MEMBERS_DRAFT.id])

    void render(
      <ConfirmDeleteDialogHarness
        deletionRef={refs.deletionRef}
        selectionRef={refs.selectionRef}
      />,
    )

    await expect.element($dialog.getByText('Delete 1 of 2 versions?')).toBeVisible()
    const [$first, $second] = $dialog.getByTestId('default-blocked').getByRole('listitem').all()
    await expect.element($first).toHaveTextContent('2 variants exist. Delete the variants first.')
    await expect
      .element($second)
      .toHaveTextContent(
        '1 document links to it with a required link. Change or remove that link first.',
      )
    await expect
      .element($dialog.getByRole('button', {name: 'Delete 1 version', exact: true}))
      .toBeEnabled()

    await settleChromaticEndState()
  })

  it('lets the Default go with only optional links once no variants exist', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness(OPTIONAL_REFERRING_DOCUMENTS, WITHOUT_VARIANTS)
    selectAndRequest(refs, [PUBLISHED.id])

    void render(
      <ConfirmDeleteDialogHarness
        deletionRef={refs.deletionRef}
        selectionRef={refs.selectionRef}
      />,
    )

    await expect.element($dialog.getByText('Delete the Default document?')).toBeVisible()
    await expect
      .element($dialog.getByTestId('optional-links'))
      .toMatchTextContent('1 document links to “Ursula K. Le Guin” with an optional link.')
    await expect.element($dialog.getByTestId('default-blocked')).not.toBeInTheDocument()
    await expect.element($dialog.getByText(/variants stay/)).not.toBeInTheDocument()
    await expect.element($dialog.getByText(/You may not be able to delete/)).not.toBeInTheDocument()

    const $delete = $dialog.getByRole('button', {name: 'Delete 1 version', exact: true})
    await expect.element($delete).toBeEnabled()

    await settleChromaticEndState()
    await takeSnapshot('optional-links')

    await userEvent.click($delete)
    await expect.poll(() => deletedIds).toEqual([[PUBLISHED.id]])
  })

  it('names no strength above the reference cap when none of the links read is required', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness(OVER_CAP_REFERRING_DOCUMENTS, WITHOUT_VARIANTS)
    selectAndRequest(refs, [PUBLISHED.id])

    void render(
      <ConfirmDeleteDialogHarness
        deletionRef={refs.deletionRef}
        selectionRef={refs.selectionRef}
      />,
    )

    await expect.element($dialog.getByText('Delete the Default document?')).toBeVisible()
    await expect
      .element($dialog.getByTestId('partial-links'))
      .toHaveTextContent('140 documents link here. Some links may be required.')
    // It claims no strength for the links it did not read.
    await expect.element($dialog.getByTestId('optional-links')).not.toBeInTheDocument()
    await expect.element($dialog.getByTestId('default-blocked')).not.toBeInTheDocument()
    await expect.element($dialog.getByText('40 other references not shown')).toBeInTheDocument()
    // Delete stays enabled, so the Content Lake decides.
    await expect
      .element($dialog.getByRole('button', {name: 'Delete 1 version', exact: true}))
      .toBeEnabled()

    await settleChromaticEndState()
  })

  it('counts cross-dataset links as optional, grouped by dataset', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness(CROSS_DATASET_REFERRING_DOCUMENTS, WITHOUT_VARIANTS)
    selectAndRequest(refs, [PUBLISHED.id])

    void render(
      <ConfirmDeleteDialogHarness
        deletionRef={refs.deletionRef}
        selectionRef={refs.selectionRef}
      />,
    )

    await expect
      .element($dialog.getByTestId('optional-links'))
      .toMatchTextContent('2 documents link to “Ursula K. Le Guin” with optional links.')
    const $crossDataset = $dialog.getByTestId('cross-dataset-references')
    await expect.element($crossDataset).toMatchTextContent('2 documents in 2 datasets')
    await expect.element($crossDataset).toMatchTextContent('Datasets: production, staging')
    await expect.element($dialog.getByTestId('default-blocked')).not.toBeInTheDocument()
    await expect
      .element($dialog.getByRole('button', {name: 'Delete 1 version', exact: true}))
      .toBeEnabled()

    await settleChromaticEndState()
  })

  it('does not block on a required link held only by a release copy, and says it fails later', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness(RELEASE_COPY_REFERRING_DOCUMENTS, WITHOUT_VARIANTS)
    selectAndRequest(refs, [PUBLISHED.id])

    void render(
      <ConfirmDeleteDialogHarness
        deletionRef={refs.deletionRef}
        selectionRef={refs.selectionRef}
      />,
    )

    await expect
      .element($dialog.getByTestId('fails-later'))
      .toHaveTextContent(
        "1 document in a release links here with a required link. The delete goes through, but that release will fail when it's published.",
      )
    await expect
      .element($dialog.getByTestId('reference-tag-versions.rp-release.referrer-r'))
      .toHaveTextContent('Fails later')
    await expect
      .element($dialog.getByTestId('internal-references').getByRole('listitem').first())
      .toMatchTextContent('referrer-r')
    await expect.element($dialog.getByTestId('default-blocked')).not.toBeInTheDocument()
    await expect
      .element($dialog.getByRole('button', {name: 'Delete 1 version', exact: true}))
      .toBeEnabled()

    await settleChromaticEndState()
  })

  it('reports a delete that leaves the document with no versions (D1)', async () => {
    configure({disableAutoSnapshot: true})
    const refs = startHarness(NO_LINKS, WITHOUT_VARIANTS)
    const emptied: string[] = []
    refs.deletionRef.on('allVersionsDeleted', (event) => emptied.push(event.type))
    selectAndRequest(refs, [PUBLISHED.id, DRAFT.id])

    void render(
      <ConfirmDeleteDialogHarness
        deletionRef={refs.deletionRef}
        selectionRef={refs.selectionRef}
      />,
    )

    await expect
      .element($dialog.getByText('Delete 2 versions, including the Default?'))
      .toBeVisible()
    await userEvent.click($dialog.getByRole('button', {name: 'Delete 2 versions', exact: true}))

    await expect.poll(() => deletedIds).toEqual([[PUBLISHED.id, DRAFT.id]])
    await expect.poll(() => emptied).toEqual(['allVersionsDeleted'])
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

    const $createVariant = page.getByRole('button', {name: 'Create version'})
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

    await expect.element(page.getByRole('button', {name: 'Create version'})).toBeVisible()
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

  it('swaps the group actions for deselect all while versions are selected', async () => {
    // The selected header is archived by the test above, and this one ends
    // back on the empty header.
    configure({disableAutoSnapshot: true})
    const refs = startHarness()
    const {selectionRef} = refs
    selectionRef.send({type: 'selection.add', variantId: DRAFT.id})
    selectionRef.send({type: 'selection.add', variantId: PUBLISHED.id})

    void render(<InventoryHeaderHarness {...refs} components={COMPONENTS} />)

    const $deselectAll = page.getByRole('button', {name: 'Deselect all'})
    await expect.element($deselectAll).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Create version'})).not.toBeInTheDocument()
    await expect.element(page.getByTestId('compare-versions-action')).not.toBeInTheDocument()

    await userEvent.click($deselectAll)

    expect(selectionRef.getSnapshot().context.selectedIds.size).toBe(0)
    await expect.element(page.getByRole('button', {name: 'Create version'})).toBeVisible()
    await expect.element(page.getByTestId('compare-versions-action')).toBeVisible()
    await expect.element(page.getByText(/selected$/)).not.toBeInTheDocument()
  })

  it('renders no compare versions action without the consumer components of manage mode', async () => {
    const {settleChromaticEndState} = testHelpers()
    const refs = startHarness()

    void render(<InventoryHeaderHarness {...refs} components={undefined} />)

    await expect.element(page.getByRole('button', {name: 'Create version'})).toBeVisible()
    await expect.element(page.getByTestId('compare-versions-action')).not.toBeInTheDocument()

    await settleChromaticEndState()
  })
})
