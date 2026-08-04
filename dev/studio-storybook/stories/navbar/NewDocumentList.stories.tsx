import {DocumentIcon} from '@sanity/icons/Document'
import {type CurrentUser} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from a real path (org contract §8).
import {NewDocumentList} from '../../../../packages/sanity/src/core/studio/components/navbar/new-document/NewDocumentList'
import {type NewDocumentOption} from '../../../../packages/sanity/src/core/studio/components/navbar/new-document/types'
import {NavbarProviders} from '../../lib/navbarHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── The four returns ─────────────────────────────────────────────────────
   `NewDocumentList` is presentational: `NewDocumentButton` does the schema walk and the
   permission check (`useNewDocumentOptions`) and hands this component a ready `options` array,
   a `loading` flag and the current `searchQuery`. Those three props ARE the component's own
   input (the same relationship `PreviewReferenceValue` has to its `referenceInfo`), so the
   stories below drive it with hand-built option lists rather than reconstructing the whole
   permission-resolution chain - `NewDocumentButton.stories.tsx` already established exactly
   this idiom for the parent.

   Four returns, four branches, in source order:
   - `loading` → `<LoadingBlock showText />`
   - `!hasOptions && searchQuery` → "No results for {searchQuery}"
   - `!hasOptions` (no search query) → "No document types found"
   - otherwise → the real `CommandList`, one `NewDocumentListOption` per option

   `hasOptions = options.length > 0 && !loading` (L31). The `&& !loading` half is dead weight by
   the time either empty branch reads it: both live after the `if (loading) return` on L58-60, so
   `loading` is already known false. Harmless (the boolean is still correct), just worth noting as
   the same species of finding as `ObjectInputMember`'s unreachable branch: not wrong, just carrying
   a condition that can never do anything.

   THE QUESTION THAT MATTERS: does "no options" collapse two different situations the way the
   PreviewReferenceValue and DiffFromTo pages found? Read against `useNewDocumentOptions.ts` and
   `NewDocumentButton.tsx`, the answer is no, and here is why: `useNewDocumentOptions` maps EVERY
   declared template into `options`, including ones the user cannot create - it tags each with
   `hasPermission`, it never removes them. So "the person may create nothing" is not an empty
   `options` array; it is a full array where every `hasPermission` is `false`. `hasOptions` stays
   true, the `CommandList` branch renders, and every row shows disabled with an
   `InsufficientPermissionsMessage` tooltip (`NewDocumentListOption.tsx:64-70`). The ONLY way to
   reach the true "no document types found" empty is for `options` itself to be empty, which from
   this component's vantage point means the caller found nothing to offer - not that permission was
   denied. See `AllPermissionsDenied` vs `NoDocumentTypesDeclared` below: same message space,
   genuinely different inputs, never confused with each other. */

const currentUser: CurrentUser = {
  id: 'reader',
  name: 'Ripley Reader',
  email: 'reader@example.com',
  // oxlint-disable-next-line no-deprecated -- role remains a required (if deprecated) field on CurrentUser; roles is also provided
  role: 'viewer',
  roles: [{name: 'viewer', title: 'Viewer'}],
}

const option = (id: string, title: string, hasPermission: boolean): NewDocumentOption =>
  ({
    id,
    type: 'initialValueTemplateItem',
    templateId: id,
    schemaType: id,
    title,
    hasPermission,
    icon: DocumentIcon,
    // Fixture option: only the fields the
    // component and its child actually read are set (org contract idiom, matches
    // NewDocumentButton.stories.tsx).
  }) as unknown as NewDocumentOption

const allAllowed = [
  option('article', 'Article', true),
  option('author', 'Author', true),
  option('page', 'Landing page', true),
]

const mixedPermissions = [
  option('article', 'Article', true),
  option('author', 'Author', false),
  option('page', 'Landing page', true),
  option('event', 'Event', false),
]

const allDenied = [
  option('article', 'Article', false),
  option('author', 'Author', false),
  option('page', 'Landing page', false),
]

function Row({label, note, children}: {label: string; note: string; children: React.ReactNode}) {
  return (
    <Stack gap={2}>
      <Text size={1} weight="semibold">
        {label}
      </Text>
      <Text muted size={1}>
        {note}
      </Text>
      {children}
    </Stack>
  )
}

function Harness(props: {loading?: boolean; options?: NewDocumentOption[]; searchQuery?: string}) {
  const {loading = false, options = [], searchQuery = ''} = props
  return (
    <NavbarProviders>
      <Card border radius={2} style={{maxWidth: 340, height: 220, overflow: 'hidden'}}>
        <NewDocumentList
          currentUser={currentUser}
          loading={loading}
          onDocumentClick={() => undefined}
          options={options}
          preview="inline"
          searchQuery={searchQuery}
          textInputElement={null}
        />
      </Card>
    </NavbarProviders>
  )
}

