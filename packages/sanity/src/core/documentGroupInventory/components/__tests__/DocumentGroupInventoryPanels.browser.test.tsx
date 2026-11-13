import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {type ReleaseDocument} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import {Card, PortalProvider} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ComponentType, useMemo, useRef, useState} from 'react'
import {BehaviorSubject} from 'rxjs'
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
import {
  STATUS_MARKS,
  type StatusMarkName,
  statusMarkGeometry,
} from '../../../../ui-components/statusMark/statusMarkGeometry'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
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
  context: ({spawn}) => ({
    selectionRef: spawn(selectionMachine, {input: undefined}),
    deletionRef: spawn(
      deletionMachine.provide({
        actors: {
          referringDocuments: fromObservable(() => new BehaviorSubject(REFERRING_DOCUMENTS)),
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

function startHarness() {
  harness = createActor(harnessMachine).start()
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
    await expect.element($dialog.getByText('Delete 2 versions')).toBeVisible()
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
    await expect.element($dialog.getByText('Delete 1 version')).toBeVisible()
    await userEvent.click($dialog.getByText('Dataset: production'))
    await expect.element($dialog.getByText('Project ID')).toBeVisible()
    await expect.element($dialog.getByText('remote-doc')).toBeVisible()
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

  it('puts the count on the left, then Clear and an outlined Delete on the right', async () => {
    const refs = startHarness()
    refs.selectionRef.send({type: 'selection.add', variantId: DRAFT.id})
    void render(<InventoryHeaderHarness {...refs} components={COMPONENTS} />)

    const $delete = page.getByRole('button', {name: 'Delete', exact: true})
    const $clear = page.getByRole('button', {name: 'Clear', exact: true})
    await expect.element($delete).toBeVisible()
    const status = page.getByTestId('selected-count-status').element().getBoundingClientRect()
    const clear = ($clear.element() as HTMLElement).getBoundingClientRect()
    const deleteButton = $delete.element() as HTMLElement
    const del = deleteButton.getBoundingClientRect()

    // Status, then Clear, then Delete, rightmost
    expect(status.right).toBeLessThan(clear.left)
    expect(clear.right).toBeLessThan(del.left)
    const bar = deleteButton.closest('.atom')!.parentElement!.getBoundingClientRect()
    expect(bar.right - del.right).toBeLessThan(bar.right - clear.right)

    // At least the 24x24 a target needs
    for (const rect of [clear, del]) {
      expect(rect.width).toBeGreaterThanOrEqual(24)
      expect(rect.height).toBeGreaterThanOrEqual(24)
    }

    // Outlined, not filled: ui5's secondary level, a border on a background within a hair of the
    // bar's, with the critical text at 4.5:1 or more
    const style = getComputedStyle(deleteButton)
    const behind = background(deleteButton.closest('.atom')!.parentElement as HTMLElement)
    expect(contrastRatio(background(deleteButton), behind)).toBeLessThan(1.1)
    expect(Number.parseFloat(style.borderTopWidth) > 0 || /inset/.test(style.boxShadow)).toBe(true)
    const label = deleteButton.querySelector<HTMLElement>('[data-ui="Text"], span') ?? deleteButton
    expect(
      contrastRatio(rgb(getComputedStyle(label).color), background(deleteButton)),
    ).toBeGreaterThanOrEqual(4.5)

    // Keyboard order follows the visual order
    ;($clear.element() as HTMLElement).focus()
    await userEvent.tab()
    expect(document.activeElement).toBe(deleteButton)
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
    await expect.element(page.getByRole('button', {name: 'Create version'})).not.toBeInTheDocument()
    await expect.element(page.getByTestId('compare-versions-action')).not.toBeInTheDocument()

    await userEvent.click($clear)

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
  openId,
}: {
  refs: ReturnType<typeof startHarness>
  onOpen?: (entry: Variant) => void
  scheme?: 'light' | 'dark'
  /** The version open in the form. */
  openId?: string
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
            <SelectionSets selectionRef={refs.selectionRef} onOpen={onOpen} openId={openId} />
          </Body>
        </Container>
      </Card>
    </TestWrapper>
  )
}

function SelectionSets({
  selectionRef,
  onOpen,
  openId,
}: {
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
  onOpen: (entry: Variant) => void
  openId?: string
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
          selectionRef.send(
            checked
              ? {type: 'selection.addMany', variantIds: selection.selectableIds}
              : {type: 'selection.removeMany', variantIds: set.variants.map(({id}) => id)},
          )
        }
      >
        {set.variants.map((entry) => {
          const blocked = selection.blockedReasons.get(entry.id)

          return (
            <DocumentGroupEntry
              key={entry.id}
              variant={entry}
              releases={SELECTION_RELEASES}
              isSelected={entry.id === openId}
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

/**
 * A status mark's declared size, from its own attributes: its mark, its box (width and height) and
 * the painted size its viewBox gives the drawing (the geometry at that scale, plus its fixed
 * stroke). No layout is read, so it holds in every browser.
 */
function declaredMark(svg: SVGSVGElement) {
  const mark = svg.dataset.mark as StatusMarkName
  const width = Number(svg.getAttribute('width'))
  const height = Number(svg.getAttribute('height'))
  const side = Number(svg.getAttribute('viewBox')!.split(' ')[2])
  const {extent, stroke} = STATUS_MARKS[mark]
  return {mark, width, height, painted: (extent * width) / side + stroke}
}

function expectDeclared(svg: SVGSVGElement, mark: StatusMarkName, painted: number, box: number) {
  const declared = declaredMark(svg)
  expect(declared.mark).toBe(mark)
  expect(declared.width).toBe(box)
  expect(declared.height).toBe(box)
  expect(declared.painted).toBeCloseTo(painted, 2)
  expect(statusMarkGeometry(mark, 'row')).toMatchObject({painted, box})
}

function headerGlyph(setName: string): SVGSVGElement {
  return selectionSet(setName).querySelector<SVGSVGElement>('header .variant-set-icon svg')!
}

function header(setName: string): HTMLElement {
  return selectionSet(setName).querySelector<HTMLElement>('header')!
}

function selected(refs: ReturnType<typeof startHarness>): string[] {
  return [...refs.selectionRef.getSnapshot().context.selectedIds].toSorted()
}

/**
 * The UI 5 blue selection ladder, from `@sanity/ui` 5's palette (`ui5/styles.css`), as rgb.
 */
const UI5 = {
  light: {
    open: [64, 67, 231], // --active-background-emphasized: blue-600
    openTitle: [255, 255, 255], // --active-foreground-emphasized: white
    openSubtitle: [229, 237, 255], // blue-100
    openVariantMark: [241, 235, 255], // suggest --foreground-low-emphasized: purple-100
    checked: [245, 248, 255], // --active-background-normal: blue-50
    checkedHeader: [229, 237, 255], // blue-100
    hover: [246, 246, 248], // --background-low: gray-50
    checkboxFill: [64, 67, 231], // blue-600
    checkboxTick: [255, 255, 255], // white
  },
  dark: {
    open: [117, 149, 255], // --active-background-emphasized: blue-400
    openTitle: [19, 20, 27], // --active-foreground-emphasized: black
    openSubtitle: [22, 26, 65], // blue-900
    openVariantMark: [35, 23, 63], // suggest --foreground-low-emphasized: purple-900
    checked: [16, 18, 40], // --active-background-normal: blue-950
    checkedHeader: [22, 26, 65], // blue-900
    hover: [27, 29, 39], // gray-900: --background-low is gray-950, the panel's own background
    checkboxFill: [117, 149, 255], // blue-400
    checkboxTick: [19, 20, 27], // black
  },
} as const

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

  it('declares the group marks and the row marks at their optical sizes', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SelectionPanel refs={startSelectionHarness()} />)

    await expect
      .element(page.getByRole('button', {name: 'VIP users', exact: true}))
      .toBeInTheDocument()
    await settleChromaticEndState()

    // Row marks (M = 10px): the diamond and a pictogram 10px, a disc and the Draft ring 8px
    const mark = selectionRow('Draft', 'VIP users').querySelector<SVGSVGElement>(
      '.variant-mark svg',
    )!
    expectDeclared(mark, 'variant', 10, 12)
    expectDeclared(headerGlyph('Published'), 'published', 8, 10)
    expectDeclared(headerGlyph('Draft'), 'draft', 8, 10)
    expectDeclared(headerGlyph(scheduledRelease.metadata.title), 'scheduled', 10, 12)

    // Draft is a ring, and no stroke scales with the mark
    const ring = headerGlyph('Draft').querySelector('circle')!
    expect(ring.getAttribute('fill')).toBe('none')
    for (const shape of document.querySelectorAll('[data-ui="StatusMark"] [stroke]')) {
      expect(shape.getAttribute('vector-effect')).toBe('non-scaling-stroke')
    }
  })

  it('declares an ASAP, an undecided and an agent group mark at their row sizes', async () => {
    void render(
      <TestWrapper schemaTypes={SCHEMA_TYPES}>
        {(
          [
            ['ASAP', {type: 'perspective', perspective: activeASAPRelease}],
            ['Undecided', {type: 'perspective', perspective: activeUndecidedRelease}],
            ['Agent', {type: 'agent'}],
          ] as const
        ).map(([name, bundle]) => (
          <DocumentGroupSet
            key={name}
            name={name}
            bundle={bundle as VariantSet['bundle']}
            selectionState="unchecked"
            onCheckedChange={() => undefined}
          >
            <DocumentGroupEntry
              variant={DRAFT_VIP}
              releases={SELECTION_RELEASES}
              onPrimaryAction={() => undefined}
            />
          </DocumentGroupSet>
        ))}
      </TestWrapper>,
    )

    await expect.element(page.getByText('Undecided')).toBeVisible()
    expectDeclared(headerGlyph('ASAP'), 'asap', 10, 12)
    expectDeclared(headerGlyph('Undecided'), 'undecided', 8, 10)
    expectDeclared(headerGlyph('Agent'), 'agent', 10, 12)
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
    'colours checked rows and a checked header on the UI 5 blue ladder, in %s mode',
    async (scheme) => {
      const ui5 = UI5[scheme]
      const refs = startSelectionHarness()
      void render(<SelectionPanel refs={refs} scheme={scheme} />)

      await expect
        .element(page.getByRole('button', {name: 'VIP users', exact: true}))
        .toBeInTheDocument()
      const panel = background(page.getByTestId('selection-panel').element() as HTMLElement)

      // Hover: UI 5's --background-low, or gray-900 in dark where that equals the panel
      const published = selectionRow('Published', 'Default')
      await userEvent.hover(page.elementLocator(published))
      await expect.poll(() => background(published)).toEqual(ui5.hover)
      expect(contrastRatio(background(published), panel)).toBeGreaterThan(1.05)

      refs.selectionRef.send({
        type: 'selection.addMany',
        variantIds: [DRAFT.id, DRAFT_VIP.id, DRAFT_SUMMER.id],
      })
      await expect.poll(() => groupCheckbox('Draft').checked).toBe(true)
      await userEvent.hover(page.getByTestId('chromatic-pointer-park'))

      const row = selectionRow('Draft', 'VIP users')
      expect(background(row)).toEqual(ui5.checked)
      // The header keeps a band of its own, one step stronger than its checked rows
      expect(background(header('Draft'))).toEqual(ui5.checkedHeader)
      expect(contrastRatio(background(header('Draft')), background(row))).toBeGreaterThan(1.05)
      expect(contrastRatio(background(header('Draft')), panel)).toBeGreaterThan(
        contrastRatio(background(row), panel),
      )

      for (const element of [
        row.querySelector<HTMLElement>('[data-testid="version-title"]')!,
        row.querySelector<HTMLElement>('[data-testid="version-secondary-line"]')!,
      ]) {
        expect(textContrast(element, row)).toBeGreaterThanOrEqual(4.5)
      }
      const name = header('Draft').querySelector<HTMLElement>('[data-testid="variant-set-name"]')!
      expect(textContrast(name, header('Draft'))).toBeGreaterThanOrEqual(4.5)

      // UI 5's checkbox: the strong blue fill with an inverted tick, 3:1 or more on its row
      for (const [checkbox, element] of [
        [groupCheckbox('Draft'), header('Draft')],
        [rowCheckbox('Draft', 'VIP users'), row],
      ] as const) {
        const box = getComputedStyle(checkbox.nextElementSibling!)
        expect(rgb(box.backgroundColor)).toEqual(ui5.checkboxFill)
        expect(rgb(box.color)).toEqual(ui5.checkboxTick)
        expect(contrastRatio(rgb(box.backgroundColor), background(element))).toBeGreaterThanOrEqual(
          3,
        )
      }
    },
  )

  it.each(['light', 'dark'] as const)(
    "gives the open version UI 5's strong selected state, checked or not, in %s mode",
    async (scheme) => {
      const ui5 = UI5[scheme]
      const refs = startSelectionHarness()
      void render(<SelectionPanel refs={refs} scheme={scheme} openId={DRAFT_VIP.id} />)

      await expect
        .element(page.getByRole('button', {name: 'VIP users', exact: true}))
        .toHaveAttribute('aria-current', 'true')
      await userEvent.hover(page.getByTestId('chromatic-pointer-park'))
      const open = selectionRow('Draft', 'VIP users')
      const other = selectionRow('Draft', 'Summer sale')
      const title = (row: HTMLElement) =>
        row.querySelector<HTMLElement>('[data-testid="version-title"]')!
      const meta = open.querySelector<HTMLElement>('[data-testid="version-secondary-line"]')!
      const mark = () => open.querySelector<SVGSVGElement>('.variant-mark svg')!

      // Only the open row is the current item, with no weight change and no edge bar
      const marked = [...document.querySelectorAll('[data-variant-name] .primary-action')].filter(
        (action) => action.hasAttribute('aria-current'),
      )
      expect(marked).toHaveLength(1)
      expect(getComputedStyle(title(open)).fontWeight).toBe(
        getComputedStyle(title(other)).fontWeight,
      )
      expect(getComputedStyle(open, '::before').content).toBe('none')

      const expectOpen = () => {
        expect(background(open)).toEqual(ui5.open)
        expect(rgb(getComputedStyle(title(open)).color)).toEqual(ui5.openTitle)
        expect(rgb(getComputedStyle(meta).color)).toEqual(ui5.openSubtitle)
        expect(rgb(getComputedStyle(mark()).color)).toEqual(ui5.openVariantMark)
        expect(textContrast(title(open), open)).toBeGreaterThanOrEqual(4.5)
        expect(textContrast(meta, open)).toBeGreaterThanOrEqual(4.5)
        expect(
          contrastRatio(rgb(getComputedStyle(mark()).color), background(open)),
        ).toBeGreaterThanOrEqual(3)
      }

      // Open, not checked: the empty box's border shows on the blue
      expectOpen()
      expect(railContrast(rowCheckbox('Draft', 'VIP users'), open)).toBeGreaterThanOrEqual(3)

      // Open and checked: the strong blue wins over the checked background, and the box inverts
      refs.selectionRef.send({
        type: 'selection.addMany',
        variantIds: [DRAFT_VIP.id, DRAFT_SUMMER.id],
      })
      await expect.poll(() => rowCheckbox('Draft', 'VIP users').checked).toBe(true)
      await userEvent.hover(page.getByTestId('chromatic-pointer-park'))
      expectOpen()
      const box = getComputedStyle(rowCheckbox('Draft', 'VIP users').nextElementSibling!)
      expect(rgb(box.backgroundColor)).toEqual(ui5.checkboxTick)
      expect(rgb(box.color)).toEqual(ui5.checkboxFill)
      expect(contrastRatio(rgb(box.backgroundColor), background(open))).toBeGreaterThanOrEqual(3)
      // A checked row that is not open keeps the pale blue
      expect(background(other)).toEqual(ui5.checked)

      // Hovered, the open row keeps its state
      await userEvent.hover(page.elementLocator(open))
      expect(background(open)).toEqual(ui5.open)
    },
  )

  it('shows no Editing or Served badges in the panel', async () => {
    void render(<SelectionPanel refs={startSelectionHarness()} openId={DRAFT.id} />)

    await expect
      .element(page.getByRole('button', {name: 'Default', exact: true}).first())
      .toBeInTheDocument()
    expect(document.querySelector('[data-badge]')).toBeNull()
    expect(document.querySelector('[data-testid="version-badges"]')).toBeNull()
  })

  it('keeps Sanity UI focus ring on the group checkbox, over the quiet border', async () => {
    const refs = startSelectionHarness()
    void render(<SelectionPanel refs={refs} />)

    const $create = page.getByRole('button', {name: 'Create version'})
    await expect.element($create).toBeVisible()
    const group = groupCheckbox('Published')
    const restShadow = getComputedStyle(group.nextElementSibling!).boxShadow
    ;($create.element() as HTMLButtonElement).focus()
    await userEvent.tab()

    expect(document.activeElement).toBe(group)
    // The focus ring is more than the 1px inset border it replaces
    await expect
      .poll(() => getComputedStyle(group.nextElementSibling!).boxShadow)
      .not.toBe(restShadow)
    expect(getComputedStyle(group.nextElementSibling!).boxShadow).not.toMatch(
      /^\S+ 0px 0px 0px 1px inset$/,
    )
  })

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
            showStatusBadges
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

    const $create = page.getByRole('button', {name: 'Create version'})
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

    const $create = page.getByRole('button', {name: 'Create version'})
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
