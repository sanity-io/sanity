import {
  defineContainer,
  defineSchema,
  EditorProvider,
  type EditorEmittedEvent,
  type MutationEvent,
  PortableTextEditable,
  useEditor,
} from '@portabletext/editor'
import {defineBehavior} from '@portabletext/editor/behaviors'
import {BehaviorPlugin, EventListenerPlugin, NodePlugin} from '@portabletext/editor/plugins'
import {Card, Stack, Text} from '@sanity/ui'
import {type ReactElement, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  diffMatchPatch,
  type FormPatch,
  insert,
  type ObjectInputProps,
  type Path,
  PatchEvent,
  set,
  setIfMissing,
  unset,
} from 'sanity'

import {
  isEmptyTable,
  isInsideCellPath,
  packageTableValue,
  rerootPatches,
  scaffoldRows,
  type StandaloneTableValue,
  TABLE_SHAPE,
} from './helpers'

/**
 * Standalone table field POC — the disguised input.
 *
 * `standaloneTableObject` stores plain nested arrays, but this input edits it
 * through a real Portable Text editor:
 *
 *  1. {@link packageTableValue} wraps the object as a one-block PT value, keyed
 *     with a stable {@link ROOT_KEY}, so the editor sees a table *container*.
 *  2. Editing produces `mutation` events whose patch paths are rooted at that
 *     synthetic block. {@link rerootPatches} strips the leading `{_key:'root'}`
 *     segment; the survivors are converted to granular Studio form patches and
 *     emitted on the *real* field paths — never a whole-value `set()`.
 *  3. {@link UpdateValuePlugin} keeps the editor in sync when the field value
 *     changes from the outside (remote edits, undo), deduping our own echoes.
 *  4. Empty fields are scaffolded to a 3×3 grid, and re-scaffolded if the user
 *     deletes every row.
 *
 * The table chrome is deliberately minimal: containers render as CSS-`table`
 * `<div>`s via `defineContainer` render props. Studio's full in-PT table
 * chrome (packages/sanity's internal `TablePlugin`) is not reachable from
 * test-studio; see POC-NOTES.md for that and other deltas.
 */

const SCAFFOLD_ROWS = 3
const SCAFFOLD_COLS = 3
const EMPTY_PATH: Path = []

/** Random-ish key generator; unique enough for a scaffold/never collides with `root`. */
let keySeq = 0
function keyGenerator(): string {
  keySeq += 1
  return `k${keySeq.toString(36)}${(keySeq * 2654435761).toString(36).slice(-4)}`
}

// ---------------------------------------------------------------------------
// Editor schema + container rendering
// ---------------------------------------------------------------------------

// A flat PT schema. Text blocks only ever live inside cells, so the block
// config is the narrow cell config (styles normal/quote, decorators
// strong/underline, bullet list, no annotations) — matching the schema.
const editorSchema = defineSchema({
  decorators: [{name: 'strong'}, {name: 'underline'}],
  styles: [{name: 'normal'}, {name: 'blockquote'}],
  lists: [{name: 'bullet'}],
  annotations: [],
  inlineObjects: [{name: 'inlineNote', fields: [{name: 'text', type: 'string'}]}],
  blockObjects: [{name: 'image', fields: [{name: 'alt', type: 'string'}]}],
})

const cellStyle: React.CSSProperties = {
  display: 'table-cell',
  border: '1px solid var(--card-border-color, #e3e4e8)',
  padding: '6px 10px',
  verticalAlign: 'top',
  minWidth: 80,
}

