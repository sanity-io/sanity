import {type MultipleMutationResult} from '@sanity/client'
import {type SanityDocumentLike} from '@sanity/types'
import {Box, Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useActorRef} from '@xstate/react'
import {useEffect, useMemo, useRef} from 'react'
import {EMPTY, type Observable, of, throwError} from 'rxjs'
import {type ActorRefFromLogic, fromObservable, fromPromise, setup} from 'xstate'

// Real components from their real paths (org contract §8): the files under test.
import {ConfirmDeleteDialog} from '../../../../packages/sanity/src/core/documentGroupInventory/components/ConfirmDeleteDialog'
import {OtherReferenceCount} from '../../../../packages/sanity/src/core/documentGroupInventory/components/ConfirmDeleteDialog.styles'
import {type DocumentGroupInventoryProps} from '../../../../packages/sanity/src/core/documentGroupInventory/components/DocumentGroupInventory'
import {
  deletionMachine,
  type ReferringDocuments,
} from '../../../../packages/sanity/src/core/documentGroupInventory/machines/deletionMachine'
import {
  selectionMachine,
  type Variant,
} from '../../../../packages/sanity/src/core/documentGroupInventory/machines/selectionMachine'
import {type DocumentGroupInventoryReferencePreviewLinkProps} from '../../../../packages/sanity/src/core/documentGroupInventory/types'
// `VersionsPreviewList` is a cheap real mount (schema + the seeded preview store, no pane
// router). `DocTitle` and the real `ReferencePreviewLink` both need a live document pane /
// pane router the dialog itself never asks for, see the fixture note below.
import {VersionsPreviewList} from '../../../../packages/sanity/src/structure/components/confirmDeleteDialog/VersionsPreviewList'
import {NamedPortalFrame} from '../../lib/documentGroupInventoryFrame'
import {createMockPreviewUniverse} from '../../lib/mockDocumentPreviewStore'
import {createStructureFixtureClient} from '../../lib/structureHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Fixture universe ─────────────────────────────────────────────────────
   One subject (a book, draft + published), and four referring documents: two
   registered schema types, one deliberately UNREGISTERED (hits the "Preview
   unavailable" branch), used only by id/type/title, never fetched through the
   preview store (References does not use it for referrers, only useSchema()). */

const SUBJECT_DRAFT_ID = 'drafts.book-anna-karenina'
const SUBJECT_PUBLISHED_ID = 'book-anna-karenina'

const subjectDocuments = [
  {
    _id: SUBJECT_DRAFT_ID,
    _type: 'book',
    _rev: 'rev-draft-1',
    _createdAt: '2026-03-01T09:00:00Z',
    _updatedAt: '2026-03-01T09:00:00Z',
    title: 'Anna Karenina',
  },
  {
    _id: SUBJECT_PUBLISHED_ID,
    _type: 'book',
    _rev: 'rev-published-1',
    _createdAt: '2026-01-15T09:00:00Z',
    _updatedAt: '2026-01-15T09:00:00Z',
    title: 'Anna Karenina',
  },
]

const REFERRER = {
  tolstoy: {_id: 'author-tolstoy', _type: 'author', title: 'Leo Tolstoy'},
  readingList: {
    _id: 'list-russian-classics',
    _type: 'page',
    title: 'Reading list, Russian classics',
  },
  homepage: {_id: 'homepage-featured', _type: 'page', title: 'Homepage, Featured book'},
  // `campaignBanner` is deliberately absent from the schema below.
  campaignBanner: {
    _id: 'campaign-spring-sale',
    _type: 'campaignBanner',
    title: 'Spring sale banner',
  },
} as const

const previewUniverse = createMockPreviewUniverse({documents: subjectDocuments})
const client = createStructureFixtureClient({documents: subjectDocuments})

/* ── Fixture stand-ins for the two injected preview components ────────────
   The real `ReferencePreviewLink` (`structure/components/confirmDeleteDialog/ReferencePreviewLink.tsx`)
   reads `usePaneRouter()` for its `ReferenceChildLink`; the real `DocTitle`
   (`structure/components/DocTitle.tsx`) reads `useDocumentTitle()` off a live
   `DocumentPaneContext`. Both need a document pane this dialog never opens one of -
   they are the CALLER's concern (`DocumentStatusBarActions.tsx` supplies them), not
   `ConfirmDeleteDialog`'s. Per the fixture rule, these are legitimate hand-built
   stand-ins: `ConfirmDeleteDialog` only cares that its `components` prop renders
   SOMETHING for a given `{type, value}` / `{document}`, not which component does it. */

function FixtureDocTitle({document}: {document: SanityDocumentLike}) {
  const title = subjectDocuments.find((doc) => doc._id === document._id)?.title ?? document._id
  return <>{title}</>
}

function FixtureReferencePreviewLink({
  type,
  value,
  onClick,
}: DocumentGroupInventoryReferencePreviewLinkProps) {
  const entry = Object.values(REFERRER).find((referrer) => referrer._id === value._id)
  return (
    <Card
      as={onClick ? 'button' : 'div'}
      onClick={onClick}
      padding={2}
      radius={2}
      tone="transparent"
    >
      <Text size={1}>{entry?.title ?? value._id}</Text>
      <Box paddingTop={1}>
        <Text size={0} muted>
          {type.name}
        </Text>
      </Box>
    </Card>
  )
}

const components: DocumentGroupInventoryProps['components'] = {
  DocTitle: FixtureDocTitle,
  ReferencePreviewLink: FixtureReferencePreviewLink,
  VersionsPreviewList,
}

/* ── Reference-check fixtures ──────────────────────────────────────────── */

function referringDocuments(partial: Partial<ReferringDocuments>): ReferringDocuments {
  return {
    isLoading: false,
    totalCount: 0,
    projectIds: [],
    datasetNames: [],
    hasUnknownDatasetNames: false,
    ...partial,
  }
}

/** Emits once and never again, the real shape of a check that never resolves. */
const checking$: Observable<ReferringDocuments> = of(
  referringDocuments({isLoading: true, totalCount: 0}),
)

const noReferences$: Observable<ReferringDocuments> = of(referringDocuments({totalCount: 0}))

/** 5 internal references, only 3 fetched (the real store's `[0...100]` GROQ slice truncates
 * the same way at scale; 3-of-5 reproduces the shape without needing 100 fixture rows). */
const withInternalReferences$: Observable<ReferringDocuments> = of(
  referringDocuments({
    totalCount: 5,
    internalReferences: {
      totalCount: 5,
      references: [REFERRER.tolstoy, REFERRER.readingList, REFERRER.campaignBanner],
    },
  }),
)

const withCrossDatasetReferences$: Observable<ReferringDocuments> = of(
  referringDocuments({
    totalCount: 3,
    projectIds: ['prj-abc123', 'prj-xyz789'],
    datasetNames: ['production'],
    hasUnknownDatasetNames: true,
    crossDatasetReferences: {
      totalCount: 3,
      references: [
        {projectId: 'prj-abc123', datasetName: 'production', documentId: 'partner-catalog-entry-1'},
        {projectId: 'prj-xyz789', datasetName: undefined, documentId: undefined},
      ],
    },
  }),
)

const withBothReferenceKinds$: Observable<ReferringDocuments> = of(
  referringDocuments({
    totalCount: 4,
    projectIds: ['prj-abc123'],
    datasetNames: ['production'],
    hasUnknownDatasetNames: false,
    internalReferences: {
      totalCount: 2,
      references: [REFERRER.tolstoy, REFERRER.homepage],
    },
    crossDatasetReferences: {
      totalCount: 2,
      references: [
        {projectId: 'prj-abc123', datasetName: 'production', documentId: 'partner-catalog-entry-1'},
        {projectId: 'prj-abc123', datasetName: 'production', documentId: 'partner-catalog-entry-2'},
      ],
    },
  }),
)

const erroringCheck$: Observable<ReferringDocuments> = throwError(
  () => new Error('Referring-documents query timed out'),
)

/* ── Real actor wiring ─────────────────────────────────────────────────────
   `ConfirmDeleteDialog`'s actual props are two xstate `ActorRefFromLogic`s. In
   production `DocumentGroupInventory` builds them by spawning `selectionMachine` and
   `deletionMachine` as children of `documentGroupInventoryMachine`, which forwards
   `selection.changed` from the former to the latter. This hook is that same wiring
   minus the parent node: it drives both machines through their OWN declared events
   (`variants.changed`, `selection.add`, `selection.changed`, `delete.request`,
   `delete.confirm`) rather than fabricating internal state, so `ConfirmDeleteDialog`
   is handed genuine actor refs, exactly the input contract it was built for. */
/**
 * A minimal host, because `selectionMachine` talks to its parent.
 *
 * Both machines `sendTo('#_parent', ...)`. Spawned as roots via `useActorRef` there is no parent
 * to receive that, and xstate throws "Unable to send event to actor '#_parent'" at the first
 * forward, which renders as an empty story with no clue why.
 *
 * The real `documentGroupInventoryMachine` spawns both from its own context with `systemId`
 * 'selection' and 'deletion'. This mirrors that exactly, and absorbs whatever the children
 * forward rather than acting on it: the point is to give `#_parent` something to resolve to, not
 * to reimplement the parent's behaviour.
 */
const hostMachine = setup({
  types: {} as {
    context: {
      selectionRef: ActorRefFromLogic<typeof selectionMachine>
      deletionRef: ActorRefFromLogic<typeof deletionMachine>
    }
    input: {
      selectionLogic: typeof selectionMachine
      deletionLogic: typeof deletionMachine
    }
  },
}).createMachine({
  id: 'host',
  context: ({input, spawn}) => ({
    selectionRef: spawn(input.selectionLogic, {systemId: 'selection', input: undefined}),
    deletionRef: spawn(input.deletionLogic, {systemId: 'deletion', input: undefined}),
  }),
  on: {'*': {}},
})

function useConfirmDeleteActors(options: {
  variantIds: string[]
  referringDocuments$: Observable<ReferringDocuments>
  deleteVariants?: () => Promise<MultipleMutationResult>
  /** Send `delete.confirm` the moment the machine would first accept it. */
  autoConfirmWhenReady?: boolean
}) {
  const {variantIds, referringDocuments$: refs$, deleteVariants, autoConfirmWhenReady} = options

  const deletionLogic = useMemo(
    () =>
      deletionMachine.provide({
        actors: {
          referringDocuments: fromObservable(() => refs$),
          deleteVariants: fromPromise(
            deleteVariants ??
              (() => Promise.resolve({results: []} as unknown as MultipleMutationResult)),
          ),
        },
      }),
    [refs$, deleteVariants],
  )
  const selectionLogic = useMemo(
    () =>
      selectionMachine.provide({
        actors: {filterString: fromObservable<string, unknown>(() => EMPTY)},
      }),
    [],
  )

  const hostRef = useActorRef(hostMachine, {
    input: {
      selectionLogic: selectionLogic as typeof selectionMachine,
      deletionLogic: deletionLogic as typeof deletionMachine,
    },
  })
  const {selectionRef, deletionRef} = hostRef.getSnapshot().context

  // Fixture ids/observables are stable per story render; this wiring only needs to run once
  // per (selectionRef, deletionRef) pair, so the fixture inputs are read from a ref rather than
  // listed as effect deps, keeping the dependency array honest without changing behaviour.
  const fixtureRef = useRef<{variantIds: string[]; autoConfirmWhenReady?: boolean}>(undefined)
  fixtureRef.current ??= {variantIds, autoConfirmWhenReady}

  useEffect(() => {
    const {variantIds, autoConfirmWhenReady} = fixtureRef.current!
    // Minimal stub - the selection/deletion machines and this dialog only read id/name for
    // display; `document`/`releaseDocument` aren't exercised by this fixture scenario.
    const variants = variantIds.map((id) => ({id, name: id}) as unknown as Variant)
    selectionRef.send({type: 'variants.changed', variants, loaded: true})
    variantIds.forEach((id) => selectionRef.send({type: 'selection.add', variantId: id}))
    deletionRef.send({type: 'selection.changed', selectedIds: new Set(variantIds)})
    deletionRef.send({type: 'delete.request'})

    if (!autoConfirmWhenReady) return undefined

    const subscription = deletionRef.subscribe(() => {
      if (deletionRef.getSnapshot().can({type: 'delete.confirm'})) {
        subscription.unsubscribe()
        deletionRef.send({type: 'delete.confirm'})
      }
    })
    return () => subscription.unsubscribe()
  }, [selectionRef, deletionRef])

  return {deletionRef, selectionRef}
}

function DeleteDialogDemo(props: {
  variantIds: string[]
  referringDocuments$: Observable<ReferringDocuments>
  deleteVariants?: () => Promise<MultipleMutationResult>
  autoConfirmWhenReady?: boolean
  portalElementName: string
}) {
  const {deletionRef, selectionRef} = useConfirmDeleteActors(props)
  return (
    <ConfirmDeleteDialog
      documentId={SUBJECT_PUBLISHED_ID}
      documentType="book"
      deletionRef={deletionRef}
      selectionRef={selectionRef}
      portalElementName={props.portalElementName}
      components={components}
    />
  )
}

const meta: Meta<typeof ConfirmDeleteDialog> = {
  title: 'Overlays & Navigation/Confirm Delete Dialog',
  component: ConfirmDeleteDialog,
  decorators: [
    WithStudioProviders({
      config: {
        schema: {
          name: 'storybook-confirm-delete',
          types: [
            {
              name: 'book',
              title: 'Book',
              type: 'document',
              fields: [{name: 'title', title: 'Title', type: 'string'}],
              preview: {select: {title: 'title'}},
            },
            {
              name: 'author',
              title: 'Author',
              type: 'document',
              fields: [{name: 'name', title: 'Name', type: 'string'}],
            },
            {
              name: 'page',
              title: 'Page',
              type: 'document',
              fields: [{name: 'title', title: 'Title', type: 'string'}],
            },
            // `campaignBanner` is deliberately NOT registered, see REFERRER.campaignBanner.
          ],
        },
      },
      client,
      previewStore: previewUniverse.store,
      releases: [],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          'ConfirmDeleteDialog is the last checkpoint before an editor deletes a document ' +
            'version, and the only place in Studio that names which other documents point at what ' +
            'is about to disappear, except when it silently declines to.',
          '',
          '|           |                                                                                                                                                                                                                                                                                                                                                                                     |',
          '| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source    | `packages/sanity/src/core/documentGroupInventory/components/ConfirmDeleteDialog.tsx`                                                                                                                                                                                                                                                                                                |',
          '| Tier      | CORE. The last checkpoint before an editor deletes a document version                                                                                                                                                                                                                                                                                                               |',
          '| Audit     | 🔴 needs-work (`spinners-loading`, `similarity`). No on-screen indication a reference check is running at all (see `CheckInProgress`), and a failed check renders the identical generic message a failed delete would (see `ReferenceCheckErrors` vs `DeleteMutationFails`), while also re-enabling the confirm button through a different guard than the one the checked path uses |',
          '| Patterns  | `spinners-loading` · `similarity` · `destructive-friction`                                                                                                                                                                                                                                                                                                                          |',
          '| Structure | one `Dialog` body, three independent conditionals: an `error` card, a `VersionsPreviewList` of what is about to be lost, and, only when `warnIncomingReferences` is true, a caution banner plus the module-local `References` list                                                                                                                                                  |',
          '',
          '`warnIncomingReferences` (`deletionMachine.ts` guard `shouldWarnIncomingReferences`) ' +
            'requires both conditions: the selection includes a published id ' +
            '(`ids.some(isPublishedId)`), and at least one reference was actually found. Delete ' +
            'only drafts or only versions, however many other documents point at them, and this ' +
            'dialog never mentions references at all: the warning is published-id-gated, not ' +
            'reference-count-gated. `NoIncomingReferences` below reproduces the "references ' +
            'exist, warning does not show" half; the draft/version-only half needs no separate ' +
            'story, it is the same code path with zero references.',
          '',
          'References, not just a count: when the warning fires, `References` (module-local, ' +
            'unexported, reachable only through this branch) lists the actual referring documents ' +
            'via the injected `ReferencePreviewLink`, not merely "N documents reference this." ' +
            'Internal (same-dataset) references are capped at 100 by the query that feeds this ' +
            'dialog (`*[references($documentId)][0...100]` in `useReferringDocuments.ts`); ' +
            'cross-dataset references have no such client-side cap here. Either list truncates ' +
            'against its own `totalCount`, and `OtherReferenceCount` ' +
            '(`ConfirmDeleteDialog.styles.tsx`, exported, storied standalone below) says so, ' +
            'except its one piece of copy is written for the cross-dataset case and is misleading ' +
            'when it fires for an internal-reference cap; see `TruncationTooltipMismatch`.',
          '',
          '> **Why it matters:** an editor who deletes only drafts or scheduled versions never ' +
            'sees this dialog say a word about references, no matter how many other documents ' +
            'point at the published document underneath. The gate is "are you deleting something ' +
            'published," not "will this break something."',
          '',
          'Fixture note: `components.DocTitle` and `components.ReferencePreviewLink` are ' +
            'hand-built stand-ins for the real `structure/components/DocTitle.tsx` and ' +
            '`structure/components/confirmDeleteDialog/ReferencePreviewLink.tsx`. Both real ' +
            'components need a live document pane / pane router this dialog never opens one of, ' +
            'and are the document-pane caller’s concern, not this one’s (see ' +
            '`DocumentStatusBarActions.tsx`). `components.VersionsPreviewList` is the real ' +
            'component: it only needs schema and the seeded preview store, both cheap to provide ' +
            'here.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:nav',
    'chapter:cms',
    'pattern:spinners-loading',
    'pattern:similarity',
    'pattern:destructive-friction',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj<typeof ConfirmDeleteDialog>

/**
 * Current, the audit finding: two frames, same frozen "checking" fixture (the reference
 * query emits `isLoading: true` once and never again: the real shape of a check that is
 * slow or never resolves). Left: only a draft is selected, so `selectionExcludesPublished`
 * is true and the confirm is enabled immediately, before any check has run. Right: the
 * published id is in the selection, so the confirm stays disabled until the check settles.
 * Neither frame shows a spinner, a "checking references…" label, or any other indication a
 * check is even in flight: the only visible difference between "checking" and "nothing to
 * check" is whether the confirm button happens to be clickable.
 */
export const CheckInProgress: Story = {
  name: 'Check in progress (no visible indication)',
  tags: ['audit:needs-work'],
  render: () => (
    <Stack gap={4}>
      <Stack gap={2}>
        <Text size={0} muted weight="medium">
          Selection excludes published, confirm enabled while the check is still running
        </Text>
        <NamedPortalFrame portalElementName="confirm-delete-portal-a" minHeight={260}>
          <DeleteDialogDemo
            variantIds={[SUBJECT_DRAFT_ID]}
            referringDocuments$={checking$}
            portalElementName="confirm-delete-portal-a"
          />
        </NamedPortalFrame>
      </Stack>
      <Stack gap={2}>
        <Text size={0} muted weight="medium">
          Selection includes published, confirm disabled, same silent "checking" state
        </Text>
        <NamedPortalFrame portalElementName="confirm-delete-portal-b" minHeight={260}>
          <DeleteDialogDemo
            variantIds={[SUBJECT_PUBLISHED_ID]}
            referringDocuments$={checking$}
            portalElementName="confirm-delete-portal-b"
          />
        </NamedPortalFrame>
      </Stack>
    </Stack>
  ),
}

/**
 * Published id selected, check resolved, zero references either kind. The warning card and
 * `References` never mount: `warnIncomingReferences` needs references to exist, not merely
 * a published id in the selection.
 */
export const NoIncomingReferences: Story = {
  render: () => (
    <NamedPortalFrame portalElementName="confirm-delete-no-refs">
      <DeleteDialogDemo
        variantIds={[SUBJECT_PUBLISHED_ID]}
        referringDocuments$={noReferences$}
        portalElementName="confirm-delete-no-refs"
      />
    </NamedPortalFrame>
  ),
}

/**
 * 5 internal references, 3 fetched: two ordinary preview rows and one of an UNREGISTERED
 * schema type (`campaignBanner`), which falls to `SanityDefaultPreview`'s "Preview
 * unavailable" branch rather than `ReferencePreviewLink`. `OtherReferenceCount` reports the
 * 2 not shown.
 */
export const WarnInternalReferences: Story = {
  render: () => (
    <NamedPortalFrame portalElementName="confirm-delete-internal-refs" minHeight={420}>
      <DeleteDialogDemo
        variantIds={[SUBJECT_PUBLISHED_ID]}
        referringDocuments$={withInternalReferences$}
        portalElementName="confirm-delete-internal-refs"
      />
    </NamedPortalFrame>
  ),
}

/**
 * Cross-dataset references only: the `<details>` disclosure, its project/dataset/document-id
 * table, a row whose dataset AND document id are both unavailable (no access token for that
 * project), and the copy-id button on the row that does have one.
 */
export const WarnCrossDatasetReferences: Story = {
  render: () => (
    <NamedPortalFrame portalElementName="confirm-delete-cdr" minHeight={420}>
      <DeleteDialogDemo
        variantIds={[SUBJECT_PUBLISHED_ID]}
        referringDocuments$={withCrossDatasetReferences$}
        portalElementName="confirm-delete-cdr"
      />
    </NamedPortalFrame>
  ),
}

/**
 * Current, the audit finding: the reference check itself fails (`referringDocuments`
 * actor's `onError`, `deletionMachine.ts` lines 161-164). No reference was ever counted,
 * yet the dialog renders the exact same `document-group.delete.error.message` a failed
 * delete mutation would ("An error occurred while attempting to delete this document.").
 * Compare with `DeleteMutationFails`: same card, same copy, two structurally different
 * failures. Worse: the confirm button, which read "Delete (1)" disabled a moment ago while
 * checking, is now enabled: the `error` state's own `delete.confirm` transition guards only
 * on `hasSelection`, not the `canConfirmDeletion` composite the checked path uses. A retry
 * click goes straight to `deleting`, skipping the incoming-reference check entirely.
 */
export const ReferenceCheckErrors: Story = {
  name: 'Reference check errors (confirm re-enabled)',
  tags: ['audit:needs-work'],
  render: () => (
    <NamedPortalFrame portalElementName="confirm-delete-check-error">
      <DeleteDialogDemo
        variantIds={[SUBJECT_PUBLISHED_ID]}
        referringDocuments$={erroringCheck$}
        portalElementName="confirm-delete-check-error"
      />
    </NamedPortalFrame>
  ),
}

/**
 * Contrast case for `ReferenceCheckErrors`: the check SUCCEEDS (references found, warning
 * shown), the editor confirms, and the delete mutation itself rejects. Same error card, same
 * copy as above, but this time a delete genuinely occurred and failed, so the message is at
 * least accurate for what happened. `autoConfirmWhenReady` drives the story past the checked
 * gate the moment it opens, the same way a real click would.
 */
export const DeleteMutationFails: Story = {
  render: () => (
    <NamedPortalFrame portalElementName="confirm-delete-mutation-error" minHeight={420}>
      <DeleteDialogDemo
        variantIds={[SUBJECT_PUBLISHED_ID]}
        referringDocuments$={withInternalReferences$}
        deleteVariants={() => Promise.reject(new Error('mutation failed'))}
        autoConfirmWhenReady
        portalElementName="confirm-delete-mutation-error"
      />
    </NamedPortalFrame>
  ),
}

/**
 * Current, the audit finding: `OtherReferenceCount` standalone, its own two states.
 * `null` when `totalCount === references.length` (nothing hidden), and the "N other
 * references not shown" row otherwise. The same component, same tooltip copy
 * ("We can't display metadata for these references due to a missing access token for the
 * related datasets"), renders for both truncation reasons: a cross-dataset reference omitted
 * for lack of a project token (the copy is accurate here), and an internal, same-dataset
 * reference simply past the query's own `[0...100]` fetch cap (the copy is wrong here: there
 * is no dataset, no token, nothing cross-project about it). An editor hovering the info icon
 * on a same-dataset truncation reads an explanation about access tokens for a cap that has
 * nothing to do with access.
 */
export const TruncationTooltipMismatch: Story = {
  name: 'OtherReferenceCount: same copy, two different reasons',
  tags: ['audit:needs-work', 'pattern:similarity'],
  render: () => (
    <Stack gap={4}>
      <Stack gap={2}>
        <Text size={0} muted weight="medium">
          Nothing hidden, renders null
        </Text>
        <Card border padding={3} radius={2} style={{minHeight: 32}}>
          <OtherReferenceCount totalCount={2} references={[REFERRER.tolstoy, REFERRER.homepage]} />
        </Card>
      </Stack>
      <Stack gap={2}>
        <Text size={0} muted weight="medium">
          Cross-dataset truncation, the tooltip copy is accurate here
        </Text>
        <Card border padding={3} radius={2}>
          <OtherReferenceCount totalCount={40} references={[REFERRER.tolstoy]} />
        </Card>
      </Stack>
      <Stack gap={2}>
        <Text size={0} muted weight="medium">
          Internal, same-dataset truncation past the [0...100] fetch cap: the SAME copy now blames a
          missing dataset access token for an unrelated, same-project fetch limit
        </Text>
        <Card border padding={3} radius={2}>
          <OtherReferenceCount
            totalCount={5}
            references={[REFERRER.tolstoy, REFERRER.readingList, REFERRER.campaignBanner]}
          />
        </Card>
      </Stack>
    </Stack>
  ),
}

/**
 * In context, deleting a referenced book. Both reference kinds together, the fullest
 * real render this dialog produces: an editor hits Delete on the published *Anna Karenina*,
 * the check has resolved, and the dialog states the concrete blast radius before asking for a
 * commit: two internal referrers (one previewable, one via `Homepage`), two cross-dataset
 * referrers in the same partner project, all counted honestly (nothing truncated here). This
 * is the dialog working as designed; the audit findings above are about the states either
 * side of this one.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <NamedPortalFrame portalElementName="confirm-delete-in-context" minHeight={480}>
      <DeleteDialogDemo
        variantIds={[SUBJECT_PUBLISHED_ID]}
        referringDocuments$={withBothReferenceKinds$}
        portalElementName="confirm-delete-in-context"
      />
    </NamedPortalFrame>
  ),
}
