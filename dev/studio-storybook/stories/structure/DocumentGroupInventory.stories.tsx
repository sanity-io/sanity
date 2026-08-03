import {type ReleaseDocument} from '@sanity/client'
import {type SanityDocument, type SanityDocumentLike} from '@sanity/types'
import {Box, Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'
import {type Observable, of} from 'rxjs'
import {DocumentPaneContext} from 'sanity/_singletons'

// Real components from their real paths (org contract §8): the files under test.
import {DocumentGroupInventory} from '../../../../packages/sanity/src/core/documentGroupInventory/components/DocumentGroupInventory'
import {DocumentGroupInventoryAction} from '../../../../packages/sanity/src/core/documentGroupInventory/components/DocumentGroupInventoryAction'
import {type ReferringDocuments} from '../../../../packages/sanity/src/core/documentGroupInventory/machines/deletionMachine'
import {
  type DocumentGroupInventoryPerspectiveList,
  type DocumentGroupInventoryReferencePreviewLinkProps,
} from '../../../../packages/sanity/src/core/documentGroupInventory/types'
import {type DocumentPaneContextValue} from '../../../../packages/sanity/src/structure/panes/document/DocumentPaneContext'
import {DocumentGroupInventoryHint} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/header/documentGroupInventoryHint/DocumentGroupInventoryHint'
import {NamedPortalFrame} from '../../lib/documentGroupInventoryFrame'
import {createMockPreviewUniverse} from '../../lib/mockDocumentPreviewStore'
import {createStructureFixtureClient} from '../../lib/structureHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Fixture universe ─────────────────────────────────────────────────────
   `article-quarterly` has both a draft and a published sibling, so
   `useDocumentVersionsObservable` (feeding both `DocumentGroupInventoryAction`'s
   `isAvailable` and `DocumentGroupInventory`'s own variant set) reports two real
   versions with no source patch needed: the mock's `unstable_observeVersionDocumentIds`
   already resolves draft+published existence for any id whose PUBLISHED id it holds.
   `article-solo` has ONLY a published sibling (one version, still "available", the
   button renders, one row). `article-missing` has NEITHER (drives `isAvailable: false`). */

const SUBJECT_PUBLISHED_ID = 'article-quarterly'
const SUBJECT_DRAFT_ID = 'drafts.article-quarterly'
const SOLO_PUBLISHED_ID = 'article-solo'
const UNAVAILABLE_PUBLISHED_ID = 'article-missing'

const fixtureDocuments: SanityDocument[] = [
  {
    _id: SUBJECT_DRAFT_ID,
    _type: 'article',
    _rev: 'rev-draft-1',
    _createdAt: '2026-05-01T09:00:00Z',
    _updatedAt: '2026-05-14T11:30:00Z',
    title: 'Quarterly Planning Review (edited)',
  },
  {
    _id: SUBJECT_PUBLISHED_ID,
    _type: 'article',
    _rev: 'rev-published-1',
    _createdAt: '2026-04-01T09:00:00Z',
    _updatedAt: '2026-04-01T09:00:00Z',
    title: 'Quarterly Planning Review',
  },
  {
    _id: SOLO_PUBLISHED_ID,
    _type: 'article',
    _rev: 'rev-solo-1',
    _createdAt: '2026-04-02T09:00:00Z',
    _updatedAt: '2026-04-02T09:00:00Z',
    title: 'A published-only article',
  },
]

const previewUniverse = createMockPreviewUniverse({documents: fixtureDocuments})
const client = createStructureFixtureClient({documents: fixtureDocuments})

// One active release, so `useVersionRelease`'s release-perspective branch (`PerspectiveLabels`
// below) has a real title to resolve rather than falling back to the raw release id.
const fixtureReleases: ReleaseDocument[] = [
  {
    _id: '_.releases.rSpringCampaign',
    name: 'rSpringCampaign',
    _type: 'system.release',
    _rev: 'rev-release-1',
    _createdAt: '2026-04-20T09:00:00Z',
    _updatedAt: '2026-04-20T09:00:00Z',
    state: 'active',
    metadata: {title: 'Spring campaign', releaseType: 'scheduled'},
  },
]

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

const noReferences$: Observable<ReferringDocuments> = of(referringDocuments({}))

/* ── Fixture stand-ins for the injected preview components (see the note in
   `ConfirmDeleteDialog.stories.tsx`, same rationale, duplicated per this file's
   self-contained convention rather than shared across story files). */

function FixtureDocTitle({document}: {document: SanityDocumentLike}) {
  const title = fixtureDocuments.find((doc) => doc._id === document._id)?.title ?? document._id
  return <>{title}</>
}

function FixtureReferencePreviewLink({
  type,
  value,
}: DocumentGroupInventoryReferencePreviewLinkProps) {
  return (
    <Card padding={2} radius={2} tone="transparent">
      <Text size={1}>{value._id}</Text>
      <Box paddingTop={1}>
        <Text size={0} muted>
          {type.name}
        </Text>
      </Box>
    </Card>
  )
}

function FixtureVersionsPreviewList({
  documentVersions,
}: {
  documentType: string
  documentVersions: string[]
}) {
  return (
    <Stack gap={1}>
      {documentVersions.map((id) => (
        <Text key={id} size={1}>
          {id}
        </Text>
      ))}
    </Stack>
  )
}

const components = {
  DocTitle: FixtureDocTitle,
  ReferencePreviewLink: FixtureReferencePreviewLink,
  VersionsPreviewList: FixtureVersionsPreviewList,
}

const perspectiveList: DocumentGroupInventoryPerspectiveList = {
  filteredReleases: {notCurrentReleases: []},
  getReleaseChipState: () => ({selected: false}),
  clearScheduledDraftPerspective: () => undefined,
  isDraftSelected: false,
  isPublishSelected: false,
}

const meta: Meta = {
  title: 'Document Pane/Document Group Inventory',
  decorators: [
    WithStudioProviders({
      config: {
        schema: {
          name: 'storybook-document-group-inventory',
          types: [
            {
              name: 'article',
              title: 'Article',
              type: 'document',
              fields: [{name: 'title', title: 'Title', type: 'string'}],
              preview: {select: {title: 'title'}},
            },
          ],
        },
        beta: {documentGroupInventory: {enabled: true}},
      },
      client,
      previewStore: previewUniverse.store,
      releases: fixtureReleases,
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          'A header nudge and the button it points at do not check the same thing before they ' +
            'render. One invites a click; the other has already decided there is nothing to show.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `DocumentGroupInventoryAction.tsx` (trigger) and `DocumentGroupInventory.tsx` (popover content), plus `DocumentGroupInventoryHint.tsx` |',
          '| Tier | CORE: the trigger and the full "which version am I looking at, which am I about to delete" surface, gated by a beta flag |',
          '| Audit | 🔴 needs-work (`empty-states`). See `HintAvailabilityMismatch` below |',
          '| Patterns | `empty-states` |',
          '',
          'Three pieces that only ever appear together in production, storied here as one chapter. ' +
            'The action is the status-bar trigger: a popover wrapping a button whose label reads ' +
            "the current document's perspective, Draft, Published, a release title, or Proposed " +
            'changes for an agent bundle. It renders nothing at all, no placeholder, no disabled ' +
            'state, while versions are loading or none exist. The inventory itself is the ' +
            "popover's content: a filterable list of every draft, published, or release version " +
            'of the group, each row selectable, with a footer delete button that opens the confirm ' +
            'delete dialog, storied separately under Overlays & Navigation. The hint is an ' +
            'onboarding nudge in the document header that points at the same trigger.',
          '',
          '> **Why it matters:** the hint and the action agree on the one gate that is cheap to ' +
            'check from anywhere, a feature flag; both read it. Only the action also checks ' +
            'whether there is anything to show. The hint has no such check: it is driven purely by ' +
            'a session counter. A document with the flag on but nothing else to inventory can show ' +
            'the hint inviting a click while the trigger it points at has already rendered ' +
            'nothing.',
          '',
          "<details><summary><b>No injectable seam for the hint's storage read (a finding, not a workaround).</b></summary>",
          '',
          "The hint's underlying status function takes a storage interface as a parameter, and its " +
            'own unit test injects an in-memory fixture through it, but the hint component ' +
            'hardcodes the real browser storage adapter, with no prop to substitute another one. ' +
            'The seam the test file uses does not reach the component. The active and inactive ' +
            'stories below drive it the only way a caller outside the component can: writing the ' +
            "same storage keys the real adapter reads, reconstructed from the status module's own " +
            'constants, verified against source, not guessed.',
          '',
          '</details>',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:empty-states',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/* ── DocumentGroupInventoryAction ─────────────────────────────────────────
   Single component, one early return (`if (!isAvailable) return null`, line 62-64):
   two appearances. */

/**
 * `isAvailable` (`!loading && versions.length !== 0`) is false: neither a draft nor a
 * published sibling exists for this id anywhere in the fixture set. The component
 * renders `null`, no placeholder, no disabled ghost button, nothing at all.
 */
export const Unavailable: Story = {
  name: 'Action: unavailable (renders null)',
  render: () => (
    <Stack gap={2}>
      <Text size={0} muted weight="medium">
        Nothing below this line is the story rendering wrong, `DocumentGroupInventoryAction`
        genuinely returns null here.
      </Text>
      <Card border padding={3} radius={2} style={{minHeight: 32}}>
        <DocumentGroupInventoryAction
          documentId={UNAVAILABLE_PUBLISHED_ID}
          portalElementName="inventory-action-unavailable"
          isDocumentGroupInventoryActive={false}
          setIsDocumentGroupInventoryActive={() => undefined}
        >
          <div />
        </DocumentGroupInventoryAction>
      </Card>
    </Stack>
  ),
}

/**
 * The trigger button's label, purely a function of the `documentId` string passed in:
 * `useVersionRelease` reads `getVersionFromId` off the id and the seeded releases store,
 * nothing else. Four real perspectives: a bare id (Published), a `drafts.`-prefixed id
 * (Draft), a `versions.<releaseId>.` id matching the seeded "Spring campaign" release
 * (its title), and a `versions.agent-*.` id (the agent-bundle "Proposed changes" label,
 * `isAgentBundleName` matches the `agent-` prefix directly on the raw version string when
 * no release document owns it).
 */
export const PerspectiveLabels: Story = {
  name: 'Action: trigger label by perspective',
  render: () => (
    <Stack gap={3}>
      {[
        {label: 'Published (bare id)', documentId: SUBJECT_PUBLISHED_ID},
        {label: 'Draft', documentId: SUBJECT_DRAFT_ID},
        {
          label: 'Release (seeded "Spring campaign")',
          documentId: `versions.rSpringCampaign.${SUBJECT_PUBLISHED_ID}`,
        },
        {
          label: 'Agent bundle ("Proposed changes")',
          documentId: `versions.agent-content-writer.${SUBJECT_PUBLISHED_ID}`,
        },
      ].map(({label, documentId}) => (
        <Stack key={documentId} gap={2}>
          <Text size={0} muted weight="medium">
            {label}
          </Text>
          <Card border padding={3} radius={2}>
            <DocumentGroupInventoryAction
              documentId={documentId}
              portalElementName={`inventory-action-label-${documentId}`}
              isDocumentGroupInventoryActive={false}
              setIsDocumentGroupInventoryActive={() => undefined}
            >
              <div />
            </DocumentGroupInventoryAction>
          </Card>
        </Stack>
      ))}
    </Stack>
  ),
}

/**
 * Open: the `Popover` mounts its `children` beside the trigger. Content here is a
 * placeholder, the real content (`DocumentGroupInventory`) is storied on its own below,
 * since it is a substantial surface in its own right.
 */
export const PopoverOpen: Story = {
  name: 'Action: popover open',
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true)
      return (
        <DocumentGroupInventoryAction
          documentId={SUBJECT_PUBLISHED_ID}
          portalElementName="inventory-action-open"
          isDocumentGroupInventoryActive={open}
          setIsDocumentGroupInventoryActive={setOpen}
        >
          <Card padding={3} style={{width: 240}}>
            <Text size={1} muted>
              Popover content placeholder, see `DocumentGroupInventory` below.
            </Text>
          </Card>
        </DocumentGroupInventoryAction>
      )
    }
    return (
      <NamedPortalFrame portalElementName="inventory-action-open" minHeight={220}>
        <Demo />
      </NamedPortalFrame>
    )
  },
}

/* ── DocumentGroupInventory ────────────────────────────────────────────── */

/**
 * The default render: two versions (draft + published), nothing selected, nothing
 * filtered. The footer's Delete button starts disabled, `canRequestDeletion` needs a
 * non-empty selection, and none has been made yet.
 */
export const VersionList: Story = {
  render: () => (
    <NamedPortalFrame portalElementName="inventory-list" minHeight={420}>
      <Card style={{width: 360}}>
        <DocumentGroupInventory
          documentId={SUBJECT_PUBLISHED_ID}
          documentType="article"
          portalElementName="inventory-list"
          perspectiveList={perspectiveList}
          referringDocuments$={noReferences$}
          components={components}
        />
      </Card>
    </NamedPortalFrame>
  ),
}

/**
 * A document with exactly one version (published only, no draft). Still "available":
 * one row is enough, but worth seeing next to `VersionList` since the singular/plural
 * "N versions" heading and the singular "Select all 1" button text both depend on this
 * count being exactly one.
 */
export const SingleVersion: Story = {
  render: () => (
    <NamedPortalFrame portalElementName="inventory-single" minHeight={320}>
      <Card style={{width: 360}}>
        <DocumentGroupInventory
          documentId={SOLO_PUBLISHED_ID}
          documentType="article"
          portalElementName="inventory-single"
          perspectiveList={perspectiveList}
          referringDocuments$={noReferences$}
          components={components}
        />
      </Card>
    </NamedPortalFrame>
  ),
}

/**
 * **In context, the real trigger and the real popover together**, exactly as
 * `DocumentStatusBarActions.tsx` composes them (`DocumentGroupInventoryAction` wrapping
 * `DocumentGroupInventory` as its `children`). Open by default so the two pieces are seen
 * as the one surface an editor actually gets, not two isolated fixtures.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true)
      return (
        <DocumentGroupInventoryAction
          documentId={SUBJECT_PUBLISHED_ID}
          portalElementName="inventory-in-context"
          isDocumentGroupInventoryActive={open}
          setIsDocumentGroupInventoryActive={setOpen}
        >
          <DocumentGroupInventory
            documentId={SUBJECT_PUBLISHED_ID}
            documentType="article"
            portalElementName="inventory-in-context"
            perspectiveList={perspectiveList}
            referringDocuments$={noReferences$}
            components={components}
          />
        </DocumentGroupInventoryAction>
      )
    }
    return (
      <NamedPortalFrame portalElementName="inventory-in-context" minHeight={460}>
        <Demo />
      </NamedPortalFrame>
    )
  },
}

/* ── DocumentGroupInventoryHint ────────────────────────────────────────── */

// Reconstructed verbatim from `hintStatus.ts` (`STORAGE_NAMESPACE`/`COUNT_KEY`/`DISPLAYED_KEY`,
// not exported), see the no-injectable-seam note in the meta docblock above.
const HINT_COUNT_KEY = 'studio.document-group-inventory.hint.session-count'
const HINT_DISPLAYED_KEY = 'studio.document-group-inventory.hint.has-displayed'

const inertDocumentPane = {
  setIsDocumentGroupInventoryActive: () => undefined,
} as unknown as DocumentPaneContextValue

function HintDemo({sessionCount}: {sessionCount: number}) {
  // Runs synchronously during this component's own render, before
  // `DocumentGroupInventoryHint` mounts and reads storage for the first time.
  useState(() => {
    localStorage.setItem(HINT_COUNT_KEY, JSON.stringify(sessionCount))
    sessionStorage.removeItem(HINT_DISPLAYED_KEY)
    return null
  })
  return (
    <DocumentPaneContext.Provider value={inertDocumentPane}>
      <DocumentGroupInventoryHint />
    </DocumentPaneContext.Provider>
  )
}

/** Fresh session count (0 of a 3-session limit), the hint renders. */
export const HintActive: Story = {
  name: 'Hint: active',
  render: () => (
    <Card border padding={3} radius={2}>
      <HintDemo sessionCount={0} />
    </Card>
  ),
}

/** Session count past the limit (or the suppressed sentinel, -1), renders null. */
export const HintInactive: Story = {
  name: 'Hint: inactive (dismissed or expired)',
  render: () => (
    <Stack gap={2}>
      <Text size={0} muted weight="medium">
        Renders nothing below this line, the hint has been suppressed.
      </Text>
      <Card border padding={3} radius={2} style={{minHeight: 32}}>
        <HintDemo sessionCount={-1} />
      </Card>
    </Stack>
  ),
}

/**
 * **Current (audit finding).** The Hint (active, left) beside an Action whose trigger for
 * the SAME document has already decided there is nothing to show (right, `Unavailable`
 * above). Both read `beta.documentGroupInventory.enabled`, this file's decorator has it on
 * for both, but only the Action also checks `isAvailable`. An editor can see the header
 * nudge "psst, try version history" pointing at a status-bar button that renders nothing.
 */
export const HintAvailabilityMismatch: Story = {
  name: 'Hint vs. Action: do not agree on availability',
  tags: ['audit:needs-work', 'pattern:empty-states'],
  render: () => (
    <Stack gap={2}>
      <Text size={0} muted weight="medium">
        Header hint (reads only the session counter)
      </Text>
      <Card border padding={3} radius={2}>
        <HintDemo sessionCount={0} />
      </Card>
      <Text size={0} muted weight="medium">
        Status-bar trigger, same document (reads the session counter AND `isAvailable`), renders
        nothing
      </Text>
      <Card border padding={3} radius={2} style={{minHeight: 32}}>
        <DocumentGroupInventoryAction
          documentId={UNAVAILABLE_PUBLISHED_ID}
          portalElementName="inventory-action-mismatch"
          isDocumentGroupInventoryActive={false}
          setIsDocumentGroupInventoryActive={() => undefined}
        >
          <div />
        </DocumentGroupInventoryAction>
      </Card>
    </Stack>
  ),
}