// Container binding derived from TABLE_SHAPE — the single shape-declaration
// site (see helpers.ts; TODO(POC) there covers convention-based inference).
const tableContainers = [
  defineContainer({
    type: TABLE_SHAPE.table.type,
    arrayField: TABLE_SHAPE.table.arrayField,
    render: ({attributes, children}) => (
      <div
        {...attributes}
        style={{display: 'table', borderCollapse: 'collapse', width: '100%', margin: '4px 0'}}
      >
        {children}
      </div>
    ),
    of: [
      defineContainer({
        type: TABLE_SHAPE.row.type,
        arrayField: TABLE_SHAPE.row.arrayField,
        render: ({attributes, children}) => (
          <div {...attributes} style={{display: 'table-row'}}>
            {children}
          </div>
        ),
        of: [
          defineContainer({
            type: TABLE_SHAPE.cell.type,
            arrayField: TABLE_SHAPE.cell.arrayField,
            render: ({attributes, children}) => (
              <div {...attributes} style={cellStyle}>
                {children}
              </div>
            ),
          }),
        ],
      }),
    ],
  }),
]

// ---------------------------------------------------------------------------
// One-block invariant behaviors
// ---------------------------------------------------------------------------
//
// The authoritative guard is re-rooting: any block that is not the single
// `root` container produces patches that aren't rooted at `root` and get
// dropped, so the store can never gain a sibling top-level block. These
// behaviors are a UX layer on top — they stop the editor from *transiently*
// creating structural siblings while the caret is at the table/row level
// (as opposed to inside a cell, where breaks and block inserts are normal).
// Best-effort and not runtime-verified in this environment; see POC-NOTES.md.
const oneBlockInvariantBehaviors = [
  // Swallow whole-block inserts (paste/drag) aimed at the top level. Inserts
  // whose selection is inside a cell (`…/value/…`) are forwarded untouched.
  defineBehavior({
    on: 'insert.block',
    guard: ({snapshot}) => !isInsideCellPath(snapshot.context.selection?.focus.path),
    actions: [() => []],
  }),
  defineBehavior({
    on: 'insert.blocks',
    guard: ({snapshot}) => !isInsideCellPath(snapshot.context.selection?.focus.path),
    actions: [() => []],
  }),
]

// ---------------------------------------------------------------------------
// Editor <-> form bridge helpers
// ---------------------------------------------------------------------------

/**
 * Convert one re-rooted editor patch to a granular Studio form patch. Returns
 * `null` (and warns) for a patch that would target the whole object value
 * (empty path) or a patch type we don't translate — upholding the
 * "never a whole-value set()" invariant at the emission boundary.
 */
function toFormPatch(patch: MutationEvent['patches'][number]): FormPatch | null {
  const path = patch.path
  if (path.length === 0) {
    console.warn(
      '[standaloneTable] dropped a whole-value patch (empty path after re-rooting):',
      patch,
    )
    return null
  }
  switch (patch.type) {
    case 'set':
      return set(patch.value, path)
    case 'setIfMissing':
      return setIfMissing(patch.value, path)
    case 'unset':
      return unset(path)
    case 'insert':
      if (patch.position === 'replace') {
        // Studio's insert only supports before/after; a single-item replace
        // maps cleanly to a keyed `set`.
        return patch.items.length === 1 ? set(patch.items[0], path) : null
      }
      return insert(patch.items, patch.position, path)
    case 'diffMatchPatch':
      return diffMatchPatch(patch.value, path)
    default:
      console.warn('[standaloneTable] unsupported patch type, dropped:', patch)
      return null
  }
}

// ---------------------------------------------------------------------------
// Plugins
// ---------------------------------------------------------------------------

/**
 * Push external value changes into the editor. Dedupes the field value we just
 * emitted ourselves (tracked in `syncedRef`) so a round-tripped edit doesn't
 * re-send `update value` and reset the caret.
 */
function UpdateValuePlugin(props: {
  value: StandaloneTableValue | undefined
  syncedRef: React.MutableRefObject<string>
}) {
  const {value, syncedRef} = props
  const editor = useEditor()
  const packagedJson = useMemo(() => JSON.stringify(packageTableValue(value)), [value])

  useEffect(() => {
    if (packagedJson === syncedRef.current) {
      return
    }
    syncedRef.current = packagedJson
    editor.send({type: 'update value', value: JSON.parse(packagedJson)})
  }, [editor, packagedJson, syncedRef])

  return null
}

