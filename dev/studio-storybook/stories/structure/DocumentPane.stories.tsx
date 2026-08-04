import {type SanityDocument} from '@sanity/types'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {structureTool} from '../../../../packages/sanity/src/structure/structureTool'
import {type PaneNode} from '../../../../packages/sanity/src/structure/types'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {
  createStructureFixtureClient,
  StructureHarness,
  type StructureHarnessProps,
} from '../../lib/structureHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Three lifecycle states of the same schema:
 * - `book-anna-karenina` — draft OVER published (the "edited" pair)
 * - `book-persuasion` — published only (clean)
 * - `drafts.book-untitled` — draft only, missing its required `title`
 *   (real validation marker → publish-blocking state)
 */
const schemaTypes = [
  {
    name: 'book',
    title: 'Book',
    type: 'document',
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
        validation: (rule: {required: () => unknown}) => rule.required(),
      },
      {name: 'year', title: 'Year', type: 'number'},
      {name: 'summary', title: 'Summary', type: 'text'},
    ],
    preview: {select: {title: 'title', subtitle: 'year'}},
  },
]

const fixtureDocuments: SanityDocument[] = [
  {
    _id: 'book-anna-karenina',
    _type: 'book',
    _rev: 'rev-anna-1',
    _createdAt: '2026-01-03T09:00:00Z',
    _updatedAt: '2026-01-03T09:00:00Z',
    title: 'Anna Karenina',
    year: 1877,
  },
  {
    _id: 'drafts.book-anna-karenina',
    _type: 'book',
    _rev: 'rev-anna-draft-2',
    _createdAt: '2026-01-03T09:00:00Z',
    _updatedAt: '2026-03-04T15:00:00Z',
    title: 'Anna Karenina',
    year: 1877,
    summary: 'A draft revision awaiting publish, the edited pair state.',
  },
  {
    _id: 'book-persuasion',
    _type: 'book',
    _rev: 'rev-persuasion-1',
    _createdAt: '2026-01-05T09:00:00Z',
    _updatedAt: '2026-01-05T09:00:00Z',
    title: 'Persuasion',
    year: 1817,
  },
  {
    _id: 'drafts.book-untitled',
    _type: 'book',
    _rev: 'rev-untitled-1',
    _createdAt: '2026-02-01T09:00:00Z',
    _updatedAt: '2026-02-01T09:00:00Z',
    year: 2026,
  },
]

const client = createStructureFixtureClient({documents: fixtureDocuments})

const documentPane =
  (documentId: string): StructureHarnessProps['resolveRootPane'] =>
  (S) =>
    S.document()
      .id(documentId)
      .documentId(documentId)
      .schemaType('book')
      .serialize() as unknown as PaneNode

// Child panes are not part of these single-pane stories, but the REAL pane can
// legitimately push one (e.g. `handleEditReference`); resolve any such id as a
// book document pane instead of crashing into the story's error boundary.
const resolveChildPane: StructureHarnessProps['resolvePane'] = (S, id) =>
  S.document().id(id).documentId(id).schemaType('book').serialize() as unknown as PaneNode

const meta: Meta = {
  title: 'Document Pane/Document Pane',
  parameters: {
    docs: {
      description: {
        component: [
          'Open any document in the product and this is the surface in front of everyone: the ' +
            'form filled in, the title renamed, the tabs switched between, the button pressed to ' +
            'publish. It is the single component that walks the schema, builds a value tree from ' +
            'it, and turns every keystroke into a patch.',
          '',
          '|          |                                                                                                        |',
          '| -------- | ------------------------------------------------------------------------------------------------------ |',
          '| Source   | `packages/sanity/src/structure/panes/document` (Studio-only, no design-system equivalent)              |',
          '| Tier     | CORE. The host of the editing engine: schema walk, value tree, patch write, plus the publish lifecycle |',
          '| Audit    | 🔴 needs-work (`draft-publish-lifecycle`, `similarity`)                                                |',
          '| Patterns | `draft-publish-lifecycle` · `schema-driven-forms`                                                      |',
          '',
          'This is where the actual work happens: the document editor itself, the whole ' +
            'right-hand surface a person lands in when they open one document, its header, the ' +
            'schema-driven form, the view tabs, and the publish and status bar along the bottom.',
          '',
          'The real editor is mounted here, not a header or status bar in isolation, over a ' +
            'real document store. The pair machinery runs for real, snapshots served from ' +
            'fixtures, a listener held open on a mock welcome event, grants come from a fixture ' +
            'access list, and edits type into the real local-first patch pipeline, nothing ' +
            "persists, mutations land in the mock client's own transaction log. The document " +
            'header, context menu, view tabs, the form, and the status bar, publish button, ' +
            'action menu, status line, are all live.',
          '',
          'The events feed is served empty, a shaped response, so the pane renders its real "no ' +
            'events" state rather than a network error. Revision and event list contents are out ' +
            'of scope for this harness tier.',
          '',
          '> **Why it matters:** lifecycle state, draft, published, edited, is carried by ' +
            'color-only status dots of identical shape and size, and a version or variant chip ' +
            'can surface before any version exists. This is the core surface every editor lives ' +
            'in, so those two findings do not touch one screen. They touch every document in the ' +
            'product.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      // `structureTool()` is what registers the desk's document surface config —
      // the changes/validation/incoming-refs INSPECTORS (Review changes no-ops
      // without the history inspector), the default document ACTIONS (publish et
      // al in the status bar), and badges. The real desk always runs with it.
      config: {
        schema: {name: 'storybook-structure', types: schemaTypes},
        plugins: [structureTool()],
      },
      client,
      // delayMs 1: async preview-store emissions — `useInitialValue` seeds
      // `loading: true` synchronously AFTER subscribing, so a sync success
      // emission is lost and the form sticks read-only (see PaneLayout.stories).
      previewStore: createMockDocumentPreviewStore({documents: fixtureDocuments, delayMs: 1}),
    }),
  ],
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:draft-publish-lifecycle',
    'pattern:schema-driven-forms',
    'audit:needs-work',
    'tier:core',
    'source:studio-only',
  ],
}

export default meta
type Story = StoryObj

/**
 * Draft over published: the edited pair. The status bar reports the draft's edit
 * time; the publish action is live (it will "publish" into the mock transaction log).
 * Type into the form, patches run through the real local-first pipeline.
 */
export const EditedDraft: Story = {
  name: 'Edited (draft over published)',
  render: () => (
    <StructureHarness
      resolveRootPane={documentPane('book-anna-karenina')}
      resolvePane={resolveChildPane}
      height={640}
    />
  ),
}

/** Published only: the clean state, no pending draft, publish reflects "up to date". */
export const PublishedOnly: Story = {
  name: 'Published (no draft)',
  render: () => (
    <StructureHarness
      resolveRootPane={documentPane('book-persuasion')}
      resolvePane={resolveChildPane}
      height={640}
    />
  ),
}

/**
 * A draft missing its required `title`: real `validateDocument` output flows into the
 * form (field-level error) and the status surface. The publish path is the one place
 * the audit found validation surfaces at all (`inline-validation-timing` lives in the
 * form stories; here it manifests as the publish-blocking state).
 */
export const ValidationBlocked: Story = {
  name: 'Validation (missing required title)',
  render: () => (
    <StructureHarness
      resolveRootPane={documentPane('book-untitled')}
      resolvePane={resolveChildPane}
      height={640}
    />
  ),
}
