import {type ReleaseDocument} from '@sanity/client'
import {PortalProvider} from '@sanity/ui'
import {type ReactNode, useEffect, useState} from 'react'
import {of} from 'rxjs'
import {type ActorRefFromLogic, createActor, fromObservable, sendTo, setup} from 'xstate'

import {
  activeASAPRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {type ReleasesReducerState} from '../../../releases/store/reducer'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {type VariantStoreState} from '../../../variants/store/reducer'
import {type SystemVariant} from '../../../variants/types'
import {deletionMachine, type ReferringDocuments} from '../../machines/deletionMachine'
import {selectionMachine, type Variant} from '../../machines/selectionMachine'
import {variantCreationMachine} from '../../machines/variantCreationMachine'

const TIMESTAMP = '2024-01-01T00:00:00.000Z'
const PUBLISHED_ID = 'article-1'
const GROUP = {_ref: PUBLISHED_ID, _weak: true} as const

function stub(id: string, system: Omit<VersionInfoDocumentStub['_system'], 'group'>) {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: TIMESTAMP,
    _updatedAt: TIMESTAMP,
    _type: 'article',
    _system: {...system, group: GROUP},
  } satisfies VersionInfoDocumentStub
}

export const MOBILE_VARIANT: SystemVariant = {
  _id: '_.variants.mobile',
  _type: 'system.variant',
  _rev: 'rev',
  _createdAt: TIMESTAMP,
  _updatedAt: TIMESTAMP,
  name: 'mobile',
  conditions: {},
  priority: 0,
  metadata: {title: 'Mobile'},
}

export const PARTNER_VARIANT: SystemVariant = {
  _id: '_.variants.partner',
  _type: 'system.variant',
  _rev: 'rev',
  _createdAt: TIMESTAMP,
  _updatedAt: TIMESTAMP,
  name: 'partner',
  conditions: {},
  priority: 0,
  metadata: {title: 'Partner portal'},
}

export const PUBLISHED: Variant = {
  id: PUBLISHED_ID,
  name: 'Published',
  document: stub(PUBLISHED_ID, {}),
}

export const DRAFT: Variant = {
  id: `drafts.${PUBLISHED_ID}`,
  name: 'Draft',
  document: stub(`drafts.${PUBLISHED_ID}`, {bundleId: 'drafts'}),
}

export const RELEASE_VERSION: Variant = {
  id: `versions.${activeASAPRelease.name}.${PUBLISHED_ID}`,
  name: activeASAPRelease.metadata.title,
  document: stub(`versions.${activeASAPRelease.name}.${PUBLISHED_ID}`, {
    bundleId: activeASAPRelease.name,
    release: {_ref: activeASAPRelease._id, _weak: true},
  }),
  releaseDocument: activeASAPRelease,
}

export const AGENT_VERSION: Variant = {
  id: `versions.agent-copy.${PUBLISHED_ID}`,
  name: 'Agent suggestion',
  document: stub(`versions.agent-copy.${PUBLISHED_ID}`, {bundleId: 'agent-copy'}),
}

export const MOBILE_DRAFT: Variant = {
  id: `drafts.${PUBLISHED_ID}-mobile`,
  name: 'Mobile draft',
  document: stub(`drafts.${PUBLISHED_ID}-mobile`, {
    bundleId: 'drafts',
    variants: [{_ref: MOBILE_VARIANT._id, _key: 'mobile'}],
  }),
}

export const ALL_VARIANTS: Variant[] = [
  PUBLISHED,
  DRAFT,
  RELEASE_VERSION,
  AGENT_VERSION,
  MOBILE_DRAFT,
]

export const RELEASES_BY_ID = new Map<string, ReleaseDocument>([
  [activeASAPRelease._id, activeASAPRelease],
  [activeUndecidedRelease._id, activeUndecidedRelease],
])

const RELEASE_STATE: ReleasesReducerState = {releases: RELEASES_BY_ID, state: 'loaded'}

const VARIANT_STATE: VariantStoreState = {
  variants: new Map<string, SystemVariant>([
    [MOBILE_VARIANT._id, MOBILE_VARIANT],
    [PARTNER_VARIANT._id, PARTNER_VARIANT],
  ]),
  state: 'loaded',
}

export const NO_REFERRING_DOCUMENTS: ReferringDocuments = {
  isLoading: false,
  totalCount: 0,
  projectIds: [],
  datasetNames: [],
  hasUnknownDatasetNames: false,
  internalReferences: {totalCount: 0, references: []},
  crossDatasetReferences: {totalCount: 0, references: []},
}