const meta: Meta = {
  title: 'Navbar & Shell/New Document List',
  parameters: {
    // Every story drives Harness with fixed loading/options/searchQuery combinations to
    // demonstrate a specific branch; controls would let a reader break that pairing.
    controls: {include: []},
    docs: {
      description: {
        component: [
          "NewDocumentList is the list body inside the navbar's new-document button, " +
            'deliberately dumb: no schema reading, no permission checking, just four branches ' +
            'over the props it is handed. The branches matter because a permission problem and a ' +
            'configuration problem could easily read as the same empty screen here, and do not.',
          '',
          '|        |                                                                                                                                                                                                                                   |',
          '| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source | `packages/sanity/src/core/studio/components/navbar/new-document/NewDocumentList.tsx` (org contract: read the real thing, do not reimplement)                                                                                      |',
          '| Tier   | CHROME. The body of the "New document" popover and dialog; every author meets it every time they start a document from the navbar                                                                                                 |',
          '| Audit  | 🟢 holds. The three empty-ish states (loading, no search results, no document types) are each distinguishable, and permission denial never collapses into the "no document types" empty. See the body below for the full argument |',
          '',
          'Four returns in source order: `loading` opens a loading block; `!hasOptions && ' +
            'searchQuery` reads "No results for {searchQuery}"; `!hasOptions` alone reads "No ' +
            'document types found"; otherwise the real `CommandList` renders. `hasOptions` also ' +
            'ANDs in `!loading`, which is always true by the time either empty branch reads it ' +
            '(both come after the `loading` early return), a harmless but pointless condition, ' +
            'the same species of finding as a dead branch, just smaller.',
          '',
          "`useNewDocumentOptions` (the caller's hook) tags every declared template with " +
            '`hasPermission` but never removes the ones a person cannot create. So a person who ' +
            'may create nothing still gets a full `options` array, `hasOptions` is `true`, and ' +
            'the real list renders: every row disabled, every row wrapped in a tooltip carrying ' +
            '`InsufficientPermissionsMessage`. The empty state this component owns ("No document ' +
            'types found") is reachable only when the caller\'s `options` array is itself empty, ' +
            'which happens when the studio declares no creatable types, or every declared type ' +
            'was filtered as deprecated one level up in `NewDocumentButton`, never as a side ' +
            'effect of permissions. `AllPermissionsDenied` and `NoDocumentTypesDeclared` below ' +
            'are the same message space and genuinely different inputs; they do not collapse.',
          '',
          '> **Why it matters:** this is the shape that broke elsewhere this week ' +
            '(`PreviewReferenceValue`, `DiffFromTo`): a permission problem and a configuration ' +
            'problem reading as the same screen, so the person cannot tell whether to ask an ' +
            'administrator or ask whoever owns the schema. This component keeps that distinction, ' +
            'because the deciding work of whether to remove an option was never pushed down into ' +
            'it in the first place. The caller keeps every option and lets this component render ' +
            'the honest, disabled truth.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {name: 'default', title: 'Acme Content', schema: {name: 'default', types: []}},
    }),
  ],
  tags: [
    'autodocs',
    'chapter:navbar',
    'pattern:document-creation',
    'audit:healthy',
    'source:studio',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj

/** All four appearances, plus the permission-vs-configuration pair, stacked for comparison. */
export const ReturnMatrix: Story = {
  // Enumeration story: the docs canvas is 540px and this content is 1831px tall, so
  // 1291px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {docs: {story: {height: '1855px'}}},
  render: () => (
    <Stack gap={5} style={{maxWidth: 380}}>
      <Row label="loading" note="LoadingBlock, regardless of what options would resolve to.">
        <Harness loading />
      </Row>
      <Row
        label="no document types declared"
        note="options is empty and there is no search query. The only true configuration empty."
      >
        <Harness options={[]} searchQuery="" />
      </Row>
      <Row
        label="no search results"
        note="options is empty AND a query is present. Distinct copy, names the query."
      >
        <Harness options={[]} searchQuery="zzznope" />
      </Row>
      <Row label="all allowed" note="Every option has hasPermission: true.">
        <Harness options={allAllowed} />
      </Row>
      <Row
        label="mixed permissions"
        note="Some allowed, some not, in the same list - each row carries its own disabled state and tooltip."
      >
        <Harness options={mixedPermissions} />
      </Row>
      <Row
        label="all permissions denied (NOT the same as no document types declared)"
        note="Every option has hasPermission: false. The list still renders in full, every row disabled with a reason on hover."
      >
        <Harness options={allDenied} />
      </Row>
    </Stack>
  ),
}

/** `loading === true`: short-circuits before any options/search logic runs. */
export const Loading: Story = {
  render: () => <Harness loading />,
}

/**
 * `!hasOptions && !searchQuery`: the caller found nothing to offer at all. Reachable only when
 * the studio declares no creatable document types (or every declared type is deprecated), never
 * by a permissions problem - see `AllPermissionsDenied`.
 */
export const NoDocumentTypesDeclared: Story = {
  render: () => <Harness options={[]} searchQuery="" />,
}

/**
 * `!hasOptions && searchQuery`: options is empty because nothing matched the query, not because
 * nothing exists. The copy names the query so this cannot be mistaken for the state above.
 */
export const NoSearchResults: Story = {
  render: () => <Harness options={[]} searchQuery="zzznope" />,
}

/** Every option permitted: the ordinary path, every row an active link. */
export const AllAllowed: Story = {
  render: () => <Harness options={allAllowed} />,
}

/**
 * A realistic mix: some templates the person may create, some they may not, side by side. Each
 * row decides its own disabled state independently (`NewDocumentListOption.tsx`), so this is not
 * a distinct branch of `NewDocumentList` itself, but it is the state the permission question was
 * actually about.
 */
export const MixedPermissions: Story = {
  render: () => <Harness options={mixedPermissions} />,
}

/**
 * Every option exists and every one is forbidden. `hasOptions` is still `true` - this renders the
 * full `CommandList`, not the "no document types found" empty. Compare directly with
 * `NoDocumentTypesDeclared`: same absence of anything the person can click, two different screens,
 * because they are two different problems with two different remedies.
 */
export const AllPermissionsDenied: Story = {
  render: () => <Harness options={allDenied} />,
}
