import {type ArraySchemaType, type SchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from a real path (org contract §8).
import {MemberFieldError} from '../../../../packages/sanity/src/core/form/members/object/MemberFieldError'
import {type FieldError} from '../../../../packages/sanity/src/core/form/store/types/memberErrors'
import {FormCallbacksProvider} from '../../../../packages/sanity/src/core/form/studio/contexts/FormCallbacks'
import {WithStudioProviders} from '../../lib/testProvider'

/** Every callback is a sink: this page is about what the error renderer draws, not what it emits. */
const noop = () => undefined

const schemaTypes = [
  {
    name: 'book',
    title: 'Book',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'tags', title: 'Tags', type: 'array', of: [{type: 'string'}]},
    ],
  },
]

/* ── The six declared error types ──────────────────────────────────────────
   `FieldError['error']` is a union of exactly six members, all public and all documented in the
   same docblock on the interface. `MemberFieldError` branches on four of them by name and lets
   the other two fall through to a generic fallback, so the set below is the complete input
   domain rather than a selection from it. */

const stringType = {name: 'string', jsonType: 'string', type: {name: 'string'}} as SchemaType
const arrayType = {name: 'array', jsonType: 'array', of: [stringType]} as unknown as ArraySchemaType

const err = (error: FieldError['error']): FieldError => ({
  kind: 'error',
  key: 'tags',
  fieldName: 'tags',
  path: ['tags'],
  error,
})

const INCOMPATIBLE = err({
  type: 'INCOMPATIBLE_TYPE',
  expectedSchemaType: arrayType,
  resolvedValueType: 'string',
  value: 'fiction, essays',
})

const MISSING_KEYS = err({
  type: 'MISSING_KEYS',
  schemaType: arrayType,
  value: [{_key: 'a'}, {}, {}],
})

const DUPLICATE_KEYS = err({
  type: 'DUPLICATE_KEYS',
  schemaType: arrayType,
  duplicates: [
    [1, 'a'],
    [2, 'a'],
  ],
})

const MIXED_ARRAY = err({
  type: 'MIXED_ARRAY',
  schemaType: arrayType,
  value: ['fiction', {_type: 'tag', _key: 'x'}],
})

/** Declared in the union, documented on the interface, and NOT branched on by the component. */
const TYPE_ANNOTATION_MISMATCH = err({
  type: 'TYPE_ANNOTATION_MISMATCH',
  expectedSchemaType: arrayType,
  resolvedValueType: 'legacyTags',
})

/** Same. Falls through to the same generic fallback. */
const UNDECLARED_MEMBERS = err({
  type: 'UNDECLARED_MEMBERS',
  schemaType: arrayType,
})

function Harness({member}: {member: FieldError}) {
  return (
    <WithStudioProvidersInner>
      <Card border padding={3} radius={0} style={{maxWidth: 560}}>
        <MemberFieldError member={member} />
      </Card>
    </WithStudioProvidersInner>
  )
}

/**
 * `MemberFieldError` calls `useFormCallbacks`, which THROWS when no provider is present
 * ("Form context not provided"), and `useTranslation`, which the studio providers supply.
 * Nothing else. It does NOT need the FormBuilder context, so `FormStub` is not used here.
 *
 * Worth knowing because the failure is quiet from the outside: a React error boundary catches
 * the throw, Storybook renders its generic error display, and nothing reaches `pageerror`. An
 * earlier version of this page reported eight clean stories while every one of them was showing
 * that overlay. They were caught by their byte counts being identical to one another, and
 * `qa/verify-ids.mjs` now detects the overlay directly.
 */
function WithStudioProvidersInner({children}: {children: React.ReactNode}) {
  return (
    <FormCallbacksProvider
      onChange={noop}
      onFieldGroupSelect={noop}
      onPathBlur={noop}
      onPathFocus={noop}
      onPathOpen={noop}
      onSetFieldSetCollapsed={noop}
      onSetPathCollapsed={noop}
    >
      {children}
    </FormCallbacksProvider>
  )
}

const HANDLED: {label: string; note: string; member: FieldError}[] = [
  {
    label: 'INCOMPATIBLE_TYPE',
    note: 'The value is structurally the wrong shape. Gets the full InvalidValueInput, with the offending value shown and a way to reset it.',
    member: INCOMPATIBLE,
  },
  {
    label: 'MISSING_KEYS',
    note: 'Array items with no _key. A dedicated alert with a repair action.',
    member: MISSING_KEYS,
  },
  {
    label: 'DUPLICATE_KEYS',
    note: 'Two array items sharing a _key. Its own alert, its own repair.',
    member: DUPLICATE_KEYS,
  },
  {
    label: 'MIXED_ARRAY',
    note: 'Primitives and objects in one array. Its own alert again.',
    member: MIXED_ARRAY,
  },
]

