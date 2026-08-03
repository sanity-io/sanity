import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useMemo} from 'react'
import {DocumentChangeContext} from 'sanity/_singletons'

// `@sanity/diff` is not a dependency of this storybook package, so Vite cannot resolve the bare
// specifier from here. Deep source import, the convention throughout this storybook.
import {diffInput, wrap} from '../../../../packages/@sanity/diff/src/index'
// Real components from real paths (org contract §8). `buildObjectChangeList` is the same
// builder `ChangeList` calls, so the `ChangeNode`s below are the product of the real pipeline,
// not hand-built literals - the only way to get a genuine `type: 'group'` vs `type: 'field'`
// discriminant is to let the real builder decide it.
import {buildObjectChangeList} from '../../../../packages/sanity/src/core/field/diff/changes/buildChangeList'
import {ChangeResolver} from '../../../../packages/sanity/src/core/field/diff/components/ChangeResolver'
import {type ChangeNode, type ObjectDiff} from '../../../../packages/sanity/src/core/field/types'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {DiffStage, diffSchemaTypes, diffStudioConfig} from '../../lib/diffHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── The schema ───────────────────────────────────────────────────────────
   `diffSchemaTypes`'s `article` has no field configured `hidden`, and the hidden branch is one
   of `ChangeResolver`'s four returns, so one field is added here rather than touching the shared
   harness. Everything else is the shared `article`/`seo` pair every sibling diff page uses. */

const articleType = diffSchemaTypes.find((t) => t.name === 'article')!
const articleWithHiddenField = {
  ...articleType,
  fields: [
    ...articleType.fields,
    // Static `hidden: true`, the simplest case `useConditionalProperty` can resolve. Real
    // Studio schemas use this for internal-only fields that should never surface in Review
    // Changes even though they are tracked and diffed like any other field.
    {name: 'internalNotes', title: 'Internal notes', type: 'string', hidden: true},
  ],
}
const schemaTypes = [...diffSchemaTypes.filter((t) => t.name !== 'article'), articleWithHiddenField]

const AUTHOR = 'ada'

function rootDiff(from: Record<string, unknown>, to: Record<string, unknown>): ObjectDiff {
  return diffInput(
    wrap({_type: 'article', ...from}, {author: AUTHOR}),
    wrap({_type: 'article', ...to}, {author: AUTHOR}),
  ) as ObjectDiff
}

const noopWrapper = (props: {children: ReactNode}) => props.children

/**
 * Builds a real `ChangeNode[]` from two documents (via `buildObjectChangeList`, the same
 * function `ChangeList` calls) and provides the `DocumentChangeContext` every downstream
 * component in this subsystem reads. Exposes the list through a render prop so individual
 * stories can pull out ONE node and hand it to a bare `<ChangeResolver>` - the same "mount the
 * dispatcher directly" approach `DiffFromTo`/`JsonFieldDiff` use for their own components.
 */
function ChangeNodeStage({
  from,
  to,
  render,
}: {
  from: Record<string, unknown>
  to: Record<string, unknown>
  render: (changes: ChangeNode[]) => ReactNode
}) {
  const schema = useSchema()
  const schemaType = schema.get('article') as ObjectSchemaType
  const diff = useMemo(() => rootDiff(from, to), [from, to])
  const changes = useMemo(
    () => buildObjectChangeList(schemaType, diff, [], [], {}),
    [schemaType, diff],
  )

  return (
    <DocumentChangeContext.Provider
      value={{
        documentId: 'doc-1',
        schemaType,
        rootDiff: diff,
        isComparingCurrent: false,
        FieldWrapper: noopWrapper as never,
        value: {_type: 'article', ...to} as Partial<SanityDocument>,
        showFromValue: true,
      }}
    >
      {render(changes)}
    </DocumentChangeContext.Provider>
  )
}

/** Each pair below is built so the root change list resolves to exactly ONE node at `changes[0]`
 * - either a lone `FieldChangeNode` or, for the seo pair, the single `GroupChangeNode` that wraps
 * its two changed children - so the story is unambiguous about which node `ChangeResolver` sees. */
