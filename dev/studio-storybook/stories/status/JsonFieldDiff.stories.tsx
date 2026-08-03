import {type ObjectSchemaType, type SchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// `@sanity/diff` is not a dependency of this storybook package, so Vite cannot resolve the bare
// specifier from here. Deep source import, the convention throughout this storybook.
import {diffInput, wrap} from '../../../../packages/@sanity/diff/src/index'
// Real component from a real path (org contract §8).
import {JsonFieldDiff} from '../../../../packages/sanity/src/core/field/diff/components/JsonFieldDiff'
import {type Diff, type ObjectDiff} from '../../../../packages/sanity/src/core/field/types'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {diffSchemaTypes, diffStudioConfig} from '../../lib/diffHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Real diffs ────────────────────────────────────────────────────────────
   Same discipline as the rest of the diff pages: `@sanity/diff` exports the same
   `diffInput(wrap(from), wrap(to))` the studio calls, so each story supplies two documents and
   the differ decides `action`, `fromValue` and `toValue`. Nothing here is a hand-written literal.

   `tags` is used as the carrier field because it is an array, which is the shape most likely to
   reach this renderer in the wild: an array of a type the running schema no longer declares. */

const AUTHOR = 'ada'

function fieldDiff(from: Record<string, unknown>, to: Record<string, unknown>): Diff | undefined {
  const root = diffInput(
    wrap({_type: 'article', ...from}, {author: AUTHOR}),
    wrap({_type: 'article', ...to}, {author: AUTHOR}),
  ) as ObjectDiff
  return root.fields.tags
}

const CASES = {
  changed: {from: {tags: ['fiction', 'essays']}, to: {tags: ['fiction', 'criticism']}},
  added: {from: {}, to: {tags: ['fiction', 'essays']}},
  removed: {from: {tags: ['fiction', 'essays']}, to: {}},
  unchanged: {from: {tags: ['fiction']}, to: {tags: ['fiction']}},
} as const

function Harness({from, to}: {from: Record<string, unknown>; to: Record<string, unknown>}) {
  const schema = useSchema()
  const articleType = schema.get('article') as ObjectSchemaType
  const tagsType = articleType?.fields.find((f) => f.name === 'tags')?.type as SchemaType
  const diff = fieldDiff(from, to)

  if (!diff || !tagsType) {
    return (
      <Card border padding={3} radius={0} tone="caution">
        <Text size={1}>
          The differ produced no change for this field, so the change list would never dispatch to
          JsonFieldDiff at all. That absence is the answer for this pair.
        </Text>
      </Card>
    )
  }

  return (
    <Card border padding={3} radius={0} style={{maxWidth: 560}}>
      <JsonFieldDiff diff={diff as never} schemaType={tagsType as never} />
    </Card>
  )
}

function Row({
  label,
  note,
  ...rest
}: {
  label: string
  note: string
  from: Record<string, unknown>
  to: Record<string, unknown>
}) {
  return (
    <Stack gap={2}>
      <Text size={1} weight="semibold">
        {label}
      </Text>
      <Text muted size={1}>
        {note}
      </Text>
      <Harness {...rest} />
    </Stack>
  )
}

const meta: Meta = {
  title: 'Lists & Data/JsonFieldDiff',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'This is the renderer a person meets when someone changed the schema and a field is no ' +
            'longer recognised: raw JSON, before and after, under a caution card, with no way to ' +
            'tell an addition from a removal except colour and strikethrough.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/field/diff/components/JsonFieldDiff.tsx` |',
          '| Tier | SERVICE. The fallback renderer in Review Changes, reached when a changed field has no schema type the studio recognises |',
          '| Audit | 🟡 needs-work (`change-visibility`, `error-recovery`). The warning it carries is unconditional, and one reachable state shows the warning with nothing underneath it |',
          '| Patterns | `change-visibility` · `error-recovery` |',
          '',
          'What Review Changes shows when it cannot identify the field: raw JSON, before and after, under a caution card explaining why the field is showing as JSON.',
          '',
          'Nothing is hand-authored: `@sanity/diff` produces the real diff from two documents, exactly as `lib/diffHarness.tsx` argues it should.',
          '',
          '**What reading it turned up.**',
          '',
          '<details>',
          '<summary><b>The caution card is unconditional.</b></summary>',
          '',
          'It sits outside every branch, so it renders whatever the diff says, including for a field where nothing meaningful changed. That is arguably right for this component (the point is "this field is not in the schema") and it does mean the warning is furniture rather than a signal.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>There is no `unchanged` branch at all.</b></summary>',
          '',
          '`DiffFromTo`, which does the same job for known types, opens with `if (action === "unchanged")` and returns a plain card. This one has no such check: an unchanged field renders as a from/to pair with a down arrow between two identical blocks of JSON.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>`content` can be `null`.</b></summary>',
          '',
          'When neither `fromValue` nor `toValue` survives its guard, the component returns the caution card and nothing else: a warning about a field, with no field shown.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>`jsonify` has a dead branch.</b></summary>',
          '',
          'It opens `if (typeof value === "undefined") return "undefined"`, but both call sites sit inside guards that have already excluded `undefined`. The string `"undefined"` can never be printed.',
          '',
          '</details>',
          '',
          '> **Why it matters:** this is the moment someone most needs to know what happened to their content, and what they get is unlabelled JSON under a warning that appears whether or not anything meaningful changed.',
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
    'pattern:error-recovery',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** Every outcome in one column, with the caution card repeating in all of them. */
export const OutcomeMatrix: Story = {
  // Enumeration story: the docs canvas is 540px and this content is 1051px tall, so
  // 511px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {docs: {story: {height: '1075px'}}},
  render: () => (
    <Stack gap={5} style={{maxWidth: 620}}>
      <Row
        label="Changed"
        note="Both values present: two JSON blocks stacked with a down arrow between them."
        {...CASES.changed}
      />
      <Row
        label="Added"
        note="No fromValue. One ins card. The verb lives only in the tooltip."
        {...CASES.added}
      />
      <Row
        label="Removed"
        note="No toValue. One del card, distinguished from Added by styling alone."
        {...CASES.removed}
      />
      <Row
        label="Unchanged"
        note="No branch handles this. DiffFromTo returns a plain card here; this one does not check."
        {...CASES.unchanged}
      />
    </Stack>
  ),
}

/** Both values present. Two JSON blocks, a down arrow, one tooltip. */
export const Changed: Story = {
  render: () => <Harness {...CASES.changed} />,
}

/** The field did not exist before. */
export const Added: Story = {
  render: () => <Harness {...CASES.added} />,
}

/**
 * The field existed and does not now. Compare with `Added`: the only thing separating them on
 * the canvas is the `del` styling and the annotation colour.
 */
export const Removed: Story = {
  render: () => <Harness {...CASES.removed} />,
}

/**
 * Identical documents.
 *
 * `DiffFromTo` opens with `if (action === 'unchanged')` and returns a plain card. This component
 * has no equivalent check, which is the clearest difference between the two renderers doing the
 * same job for known and unknown types.
 */
export const Unchanged: Story = {
  render: () => <Harness {...CASES.unchanged} />,
}
