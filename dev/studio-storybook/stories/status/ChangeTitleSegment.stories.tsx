import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from a real path (org contract §8).
import {ChangeTitleSegment} from '../../../../packages/sanity/src/core/field/diff/components/ChangeTitleSegment'
import {type Annotation, type FromToIndex} from '../../../../packages/sanity/src/core/field/types'
import {diffSchemaTypes, diffStudioConfig} from '../../lib/diffHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── The inputs ────────────────────────────────────────────────────────────
   `ChangeTitleSegment` takes plain props and no context beyond i18n and the annotation colour
   manager, so the fixtures here are literally its arguments. A `ChangeTitlePath` is a list of
   these: string segments for field names, `FromToIndex` segments for array positions, which is
   why the breadcrumb over an array change reads "Tags › #3 ↓1". */

const annotation: Annotation = {
  author: 'ada',
  timestamp: '2026-07-27T08:00:00.000Z',
}

const seg = (over: Partial<FromToIndex>): FromToIndex => ({hasMoved: false, ...over})

const CASES: {id: string; label: string; note: string; segment: string | FromToIndex}[] = [
  {
    id: 'field',
    label: 'String segment',
    note: 'A field name in the breadcrumb. The only branch that is not about an array position, and the only one with no annotation, no card and no tooltip.',
    segment: 'Tags',
  },
  {
    id: 'created',
    label: 'Created, annotated',
    note: 'No fromIndex, so the item is new. An ins card in the author colour, with the position in the tooltip.',
    segment: seg({toIndex: 2, annotation}),
  },
  {
    id: 'created-bare',
    label: 'Created, no annotation',
    note: 'Same situation, no annotation available. Falls back to plain text: no card, no tooltip, no indication that this item is new.',
    segment: seg({toIndex: 2}),
  },
  {
    id: 'deleted',
    label: 'Deleted, annotated',
    note: 'No toIndex. A del card with strikethrough.',
    segment: seg({fromIndex: 1, annotation}),
  },
  {
    id: 'deleted-bare',
    label: 'Deleted, no annotation',
    note: 'Compare with "Created, no annotation". This one still gets a card, because it passes `annotation || null` rather than falling back to bare text.',
    segment: seg({fromIndex: 1}),
  },
  {
    id: 'moved-up',
    label: 'Moved up',
    note: 'Position plus a direction glyph. "#2 ↑2" is the entire visible content; which way and how far is only legible if you already know the convention.',
    segment: seg({hasMoved: true, fromIndex: 3, toIndex: 1, annotation}),
  },
  {
    id: 'moved-down',
    label: 'Moved down',
    note: 'Same shape, opposite direction.',
    segment: seg({hasMoved: true, fromIndex: 0, toIndex: 2, annotation}),
  },
  {
    id: 'unchanged',
    label: 'Present, unmoved',
    note: 'The final fallback: a bare position number. Reached when an item exists on both sides and did not move.',
    segment: seg({fromIndex: 2, toIndex: 2}),
  },
]

function Harness({segment}: {segment: string | FromToIndex}) {
  return (
    <Card border padding={2} radius={0} style={{maxWidth: 320}}>
      <Flex align="center" gap={2}>
        <ChangeTitleSegment segment={segment} />
      </Flex>
    </Card>
  )
}

/** A realistic breadcrumb: what the change list actually puts above an array item change. */
function Breadcrumb() {
  return (
    <Card border padding={2} radius={0} style={{maxWidth: 420}}>
      <Flex align="center" gap={2}>
        <ChangeTitleSegment segment="Tags" />
        <Text muted size={1}>
          ›
        </Text>
        <ChangeTitleSegment segment={seg({hasMoved: true, fromIndex: 3, toIndex: 1, annotation})} />
      </Flex>
    </Card>
  )
}

