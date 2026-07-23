import {type Container, defineContainer} from '@portabletext/editor'
import {useMemo} from 'react'
import {
  type ArraySchemaType,
  type FormPatch,
  type ObjectInputProps,
  type ObjectSchemaType,
  type Path,
  PatchEvent,
  type PortableTextInputProps,
  type PortableTextPluginsProps,
} from 'sanity'

import {packageTableValue, rerootPatches, type StandaloneTableValue, TABLE_SHAPE} from '../helpers'
import {fromSyntheticPath, toSyntheticPath} from './pathBridge'

/**
 * Spike R1 — the bridge that lets Studio's real {@link PortableTextInput} edit
 * the standalone table object.
 *
 * The POC input mounts a *bare* `EditorProvider` and re-implements the table
 * chrome with `defineContainer` render props. Route 1 asks the opposite
 * question: what does it cost to mount Studio's own `PortableTextInput` — so
 * presence cursors, comment range-decorations, and in-editor block-object
 * editing come from Studio's machinery instead of being re-built?
 *
 * `PortableTextInput` takes {@link PortableTextInputProps} — a specialization
 * of `ArrayOfObjectsInputProps`. It believes it is editing a Portable Text
 * *array*. So this bridge fabricates, from the object field's
 * {@link ObjectInputProps}, the array-shaped props it expects:
 *
 *  - **schemaType** — a synthetic `ArraySchemaType` whose single block-object
 *    member is the table object, with the built-in table plugin bound to the
 *    table's own `rows`/`cells`/`value` shape (see {@link useSyntheticArraySchemaType}).
 *  - **value** — the object packaged as a one-block PT value ({@link packageTableValue}).
 *  - **onChange** — editor patches are rooted at the synthetic block; strip that
 *    root and forward granular patches on the real field paths ({@link rerootPatches}).
 *  - **focusPath / onPathFocus** — translated in both directions across the
 *    synthetic-root boundary ({@link toSyntheticPath} / `fromSyntheticPath`).
 *  - **members** — THE CRUX, and the documented boundary. See the extended note
 *    on {@link synthesizeArrayInputProps} below.
 *
 * TS note: several props require internal form-store types that cannot be
 * honestly constructed from a custom input (see SPIKE-NOTES.md). Those are
 * annotated with `@ts-expect-error` describing the invariant being bent, per
 * the spike's method guidance — no silent `as any`.
 */

// ---------------------------------------------------------------------------
// 1. Synthetic array schema + table plugin binding
// ---------------------------------------------------------------------------

/**
 * The three table plugin containers, one per role, bound to the standalone
 * table's own type + field names via {@link TABLE_SHAPE}. `@portabletext/plugin-table`
 * (through Studio's `PortableTextTablePlugin`) owns the nesting; we only supply
 * the type/arrayField bindings and, for `table`, a render. Row/cell renders are
 * intentionally omitted so Studio's own defaults (the reference row/cell UI)
 * fill in — that is where the "real chrome" comes from.
 *
 * Defined at module scope: the plugin warns and re-registers if the containers
 * object identity changes between renders.
 */
const tableContainers = {
  table: defineContainer({
    type: TABLE_SHAPE.table.type,
    arrayField: TABLE_SHAPE.table.arrayField,
  }) as Container,
  row: defineContainer({
    type: TABLE_SHAPE.row.type,
    arrayField: TABLE_SHAPE.row.arrayField,
  }) as Container,
  cell: defineContainer({
    type: TABLE_SHAPE.cell.type,
    arrayField: TABLE_SHAPE.cell.arrayField,
  }) as Container,
}

/**
 * The plugins component Studio's `PortableTextEditorPlugins` looks up at
 * `schemaType.components.portableText.plugins`. It enables the (opt-in) table
 * plugin and points it at our containers, keeping every other built-in plugin
 * (markdown, paste-link, typography) at its default via `renderDefault`.
 *
 * This is the officially-supported extension point for "adopting a table shape
 * that already exists in your dataset" (see the `table.containers` docs on
 * `PortableTextPluginsProps`) — the reason route 1 is even plausible.
 */
export function StandaloneTablePlugins(props: PortableTextPluginsProps): React.JSX.Element {
  return props.renderDefault({
    ...props,
    plugins: {
      ...props.plugins,
      table: {enabled: true, containers: tableContainers},
    },
  })
}

