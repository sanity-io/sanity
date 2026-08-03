import {type SanityDocument} from '@sanity/types'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type KeyboardEvent, useCallback, useState} from 'react'
import {RouterProvider} from 'sanity/router'
import {styled} from 'styled-components'

// Real components from real paths (org contract §8).
import {DocumentHeaderBreadcrumb} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/header/DocumentHeaderBreadcrumb'
import {router as structureRouter} from '../../../../packages/sanity/src/structure/router'
import {type Panes} from '../../../../packages/sanity/src/structure/structureResolvers/useResolvedPanes'
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
 * A `book` library: enough documents for a real list, one draft+published pair
 * (`book-war-and-peace`) so the edited-state indicator renders, and varied
 * `year`/`_createdAt` values so the sort menu visibly reorders.
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
    orderings: [
      {title: 'Title', name: 'titleAsc', by: [{field: 'title', direction: 'asc'}]},
      {title: 'Year', name: 'yearDesc', by: [{field: 'year', direction: 'desc'}]},
    ],
    preview: {select: {title: 'title', subtitle: 'year'}},
  },
]

const BOOK = (
  id: string,
  title: string,
  year: number,
  created: string,
  extra: Partial<SanityDocument> = {},
): SanityDocument => ({
  _id: id,
  _type: 'book',
  _rev: `rev-${id}`,
  _createdAt: created,
  _updatedAt: created,
  title,
  year,
  ...extra,
})

const fixtureDocuments: SanityDocument[] = [
  BOOK('book-war-and-peace', 'War and Peace', 1869, '2026-01-02T09:00:00Z'),
  BOOK('drafts.book-war-and-peace', 'War and Peace (annotated)', 1869, '2026-01-02T09:00:00Z', {
    _updatedAt: '2026-03-01T10:00:00Z',
    summary: 'The annotated edition, still in draft.',
  }),
  BOOK('book-persuasion', 'Persuasion', 1817, '2026-01-05T09:00:00Z'),
  BOOK('book-jane-eyre', 'Jane Eyre', 1847, '2026-01-08T09:00:00Z'),
  BOOK('book-mrs-dalloway', 'Mrs Dalloway', 1925, '2026-01-11T09:00:00Z'),
  BOOK('book-solaris', 'Solaris', 1961, '2026-01-14T09:00:00Z'),
]

const client = createStructureFixtureClient({documents: fixtureDocuments})

const resolveRootPane: StructureHarnessProps['resolveRootPane'] = (S) =>
  S.documentTypeList('book').title('Books').serialize() as unknown as PaneNode

const resolvePane: StructureHarnessProps['resolvePane'] = (S, id) =>
  S.document().id(id).documentId(id).schemaType('book').serialize() as unknown as PaneNode

