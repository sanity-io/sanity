import {type ArraySchemaType, type ObjectSchemaType, type Path} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback} from 'react'
import {userEvent, within} from 'storybook/test'

// Real components from real paths (org contract §8). Both of them, deliberately: this page is
// the comparison of two siblings, not one component.
import {ArrayOfObjectsFunctions} from '../../../../packages/sanity/src/core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsFunctions'
import {ArrayOfPrimitivesFunctions} from '../../../../packages/sanity/src/core/form/inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesFunctions'
import {ArrayValidationProvider} from '../../../../packages/sanity/src/core/form/inputs/arrays/common/ArrayValidationContext'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {WithStudioProviders} from '../../lib/testProvider'
import {OverlayFrame} from '../overlays/OverlayFrame'

const noop = () => undefined

/* ── The schema ───────────────────────────────────────────────────────────
   One document type, one array field per state the two files can be in. `objectsSingle` and
   `primitivesSingle` carry `validation: (Rule) => Rule.max(2)` so the max-reached branch runs
   through the real rule, not a hand-built context value. `objectsMulti` sets
   `options.insertMenu.filter: true` so its search box shows with only two candidate types - the
   real default only shows it past five, and two is enough to make the point without a schema
   full of filler types. */

const objectMemberTypes = [
  {
    name: 'quote',
    title: 'Quote',
    type: 'object',
    fields: [{name: 'text', title: 'Text', type: 'string'}],
    preview: {select: {title: 'text'}},
  },
  {
    name: 'note',
    title: 'Note',
    type: 'object',
    fields: [{name: 'body', title: 'Body', type: 'string'}],
    preview: {select: {title: 'body'}},
  },
]

const schemaTypes = [
  ...objectMemberTypes,
  {
    name: 'arrayFunctionsHost',
    title: 'Array functions host',
    type: 'document',
    fields: [
      {
        name: 'objectsSingle',
        title: 'Objects, single candidate type',
        type: 'array',
        of: [{type: 'quote'}],
        validation: (Rule: any) => Rule.max(2),
      },
      {
        name: 'objectsMulti',
        title: 'Objects, two candidate types',
        type: 'array',
        of: [{type: 'quote'}, {type: 'note'}],
        options: {insertMenu: {filter: true}},
      },
      {
        name: 'objectsHidden',
        title: 'Objects, add disabled',
        type: 'array',
        of: [{type: 'quote'}],
        options: {disableActions: ['add']},
      },
      {
        name: 'primitivesSingle',
        title: 'Primitives, single candidate type',
        type: 'array',
        of: [{type: 'string'}],
        validation: (Rule: any) => Rule.max(2),
      },
      {
        name: 'primitivesMulti',
        title: 'Primitives, two candidate types',
        type: 'array',
        of: [
          {type: 'string', title: 'Text'},
          {type: 'number', title: 'Number'},
        ],
      },
      {
        name: 'primitivesHidden',
        title: 'Primitives, add disabled',
        type: 'array',
        of: [{type: 'string'}],
        options: {disableActions: ['add']},
      },
    ],
  },
]

/* ── Pulling real, compiled ArraySchemaTypes out of the real schema ─────────
   Both functions read `schemaType.options` and `schemaType.validation`-derived state, neither of
   which exists on a hand-written literal until `createWorkspaceFromConfig` (inside
   `WithStudioProviders`) has run it through the real schema compiler. Reading the field back off
   `useSchema()` is the only way `max` becomes a real `Rule` instance rather than the function that
   declared it - see `getValidationRule`, which throws if handed an uncompiled `validation`. */

function useArrayFieldType(fieldName: string): ArraySchemaType {
  const schema = useSchema()
  const hostType = schema.get('arrayFunctionsHost') as ObjectSchemaType
  const field = hostType.fields.find((f) => f.name === fieldName)
  if (!field) {
    throw new Error(`arrayFunctionsHost has no field named "${fieldName}"`)
  }
  return field.type as ArraySchemaType
}