/** Bridge the editor's focus/blur to the Studio form's focus tracking. */
function FocusBridgePlugin(props: {onFocus: () => void; onBlur: () => void}) {
  const {onFocus, onBlur} = props
  const on = useCallback(
    (event: EditorEmittedEvent) => {
      if (event.type === 'focused') onFocus()
      else if (event.type === 'blurred') onBlur()
    },
    [onFocus, onBlur],
  )
  return <EventListenerPlugin on={on} />
}

// ---------------------------------------------------------------------------
// Input component
// ---------------------------------------------------------------------------

export function StandaloneTableInput(props: ObjectInputProps<StandaloneTableValue>): ReactElement {
  const {value, onChange, readOnly, elementProps, onPathFocus} = props

  // Captured once at mount: the packaged value the editor is seeded with, and
  // the JSON of the value currently reflected in the editor (so
  // UpdateValuePlugin can ignore our own echoes).
  const [initialValue] = useState(() => packageTableValue(value))
  const syncedRef = useRef<string>(JSON.stringify(initialValue))
  const scaffoldingRef = useRef(false)

  // Editor mutation -> re-rooted, granular form patches on real field paths.
  const handleEvent = useCallback(
    (event: EditorEmittedEvent) => {
      if (event.type !== 'mutation') {
        return
      }
      // Remember the editor's post-mutation value so the echoed field update
      // isn't pushed back into the editor.
      syncedRef.current = JSON.stringify(event.value ?? packageTableValue(undefined))

      const rerooted = rerootPatches(event.patches)
      const formPatches = rerooted.map(toFormPatch).filter((p): p is FormPatch => p !== null)

      if (formPatches.length > 0) {
        onChange(PatchEvent.from(formPatches))
      }
    },
    [onChange],
  )

  // Scaffold an empty field to a 3×3 grid, and re-scaffold after a delete-all.
  useEffect(() => {
    if (readOnly || !isEmptyTable(value) || scaffoldingRef.current) {
      return
    }
    scaffoldingRef.current = true
    const rows = scaffoldRows(SCAFFOLD_ROWS, SCAFFOLD_COLS, keyGenerator)
    onChange(
      PatchEvent.from([
        // Create the object shell without clobbering it if it already exists…
        setIfMissing({_type: TABLE_SHAPE.table.type}, EMPTY_PATH),
        // …then seed just the `rows` field (granular, not a whole-value set).
        set(rows, [TABLE_SHAPE.table.arrayField]),
      ]),
    )
  }, [readOnly, value, onChange])

  // Release the scaffold guard once the field is non-empty again, so a later
  // delete-all can re-scaffold.
  useEffect(() => {
    if (!isEmptyTable(value)) {
      scaffoldingRef.current = false
    }
  }, [value])

  const handleFocus = useCallback(() => onPathFocus(EMPTY_PATH), [onPathFocus])
  const handleBlur = useCallback(() => {
    // Focus tracking only; blur is a no-op for the form path here.
  }, [])

  return (
    <Card border radius={2} padding={3} data-testid={`standalone-table-${elementProps.id}`}>
      <Stack space={3}>
        <Text size={1} muted>
          Standalone table (disguised Portable Text editor)
        </Text>
        <EditorProvider
          initialConfig={{
            schemaDefinition: editorSchema,
            initialValue,
            keyGenerator,
            readOnly,
          }}
        >
          <NodePlugin nodes={tableContainers} />
          <BehaviorPlugin behaviors={oneBlockInvariantBehaviors} />
          <EventListenerPlugin on={handleEvent} />
          <UpdateValuePlugin value={value} syncedRef={syncedRef} />
          <FocusBridgePlugin onFocus={handleFocus} onBlur={handleBlur} />
          <PortableTextEditable
            id={elementProps.id}
            aria-describedby={elementProps['aria-describedby']}
            style={{outline: 'none'}}
            readOnly={readOnly}
          />
        </EditorProvider>
      </Stack>
    </Card>
  )
}