const meta: Meta = {
  title: 'Document Pane/Pane Layout',
  parameters: {
    docs: {
      description: {
        component: [
          'No design system ships a master-detail pane stack. This rail is entirely the ' +
            "product's own, which is exactly why its wayfinding gaps have no upstream fix to " +
            'inherit.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/components/pane` (+ `panes/documentList`, `panes/document`). Studio-only, no design-system equivalent |',
          '| Tier | CHROME. Pane-stack navigation is chrome by the decomposition map, but the rail itself was a Carbon 🔴 Gap: no design system ships a master-detail pane stack |',
          '| Audit | 🔴 needs-work (`pane-stack-navigation`, `breadcrumbs`, `escape-hatch`, `movable-panels`) |',
          '| Patterns | `pane-stack-navigation` · `escape-hatch` · `movable-panels` |',
          '',
          'This is the sliding pane stack: the master-detail rail where clicking a list item opens ' +
            'a new pane to the right instead of replacing the page, and each pane can open the ' +
            'next.',
          '',
          "Most of the product's navigation is panes that stack sideways, not pages that swap " +
            'each other out: click a book in the list and its document pane slides in ' +
            'beside the list; click something in that pane and a third slides in after it. It is ' +
            'one of the most recognisable things about working here, and, as the Carbon audit ' +
            'found, one that no design system had a pattern for, so every pixel of the rail is ' +
            "the product's own invention.",
          '',
          'These stories mount the real structure machinery: a structure tool provider, the pane ' +
            'layout, a pane router provider per pane, and the real document-list and document ' +
            'pane components. The router is the real structure router mounted statefully, so ' +
            'clicking a list item truly navigates: a document pane opens to the right, back and ' +
            'close links work, and the pane stack re-derives from router state. Pane nodes come ' +
            'from the real structure builder, so the header sort and layout menus are the ' +
            'auto-derived ones.',
          '',
          'Audit verdicts against current code, verified in source:',
          '',
          '<details><summary><b>Breadcrumbs: a breadcrumb component exists but only renders in focus mode.</b></summary>',
          '',
          'The document panel header renders it only when the pane is maximized; in the normal ' +
            'stack each header shows only its local title. The audit finding stands.',
          '',
          '</details>',
          '',
          '<details><summary><b>Escape hatch: Escape is a no-op in the stack.</b></summary>',
          '',
          'The only global key handler in the structure tool is the save-shortcut toast. ' +
            'Addressed would be: Escape steps back one pane, closing the last group, matching the ' +
            'modal-dismiss instinct the pattern names.',
          '',
          '</details>',
          '',
          '<details><summary><b>Movable panels: partially better than the audit note suggested.</b></summary>',
          '',
          'The divider has a 9px hit area, a resize cursor, and a faint hover tint. Still no ' +
            'visible handle glyph, no keyboard resize, and panes cannot be reordered.',
          '',
          '</details>',
          '',
          'Mock seam, stated honestly: the fixture client filters by type and re-sorts by the ' +
            "query's order clause, but does not evaluate search terms; typing in the list search " +
            'returns all fixtures. Search-behaviour findings belong to other stories.',
          '',
          '> **Why it matters:** every affordance here gets built here or it does not exist. No ' +
            'breadcrumb trail outside focus mode, Escape doing nothing, a 1px divider with no ' +
            'handle, none of these have an upstream fix to inherit, because no design system ' +
            'ships this pattern at all.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      // `structureTool()` registers the desk's document surface config (changes/
      // validation inspectors, default document actions, badges) — see
      // DocumentPane.stories for the full rationale.
      config: {
        schema: {name: 'storybook-structure', types: schemaTypes},
        plugins: [structureTool()],
      },
      client,
      // delayMs 1: the preview store MUST emit async here. `useInitialValue`
      // subscribes and THEN synchronously seeds `loading: true` — a synchronous
      // success emission is overwritten and `initialValue.loading` sticks, which
      // holds `useDocumentForm`'s `ready` false and the whole form read-only.
      previewStore: createMockDocumentPreviewStore({documents: fixtureDocuments, delayMs: 1}),
    }),
  ],
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:nav',
    'chapter:layout',
    'pattern:pane-stack-navigation',
    'pattern:escape-hatch',
    'pattern:movable-panels',
    'audit:needs-work',
    'tier:chrome',
    'source:studio-only',
  ],
}

export default meta
type Story = StoryObj

/**
 * The root document-type list pane alone: real `PaneHeader` (title, create button,
 * the sort/layout context menu derived from the schema's `orderings`), the real
 * search input, and `PaneItem` previews from the seeded preview store, the
 * War and Peace row carries the edited-state (draft) indicator.
 */
export const ListPane: Story = {
  render: () => (
    <StructureHarness resolveRootPane={resolveRootPane} resolvePane={resolvePane} height={480} />
  ),
}

/**
 * The two-pane stack, LIVE: list on the left, a real `DocumentPane` on the right,
 * document header (title, context menu, split/close), the real form over the fixture
 * document, and the status bar with publish/action buttons. Click another row in the
 * list and the document pane navigates to it; the divider between panes resizes.
 */
export const ListDocumentStack: Story = {
  name: 'List → document stack (live)',
  render: () => (
    <StructureHarness
      resolveRootPane={resolveRootPane}
      resolvePane={resolvePane}
      initialPanes={[[{id: 'book-war-and-peace'}]]}
      height={640}
    />
  ),
}

/**
 * **Current (audit finding).** `pane-stack-navigation` / `breadcrumbs`: in the normal
 * (non-focus) stack, each pane header shows only its LOCAL title, "Books" | "War and
 * Peace", with the trail conveyed by adjacency alone. The breadcrumb component exists
 * in the codebase but is gated to focus/maximized mode (`DocumentPanelHeader`:
 * `isMaximizedPane && <DocumentHeaderBreadcrumb …>`). This is the real, unmodified stack.
 */
export const CurrentNoBreadcrumbTrail: Story = {
  name: 'Current (no breadcrumb in normal mode)',
  tags: ['audit:needs-work'],
  render: () => (
    <StructureHarness
      resolveRootPane={resolveRootPane}
      resolvePane={resolvePane}
      initialPanes={[[{id: 'book-persuasion'}]]}
      height={560}
    />
  ),
}

/**
 * **Recommended.** The trail, always on: this mounts the REAL `DocumentHeaderBreadcrumb`
 * (the exact component focus mode uses) in a normal-mode header slot, fed the same pane
 * data the harness renders. "Addressed" is not new UI, it is un-gating an existing
 * component: Books → *War and Peace*, each crumb a real navigation button.
 */
export const RecommendedBreadcrumbTrail: Story = {
  name: 'Recommended (breadcrumb always visible)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => <BreadcrumbDemo />,
}

/**
 * **Current (audit finding).** `movable-panels`: the divider between panes. Hover it:
 * there is a `ew-resize` cursor and a faint 9px tint, and dragging genuinely resizes.
 * But at rest it is a 1px line with no handle glyph, there is no keyboard resize, and
 * panes cannot be reordered. Three panes so both dividers render.
 */
export const CurrentDividerAffordance: Story = {
  name: 'Current (1px divider, hover-only cue)',
  tags: ['audit:needs-work'],
  render: () => (
    <StructureHarness
      resolveRootPane={resolveRootPane}
      resolvePane={resolvePane}
      initialPanes={[[{id: 'book-jane-eyre'}], [{id: 'book-solaris'}]]}
      height={560}
    />
  ),
}

/**
 * **Recommended.** A divider that declares itself: a visible center grip (the
 * standard three-dot handle) at rest, full-height highlight on hover, and a real
 * keyboard resize: focus the divider and ArrowLeft/ArrowRight move the split live
 * (`aria-valuenow` tracks it, 20-80% in 5% steps). Prop-driven illustration on
 * `@sanity/ui` primitives: the real `PaneDivider` is mouse-only (drag, no `tabIndex`,
 * no key handler, the audit gap), so the keyboard mechanics here are the demo's own,
 * showing what "addressed" behaves like rather than wrapping the real component.
 */
export const RecommendedDividerAffordance: Story = {
  name: 'Recommended (visible grip handle)',
  tags: ['!audit:needs-work', 'audit:holds'],
  parameters: {
    // Keyboard resize needs real focus + keydown delivery; the inline autodocs
    // canvas doesn't reliably deliver either (captain-reported dead grip), so
    // embed the docs canvas as the story iframe — the same view the arrow-key
    // behavior was verified in.
    docs: {story: {inline: false, height: '400px'}},
  },
  render: () => <DividerHandleDemo />,
}

// ---------------------------------------------------------------------------
// Recommended-state demos (prop-driven, per the two-variant contract §4)
// ---------------------------------------------------------------------------

/**
 * Pane data shaped the way `useResolvedPanes` emits it, feeding the REAL
 * `DocumentHeaderBreadcrumb` (only the fields its render path reads are populated).
 * Mounted under the real structure router so each crumb is a live navigation button
 * (navigation is a no-op here, there is no pane stack to re-derive), inside a
 * pane-header-shaped card standing in for the normal-mode header slot.
 */
function BreadcrumbDemo() {
  const paneDataItems = [
    {
      key: 'root',
      groupIndex: 0,
      pane: {id: 'books', type: 'list', title: 'Books'},
    },
    {
      key: 'doc',
      groupIndex: 1,
      pane: {
        id: 'book-war-and-peace',
        type: 'document',
        title: '',
        options: {id: 'book-war-and-peace', type: 'book'},
      },
    },
  ] as unknown as Panes['paneDataItems']

  return (
    <RouterProvider router={structureRouter} state={EMPTY_ROUTER_STATE} onNavigate={NOOP_NAVIGATE}>
      <Box padding={3}>
        <Card border radius={2} padding={3}>
          <Stack gap={3}>
            <DocumentHeaderBreadcrumb paneDataItems={paneDataItems} currentPaneIndex={1} />
            <Text size={1} muted>
              The real focus-mode breadcrumb component, rendered in the normal-mode header slot: the
              trail (Books → War and Peace) stays visible without maximizing.
            </Text>
          </Stack>
        </Card>
      </Box>
    </RouterProvider>
  )
}

const EMPTY_ROUTER_STATE = {}
const NOOP_NAVIGATE = () => undefined

const GripDot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--card-muted-fg-color);
  display: block;