/**
 * Build the synthetic `ArraySchemaType` that `PortableTextInput` edits.
 *
 * The honest cost lives here. `PortableTextInput` needs a *compiled*
 * `ArraySchemaType<PortableTextBlock>` — `sanitySchemaToPortableTextSchema`,
 * the member-schema-types provider, and the editor schema all read it. There
 * is no public factory that compiles a schema type from a definition at
 * runtime, so a fully-faithful synthetic type cannot be built from outside the
 * schema pipeline.
 *
 * What we CAN do cheaply, and what this spike does: reuse the *already-compiled*
 * pieces reachable from the object schema type:
 *
 *  - the cell's `value` array — a real compiled PT array carrying the block,
 *    image, and inlineNote member types (the text config the editor needs at
 *    top level so cell text renders with the right decorators/styles);
 *  - the table object type itself — a valid block-object member type.
 *
 * We graft them into a synthetic array and hang the plugins component off
 * `components.portableText.plugins`. The result is structurally a PT array of
 * `[block, image, inlineNote?, standaloneTableObject]`.
 *
 * FRAGILITY (annotated, see SPIKE-NOTES.md): the synthetic array's identity,
 * `name`, and parent `type` chain are fabricated, not compiler-produced. This
 * is the single biggest reason the ship version wants route 2 (define the PT
 * array type in the schema so the compiler produces it) rather than fabricating
 * it in a custom input.
 */
export function useSyntheticArraySchemaType(objectSchemaType: ObjectSchemaType): ArraySchemaType {
  return useMemo(() => {
    const cellValueArray = findCellValueArrayType(objectSchemaType)

    // The compiled member types the editor's flat schema needs at top level.
    // Cell text config (block + inline objects) comes from the cell's `value`
    // array; the table object is added so the single packaged block validates.
    const of = [...(cellValueArray?.of ?? []), objectSchemaType]

    const synthetic = {
      jsonType: 'array' as const,
      name: `${objectSchemaType.name}__syntheticPtArray`,
      type: cellValueArray?.type,
      of,
      options: {},
      // The extension point that binds the table plugin to our shape.
      components: {
        portableText: {
          plugins: StandaloneTablePlugins,
        },
      },
    }

    // @ts-expect-error — fabricated compiled schema type: `name`/`type`/identity
    // are not produced by the schema compiler. Faithful only for the fields the
    // PT input actually reads (jsonType, of, components); see SPIKE-NOTES.md.
    return synthetic as ArraySchemaType
  }, [objectSchemaType])
}

/**
 * Walk the compiled object schema `table → rows → row → cells → cell → value`
 * to reach the cell's editable-content array type. Returns `undefined` if the
 * schema does not match the expected nesting (the shape is asserted, not
 * guessed — route 2 would infer this from convention).
 */
function findCellValueArrayType(objectSchemaType: ObjectSchemaType): ArraySchemaType | undefined {
  const rows = findArrayField(objectSchemaType, TABLE_SHAPE.table.arrayField)
  const row = firstObjectMember(rows)
  const cells = row && findArrayField(row, TABLE_SHAPE.row.arrayField)
  const cell = firstObjectMember(cells)
  const value = cell && findArrayField(cell, TABLE_SHAPE.cell.arrayField)
  return value
}

function findArrayField(
  objectType: ObjectSchemaType,
  fieldName: string,
): ArraySchemaType | undefined {
  const field = objectType.fields?.find((f) => f.name === fieldName)
  if (field && field.type.jsonType === 'array') {
    return field.type as ArraySchemaType
  }
  return undefined
}

function firstObjectMember(arrayType: ArraySchemaType | undefined): ObjectSchemaType | undefined {
  const member = arrayType?.of?.find((m) => m.jsonType === 'object')
  return member as ObjectSchemaType | undefined
}

// ---------------------------------------------------------------------------
// 2. Prop synthesis — object props -> PortableTextInputProps
// ---------------------------------------------------------------------------

