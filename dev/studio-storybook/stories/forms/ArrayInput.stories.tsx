import {
  type ArraySchemaType,
  type ObjectSchemaType,
  type Path,
  type ValidationMarker,
} from '@sanity/types'
import {Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useMemo, useRef, useState} from 'react'

// Real components from real paths (org contract §8): the array input under audit and
// its add-flow (the `ArrayFunctions` surface that owns the "+" defect).
import {ArrayOfObjectsInput} from '../../../../packages/sanity/src/core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsInput'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {FormStub, WithStudioProviders} from '../../lib/testProvider'

/**
 * A `blog` document with three array fields, one per add-flow shape:
 * - `singleType` — array of a single object type (`author`) → "Add item" (direct add)
 * - `multiType` — array of two object types → "Add item…" (opens the insert menu)
 * - `required` — a single-type array carrying a min-length validation rule
 */
const schemaTypes = [
  {
    name: 'author',
    title: 'Author',
    type: 'object',
    fields: [
      // `name` is required so the FormBuilderHarness story gets a REAL per-item
      // validation marker from `validateDocument` (bare stories never run validation,
      // so they are unaffected by the rule).
      {
        name: 'name',
        title: 'Name',
        type: 'string',
        validation: (rule: {required: () => unknown}) => rule.required(),
      },
      {name: 'role', title: 'Role', type: 'string'},
    ],
    preview: {select: {title: 'name', subtitle: 'role'}},
  },
  {
    name: 'book',
    title: 'Book',
    type: 'object',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'year', title: 'Year', type: 'number'},
    ],
    preview: {select: {title: 'title', subtitle: 'year'}},
  },
  {
    name: 'quote',
    title: 'Pull quote',
    type: 'object',
    fields: [
      {name: 'text', title: 'Quote', type: 'string'},
      {name: 'attribution', title: 'Attribution', type: 'string'},
    ],
    preview: {select: {title: 'text', subtitle: 'attribution'}},
  },
  {
    name: 'blog',
    title: 'Blog',
    type: 'document',
    fields: [
      {name: 'singleType', title: 'Contributors', type: 'array', of: [{type: 'author'}]},
      {
        name: 'multiType',
        title: 'Content',
        type: 'array',
        of: [{type: 'author'}, {type: 'book'}, {type: 'quote'}],
      },
      {
        name: 'required',
        title: 'Contributors (required)',
        type: 'array',
        of: [{type: 'author'}],
        validation: (rule: {min: (n: number) => unknown}) => rule.min(1),
      },
    ],
  },
  // Dedicated single-array-field hosts for the live-FormBuilder stories: one array field
  // each, so the harness renders just the surface under audit rather than the whole blog
  // form. One host per add-flow shape (single type / multi type / required).
  {
    name: 'roster',
    title: 'Roster',
    type: 'document',
    fields: [{name: 'contributors', title: 'Contributors', type: 'array', of: [{type: 'author'}]}],
  },
  {
    name: 'library',
    title: 'Library',
    type: 'document',
    fields: [
      {
        name: 'items',
        title: 'Content',
        type: 'array',
        of: [{type: 'author'}, {type: 'book'}, {type: 'quote'}],
      },
    ],
  },
  {
    name: 'team',
    title: 'Team',
    type: 'document',
    fields: [
      {
        name: 'members',
        title: 'Contributors (required)',
        type: 'array',
        of: [{type: 'author'}],
        validation: (rule: {min: (n: number) => unknown}) => rule.min(1),
      },
    ],
  },
  // The in-context host: a real book document whose Contributors array sits beside a
  // plain Title field, so the array input is shown as one field of a document being
  // edited rather than the sole surface on the canvas.
  {
    name: 'bookEntry',
    title: 'Book',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'contributors', title: 'Contributors', type: 'array', of: [{type: 'author'}]},
    ],
  },
]

const NOOP = () => undefined
const ASYNC_NOOP = () => Promise.resolve(undefined as never)

interface DemoProps {
  fieldName: 'singleType' | 'multiType' | 'required'
  validation?: ValidationMarker[]
  readOnly?: boolean
}

/**
 * Mounts the real `ArrayOfObjectsInput` with `members: []`, inside a `FormStub` (the
 * minimal `FormBuilderContext` the input's own `UploadTargetCard` requires). This
 * faithfully renders the **empty state, the add-flow, and the error tone** — the item
 * rows (`VirtualizedArrayList`) are only reached once real form members exist, which
 * requires a live `FormBuilder` (see the Populated story / harness note). The prop tail
 * the component never reads on these paths is completed with `as unknown as`.
 */
