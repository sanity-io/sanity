import {type ReleaseDocument} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import {Card, PortalProvider, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {BehaviorSubject} from 'rxjs'
import {afterEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'
import {type ActorRefFromLogic, createActor, forwardTo, fromObservable, sendTo, setup} from 'xstate'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {type ReleasesReducerState} from '../../../releases/store/reducer'
import {type VariantStoreState} from '../../../variants/store/reducer'
import {type SystemVariant} from '../../../variants/types'
import {deletionMachine, type ReferringDocuments} from '../../machines/deletionMachine'
import {selectionMachine, type Variant} from '../../machines/selectionMachine'
import {variantCreationMachine} from '../../machines/variantCreationMachine'
import {type DocumentGroupInventoryComponents} from '../../types'
import {ConfirmDeleteDialog} from '../ConfirmDeleteDialog'
import {Container} from '../Container'
import {SelectBundle} from '../CreateVariant/SelectBundle'
import {SelectVariantDefinition} from '../CreateVariant/SelectVariantDefinition'

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
// The "Summer sale" variant already exists in the ASAP release, so `SelectBundle`
// lists that release under "view existing variants" instead of as a target.
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
      <Text size={1}>{value._id}</Text>
    </Card>
  ),
  VersionsPreviewList: ({documentVersions}) => (
    <Card padding={3} radius={2} border data-testid="versions-preview-list">
      <Text size={1}>{documentVersions.join(', ')}</Text>
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

describe('DocumentGroupInventory create-variant panels', () => {
  it('lists the variant definitions to create from', async () => {
    const {settleChromaticEndState} = testHelpers()
    const {variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})

    void render(
      <PanelFrame>
        <SelectVariantDefinition variantCreationRef={variantCreationRef} />
      </PanelFrame>,
    )

    await expect.element(page.getByRole('button', {name: 'Create variant'})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Summer sale'})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'vip-users'})).toBeVisible()

    await userEvent.click(page.getByRole('button', {name: 'Summer sale'}))
    expect(variantCreationRef.getSnapshot().context.selectedVariantId).toBe(SUMMER_SALE._id)

    await settleChromaticEndState()
  })

  it('offers drafts and open releases as targets, and links to existing variants', async () => {
    const {settleChromaticEndState} = testHelpers()
    const {selectionRef, variantCreationRef} = startHarness()
    variantCreationRef.send({type: 'createVariant.request'})
    variantCreationRef.send({type: 'createVariant.selectVariant', variantId: SUMMER_SALE._id})

    void render(
      <PanelFrame>
        <SelectBundle variantCreationRef={variantCreationRef} selectionRef={selectionRef} />
      </PanelFrame>,
    )

    await expect
      .element(page.getByRole('button', {name: 'Create variant for Summer sale'}))
      .toBeVisible()
    await expect.element(page.getByText('As a draft')).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Drafts'})).toBeEnabled()
    await expect.element(page.getByText('Into a release')).toBeVisible()
    await expect
      .element(page.getByRole('button', {name: activeScheduledRelease.metadata.title}))
      .toBeEnabled()
    await expect
      .element(page.getByRole('button', {name: activeUndecidedRelease.metadata.title}))
      .toBeEnabled()
    // Already holds a "Summer sale" variant, so it is offered for viewing, not as a target.
    await expect.element(page.getByText('Or view existing variants')).toBeVisible()
    await expect
      .element(page.getByRole('button', {name: activeASAPRelease.metadata.title}))
      .toBeEnabled()

    await settleChromaticEndState()
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
    await expect.element($dialog.getByText('1 document in another dataset')).toBeVisible()
    await expect.element($dialog.getByText('Dataset: production')).toBeVisible()
    await expect.element($dialog.getByRole('button', {name: 'Delete (2)'})).toBeEnabled()

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
    await userEvent.click($dialog.getByText('1 document in another dataset'))
    await expect.element($dialog.getByText('Project ID')).toBeVisible()
    await expect.element($dialog.getByText('remote-doc')).toBeVisible()
    await expect.element($dialog.getByRole('button', {name: 'Delete (1)'})).toBeEnabled()

    await settleChromaticEndState()
  })
})