/**
 * Synthesize the full {@link PortableTextInputProps} from the object field's
 * {@link ObjectInputProps} plus the synthetic array schema type.
 *
 * ## The `members` boundary (the crux, documented, not faked)
 *
 * `PortableTextInput` derives its interactive block model from `props.members`
 * — an `ArrayOfObjectsItemMember[]` whose single item is the root block, whose
 * `.item` (an `ObjectFormNode`) carries the *full recursive form-state subtree*
 * for the rows/cells/value nesting, with **every node path expressed in
 * synthetic array space** (`[{_key:'root'}, 'rows', …]`). That tree drives:
 *   - object-block / annotation / inline-object editing dialogs (each member
 *     item builds a `<FormInput>` the editor opens on double-click);
 *   - block-level presence / validation / comment / change flagging.
 *
 * We receive the object's *field-space* member tree (`props.members`: the `rows`
 * field member, whose descendants are keyed `['rows', …]`). Turning it into the
 * array-space tree the PT input needs requires one of:
 *   1. `createPrepareFormState()` — the store factory that builds these nodes.
 *      NOT exported from `sanity` (only `useFormState` is, and it needs a
 *      *compiled* synthetic `ObjectSchemaType` we cannot produce at runtime —
 *      see {@link useSyntheticArraySchemaType}).
 *   2. A deep recursive re-root of the received node tree: rewrite `.path` on
 *      every `ObjectFormNode` and every member, plus `focusPath`, `id`, and
 *      `level`, to insert the `{_key:'root'}` segment. This depends on internal
 *      node invariants (path/id derivation, `_allMembers`, presence keying)
 *      that are not part of the public contract and would silently rot.
 *
 * Neither is constructible *honestly* from a custom input, so this spike passes
 * `members: []`. Consequence, verified against the input's own code
 * (`usePortableTextMemberItemsFromProps`): the editor still mounts, text is
 * editable, table chrome and presence cursors (context-fed, not member-fed)
 * still work — but **in-editor block-object editing does not open**, and
 * block-level validation/comment flagging is absent. This is the precise line
 * where route 1 stops being free.
 */
export function synthesizeArrayInputProps(
  props: ObjectInputProps<StandaloneTableValue>,
  syntheticSchemaType: ArraySchemaType,
): PortableTextInputProps {
  const {value, onChange, onPathFocus, focusPath} = props

  // Editor patches arrive rooted at the synthetic block; strip that segment and
  // forward granular patches on the real field paths. `rerootPatches` drops any
  // patch not rooted at `{_key:'root'}` (incl. whole-value sets), so the object
  // field can never gain a sibling block — the same choke point as the POC.
  const handleChange = (patch: FormPatch | FormPatch[] | PatchEvent) => {
    const patches = normalizePatches(patch)
    const rerooted = rerootPatches(patches as Array<{path: Path; type?: string}>)
    if (rerooted.length > 0) {
      onChange(PatchEvent.from(rerooted as FormPatch[]))
    }
  }

  // Focus reports come back in synthetic space (block-rooted, possibly with a
  // trailing `text` span segment). Strip the root before telling the field; a
  // non-rooted/foreign focus (null) collapses to field-level focus.
  const handlePathFocus = (nextPath: Path) => {
    onPathFocus(fromSyntheticPath(nextPath) ?? [])
  }

  return {
    ...(props as unknown as PortableTextInputProps),
    schemaType: syntheticSchemaType,
    // Package the object as a one-block PT value the editor renders.
    value: packageTableValue(value) as PortableTextInputProps['value'],
    // Field focusPath -> synthetic array space so the input's own focus
    // tracking and the editor selection agree.
    focusPath: toSyntheticPath(focusPath ?? []),
    onChange: handleChange,
    onPathFocus: handlePathFocus,
    // The documented boundary — see the JSDoc above.
    members: [],

    // Array-only callbacks the object field never provides. They are only
    // reachable through array chrome (array functions bar, DnD, uploads) that
    // this disguised single-block editor never shows, so no-ops are honest
    // here. Annotated rather than cast so the gap is visible.
    // @ts-expect-error — array item callbacks absent on ObjectInputProps
    onItemAppend: noop,
    // @ts-expect-error — array item callbacks absent on ObjectInputProps
    onItemPrepend: noop,
    // @ts-expect-error — array item callbacks absent on ObjectInputProps
    onItemRemove: noop,
    // @ts-expect-error — array item callbacks absent on ObjectInputProps
    onItemMove: noop,
    // @ts-expect-error — array item callbacks absent on ObjectInputProps
    onInsert: noop,
    // @ts-expect-error — array item callbacks absent on ObjectInputProps
    onIndexFocus: noop,
    // @ts-expect-error — array upload/init resolvers absent on ObjectInputProps
    resolveInitialValue: async () => ({_key: 'x'}),
    // @ts-expect-error — array upload/init resolvers absent on ObjectInputProps
    resolveUploader: () => null,
    // @ts-expect-error — array upload/init resolvers absent on ObjectInputProps
    onUpload: noop,
  }
}

function normalizePatches(patch: FormPatch | FormPatch[] | PatchEvent): FormPatch[] {
  if (Array.isArray(patch)) return patch
  if (patch instanceof PatchEvent) return patch.patches as FormPatch[]
  return [patch]
}

function noop() {
  // intentionally empty — see synthesizeArrayInputProps
}