interface CaseProps {
  fieldName: string
  readOnly?: boolean
  itemCount?: number
  testId: string
}

function ObjectsCase({fieldName, readOnly, itemCount = 0, testId}: CaseProps) {
  const schemaType = useArrayFieldType(fieldName)
  const onValueCreate = useCallback(
    (type: {name?: string}) => ({_key: 'demo', _type: type.name}),
    [],
  )
  return (
    <ArrayValidationProvider schemaType={schemaType} itemCount={itemCount}>
      <Card border padding={2} radius={0} data-testid={testId} style={{width: 260}}>
        <ArrayOfObjectsFunctions
          schemaType={schemaType}
          readOnly={readOnly}
          onValueCreate={onValueCreate as never}
          onItemAppend={noop}
          onItemPrepend={noop}
          onChange={noop}
          path={[] as Path}
        >
          {null}
        </ArrayOfObjectsFunctions>
      </Card>
    </ArrayValidationProvider>
  )
}

function PrimitivesCase({fieldName, readOnly, itemCount = 0, testId}: CaseProps) {
  const schemaType = useArrayFieldType(fieldName)
  const onValueCreate = useCallback(
    (type: {name?: string}) => (type.name === 'number' ? 0 : ''),
    [],
  )
  return (
    <ArrayValidationProvider schemaType={schemaType} itemCount={itemCount}>
      <Card border padding={2} radius={0} data-testid={testId} style={{width: 260}}>
        <ArrayOfPrimitivesFunctions
          schemaType={schemaType}
          readOnly={readOnly}
          onValueCreate={onValueCreate as never}
          onItemAppend={noop}
          onItemPrepend={noop}
          onChange={noop}
          path={[] as Path}
        >
          {null}
        </ArrayOfPrimitivesFunctions>
      </Card>
    </ArrayValidationProvider>
  )
}

/** Both siblings, same state, side by side - the comparison this page exists to make checkable. */
function Pair({
  label,
  note,
  objectsField,
  primitivesField,
  readOnly,
  itemCount,
  testIdPrefix,
}: {
  label: string
  note: string
  objectsField: string
  primitivesField: string
  readOnly?: boolean
  itemCount?: number
  testIdPrefix: string
}) {
  return (
    <Stack gap={3}>
      <Text size={1} weight="semibold">
        {label}
      </Text>
      <Text muted size={1}>
        {note}
      </Text>
      <Flex gap={4} wrap="wrap">
        <Stack gap={2}>
          <Text muted size={0} weight="medium">
            ArrayOfObjectsFunctions
          </Text>
          <ObjectsCase
            fieldName={objectsField}
            readOnly={readOnly}
            itemCount={itemCount}
            testId={`${testIdPrefix}-objects`}
          />
        </Stack>
        <Stack gap={2}>
          <Text muted size={0} weight="medium">
            ArrayOfPrimitivesFunctions
          </Text>
          <PrimitivesCase
            fieldName={primitivesField}
            readOnly={readOnly}
            itemCount={itemCount}
            testId={`${testIdPrefix}-primitives`}
          />
        </Stack>
      </Flex>
    </Stack>
  )
}