const CASES = {
  field: {from: {title: 'The Golden Notebook'}, to: {title: 'The Waves'}},
  group: {
    from: {seo: {_type: 'seo', metaTitle: 'The Golden Notebook - overview', noIndex: false}},
    to: {seo: {_type: 'seo', metaTitle: 'The Waves - a reading guide', noIndex: true}},
  },
  hidden: {from: {internalNotes: 'first pass'}, to: {internalNotes: 'second pass, ready'}},
  // `legacyRating` is not declared anywhere on `article`. This is the one condition under which
  // the builder reaches `buildUnknownFieldChangeNodes` (see the docblock finding below).
  unknownField: {from: {legacyRating: 4}, to: {legacyRating: 5}},
} as const

function ResolverHarness({from, to}: {from: Record<string, unknown>; to: Record<string, unknown>}) {
  return (
    <ChangeNodeStage
      from={from}
      to={to}
      render={(changes) => {
        const change = changes[0]
        if (!change) {
          return (
            <Card border padding={3} radius={0} tone="caution" style={{maxWidth: 480}}>
              <Text size={1}>
                The differ produced no change for this pair, so `ChangeResolver` is never called at
                all. That absence is the answer for this pair.
              </Text>
            </Card>
          )
        }
        return (
          <Card border padding={3} radius={0} style={{maxWidth: 480}}>
            <ChangeResolver change={change} />
          </Card>
        )
      }}
    />
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
      <ResolverHarness {...rest} />
    </Stack>
  )
}