function ArrayFieldDemo(props: DemoProps) {
  const {fieldName, validation = [], readOnly} = props
  const schema = useSchema()
  const blogType = schema.get('blog') as ObjectSchemaType
  const field = blogType.fields.find((candidate) => candidate.name === fieldName)!
  const schemaType = field.type as ArraySchemaType
  const elementRef = useRef<HTMLElement | null>(null)

  const inputProps = {
    schemaType,
    value: undefined,
    members: [],
    path: [fieldName] as Path,
    focusPath: [] as Path,
    focused: false,
    id: `storybook-${fieldName}`,
    level: 0,
    changed: false,
    readOnly,
    validation,
    presence: [],
    elementProps: {
      'id': `storybook-${fieldName}`,
      'onFocus': () => undefined,
      'onBlur': () => undefined,
      'ref': elementRef,
      'aria-describedby': undefined,
      'style': {},
    },
    onChange: NOOP,
    onItemAppend: NOOP,
    onItemPrepend: NOOP,
    onItemRemove: NOOP,
    onItemMove: NOOP,
    onInsert: NOOP,
    onPathFocus: NOOP,
    onItemCollapse: NOOP,
    onItemExpand: NOOP,
    onItemOpen: NOOP,
    onItemClose: NOOP,
    resolveInitialValue: ASYNC_NOOP,
    resolveUploader: () => null,
    renderField: NOOP,
    renderInput: NOOP,
    renderItem: NOOP,
    renderPreview: NOOP,
  } as unknown as Parameters<typeof ArrayOfObjectsInput>[0]

  // `ArrayOfObjectsInput` renders `ListArrayInput` → `UploadTargetCard` even with
  // `members: []` (the empty state), and `UploadTargetCard` calls `useFormBuilder()` —
  // so the input cannot mount without a `FormBuilderContext`. `FormStub` supplies that
  // context (with inert, empty asset sources) and nothing visual, so the empty/add/error
  // surfaces render exactly as the component draws them, both standalone and inline on the
  // autodocs page. Without it every bare story threw "FormBuilder: missing context value".
  return (
    <FormStub
      documentType={blogType}
      documentValue={{_id: 'storybook-blog', _type: 'blog'}}
      renderPreview={() => null}
    >
      <Stack gap={3} style={{maxWidth: 520}}>
        <ArrayOfObjectsInput {...inputProps} />
      </Stack>
    </FormStub>
  )
}