`

const RecommendedDivider = styled(Flex)`
  width: 14px;
  cursor: ew-resize;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  &:hover,
  &:focus-visible {
    background: var(--card-badge-primary-bg-color);
    outline: none;
  }
`

const SPLIT_MIN = 20
const SPLIT_MAX = 80
const SPLIT_STEP = 5

function DividerHandleDemo() {
  const [split, setSplit] = useState(40)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const delta = event.key === 'ArrowLeft' ? -SPLIT_STEP : SPLIT_STEP
    setSplit((current) => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, current + delta)))
  }, [])

  return (
    <Flex style={{height: 320}} padding={2} gap={0}>
      <Card border radius={2} padding={4} style={{flex: `0 1 ${split}%`, minWidth: 0}}>
        <Text size={1} muted>
          Books
        </Text>
      </Card>
      <RecommendedDivider
        tabIndex={0}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panes"
        aria-valuemin={SPLIT_MIN}
        aria-valuemax={SPLIT_MAX}
        aria-valuenow={split}
        onKeyDown={handleKeyDown}
      >
        <Stack gap={1}>
          <GripDot />
          <GripDot />
          <GripDot />
        </Stack>
      </RecommendedDivider>
      <Card border radius={2} padding={4} style={{flex: '1 1 0%', minWidth: 0}}>
        <Stack gap={3}>
          <Text size={1} weight="semibold">
            War and Peace
          </Text>
          <Text size={1} muted>
            A divider with an at-rest grip handle: visible before hover, and focusable, arrow keys
            resize the split live (5% steps, 20-80%). The real `PaneDivider` owns the drag
            mechanics; keyboard resize is the affordance it is missing.
          </Text>
        </Stack>
      </Card>
    </Flex>
  )
}
