import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real components from real paths (org contract §8).
import {ObjectInputMember} from '../../../../packages/sanity/src/core/form/members/object/ObjectInputMember'
import {type ObjectMember} from '../../../../packages/sanity/src/core/form/store/types/members'
import {
  type RenderArrayOfObjectsItemCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from '../../../../packages/sanity/src/core/form/types/renderCallback'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── The four returns, driven by real form state ─────────────────────────
   `ObjectInputMember` is a pure dispatcher: it takes one `ObjectMember` and switches on
   `member.kind` to decide which sub-renderer draws it. `ObjectMember` is a closed union of
   exactly four kinds (`store/types/members.ts:9`), and the component has a branch for each,
   plus a defensive fallback after all four that the type system marks unreachable (see
   `Unhandled` below).

   Hand-building a `FieldMember` or `FieldSetMember` would mean forging the internal form
   node the real resolver produces (validation, groups, collapse state, the works), exactly
   the kind of fabricated data source the "Stubbed lane" rule warns against for something
   that renders successfully but is evidence of nothing. Instead each story below is a real,
   minimal document, run through the real `useFormState` resolver via `FormBuilderHarness`, so
   the `member` reaching `ObjectInputMember` in every story is the one the studio itself would
   build. Four documents, four kinds:

   - `plainField`     → a single string field. Resolves to exactly one `kind: 'field'` member.
   - `withFieldset`    → a field inside a fieldset. Resolves to exactly one `kind: 'fieldSet'`
                         member (the field is nested inside it, not a sibling).
   - `withBadArray`    → an array-of-strings field seeded with a string, not an array. The
                         resolver's own type guard (`formState.ts:715`,
                         `isValidArrayOfPrimitivesValue`) fails and returns `kind: 'error'`
                         directly, no malformed document needed beyond the one field.
   - `withDecoration`  → a plain field plus a schema-level `renderMembers` callback that
                         appends a `kind: 'decoration'` member, exactly the pattern shown in
                         the type's own JSDoc (`definitionExtensions.ts:511-519`). This is a
                         real, supported authoring seam, not a fixture standing in for one. */

/** Stands in for a schema author's custom decoration component: a plain, real React component. */
function PublishWindowNotice() {
  return (
    <Card padding={3} radius={2} tone="caution" border>
      <Text size={1}>Publishing window: Tuesday–Thursday only.</Text>
    </Card>
  )
}

const schemaTypes = [
  {
    name: 'plainField',
    title: 'Plain field',
    type: 'document',
    fields: [{name: 'title', title: 'Title', type: 'string'}],
  },
  {
    name: 'withFieldset',
    title: 'With fieldset',
    type: 'document',
    fieldsets: [{name: 'meta', title: 'Meta'}],
    fields: [{name: 'summary', title: 'Summary', type: 'string', fieldset: 'meta'}],
  },
  {
    name: 'withBadArray',
    title: 'With bad array',
    type: 'document',
    fields: [{name: 'tags', title: 'Tags', type: 'array', of: [{type: 'string'}]}],
  },
  {
    name: 'withDecoration',
    title: 'With decoration',
    type: 'document',
    fields: [{name: 'title', title: 'Title', type: 'string'}],
    renderMembers: (members: ObjectMember[]): ObjectMember[] => [
      ...members,
      {key: 'publish-window', kind: 'decoration', component: PublishWindowNotice},
    ],
  },
]

/** `tags` is declared as an array of strings; the value is a bare string. */
const badArrayDocument = {tags: 'not-an-array'}

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

const noop = () => null

/**
 * The fifth branch: after the four `member.kind` checks, the component falls through to a
 * `console.warn` and `return null`. TypeScript flags the `member.kind` read on that line with
 * `//@ts-expect-error` because, given the closed `ObjectMember` union, the branches above
 * narrow it to `never`: the type system itself thinks this line is dead. It is only reachable
 * by handing the component a member the union does not admit, which is what this story does,
 * by force, to show what actually happens: nothing renders, and a warning goes to the console.
 * None of the render callbacks below are ever called on this path, so plain no-ops satisfy them.
 */
function UnhandledKindDemo() {
  const bogusMember = {kind: 'bogus', key: 'x'} as unknown as ObjectMember
  return (
    <Card border padding={3} radius={0} tone="critical" style={{maxWidth: 460}}>
      <Stack gap={3}>
        <Text size={1}>
          Renders nothing below this line. Open the console: a warning was logged.
        </Text>
        <ObjectInputMember
          member={bogusMember}
          renderField={noop as unknown as RenderFieldCallback}
          renderInput={noop as unknown as RenderInputCallback}
          renderItem={noop as unknown as RenderArrayOfObjectsItemCallback}
          renderPreview={noop as unknown as RenderPreviewCallback}
        />
      </Stack>
    </Card>
  )
}