const meta: Meta = {
  title: 'Lists & Data/ChangeResolver',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Every entry in Review Changes passes through this dispatcher before anything decides ' +
            'how to draw it, so a dispatcher this central inherits every gap of everything beneath ' +
            'it. One of those gaps is live: a documented, ordinary visibility pattern silently ' +
            'breaks the moment a field reaches this component.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/field/diff/components/ChangeResolver.tsx` |',
          '| Tier | CORE. `ChangeList` and `GroupChange` are its only two callers, and both feed it real, resolved `ChangeNode`s off the same builder |',
          '| Audit | 🔴 needs-work (`error-recovery`, `type-dispatch`). A real conditional-property capability is silently dropped for every change in this subsystem, and the "unknown change type" branch cannot be reached by the pipeline that is its only supplier |',
          '| Patterns | `error-recovery` · `type-dispatch` |',
          '',
          'Not a change renderer itself. Given one `ChangeNode`, it decides whether the visibility conditions hide it, then routes what survives to `FieldChange` (a leaf change) or `GroupChange` (a nested set of changes).',
          '',
          'Four returns, quoted from the file:',
          '',
          '```tsx',
          'if (isHidden) return null',
          '',
          "if (change.type === 'field') {",
          '  return <FieldChange change={change} readOnly={isReadOnly} addParentWrapper={props.addParentWrapper} />',
          '}',
          '',
          "if (change.type === 'group') {",
          '  return <GroupChange change={change} data-testid={`group-change-${change.fieldsetName}`} readOnly={isReadOnly} />',
          '}',
          '',
          'return (',
          '  <Text>',
          "    Unknown change type: <code>{(change as any).type || 'undefined'}</code>",
          '  </Text>',
          ')',
          '```',
          '',
          'Every story below is built from real documents through `buildObjectChangeList` (the exact function `ChangeList` calls), so the `ChangeNode` handed to `ChangeResolver` in each one is the real product of a real diff, never a hand-built literal.',
          '',
          '**What reading it turned up.**',
          '',
          '<details>',
          '<summary><b>`parent` is never supplied to either conditional-property check, and this is a real, live gap, not a theoretical one.</b></summary>',
          '',
          'Both `useConditionalProperty` calls (lines 24-40) carry the identical unresolved comment `// @todo: is parent missing here?`, and checking the hook they call confirms the comment is right: `ConditionalPropertyProps.parent` (`field/conditional-property/useConditionalProperty.tsx:11`) is a real, threaded-through option, and the *form*\'s own resolver for the exact same `hidden`/`readOnly` mechanism, `resolveCallbackState` in `form/store/conditional-property/createCallbackResolver.ts:14-40`, declares `parent: unknown` as a **required** field and passes a real parent object down the tree on every call. So a `hidden: (context) => context.parent?.someField === "x"` callback (a documented, ordinary pattern: hide a field based on a sibling) resolves correctly while editing and resolves against `parent: undefined` the moment the same field shows up in Review Changes. Two identical `@todo`s left in place is the author\'s own record that this was noticed and not fixed.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>The "unknown change type" fallback cannot be reached by the pipeline that is its only supplier.</b></summary>',
          '',
          "`ChangeNode` is a closed union of exactly two members, `type ChangeNode = GroupChangeNode | FieldChangeNode` (`field/types.ts:262`), and the only place in the codebase that constructs one is `changes/buildChangeList.ts`, which literally writes `type: 'field'` or `type: 'group'` at its five call sites and nothing else. `ChangeResolver` has exactly two callers (`ChangeList`, `GroupChange`), and both only ever pass nodes from that builder. The fallback needs `(change as any).type` to compile for a reason: after the two `if (change.type === ...)` guards both return, TypeScript has already narrowed `change` to `never`, the cast is not defensive style, it is required, and its presence is the source admitting the branch is unreachable through its own type system. Same shape as the `return null` at the bottom of `MemberField` (forms subsystem): an exhaustive-looking dispatcher with one extra branch nothing can hand it.",
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>Trace: how a change actually reaches `JsonFieldDiff`.</b></summary>',
          '',
          'This is narrower than "any type with no diff component." That broader case, a *schema-declared* field whose type has no registered diff renderer anywhere in its type chain, is `FallbackDiff`\'s job (`FieldChange.tsx:66`: `change.diffComponent || FallbackDiff`), and it draws a generic before/after using the type\'s own preview, not raw JSON. `JsonFieldDiff` is reached by exactly one path: `buildObjectChangeList` also asks `getSortedUnknownChangedObjectFieldNames` (`changes/unknownObjectDiffFields.ts`) which fields **present in the diffed document data** are **not declared anywhere on the running schema type** (skipping only `_type`/`_key`/`_rev`/`_createdAt`/`_updatedAt`/`_system`). Each one becomes a `FieldChangeNode` typed `UNKNOWN_DOCUMENT_FIELD_SCHEMA_TYPE`, which hard-codes `components: {diff: JsonFieldDiff}` (`changes/unknownDocumentFieldSchema.ts`), so by the time `ChangeResolver` sees it, the routing decision was already made at build time, not by `ChangeResolver` or `FieldChange` inspecting anything live. In practice this fires for exactly the situation the JsonFieldDiff page names: a field that used to be in the schema and was removed, still present in older document revisions being compared. The `RoutedToJsonFieldDiff` story below reaches it with a real diff of an undeclared `legacyRating` field, nothing fabricated.',
          '',
          '</details>',
          '',
          '> **Why it matters:** the `parent` omission is the one worth fixing, since it silently breaks a documented, ordinary conditional-property pattern for one surface only, and nothing in the UI would tell a reviewer why a field is visible in the form and invisible, or the reverse, in Review Changes.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {...diffStudioConfig, schema: {name: 'storybook', types: schemaTypes}},
    }),
  ],
  tags: [
    'autodocs',
    'chapter:data',
    'pattern:error-recovery',
    'pattern:type-dispatch',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/** The three visible outcomes plus the hidden one, side by side. */
export const AllReachableBranches: Story = {
  // Enumeration story: the docs canvas is 540px and this content is 718px tall, so
  // 178px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {docs: {story: {height: '742px'}}},
  name: 'All reachable branches (matrix)',
  render: () => (
    <Stack gap={5} style={{maxWidth: 620}}>
      <Row
        label="change.type === 'field'"
        note="A leaf change. Routed to FieldChange, which further picks a diff renderer for the field's own type."
        {...CASES.field}
      />
      <Row
        label="change.type === 'group'"
        note="Two changed fields inside the nested seo object, wrapped as one GroupChangeNode by the real builder."
        {...CASES.group}
      />
      <Row
        label="isHidden (hidden: true on the field)"
        note="Resolves before the type check even runs. Nothing below this line is the story frame; ChangeResolver itself returned null."
        {...CASES.hidden}
      />
      <Row
        label="Routed to JsonFieldDiff via change.type === 'field'"
        note="Still the field branch - the routing to raw JSON happened earlier, at build time, not here."
        {...CASES.unknownField}
      />
    </Stack>
  ),
}

/**
 * `change.type === 'field'`: a single changed leaf. `ChangeResolver` hands it to `FieldChange`,
 * which resolves its own diff renderer for the field's type (a segment-level string diff here).
 */
export const FieldChangeStory: Story = {
  name: 'Field change',
  render: () => <ResolverHarness {...CASES.field} />,
}

/**
 * `change.type === 'group'`: `metaTitle` and `noIndex` both changed inside the nested `seo`
 * object, so the real builder wraps them as one `GroupChangeNode` rather than two flat field
 * changes. `ChangeResolver` hands the whole group to `GroupChange`.
 */
export const GroupChangeStory: Story = {
  name: 'Group change',
  render: () => <ResolverHarness {...CASES.group} />,
}

/**
 * `isHidden` resolves `true` before either type check runs, so `ChangeResolver` returns `null`.
 * The card below is the story frame; the dispatcher itself rendered nothing. This is the branch
 * that also silently drops `context.parent` for callback-based `hidden` rules (finding 1 above) -
 * this story uses the static `hidden: true` form, which is unaffected by that gap, to isolate the
 * branch itself from the finding about it.
 */
export const HiddenChange: Story = {
  name: 'Hidden field (returns null)',
  render: () => (
    <Stack gap={3} style={{maxWidth: 480}}>
      <Card border style={{borderStyle: 'dashed'}} radius={0} padding={4}>
        <ResolverHarness {...CASES.hidden} />
      </Card>
      <Text size={0} muted>
        the dashed box is the story frame; ChangeResolver itself rendered nothing
      </Text>
    </Stack>
  ),
}

/**
 * `legacyRating` is not declared anywhere on `article`. The real builder classifies it as an
 * unknown document field before `ChangeResolver` ever sees it, hard-coding `JsonFieldDiff` as its
 * diff component. `ChangeResolver` still takes the ordinary `change.type === 'field'` branch -
 * `FieldChange` reads `change.diffComponent` and finds `JsonFieldDiff` already sitting there. See
 * finding 3: this is not what a type-with-no-renderer looks like (that is `FallbackDiff`); it is
 * specifically what a value-with-no-schema-field looks like.
 */
export const RoutedToJsonFieldDiff: Story = {
  name: 'Field change, routed to JsonFieldDiff',
  render: () => <ResolverHarness {...CASES.unknownField} />,
}

/**
 * In context: five fields change at once, three flat and two nested inside `seo`, run through the
 * real `ChangeList` (`lib/diffHarness.tsx`'s `DiffStage`) rather than a single extracted node.
 * `ChangeResolver` is called once per top-level entry here - a mix of `field` and `group` nodes
 * dispatched in the same pass, which is its everyday job. The full renderer catalogue for every
 * field type lives on `Document Status/Field Diffs`; this page is about the one decision upstream
 * of all of it.
 */
export const InContext: Story = {
  name: 'In context (live ChangeList)',
  render: () => (
    <Card border radius={0} padding={4} style={{maxWidth: 620}}>
      <DiffStage
        from={{title: 'The Golden Notebook', readingTime: 6, seo: {_type: 'seo', noIndex: false}}}
        to={{
          title: 'The Waves',
          readingTime: 4,
          tags: ['modernism', 'stream-of-consciousness'],
          seo: {_type: 'seo', metaTitle: 'The Waves - a reading guide', noIndex: true},
        }}
      />
    </Card>
  ),
}