const meta: Meta = {
  title: 'Forms & Input/ArrayInput',
  parameters: {
    docs: {
      description: {
        component: [
          'Adding an item to an array of objects is a plus sign that opens a template popover and ' +
            'then a separate editor, never an inline append row, and the item that lands is ' +
            'flagged critical before its author has typed a single character.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsInput.tsx`, Studio-only, no DS equivalent |',
          '| Tier | CORE. Arrays of objects are how structured, repeatable content is authored; the add-flow, item rows and reordering are content-model machinery with no design-system equivalent |',
          "| Audit | 🔴 needs-work (`new-item-row`, `cards`, `inline-validation-timing`). Two findings: adding an item opens a template popover and then a separate editor rather than an inline append row, and a freshly added item is toned critical before the author types anything (the mirror of the audit's late-validation finding) |",
          '| Patterns | `new-item-row` · `cards` · `inline-validation-timing` |',
          '',
          'See the Premature validation Current/Recommended pair; it is real Studio behaviour, ' +
            'sourced from `useDocumentForm` through `useValidationStatus` with no touched or ' +
            'first-publish gate.',
          '',
          'The interactive stories (empty, add single/multi type, current-new-item-row, error ' +
            'state) run a live `FormBuilder` (`lib/formBuilderHarness.tsx`, the port of ' +
            '`packages/sanity/test/browser/TestForm.tsx`) over a real, mutable document. That is ' +
            'what makes adding the first item actually work: the add button appends through the ' +
            'real patch pipeline, the item lands and opens its editor, and the min-length rule ' +
            'tones the empty list from real `validateDocument` markers. A bare `ArrayOfObjectsInput` ' +
            'mount (`FormStub` only) renders the empty state and add button, but its append ' +
            'handlers are inert no-ops, clicking Add does nothing, silently, so the add-flow ' +
            'stories use the live harness instead.',
          '',
          '**Where the bare mount survives.** The read-only story keeps the bare `FormStub` mount: ' +
            'the add button is correctly disabled there, so no live patch pipeline is needed to ' +
            'show it. `PopulatedRows` runs the same live `FormBuilder` over a document that ' +
            'already has three contributors, with real member resolution, per-item ' +
            '`validateDocument` markers, editable rows, and reorder.',
          '',
          '> **Why it matters:** validation should engage after the first meaningful interaction, ' +
            'not on creation. Instead a brand-new row flashes red the instant it lands, before the ' +
            'author has had a chance to fill it in, teaching them to distrust the add button ' +
            'itself.',
          '',
          'The page closes in context: the Contributors array as one field of the "Anna Karenina" ' +
            'book being edited, beside its Title.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: schemaTypes}},
      // The live-FormBuilder story renders item previews through the preview store;
      // the fixture store resolves inline object values locally (no fixtures needed).
      previewStore: createMockDocumentPreviewStore({documents: []}),
    }),
  ],
  tags: [
    'autodocs',
    'chapter:forms',
    'chapter:cms',
    'chapter:lists',
    'pattern:new-item-row',
    'pattern:cards',
    'pattern:inline-validation-timing',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/**
 * Empty array: the "no items" placeholder card plus the add affordance. Runs the live
 * `FormBuilder` over an empty `roster`, so clicking **Add item** genuinely appends the
 * first item (the row lands and opens its editor), the empty-start add path a bare mount
 * cannot exercise.
 */
export const Empty: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <div style={{maxWidth: 560}}>
      <FormBuilderHarness id="array-empty" documentType="roster" height={260} />
    </div>
  ),
}

/**
 * Single object type: the add button reads **"Add item"** and appends directly, no
 * type choice needed (`schemaType.of.length === 1`). Live `FormBuilder`, so the append
 * is real.
 */
export const AddSingleType: Story = {
  name: 'Add, single type',
  parameters: {controls: {include: []}},
  render: () => (
    <div style={{maxWidth: 560}}>
      <FormBuilderHarness id="array-add-single" documentType="roster" height={260} />
    </div>
  ),
}

/**
 * Multiple object types: when an array accepts more than one type, the add button reads
 * **"Add item…"** (the ellipsis signals a choice) and opens the real insert menu
 * (`InsertMenuPopover`) to pick a type. Here `items` accepts three, **Author**, **Book**
 * and **Pull quote**, so the menu is a genuine multi-option list, not a two-item stub.
 *
 * The flow has two legs, both live over the real `FormBuilder`:
 * 1. Click **"Add item…"** → the insert menu opens, anchored to the add control (the real
 *    component owns placement, the menu opens below/`right-start` off the trigger, staying
 *    inside the `BoundaryElementProvider` the harness mounts so it never escapes the story
 *    frame).
 * 2. Pick a type → that type's initial value is appended through the real patch pipeline and
 *    the new item opens in its editor. Choosing **Pull quote** appends a quote, **Author** an
 *    author, and so on: the type you pick is the type you get.
 *
 * This is the type-picker leg of the `new-item-row` flow. Contrast the single-type story,
 * where there is no choice to make so the button appends directly.
 */
export const AddMultipleTypes: Story = {
  name: 'Add, multiple types',
  parameters: {controls: {include: []}},
  render: () => (
    <div style={{maxWidth: 560}}>
      <FormBuilderHarness id="array-add-multi" documentType="library" height={300} />
    </div>
  ),
}

/**
 * **Current (audit finding).** `new-item-row`: the only way to add is the **"+" that
 * opens a template popover**, after which the item opens in a separate editor. There is
 * no inline append row, the row you are "adding" never appears in place. This is the
 * real component’s add surface, unmodified, driven by the live `FormBuilder`.
 */
export const CurrentNewItemRow: Story = {
  name: 'Current (+ opens popover, separate editor)',
  tags: ['audit:needs-work'],
  parameters: {controls: {include: []}},
  render: () => (
    <div style={{maxWidth: 560}}>
      <FormBuilderHarness id="array-current-new-item" documentType="library" height={260} />
    </div>
  ),
}

/**
 * **Recommended.** An inline append row: a lightweight capture field lives at the foot
 * of the list, so adding is one continuous motion (type, press Enter, the row lands in
 * place) rather than popover → separate editor. Prop-driven illustration; the value
 * shape it would emit is the array-append patch the real input already supports.
 */
export const RecommendedNewItemRow: Story = {
  name: 'Recommended (inline append row)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => <InlineAppendDemo />,
}

/**
 * Validation error on the array itself (min length): the empty-state card takes the
 * **critical tone**, matching how the real input tones an errored empty list. Live
 * `FormBuilder` over an empty `team` whose `members` field carries `rule.min(1)`, so the
 * critical tone comes from a real `validateDocument` marker, and adding the first item
 * (which clears the error) works.
 */
export const ErrorState: Story = {
  name: 'Error state (min-length)',
  parameters: {controls: {include: []}},
  render: () => (
    <div style={{maxWidth: 560}}>
      <FormBuilderHarness id="array-error-state" documentType="team" height={260} />
    </div>
  ),
}

/**
 * Current (audit finding, `inline-validation-timing`, premature). The description below is
 * authored in `parameters.docs.description.story` so the "real Studio, not a harness
 * artefact" caveat can render as a Markdown callout without tripping the tsdoc lint.
 */
export const PrematureValidationCurrent: Story = {
  name: 'Premature validation, Current (untouched item flashes red)',
  tags: ['audit:needs-work', 'pattern:inline-validation-timing'],
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story: [
          '**Current (audit finding, `inline-validation-timing`, premature).** The mirror of',
          "the audit's *late*-validation finding: here validation fires too **early**. The",
          'moment you add an item whose type has a required field, the fresh, untouched item is',
          'toned **critical**, red before you have typed a single character. "Danger, danger" on',
          'a field the author has not even reached yet.',
          '',
          '> **This is real Studio, not a harness artefact.** `useDocumentForm` feeds the live',
          '> `useValidationStatus` markers straight to the form with no first-publish gate and no',
          '> per-field "touched" state (Sanity\'s form has no touched concept), so the validation',
          '> store tones a just-created member critical as soon as it recomputes. The story seeds',
          '> a `roster` with one contributor that has a role but no `name` (a stand-in for the',
          '> item you just appended); it renders red on load, exactly the state you land in the',
          '> instant you click **Add item** on `--empty` or `--error-state`.',
          '',
          'The principle it breaks: validation should engage after the first meaningful',
          'interaction (touch/blur), not on creation.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <div style={{maxWidth: 560}}>
      <FormBuilderHarness
        id="array-premature-current"
        documentType="roster"
        height={260}
        initialDocument={{
          contributors: [{_key: 'fresh', _type: 'author', role: 'Contributor'}],
        }}
      />
    </div>
  ),
}

/**
 * **Recommended.** The same freshly-added item starts **neutral**: validation engages only
 * after the first meaningful interaction (blur, or the author moving on), so a brand-new
 * row is an invitation to type, not an error to dismiss. Once touched-and-still-empty, the
 * required-field error appears exactly as before, the message is not lost, only deferred to
 * the moment it is useful. Prop-driven illustration of the target timing; the message copy
 * and tone are the real input's.
 */
export const PrematureValidationRecommended: Story = {
  name: 'Premature validation, Recommended (neutral until touched)',
  tags: ['!audit:needs-work', 'audit:holds', 'pattern:inline-validation-timing'],
  render: () => <TouchGatedItemDemo />,
}

/** Read-only: the add button is disabled with the read-only tooltip. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => <ArrayFieldDemo fieldName="singleType" readOnly />,
}

/**
 * A LIVE `FormBuilder` (`lib/formBuilderHarness.tsx`, the `TestForm` port) over a
 * `roster` document with three contributors: real resolved members render real item
 * rows, preview title/subtitle, drag handles, per-item menus, and the third item is
 * missing its required `name`, so `validateDocument` marks that row with a real
 * validation indicator. Rows are editable (click one to open its inline editor), the
 * add flow appends to the same document, and reorder works. This is the story the
 * bare-mount harness could not render.
 */
export const PopulatedRows: Story = {
  name: 'Populated rows (live FormBuilder)',
  parameters: {controls: {include: []}},
  render: () => (
    <div style={{maxWidth: 560}}>
      <FormBuilderHarness
        id="array-populated"
        documentType="roster"
        initialDocument={{
          contributors: [
            {_key: 'c1', _type: 'author', name: 'Jane Austen', role: 'Novelist'},
            {_key: 'c2', _type: 'author', name: 'Leo Tolstoy', role: 'Novelist'},
            {_key: 'c3', _type: 'author', role: 'Editor'},
          ],
        }}
      />
    </div>
  ),
}

interface Row {
  _key: string
  name: string
  role: string
}

/**
 * The Recommended inline-append illustration: real `@sanity/ui` primitives composed to
 * show the append-in-place behaviour the audit found missing. Not the Studio component —
 * a prop-driven demo of the target interaction.
 */
function InlineAppendDemo() {
  const [rows, setRows] = useState<Row[]>([
    {_key: 'r1', name: 'Jane Austen', role: 'Novelist'},
    {_key: 'r2', name: 'Leo Tolstoy', role: 'Novelist'},
  ])
  const [draft, setDraft] = useState('')
  const nextKey = useMemo(() => `r${rows.length + 1}`, [rows.length])

  const append = useCallback(() => {
    const name = draft.trim()
    if (!name) return
    setRows((prev) => [...prev, {_key: nextKey, name, role: 'Contributor'}])
    setDraft('')
  }, [draft, nextKey])

  return (
    <Stack gap={2} style={{maxWidth: 520}}>
      {rows.map((row) => (
        <Card key={row._key} border padding={3} radius={2}>
          {/* Stack the preview lines: bare sibling <Text> elements collide because
              @sanity/ui applies optical negative margins, so title and subtitle overlap
              without an explicit gap between them. */}
          <Stack gap={2}>
            <Text size={1} weight="medium" textOverflow="ellipsis">
              {row.name}
            </Text>
            <Text size={1} muted textOverflow="ellipsis">
              {row.role}
            </Text>
          </Stack>
        </Card>
      ))}
      {/* The inline append row: a full-width capture field on its own line so the whole
          prompt is visible, with a primary Add control seated bottom-right — a real button,
          not an afterthought. Enter and the button do the same thing. */}
      <Card border padding={3} radius={2} tone="transparent">
        <Stack gap={3}>
          <TextInput
            placeholder="Add a contributor: type a name, then press Enter"
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') append()
            }}
          />
          <Flex align="center" gap={2} justify="flex-end">
            <Text size={1} muted style={{marginRight: 'auto'}}>
              Press Enter or use Add
            </Text>
            <Button text="Add" tone="primary" onClick={append} disabled={!draft.trim()} />
          </Flex>
        </Stack>
      </Card>
    </Stack>
  )
}