const meta: Meta = {
  title: 'Forms & Input/ObjectInputMember',
  parameters: {
    // No meta-level `component`: each story drives state through member kind rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Every field, fieldset and field-level error inside every object and document form ' +
            'passes through one dispatcher, and the interesting part is the fifth branch, the one ' +
            'the compiler has already marked unreachable.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/members/object/ObjectInputMember.tsx` |',
          '| Tier | CORE. Every field, fieldset and field-level error inside every object and document form passes through this dispatcher |',
          '| Audit | 🟢 holds. All four declared member kinds are handled and render distinctly. The one structural finding is a dead branch, not a defect (see `Unhandled` below) |',
          '| Kinds | 4, closed union (`store/types/members.ts:9`), plus one type-system-unreachable fallback |',
          '',
          '`ObjectInputMember` takes one `ObjectMember` and switches on `member.kind` to decide ' +
            'what to draw: a field, a fieldset, a field-level error, or a schema-injected ' +
            'decoration. It renders nothing itself; every branch delegates to a sibling renderer ' +
            '(`MemberField`, `MemberFieldSet`, `MemberFieldError`, `MemberDecoration`).',
          '',
          '**What reading it turned up.** `ObjectMember` is a closed union of exactly four ' +
            'kinds, and the component has one `if` per kind:',
          '',
          "- `member.kind === 'decoration'` maps to `MemberDecoration`, wrapped in a `FormRow`",
          "- `member.kind === 'field'` maps to `MemberField`",
          "- `member.kind === 'error'` maps to `MemberFieldError`",
          "- `member.kind === 'fieldSet'` maps to `MemberFieldSet`",
          '',
          'That is the domain, and after it the component still carries a fifth path: a ' +
            '`//@ts-expect-error`-suppressed `console.warn` followed by `return null`. The ' +
            'suppressed error is TypeScript telling the author the line is unreachable: with all ' +
            'four kinds excluded, `member.kind` narrows to `never`. The four stories below each ' +
            'drive a real document through the real `useFormState` resolver so the `member` each ' +
            'one hands to the component is genuine, not hand-forged; the fifth story forces an ' +
            'invalid `kind` past the type system to show what the dead branch actually does.',
          '',
          '> **Why it matters:** the branch is not wrong to keep. Nothing in the type system ' +
            'stops a future member kind, or a corrupted value crossing a serialization boundary, ' +
            'from reaching this component at runtime, and a silent `null` with a logged warning ' +
            'is a reasonable failure mode for that. It is worth flagging precisely because it is ' +
            'dead **by the compiler’s own admission** while still doing real defensive work, the ' +
            'kind of code a lint rule would flag and a careless pass would then delete.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders({config: {schema: {name: 'storybook', types: schemaTypes}}})],
  tags: ['autodocs', 'chapter:forms', 'audit:healthy', 'source:studio-only', 'tier:core'],
}

export default meta
type Story = StoryObj

/** All four real kinds, plus the forced-unreachable fifth, stacked for comparison. */
export const ReturnMatrix: Story = {
  // Enumeration story: the docs canvas is 540px and this content is 938px tall, so
  // 398px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {docs: {story: {height: '962px'}}},
  render: () => (
    <Stack gap={5} style={{maxWidth: 520}}>
      <Row label="kind: 'field'" note="A plain string field, resolved for real.">
        <FormBuilderHarness id="matrix-field" documentType="plainField" height="auto" />
      </Row>
      <Row
        label="kind: 'fieldSet'"
        note="A field nested inside a fieldset. The top-level member is the fieldset, not the field."
      >
        <FormBuilderHarness id="matrix-fieldset" documentType="withFieldset" height="auto" />
      </Row>
      <Row
        label="kind: 'error'"
        note="tags is declared array-of-strings; the document has a bare string. The resolver's own type guard fails before an input ever mounts."
      >
        <FormBuilderHarness
          id="matrix-error"
          documentType="withBadArray"
          initialDocument={badArrayDocument}
          height="auto"
        />
      </Row>
      <Row
        label="kind: 'decoration'"
        note="A schema-level renderMembers callback appends a custom component alongside the real field."
      >
        <FormBuilderHarness id="matrix-decoration" documentType="withDecoration" height="auto" />
      </Row>
      <Row
        label="unhandled kind (dead branch)"
        note="Not reachable through any real schema. Forced past the type system to show the fallback."
      >
        <UnhandledKindDemo />
      </Row>
    </Stack>
  ),
}

/** `member.kind === 'field'`: delegates straight to `MemberField`. */
export const Field: Story = {
  render: () => <FormBuilderHarness id="field" documentType="plainField" height="auto" />,
}

/**
 * `member.kind === 'fieldSet'`: delegates to `MemberFieldSet`, which owns the collapse
 * chrome and renders `summary` as one of its own children rather than as a sibling member.
 */
export const FieldSet: Story = {
  render: () => <FormBuilderHarness id="fieldset" documentType="withFieldset" height="auto" />,
}

/**
 * `member.kind === 'error'`: delegates to `MemberFieldError`. The error here is
 * `INCOMPATIBLE_TYPE`, produced by the form-state resolver itself the moment it sees a
 * non-array value on an array field, before any input component is involved.
 */
export const ErrorKind: Story = {
  render: () => (
    <FormBuilderHarness
      id="error"
      documentType="withBadArray"
      initialDocument={badArrayDocument}
      height="auto"
    />
  ),
}

/**
 * `member.kind === 'decoration'`: delegates to `MemberDecoration`. Decorations are how a
 * schema author injects arbitrary content into an object's member list without a backing
 * field, via the type's own `renderMembers` callback - documented on `ObjectDefinition`
 * (`definitionExtensions.ts:504-525`) with this exact shape.
 */
export const Decoration: Story = {
  render: () => <FormBuilderHarness id="decoration" documentType="withDecoration" height="auto" />,
}

/**
 * The branch after all four `member.kind` checks: a `console.warn` and `return null`,
 * reached only by a member kind the type system has already ruled out. See the docblock
 * above for what that means and why it is worth keeping anyway.
 */
export const Unhandled: Story = {
  render: () => <UnhandledKindDemo />,
}