const UNHANDLED: {label: string; note: string; member: FieldError}[] = [
  {
    label: 'TYPE_ANNOTATION_MISMATCH',
    note: 'Declared in the union and documented on the interface. Reaches the fallback.',
    member: TYPE_ANNOTATION_MISMATCH,
  },
  {
    label: 'UNDECLARED_MEMBERS',
    note: 'Also declared, also documented, also the fallback.',
    member: UNDECLARED_MEMBERS,
  },
]

function Row({label, note, member}: {label: string; note: string; member: FieldError}) {
  return (
    <Stack gap={2}>
      <Text size={1} weight="semibold">
        {label}
      </Text>
      <Text muted size={1}>
        {note}
      </Text>
      <Harness member={member} />
    </Stack>
  )
}

const meta: Meta = {
  title: 'Forms & Input/MemberFieldError',
  parameters: {
    // No meta-level `component`: each story drives state through error member rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'When the form store cannot build a normal field because the value and the schema ' +
            'disagree, one component decides what an author sees in its place, and for two of the ' +
            'six ways that disagreement can happen, what they see is a component telling them ' +
            'something unexpected occurred when the type system saw it coming.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/members/object/MemberFieldError.tsx` |',
          '| Tier | CORE. What an author is shown when the content in the document does not fit the schema the studio is running |',
          '| Audit | 🟡 needs-work (`error-recovery`). Two of the six declared error types reach a fallback that calls them unexpected and offers no repair |',
          '| Patterns | `error-recovery` |',
          '| Error union | 6 members, closed, all public, all listed in the docblock on `FieldError["error"]` |',
          '',
          'The field-level error renderer. The stories cover the **whole input domain**, not a ' +
            'selection from it, since the union is closed and every member is exercised below.',
          '',
          '**What reading it turned up.** The component branches on four of the six by name and lets ' +
            'the other two fall through to:',
          '',
          '```',
          "return <Box>{t('member-field-error.unexpected-error', {error: props.member.error.type})}</Box>",
          '```',
          '',
          '`TYPE_ANNOTATION_MISMATCH` and `UNDECLARED_MEMBERS` are not unexpected. They are declared ' +
            'in the same union, in the same file, and named in the same docblock as the four that are ' +
            'handled. An author who hits one is told the studio met something it did not anticipate, ' +
            'when in fact it is a case the type system anticipated and the renderer did not.',
          '',
          'The four handled cases each get a dedicated alert with a repair action. The two unhandled ' +
            'ones get a bare string inside a `Box`, with no `Text` wrapper, no tone, no icon and ' +
            'nothing to do about it.',
          '',
          '> **Why it matters:** these are the errors an author meets after a schema change, which is ' +
            'exactly when they are least able to tell whether the problem is their content or someone ' +
            "else's deploy. Half the vocabulary answers that question and half of it says " +
            '"unexpected".',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders({config: {schema: {name: 'storybook', types: schemaTypes}}})],
  tags: [
    'autodocs',
    'chapter:forms',
    'pattern:error-recovery',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/**
 * All six declared error types in one column: the four that are handled, then the two that are
 * not. The break in treatment is the argument of this page.
 */
export const AllErrorTypes: Story = {
  // Enumeration story: the docs canvas is 540px and this content is 1321px tall, so
  // 781px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {docs: {story: {height: '1345px'}}},
  render: () => (
    <Stack gap={5} style={{maxWidth: 620}}>
      <Text size={1} weight="semibold">
        Handled: a dedicated alert and a repair
      </Text>
      {HANDLED.map((r) => (
        <Row key={r.label} {...r} />
      ))}
      <Text size={1} weight="semibold">
        Unhandled: declared in the same union, called unexpected
      </Text>
      {UNHANDLED.map((r) => (
        <Row key={r.label} {...r} />
      ))}
    </Stack>
  ),
}

/** The value is the wrong shape entirely. The most informative of the six. */
export const IncompatibleType: Story = {
  render: () => <Harness member={INCOMPATIBLE} />,
}

/** Array items with no `_key`, which breaks reordering and diffing. Repairable in place. */
export const MissingKeys: Story = {
  render: () => <Harness member={MISSING_KEYS} />,
}

/** Two items sharing a `_key`. Also repairable in place. */
export const DuplicateKeys: Story = {
  render: () => <Harness member={DUPLICATE_KEYS} />,
}

/** Primitives and objects in the same array. */
export const MixedArray: Story = {
  render: () => <Harness member={MIXED_ARRAY} />,
}

/**
 * The first of the two fall-throughs. `TYPE_ANNOTATION_MISMATCH` is a declared, documented
 * member of the error union: the value is structurally fine but its `_type` is not what the
 * schema expects. The renderer has no branch for it.
 */
export const TypeAnnotationMismatch: Story = {
  render: () => <Harness member={TYPE_ANNOTATION_MISMATCH} />,
}

/**
 * The second. `UNDECLARED_MEMBERS` means the object carries fields the schema does not declare,
 * which is a routine consequence of removing a field from a schema that has live content.
 */
export const UndeclaredMembers: Story = {
  render: () => <Harness member={UNDECLARED_MEMBERS} />,
}