const meta: Meta = {
  title: 'Forms & Input/Array Functions',
  parameters: {
    docs: {
      description: {
        component: [
          'Two files answer the same four questions about adding an array item, one for objects ' +
            'and one for primitives, and reading them side by side is the only way to catch where ' +
            'their labels have quietly stopped agreeing with themselves.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsFunctions.tsx` and `packages/sanity/src/core/form/inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesFunctions.tsx` |',
          '| Tier | CORE. The add/insert control rendered under every array field in the Studio, whether the array holds objects or primitives |',
          '| Audit | 🟡 needs-work (`sibling-drift`). The two files share one control-flow shape (four `if`/early-return branches, in the same order) but their internal labelling has drifted apart in ways a reader comparing only one file at a time would not catch |',
          '| Patterns | `sibling-drift` |',
          '',
          'The add-item affordance under an array input, not the list of items, just the control ' +
            'that lets an author put a new one in. `ArrayOfObjectsInput` and `ArrayOfPrimitivesInput` ' +
            'each own a version of it, and the two are read here side by side rather than one at a time.',
          '',
          '**What reading both files turned up.**',
          '',
          '<details><summary><b>The four branches line up exactly.</b></summary>\n\n' +
            "`schemaType.options?.disableActions?.includes('add')` returns `null` first " +
            '(ArrayOfObjectsFunctions.tsx:82-84, ArrayOfPrimitivesFunctions.tsx:44-46); then ' +
            '`readOnly` returns a disabled button under a tooltip (:86-94 / :48-63); then ' +
            '`maxReached` (from the shared `useArrayValidation()`) returns the same shape with a ' +
            'different tooltip (:96-104 / :65-80); then the enabled case renders one button for a ' +
            'single candidate type or a button-plus-menu for more than one. Every branch is in the ' +
            'same order in both files.\n\n</details>',
          '',
          '<details><summary><b>The `data-testid` values do not agree with themselves.</b></summary>\n\n' +
            'Objects is consistent: `add-read-object-button`, `add-max-reached-object-button`, ' +
            '`add-single-object-button`, `add-multiple-object-button`, each name matches the state ' +
            'it marks. Primitives is not: the read-only button carries `add-single-primitive-button` ' +
            '(ArrayOfPrimitivesFunctions.tsx:53), and the single-candidate-type button, the actual ' +
            '"add one item" case, carries `add-multiple--primitive-button` (:86, with a stray double ' +
            'dash). The two labels that should distinguish "read-only" from "one type available" ' +
            'instead say "single" and "multiple", and neither says what it marks. A test written ' +
            'against either string by name would be testing the wrong state.\n\n</details>',
          '',
          '<details><summary><b>The multi-type button on the primitives side has no `data-testid` at all.</b></summary>\n\n' +
            'Objects tags all four of its interactive buttons; primitives tags three of four, the ' +
            '`MenuButton` trigger for two-or-more candidate types (:94-120) is the one left ' +
            'unmarked.\n\n</details>',
          '',
          '<details><summary><b>The multi-type menus are not the same component.</b></summary>\n\n' +
            'Objects opens the real `InsertMenu` (`packages/sanity/src/insert-menu/InsertMenu.tsx`) ' +
            'through `useInsertMenuPopover` (ArrayOfObjectsFunctions.tsx:65-80): schema-configurable ' +
            'search, grouping and a grid/list toggle, shown here via `options.insertMenu.filter: ' +
            'true`. Primitives opens a plain `@sanity/ui` `MenuButton`/`Menu` ' +
            '(ArrayOfPrimitivesFunctions.tsx:94-120) with none of that, plus a reference-icon ' +
            'fallback chain (:101-106) objects does not need at this layer. Not a bug on its own, ' +
            'primitive candidates are rarely many enough to need search, but it means "the insert ' +
            'menu" is two different pieces of UI depending on which array shape asked for ' +
            'one.\n\n</details>',
          '',
          '<details><summary><b>Only the objects side logs telemetry on insert.</b></summary>\n\n' +
            '`handleAddBtnClick` in ArrayOfObjectsFunctions.tsx:42-49 logs `CreatedNewObject` with ' +
            'an `origin` distinguishing the tree-editing dialog from the default add. The ' +
            'primitives equivalent (:31-33) calls `insertItem` directly and logs nothing. Whether ' +
            'that is deliberate (a primitive value is not "an object created") or a gap is not ' +
            'answerable from these two files alone.\n\n</details>',
          '',
          '> **Why it matters:** read-only and max reached explain themselves identically on both ' +
            'sides, same disabled button, same tooltip copy. Add-disabled explains nothing on ' +
            'either side; the control simply is not there. That much is consistent. What is not ' +
            'consistent is the layer underneath: two siblings that answer the same four questions ' +
            'the same way on screen are wired to a labelling vocabulary that no longer describes ' +
            'what it is pointing at.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders({config: {schema: {name: 'storybook', types: schemaTypes}}})],
  tags: [
    'autodocs',
    'chapter:forms',
    'pattern:sibling-drift',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/**
 * `schemaType.options?.disableActions?.includes('add')` returns `null` before either component
 * reads `readOnly` or `maxReached`. Both bordered boxes below are empty on purpose - there is no
 * button, no tooltip, and nothing in either file that surfaces why the affordance is gone.
 */
export const AddDisabled: Story = {
  name: 'Add disabled (disableActions)',
  render: () => (
    <Pair
      label="Add disabled - schemaType.options.disableActions includes 'add'"
      note="Both files: return null. No button, no tooltip, no reason given."
      objectsField="objectsHidden"
      primitivesField="primitivesHidden"
      testIdPrefix="add-disabled"
    />
  ),
}

/**
 * `readOnly` is checked second, before `maxReached`. Same shape on both sides - `Tooltip` around
 * a disabled `Button` - and the same tooltip copy (`inputs.array.read-only-label`, "This field is
 * read-only"). Only the primitives button's `data-testid` disagrees with what it marks (see the
 * component docblock, point 2).
 */
export const ReadOnly: Story = {
  render: () => (
    <Pair
      label="Read-only"
      note="Disabled button, tooltip: 'This field is read-only'. Identical copy on both sides."
      objectsField="objectsSingle"
      primitivesField="primitivesSingle"
      readOnly
      testIdPrefix="read-only"
    />
  ),
}

/**
 * `maxReached` comes from the shared `useArrayValidation()` context - the same hook, the same
 * `ArrayValidationProvider`, consumed independently by both files. The schema below declares
 * `Rule.max(2)`; `itemCount` is set to 2 to trip it for real, through the real validation rule,
 * not a hand-built context value.
 */
export const MaxReached: Story = {
  render: () => (
    <Pair
      label="Max reached - schema max: 2, itemCount: 2"
      note="Disabled button, tooltip: 'Maximum items reached'. Identical copy on both sides."
      objectsField="objectsSingle"
      primitivesField="primitivesSingle"
      itemCount={2}
      testIdPrefix="max-reached"
    />
  ),
}

/**
 * One candidate type: both files skip the menu entirely and wire the button straight to
 * `onValueCreate`/`onItemAppend`. Same trigger copy ("Add item"), same layout - the `data-testid`
 * drift (point 2 above) is the only difference, and it is invisible on screen.
 */
export const EnabledSingleType: Story = {
  name: 'Enabled, one candidate type',
  render: () => (
    <Pair
      label="Enabled, one candidate type ('Add item')"
      note="Same button, same copy. add-single-object-button vs. add-multiple--primitive-button underneath - see finding 2."
      objectsField="objectsSingle"
      primitivesField="primitivesSingle"
      testIdPrefix="enabled-single"
    />
  ),
}

/**
 * Two or more candidate types on the objects side opens the real `InsertMenu` - search box shown
 * here via `options.insertMenu.filter: true`. Played open on mount so the difference from the
 * primitives menu (next story) is visible without a click.
 *
 * CORRECTION, verified live against the unfixed static build (chrome devtools,
 * iframe.html?id=forms-input-array-functions--docs&viewMode=docs, 1280x900): this defect is
 * DOCS-MODE ONLY.
 * `viewMode=story` gives the story the whole iframe and never clips. The docs page stacks every
 * story inside a fixed inline canvas (`.sbdocs .docs-story { max-height: 60vh; overflow: auto }`,
 * preview-head.html), and that canvas's rendered height hugs the CLOSED-state content (measured
 * 91px) before the popover ever opens - there is no floor.
 *
 * BEFORE, measured live at 1280x900 in `viewMode=docs` (fresh page, single click each time):
 * closed frame 91px; trigger's own bottom edge 62px into it; `InsertMenu`'s natural content
 * (search row + 1px border + two `MenuItem`s) is 120px (`[data-ui="Menu"].scrollHeight`).
 * `data-placement="top"` on open, `max-height: 21px` - it does not run out of room below the
 * trigger and shrink in place, it FLIPS above it, where there is almost none. Ruled out every
 * container-size explanation live, on the unfixed build, before reaching for `fallbackPlacements`:
 * stripped `.docs-story`'s own overflow and max-height entirely (still top/21px), forced the
 * wrapping `Grid` (the `referenceBoundary` prop, ArrayOfObjectsFunctions.tsx:77) to 400px tall
 * post-render so React could not reset it (still top/21px), grew the viewport to 2200px tall
 * (still top/21px). None of it moved the needle - this is not the primitives story's shortfall.
 * Independently re-confirmed `viewMode=story` is genuinely clean (not just taking the earlier
 * all-clear on faith): fresh load, `data-placement="bottom"`, `max-height: 830px`, popover
 * renders its full natural 120px.
 *
 * The one remaining lever: `useInsertMenuPopover`'s `floatingBoundary` (InsertMenuPopover.tsx:70,
 * `editDialogOuterBoundary?.element ?? undefined`) falls through to the ambient
 * `BoundaryElementProvider`, which resolves to nothing without this wrapper - `OverlayFrame`
 * supplies it. This cannot be simulated with a DOM-only test the way the primitives story's fix
 * could (it needs a real React context, not a resized element), so PREDICTION, written down
 * before the rebuild rather than after: post-rebuild in `viewMode=docs`, expect
 * `data-placement="bottom"`, `max-height` roughly 200-250px (a ~320px boundary minus the 62px
 * trigger offset minus card padding), and the popover rendering its full 120px, unclamped. If the
 * rebuild instead still shows `top`/~21px, this fix did not address this story and the flip
 * itself needs a ledger entry, not another story-side attempt.
 */
export const EnabledMultipleTypesObjects: Story = {
  name: 'Enabled, two candidate types - ArrayOfObjectsFunctions (menu open)',
  render: () => (
    <OverlayFrame>
      <ObjectsCase fieldName="objectsMulti" testId="multi-objects-open" />
    </OverlayFrame>
  ),
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('add-multiple-object-button'))
    await within(canvasElement.ownerDocument.body).findByPlaceholderText('Search')
  },
  parameters: {
    docs: {
      description: {
        story:
          '`useInsertMenuPopover` (ArrayOfObjectsFunctions.tsx:65-80) opens the real `InsertMenu` (`packages/sanity/src/insert-menu/InsertMenu.tsx`): a search box, optional grouped tabs, and an optional grid/list toggle, all schema-configurable through `schemaType.options.insertMenu`. The search box here comes from `options.insertMenu.filter: true` on `objectsMulti` - the count-based default only shows it past five candidate types, and this schema only declares two.',
      },
    },
  },
}

/**
 * The primitives equivalent: a plain `@sanity/ui` `MenuButton`/`Menu`, no search, no groups, no
 * view toggle - and no `data-testid` on the trigger, unlike every other button in this file.
 * Played open on mount so the comparison with the previous story does not require a click.
 *
 * CORRECTION, verified live the same way as the objects story above: also DOCS-MODE ONLY, and
 * this one really is the plain container-size shortfall the objects story turned out NOT to be.
 *
 * BEFORE, measured live at 1280x900 in `viewMode=docs` (fresh page): closed frame 91px, trigger
 * bottom at the same 62px offset, `data-placement="bottom"` (correct side, unlike the objects
 * story), `data-ui="MenuButton__popover"` clamps to `max-height: 21.0156px` on open - this is the
 * exact defect the reviewer described, a "Text" `MenuItem` sliced through mid-row, screenshotted
 * live. The Menu's own natural content is 78px (`scrollHeight`), so it is short by 57px (78-21).
 * Independently re-confirmed `viewMode=story` is clean on a fresh load: `max-height: 830px`,
 * renders its full natural 78px, unclamped.
 *
 * Confirmed the fix lever directly, on a fresh page each time (an earlier attempt that chained
 * two toggles in one script gave a false negative - state from the first close leaked into the
 * second open, a reminder to isolate each measurement): forcing `.innerZoomElementWrapper` to
 * exactly `OverlayFrame`'s own default, 320px, raised the available `max-height` to 250px and the
 * popover rendered its full 78px, unclamped - 172px of margin over what it needs. PREDICTION,
 * written down before the rebuild: post-rebuild in `viewMode=docs`, expect `data-placement`
 * unchanged at `bottom`, `max-height` on the order of 200-250px, popover height 78px. This is a
 * plain size fix (unlike the objects story's boundary/flip problem above), so this prediction
 * should hold with higher confidence than that one.
 */
export const EnabledMultipleTypesPrimitives: Story = {
  name: 'Enabled, two candidate types - ArrayOfPrimitivesFunctions (menu open)',
  render: () => (
    <OverlayFrame>
      <PrimitivesCase fieldName="primitivesMulti" testId="multi-primitives-open" />
    </OverlayFrame>
  ),
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    // No data-testid on this trigger (ArrayOfPrimitivesFunctions.tsx:94-96) - found by role
    // instead, which the objects story above does not need to do.
    await userEvent.click(await canvas.findByRole('button', {name: 'Add item...'}))
    await within(canvasElement.ownerDocument.body).findByText('Number')
  },
  parameters: {
    docs: {
      description: {
        story:
          'No `useInsertMenuPopover` on this side: the trigger opens a plain `@sanity/ui` `MenuButton`/`Menu` (ArrayOfPrimitivesFunctions.tsx:94-120), built with a reference-icon fallback chain (:101-106) the objects side does not carry at this layer. No search, no groups, no view toggle, and - unlike the read-only, max-reached and single-type buttons in the same file - no `data-testid`.',
      },
    },
  },
}

/**
 * All five states, both files, stacked. The break in labelling (point 2 in the component
 * docblock) is only visible when the two are read together, which is the reason this page pairs
 * them rather than giving each file its own story.
 */
export const AllStates: Story = {
  name: 'All states (matrix)',
  parameters: {controls: {include: []}},
  render: () => (
    <Stack gap={6} style={{maxWidth: 680}}>
      <Pair
        label="1 · Add disabled"
        note="Both files: return null."
        objectsField="objectsHidden"
        primitivesField="primitivesHidden"
        testIdPrefix="matrix-add-disabled"
      />
      <Pair
        label="2 · Read-only"
        note="Tooltip: 'This field is read-only'."
        objectsField="objectsSingle"
        primitivesField="primitivesSingle"
        readOnly
        testIdPrefix="matrix-read-only"
      />
      <Pair
        label="3 · Max reached"
        note="Tooltip: 'Maximum items reached'."
        objectsField="objectsSingle"
        primitivesField="primitivesSingle"
        itemCount={2}
        testIdPrefix="matrix-max-reached"
      />
      <Pair
        label="4 · Enabled, one candidate type"
        note="'Add item', wired straight to onValueCreate/onItemAppend."
        objectsField="objectsSingle"
        primitivesField="primitivesSingle"
        testIdPrefix="matrix-enabled-single"
      />
      <Pair
        label="5 · Enabled, two candidate types (closed)"
        note="'Add item...'. What opens underneath differs - see the two 'menu open' stories above."
        objectsField="objectsMulti"
        primitivesField="primitivesMulti"
        testIdPrefix="matrix-enabled-multi"
      />
    </Stack>
  ),
}
