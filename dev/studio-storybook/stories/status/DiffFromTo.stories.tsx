import {type ObjectSchemaType, type StringSchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// `@sanity/diff` is not a dependency of this storybook package, so Vite cannot resolve the bare
// specifier from here. Deep source import, the convention throughout this storybook.
import {diffInput, wrap} from '../../../../packages/@sanity/diff/src/index'
// Real components from real paths (org contract §8).
import {DiffFromTo} from '../../../../packages/sanity/src/core/field/diff/components/DiffFromTo'
import {type Diff, type ObjectDiff} from '../../../../packages/sanity/src/core/field/types'
import {StringPreview} from '../../../../packages/sanity/src/core/field/types/string/preview/StringPreview'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {diffSchemaTypes, diffStudioConfig} from '../../lib/diffHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Real diffs, not fabricated ones ───────────────────────────────────────
   `lib/diffHarness.tsx` makes the case and it applies here too: `@sanity/diff` exports the same
   `diffInput(wrap(from), wrap(to))` the studio itself calls, so two plain documents produce the
   real diff tree with real annotations. Hand-writing a `Diff` literal would satisfy the type and
   prove nothing, because the interesting part is what the differ decides `action`, `fromValue`
   and `toValue` should be. Every story below varies the two DOCUMENTS and lets the differ answer.

   `DiffFromTo` is one level below the change list, so these reach in and take the single field
   diff rather than rendering the whole panel. That is the point of the page: the component has
   four distinct outcomes and the panel only ever shows you one at a time. */

const AUTHOR = 'ada'

function fieldDiff(from: Record<string, unknown>, to: Record<string, unknown>): Diff | undefined {
  const root = diffInput(
    wrap({_type: 'article', ...from}, {author: AUTHOR}),
    wrap({_type: 'article', ...to}, {author: AUTHOR}),
  ) as ObjectDiff
  return root.fields.title
}

/** The four documents pairs, each landing on a different return in the component. */
const CASES = {
  unchanged: {
    from: {title: 'The Garden of Forking Paths'},
    to: {title: 'The Garden of Forking Paths'},
  },
  changed: {
    from: {title: 'The Garden of Forking Paths'},
    to: {title: 'The Garden of Forking Trails'},
  },
  added: {from: {}, to: {title: 'The Garden of Forking Paths'}},
  removed: {from: {title: 'The Garden of Forking Paths'}, to: {}},
} as const

function Harness({
  from,
  to,
  layout,
}: {
  from: Record<string, unknown>
  to: Record<string, unknown>
  layout?: 'grid' | 'inline'
}) {
  const schema = useSchema()
  const articleType = schema.get('article') as ObjectSchemaType
  const titleType = articleType?.fields.find((f) => f.name === 'title')?.type as StringSchemaType
  const diff = fieldDiff(from, to)

  if (!diff || !titleType) {
    return (
      <Card border padding={3} radius={0} tone="caution">
        <Text size={1}>
          The differ produced no change for this field, so there is nothing for DiffFromTo to
          render. That is itself the answer for this pair.
        </Text>
      </Card>
    )
  }

  return (
    <Card border padding={3} radius={0} style={{maxWidth: 560}}>
      <DiffFromTo
        diff={diff}
        layout={layout}
        path="title"
        previewComponent={StringPreview}
        schemaType={titleType}
      />
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
  title: 'Lists & Data/DiffFromTo',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'The verb that tells a reader whether something was added, removed, or changed lives ' +
            'only in the tooltip. On the canvas the difference between an addition and a removal ' +
            'is carried entirely by strikethrough styling and colour, the one signal that does ' +
            'not survive being printed, screenshotted into a ticket, or read by someone with a ' +
            'colour-vision deficiency.',
          '',
          '|          |                                                                                                                                              |',
          '| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/core/field/diff/components/DiffFromTo.tsx`                                                                              |',
          '| Tier     | CORE. The atom of the Review Changes panel; every field-level change a person reads goes through it                                          |',
          '| Audit    | 🟡 needs-work (`change-visibility`). The from/to pair carries its meaning in a tooltip, and one reachable combination renders an empty frame |',
          '| Patterns | `change-visibility`                                                                                                                          |',
          '',
          'One field, before and after. It decides whether a reader sees a value, a ' +
            'strikethrough, an insertion, or both side by side.',
          '',
          'Nothing here is hand-authored. `@sanity/diff` exports the same ' +
            '`diffInput(wrap(from), wrap(to))` the studio itself calls, so each story supplies ' +
            'two plain documents and the real differ decides `action`, `fromValue`, and ' +
            '`toValue`. A fabricated `Diff` literal would satisfy the type and skip the only ' +
            'interesting part.',
          '',
          '**What reading it turned up.** The component has four outcomes and reaches them ' +
            'through two `&&` expressions rather than four branches:',
          '',
          '- `action === "unchanged"` returns a bare `DiffCard` with no tooltip at all, so an ' +
            'unchanged field is the one case with no attribution.',
          '- `from && !to` is a removal: a `del` card alone.',
          '- `!from && to` is an addition: an `ins` card alone.',
          '- both present falls through to `FromTo`, the side-by-side pair.',
          '',
          '`from` and `to` are each guarded by `diff.fromValue !== undefined && diff.fromValue ' +
            '!== null`, which means a changed diff whose values are both null renders `<FromTo ' +
            'from={false} to={false} />`: a tooltip wrapper around an empty frame. It is ' +
            'reachable whenever a field is cleared from one nullish value to another.',
          '',
          '> **Why it matters:** the verb that tells a reader whether something was added, ' +
            'removed, or changed lives only in the tooltip (`useChangeVerb`), so on the canvas ' +
            'alone, an addition and a removal are indistinguishable except by strikethrough and ' +
            'colour.',
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
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/** All four outcomes in one column. The panel only ever shows one at a time. */
export const OutcomeMatrix: Story = {
  render: () => (
    <Stack gap={5} style={{maxWidth: 620}}>
      <Row
        label="Unchanged"
        note="A bare DiffCard. The only outcome with no tooltip, so the only one with no attribution."
        {...CASES.unchanged}
      />
      <Row
        label="Changed"
        note="Both values present, so it falls through to FromTo: old and new side by side."
        {...CASES.changed}
      />
      <Row
        label="Added"
        note="No fromValue. An ins card alone, with the verb only in the tooltip."
        {...CASES.added}
      />
      <Row
        label="Removed"
        note="No toValue. A del card alone. Distinguished from Added by strikethrough and colour, and by nothing else on the canvas."
        {...CASES.removed}
      />
    </Stack>
  ),
}

/** `action === 'unchanged'`: a plain card, no tooltip, no attribution. */
export const Unchanged: Story = {
  render: () => <Harness {...CASES.unchanged} />,
}

/** Both values present. The side-by-side pair, which is what most people picture as a diff. */
export const Changed: Story = {
  render: () => <Harness {...CASES.changed} />,
}

/** The field did not exist before. */
export const Added: Story = {
  render: () => <Harness {...CASES.added} />,
}

/**
 * The field existed and does not now.
 *
 * Put this next to `Added`. On the canvas the two differ by strikethrough and by annotation
 * colour; the words "added" and "removed" appear only on hover.
 */
export const Removed: Story = {
  render: () => <Harness {...CASES.removed} />,
}

/**
 * The same changed diff in `grid` layout.
 *
 * Grid is the non-default: `DiffFromTo` passes `layout` straight through and `FromTo` defaults it
 * to `'inline'`, so a `DiffFromTo` with no `layout` prop is already inline. The first version of
 * this story passed `layout="inline"` and rendered markup byte-identical to `Changed`, which is
 * what a contrast story looks like when there is no contrast.
 */
export const GridLayout: Story = {
  render: () => <Harness {...CASES.changed} layout="grid" />,
}