export const REFERRING_DOCUMENTS: ReferringDocuments = {
  isLoading: false,
  totalCount: 7,
  projectIds: ['ppsg7ml5', 'abc123'],
  datasetNames: ['production', 'staging'],
  hasUnknownDatasetNames: true,
  internalReferences: {
    totalCount: 4,
    references: [
      {_id: 'author-1', _type: 'author'},
      {_id: 'category-1', _type: 'category'},
    ],
  },
  crossDatasetReferences: {
    totalCount: 3,
    references: [
      {projectId: 'ppsg7ml5', datasetName: 'production', documentId: 'landing-page'},
      {projectId: 'abc123', datasetName: 'staging', documentId: 'campaign-2024'},
    ],
  },
}

/**
 * The selection, deletion and variant-creation machines report to their parent
 * with `sendParent`, which throws when an actor has none. The harness parent
 * spawns them the way the inventory machine does, relays the selection to the
 * deletion machine, and replaces the store-backed actors with fixed fixtures.
 */
const harnessMachine = setup({
  types: {} as {
    context: {
      selectionRef: ActorRefFromLogic<typeof selectionMachine>
      deletionRef: ActorRefFromLogic<typeof deletionMachine>
      variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
    }
    input: {referringDocuments: ReferringDocuments}
    events:
      | {type: 'selection.changed'; selectedIds: Set<string>}
      | {type: 'deletion.activated'}
      | {type: 'deletion.deactivated'}
      | {type: 'variantCreation.activated'}
      | {type: 'variantCreation.deactivated'}
  },
}).createMachine({
  id: 'documentGroupHarness',
  context: ({spawn, input}) => ({
    selectionRef: spawn(selectionMachine, {input: undefined}),
    deletionRef: spawn(
      deletionMachine.provide({
        actors: {referringDocuments: fromObservable(() => of(input.referringDocuments))},
      }),
      {input: undefined},
    ),
    variantCreationRef: spawn(
      variantCreationMachine.provide({
        actors: {
          variants: fromObservable(() => of(VARIANT_STATE)),
          releases: fromObservable(() => of(RELEASE_STATE)),
        },
      }),
      {input: undefined},
    ),
  }),
  on: {
    'selection.changed': {
      actions: sendTo(
        ({context}) => context.deletionRef,
        ({event}) => event,
      ),
    },
  },
})

export interface DocumentGroupHarnessOptions {
  variants?: Variant[]
  selectedIds?: string[]
  referringDocuments?: ReferringDocuments
  /** Which flow to put in its `active` state before the first render. */
  activate?: 'deletion' | 'variantCreation'
  /** Pre-selected variant definition for the variant creation flow. */
  selectedVariantId?: string
}

/**
 * Starts the harness actor once and drives it into the requested state
 * synchronously, so the first render already shows that state.
 */
export function useDocumentGroupHarness(options: DocumentGroupHarnessOptions) {
  const [actor] = useState(() => {
    const {
      variants = ALL_VARIANTS,
      selectedIds = [],
      referringDocuments = NO_REFERRING_DOCUMENTS,
      activate,
      selectedVariantId,
    } = options
    const harness = createActor(harnessMachine, {input: {referringDocuments}}).start()
    const {selectionRef, deletionRef, variantCreationRef} = harness.getSnapshot().context

    selectionRef.send({type: 'variants.changed', variants, loaded: true})
    for (const variantId of selectedIds) {
      selectionRef.send({type: 'selection.add', variantId})
    }
    if (activate === 'deletion') {
      deletionRef.send({type: 'delete.request'})
    }
    if (activate === 'variantCreation') {
      variantCreationRef.send({type: 'createVariant.request'})
      if (selectedVariantId) {
        variantCreationRef.send({type: 'createVariant.selectVariant', variantId: selectedVariantId})
      }
    }
    return harness
  })

  useEffect(() => () => actor.stop(), [actor])

  return actor.getSnapshot().context
}

export const DIALOG_PORTAL_NAME = 'document-group-harness-dialog'

/**
 * `Dialog portal="<name>"` renders nothing unless a `PortalProvider` knows an
 * element under that name; the inventory gets this from the document pane.
 */
export function DialogPortalHost({children}: {children: ReactNode}) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)

  return (
    <>
      <PortalProvider __unstable_elements={{[DIALOG_PORTAL_NAME]: element}}>
        {element ? children : null}
      </PortalProvider>
      <div ref={setElement} data-testid="dialog-portal" />
    </>
  )
}