/**
 * The Recommended timing illustration for `inline-validation-timing`: a freshly-added item
 * that stays neutral until the first meaningful interaction, then validates. Real
 * `@sanity/ui` primitives (`TextInput`'s own `customValidity` ring supplies the critical
 * state) — a prop-driven demo of the target timing, not the Studio component.
 */
function TouchGatedItemDemo() {
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)
  const invalid = touched && !name.trim()

  return (
    <Stack gap={2} style={{maxWidth: 520}}>
      {/* An existing, valid item — neutral, for contrast. */}
      <Card border padding={3} radius={2}>
        <Stack gap={2}>
          <Text size={1} weight="medium">
            Jane Austen
          </Text>
          <Text size={1} muted>
            Novelist
          </Text>
        </Stack>
      </Card>
      {/* The freshly-added item: neutral on creation, critical only once touched-and-empty. */}
      <Card border padding={3} radius={2} tone={invalid ? 'critical' : 'default'}>
        <Stack gap={3}>
          <Text size={1} muted>
            New contributor
          </Text>
          <TextInput
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            onBlur={() => setTouched(true)}
            customValidity={invalid ? 'Required' : undefined}
          />
          <Text size={1} muted>
            {invalid
              ? 'Required. Validation engaged after you left the field empty, not on creation.'
              : 'Untouched: neutral tone, no error yet. Blur while empty to see validation engage.'}
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}

/**
 * In context: the Contributors array as one field of the "Anna Karenina" book being
 * edited, sitting beside the document's Title. This is the array input doing its
 * everyday job: a live `FormBuilder` over a real document, its two contributor rows
 * resolved, editable and reorderable, rather than an isolated add-flow or a defect
 * repro. Edit the title, open or reorder a contributor, or append another: every change
 * patches the same document.
 */
export const InContext: Story = {
  name: 'In context',
  parameters: {controls: {include: []}},
  render: () => (
    <div style={{maxWidth: 560}}>
      <FormBuilderHarness
        id="array-in-context"
        documentType="bookEntry"
        height={420}
        initialDocument={{
          title: 'Anna Karenina',
          contributors: [
            {_key: 'c1', _type: 'author', name: 'Leo Tolstoy', role: 'Author'},
            {_key: 'c2', _type: 'author', name: 'Virginia Woolf', role: 'Introduction'},
          ],
        }}
      />
    </div>
  ),
}