const meta: Meta = {
  title: 'Lists & Data/ChangeTitleSegment',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Two identical absences are treated differently: a newly created item with no ' +
            'annotation falls back to bare text, while a deleted item in the same situation still ' +
            'gets a full card. And the moved case carries its whole meaning, direction and ' +
            'distance, in a tooltip most people will never hover.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/field/diff/components/ChangeTitleSegment.tsx` |',
          '| Tier | SERVICE. One crumb of the breadcrumb above every change in Review Changes |',
          '| Audit | 🟡 needs-work (`change-visibility`). Two identical absences are treated differently, and the moved case carries its whole meaning in a tooltip |',
          '| Patterns | `change-visibility` |',
          '',
          'One segment of the path over a change. A field name, or an array position with what happened to it.',
          '',
          "Plain props and no context beyond i18n and the annotation colour manager, so the fixtures here are literally the component's arguments.",
          '',
          '**What reading it turned up.**',
          '',
          '<details>',
          '<summary><b>Created and deleted treat a missing annotation differently.</b></summary>',
          '',
          '`CreatedTitleSegment` checks `if (annotation)` and falls back to bare `<Text>` when there is none: no card, no tooltip, and therefore no indication that the item is new. `DeletedTitleSegment` passes `annotation || null` straight into `DiffCard` and always renders the card. Same absence, two answers. Compare the two "no annotation" stories below.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>A moved item shows "#2 ↑2" and nothing else.</b></summary>',
          '',
          'The direction is a glyph and the distance is a bare number; the sentence that explains them (`changes.array.item-moved`) is in the tooltip. It is the third component in this subsystem where the verb lives only on hover.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>The moved branch re-checks what the guards proved.</b></summary>',
          '',
          'It reads `if (hasMoved && typeof toIndex !== "undefined" && typeof fromIndex !== "undefined")`, but `created` (fromIndex undefined) and `deleted` (toIndex undefined) have both already returned above it. Neither check can fail.',
          '',
          '</details>',
          '',
          '> **Why it matters:** this is the fourth instance of the same shape in `core/field` and `core/form`: a guard re-testing a condition its own earlier returns already established (ledger 69, 75, and now this). Individually each is harmless. Together they say the subsystem does not trust its own control flow, usually a sign the branches were added one at a time by different hands.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {...diffStudioConfig, schema: {name: 'storybook', types: diffSchemaTypes}},
    }),
  ],
  tags: [
    'autodocs',
    'chapter:data',
    'pattern:change-visibility',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** Every branch, with the two "no annotation" cases adjacent so the asymmetry is visible. */
export const SegmentMatrix: Story = {
  // Enumeration story: the docs canvas is 540px and this content is 811px tall, so
  // 271px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {docs: {story: {height: '835px'}}},
  render: () => (
    <Stack gap={4} style={{maxWidth: 620}}>
      {CASES.map((c) => (
        <Stack key={c.id} gap={2}>
          <Text size={1} weight="semibold">
            {c.label}
          </Text>
          <Text muted size={1}>
            {c.note}
          </Text>
          <Harness segment={c.segment} />
        </Stack>
      ))}
    </Stack>
  ),
}

/** A field name. No card, no annotation, no tooltip. */
export const StringSegment: Story = {
  render: () => <Harness segment="Tags" />,
}

/** A new array item, with an annotation. */
export const Created: Story = {
  render: () => <Harness segment={seg({toIndex: 2, annotation})} />,
}

/**
 * The same new item with no annotation available.
 *
 * Falls back to plain text, so nothing on screen says the item is new. Put it beside
 * `DeletedWithoutAnnotation`, which keeps its card in the same situation.
 */
export const CreatedWithoutAnnotation: Story = {
  render: () => <Harness segment={seg({toIndex: 2})} />,
}

/** A removed array item. */
export const Deleted: Story = {
  render: () => <Harness segment={seg({fromIndex: 1, annotation})} />,
}

/**
 * The same removal with no annotation. Still a card, because this branch passes
 * `annotation || null` instead of falling back to text. The asymmetry with `Created` is the
 * finding on this page.
 */
export const DeletedWithoutAnnotation: Story = {
  render: () => <Harness segment={seg({fromIndex: 1})} />,
}

/** Moved from position 4 to position 2. The visible content is "#2 ↑2". */
export const MovedUp: Story = {
  render: () => <Harness segment={seg({hasMoved: true, fromIndex: 3, toIndex: 1, annotation})} />,
}

/** Moved from position 1 to position 3. */
export const MovedDown: Story = {
  render: () => <Harness segment={seg({hasMoved: true, fromIndex: 0, toIndex: 2, annotation})} />,
}

/** Present on both sides, unmoved. The final fallback: a bare position. */
export const Unmoved: Story = {
  render: () => <Harness segment={seg({fromIndex: 2, toIndex: 2})} />,
}

/** How it is actually used: several segments in a row, above one change. */
export const InABreadcrumb: Story = {
  render: () => <Breadcrumb />,
}
