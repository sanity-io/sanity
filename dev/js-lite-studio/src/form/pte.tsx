/**
 * Portable Text, on `@portabletext/editor` like the JS studio's input: the same toolbar and
 * object dialog as the Rust studio's editor, local edits written to the document store patch by
 * patch, remote ones handed to the editor as patches (the JS form's patch channel), presence
 * reported in the editor's selection format and the others' cursors drawn as range decorations.
 */
import './pte.css'

import {
  type AnnotationRenderProps,
  type BlockObjectRenderProps,
  type DecoratorRenderProps,
  defineAnnotation,
  defineBlockObject,
  defineDecorator,
  defineInlineObject,
  defineSchema,
  defineTextBlock,
  type Editor,
  type EditorEmittedEvent,
  type EditorSelection,
  type EditorSelectionPoint,
  EditorProvider,
  type FieldDefinition,
  type InlineObjectRenderProps,
  type Patch,
  type PortableTextBlock,
  PortableTextEditable,
  type RangeDecoration,
  type RangeDecorationOnMovedDetails,
  type TextBlockRenderProps,
  useEditor,
  useEditorSelector,
} from '@portabletext/editor'
import {EditorRefPlugin, EventListenerPlugin, NodePlugin} from '@portabletext/editor/plugins'
import {
  getActiveAnnotations,
  getActiveStyle,
  getFocusTextBlock,
  getSelection,
  isActiveDecorator,
  isActiveListItem,
  isSelectionCollapsed,
} from '@portabletext/editor/selectors'
import {type ColorHueKey} from '@sanity/color'
import {AddIcon} from '@sanity/icons/Add'
import {BlockElementIcon} from '@sanity/icons/BlockElement'
import {BoldIcon} from '@sanity/icons/Bold'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CodeIcon} from '@sanity/icons/Code'
import {EditIcon} from '@sanity/icons/Edit'
import {InlineElementIcon} from '@sanity/icons/InlineElement'
import {ItalicIcon} from '@sanity/icons/Italic'
import {LinkIcon} from '@sanity/icons/Link'
import {OlistIcon} from '@sanity/icons/Olist'
import {StrikethroughIcon} from '@sanity/icons/Strikethrough'
import {TextIcon} from '@sanity/icons/Text'
import {ThListIcon} from '@sanity/icons/ThList'
import {TrashIcon} from '@sanity/icons/Trash'
import {UlistIcon} from '@sanity/icons/Ulist'
import {UnderlineIcon} from '@sanity/icons/Underline'
import {Box, Button, Card, Dialog, Flex, Select, Text} from '@sanity/ui'
import {Menu, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {Popover} from '@sanity/ui/popover'
import {
  type ComponentType,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {scheme} from '../app-state'
import {getAt, type Path, parsePath} from '../paths'
import {hueTint, useFieldPresence} from '../presence'
import {imageUrl} from '../previews'
import {
  type Resolved,
  schema,
  type TitledValue,
  titledValueTitle,
  titleOf,
  memberTypeName,
  type TypeDef,
} from '../schema'
import {useAtom} from '../state'
import * as store from '../store'
import {useDismiss} from '../ui'
import {
  draftId,
  isObject,
  type Json,
  type JsonObject,
  previewText,
  randomKey,
  versionId,
} from '../util'
import {usePaneFocus} from './focus'
import {useRenderInput} from './nested'
import {child, op, patch, type Target, valueOf} from './target'

interface MemberType {
  typeName: string
  title: string
  def: TypeDef
}

/** What the array's members allow, from the schema. */
interface Config {
  textType: string
  styles: TitledValue[]
  lists: TitledValue[]
  decorators: TitledValue[]
  annotations: MemberType[]
  inline: MemberType[]
  objects: MemberType[]
}

function memberOf(def: TypeDef): MemberType {
  const typeName = memberTypeName(def)
  return {typeName, title: def.title || def.name ? titleOf(def) : schema().typeTitle(typeName), def}
}

function configOf(resolved: Resolved): Config {
  const current = schema()
  let textType: string | undefined
  let block: ReturnType<typeof current.blockConfig> | undefined
  const objects: MemberType[] = []
  for (const def of resolved.of) {
    if (current.resolve(def).kind === 'block') {
      textType ??= memberTypeName(def)
      block ??= current.blockConfig(def)
    } else {
      objects.push(memberOf(def))
    }
  }
  block ??= current.blockConfig({name: '', type: 'block'})
  return {
    textType: textType ?? 'block',
    styles: block.styles,
    lists: block.lists,
    decorators: block.decorators,
    annotations: block.annotations.map(memberOf),
    inline: block.inline.map(memberOf),
    objects,
  }
}

function fieldDefinitions(def: TypeDef): FieldDefinition[] {
  return schema()
    .resolve(def)
    .fields.map((field): FieldDefinition => {
      const kind = schema().resolve(field).kind
      if (kind === 'array') return {name: field.name, type: 'array'}
      if (kind === 'number') return {name: field.name, type: 'number'}
      if (kind === 'boolean') return {name: field.name, type: 'boolean'}
      if (
        kind === 'string' ||
        kind === 'text' ||
        kind === 'url' ||
        kind === 'email' ||
        kind === 'date' ||
        kind === 'datetime'
      ) {
        return {name: field.name, type: 'string'}
      }
      return {name: field.name, type: 'object'}
    })
}

function schemaDefinitionOf(config: Config) {
  const named = (items: TitledValue[]) =>
    items.map((item) => ({name: item.value, title: titledValueTitle(item)}))
  const members = (items: MemberType[]) =>
    items.map((member) => ({
      name: member.typeName,
      title: member.title,
      fields: fieldDefinitions(member.def),
    }))
  return defineSchema({
    block: {name: config.textType},
    styles: named(config.styles),
    lists: named(config.lists),
    decorators: named(config.decorators),
    annotations: members(config.annotations),
    blockObjects: members(config.objects),
    inlineObjects: members(config.inline),
  })
}

interface ObjectLabel {
  typeTitle: string
  title?: string
  image?: string
}

function labelOf(config: Config, value: JsonObject): ObjectLabel {
  const typeName = typeof value._type === 'string' ? value._type : ''
  const current = schema()
  const member = [...config.objects, ...config.inline].find(
    (candidate) => candidate.typeName === typeName,
  )
  const typeTitle = member?.title ?? current.typeTitle(typeName)
  if (!member) return {typeTitle}
  const resolved = current.resolve(member.def)
  const imageOf = (image: unknown) => {
    const ref = isObject(image) && isObject(image.asset) ? image.asset._ref : undefined
    return typeof ref === 'string' ? imageUrl(ref, 66) : undefined
  }
  switch (resolved.kind) {
    case 'image':
    case 'file': {
      const title = ['caption', 'alt', 'title']
        .map((field) => previewText(value[field]))
        .find(Boolean)
      return {typeTitle, title, image: resolved.kind === 'image' ? imageOf(value) : undefined}
    }
    case 'reference':
      return {typeTitle, title: typeof value._ref === 'string' ? value._ref : undefined}
    default: {
      const guess = current.guessFieldsPreview(resolved.fields)
      return {
        typeTitle,
        title: guess.title ? previewText(value[guess.title]) : undefined,
        image: guess.media ? imageOf(value[guess.media]) : undefined,
      }
    }
  }
}

const BULLETS = ['●', '○', '■']
const markerCache = new WeakMap<PortableTextBlock[], Map<string, string>>()

/** The list markers by block key: numbered items count up within their level and restart after
 * anything that is not a deeper item of the same list, like `@portabletext/editor` does. */
function markers(value: PortableTextBlock[]): Map<string, string> {
  const cached = markerCache.get(value)
  if (cached) return cached
  const result = new Map<string, string>()
  let counters: [string, number, number][] = []
  for (const block of value) {
    const list = typeof block.listItem === 'string' ? block.listItem : undefined
    if (!list) {
      counters = []
      continue
    }
    const level = Math.max(typeof block.level === 'number' ? block.level : 1, 1)
    counters = counters.filter(([, counterLevel]) => counterLevel <= level)
    const last = counters.at(-1)
    if (last && last[1] === level && last[0] === list) {
      last[2] += 1
    } else {
      counters = counters.filter(([, counterLevel]) => counterLevel < level)
      counters.push([list, level, 1])
    }
    const count = counters.at(-1)?.[2] ?? 1
    result.set(block._key, list === 'number' ? `${count}.` : BULLETS[(level - 1) % 3])
  }
  markerCache.set(value, result)
  return result
}

function TextBlockView(props: {block: TextBlockRenderProps}) {
  const {attributes, children, node} = props.block
  const editor = useEditor()
  const marker = useEditorSelector(editor, (snapshot) =>
    markers(snapshot.context.value).get(node._key),
  )
  const list = typeof node.listItem === 'string' ? node.listItem : undefined
  const level = list ? Math.max(typeof node.level === 'number' ? node.level : 1, 1) : undefined
  return (
    <div
      {...attributes}
      data-style={node.style ?? 'normal'}
      data-list={list}
      data-level={level}
      data-marker={marker}
    >
      {children}
    </div>
  )
}

/** What the object dialog edits. */
type Editing =
  | {kind: 'block'; key: string}
  | {kind: 'inline'; block: string; child: string}
  | {kind: 'annotation'; block: string; key: string}

function BlockObjectView(props: {
  block: BlockObjectRenderProps
  config: Config
  onEdit: (editing: Editing) => void
}) {
  const {attributes, children, node, selected, readOnly} = props.block
  const editor = useEditor()
  const label = labelOf(props.config, node as JsonObject)
  return (
    <div {...attributes} data-selected={selected || undefined}>
      {children}
      <div data-object="" contentEditable={false}>
        <div data-part="media">
          {label.image ? <img src={label.image} alt="" /> : <BlockElementIcon />}
        </div>
        <div data-part="body">
          <div data-part="title">{label.title ?? label.typeTitle}</div>
          {label.title ? <div data-part="type">{label.typeTitle}</div> : null}
        </div>
        <button
          type="button"
          data-action="edit"
          title={readOnly ? 'View' : 'Edit'}
          aria-label="Edit"
          onClick={() => props.onEdit({kind: 'block', key: node._key})}
        >
          <EditIcon />
        </button>
        <button
          type="button"
          data-action="remove"
          title="Remove"
          aria-label="Remove"
          onClick={() => editor.send({type: 'delete.block', at: [{_key: node._key}]})}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

function InlineObjectView(props: {
  child: InlineObjectRenderProps
  config: Config
  onEdit: (editing: Editing) => void
}) {
  const {attributes, children, node, path} = props.child
  const label = labelOf(props.config, node as JsonObject)
  const block = path[0]
  return (
    <span {...attributes}>
      {children}
      <span
        data-inline=""
        contentEditable={false}
        title={`Edit ${label.typeTitle}`}
        onClick={() => {
          if (isObject(block) && typeof block._key === 'string') {
            props.onEdit({kind: 'inline', block: block._key, child: node._key})
          }
        }}
      >
        <InlineElementIcon />
        <span>{label.title ?? label.typeTitle}</span>
      </span>
    </span>
  )
}

function renderDecorator(props: DecoratorRenderProps) {
  return <span data-marks={props.decorator}>{props.children}</span>
}

function renderAnnotation(props: AnnotationRenderProps) {
  return <span data-annotated="">{props.children}</span>
}

function renderPlaceholder() {
  return <span className="pte-placeholder">Empty</span>
}

/** Mutation patches of the document as editor patches inside the field at `field`. */
function editorPatches(field: Path, patches: store.MutationPatch[]): Patch[] {
  const result: Patch[] = []
  const inField = (text: string): Path | undefined => {
    let path: Path
    try {
      path = parsePath(text)
    } catch {
      return undefined
    }
    if (path.length < field.length) return undefined
    for (let index = 0; index < field.length; index++) {
      if (path[index] !== field[index]) return undefined
    }
    return path.slice(field.length)
  }
  for (const {origin, patch: operation} of patches) {
    for (const [type, body] of Object.entries(operation)) {
      if (type === 'id' || type === 'ifRevisionID' || type === 'query') continue
      if (type === 'unset' && Array.isArray(body)) {
        for (const text of body) {
          const path = typeof text === 'string' ? inField(text) : undefined
          if (path) result.push({type: 'unset', path, origin} as Patch)
        }
      } else if (type === 'insert' && isObject(body)) {
        const position = 'before' in body ? 'before' : 'after' in body ? 'after' : 'replace'
        const at = body[position]
        const path = typeof at === 'string' ? inField(at) : undefined
        if (path) result.push({type: 'insert', position, path, items: body.items, origin} as Patch)
      } else if (isObject(body)) {
        if (!['set', 'setIfMissing', 'diffMatchPatch', 'inc', 'dec'].includes(type)) continue
        for (const [text, value] of Object.entries(body)) {
          const path = inField(text)
          if (path) result.push({type, path, value, origin} as Patch)
        }
      }
    }
  }
  return result
}

/** Editor patches as patch operations on the document, at the field at `field`. */
function mutationOps(field: Path, editorPatch: Patch): JsonObject | undefined {
  const path = [...field, ...(editorPatch.path as Path)]
  switch (editorPatch.type) {
    case 'set':
      return op.set(path, editorPatch.value as Json)
    case 'setIfMissing':
      return op.setIfMissing(path, editorPatch.value as Json)
    case 'unset':
      return op.unset(path)
    case 'insert':
      if (editorPatch.position === 'replace')
        return {insert: {replace: pathString(path), items: editorPatch.items as Json}}
      return op.insert(editorPatch.position, path, editorPatch.items as Json[])
    case 'diffMatchPatch':
      return {diffMatchPatch: {[pathString(path)]: editorPatch.value}}
    case 'inc':
    case 'dec':
      return {[editorPatch.type]: {[pathString(path)]: editorPatch.value as Json}}
    default:
      return undefined
  }
}

function pathString(path: Path): string {
  const set = op.unset(path).unset
  return Array.isArray(set) && typeof set[0] === 'string' ? set[0] : ''
}

/** The presence location of a selection in the field at `field`: the focus path, with `text`
 * appended in a span, and the selection, like the JS input reports it. */
function presenceOf(
  field: Path,
  value: PortableTextBlock[],
  selection: EditorSelection,
): {path: Path; selection: Json} | undefined {
  if (!selection) return undefined
  const focus = selection.focus.path as Path
  const relative: Path = [...focus]
  const [blockSegment, children, childSegment] = focus
  if (
    focus.length === 3 &&
    children === 'children' &&
    isObject(blockSegment) &&
    isObject(childSegment)
  ) {
    const block = value.find((candidate) => candidate._key === blockSegment._key)
    const node = Array.isArray(block?.children)
      ? (block.children as JsonObject[]).find((candidate) => candidate._key === childSegment._key)
      : undefined
    if (node?._type === 'span') relative.push('text')
  }
  const point = (item: EditorSelectionPoint): Json => ({
    path: item.path as Json,
    offset: item.offset,
  })
  return {
    path: [...field, ...relative],
    selection: {
      anchor: point(selection.anchor),
      focus: point(selection.focus),
      backward: selection.backward ?? false,
    },
  }
}

interface Cursor {
  sessionId: string
  name: string
  hue: ColorHueKey
  selection: Json | undefined
}

function cursorComponent(
  cursor: Cursor,
  dark: boolean,
): (props: {children?: ReactNode}) => ReactElement {
  const style = {
    '--presence-cursor-bg': hueTint(cursor.hue, dark ? '400' : '500'),
    '--presence-cursor-fg': hueTint(cursor.hue, dark ? '900' : '50'),
  } as CSSProperties
  const testId = `presence-cursor-${cursor.name.split(' ').join('-')}`
  return function PresenceCursor(props: {children?: ReactNode}) {
    return (
      <>
        <span
          className="pte-cursor"
          contentEditable={false}
          data-ui="PresenceCursor"
          data-testid={testId}
          data-session={cursor.sessionId}
          style={style}
        >
          <span data-dot="" />
          <span data-name="">{cursor.name}</span>
        </span>
        {props.children}
      </>
    )
  }
}

function pointOf(value: unknown): EditorSelectionPoint | undefined {
  if (!isObject(value) || !Array.isArray(value.path)) return undefined
  return {
    path: value.path as EditorSelectionPoint['path'],
    offset: typeof value.offset === 'number' ? value.offset : 0,
  }
}

/** The others' cursors, at the focus of their selections. */
function usePresenceCursors(published: string, field: Path): RangeDecoration[] {
  const dark = useAtom(scheme) === 'dark'
  const present = useFieldPresence(published, field, false).filter(
    (item) => item.location.path.length > field.length && item.location.selection,
  )
  const key = JSON.stringify(
    present.map((item): Cursor => ({
      sessionId: item.sessionId,
      name: item.user.name,
      hue: item.hue,
      selection: item.location.selection,
    })),
  )
  const [moved, setMoved] = useState<{key: string; selections: Map<string, EditorSelection>}>({
    key,
    selections: new Map(),
  })
  const selections = moved.key === key ? moved.selections : new Map<string, EditorSelection>()
  const decorations = useMemo(() => {
    const cursors = JSON.parse(key) as Cursor[]
    return cursors.flatMap((cursor): RangeDecoration[] => {
      const focus = pointOf(isObject(cursor.selection) ? cursor.selection.focus : undefined)
      if (!focus) return []
      return [
        {
          component: cursorComponent(cursor, dark),
          selection: {anchor: focus, focus},
          payload: {sessionId: cursor.sessionId},
          onMoved: (details: RangeDecorationOnMovedDetails) => {
            setMoved((current) => {
              const next = new Map(current.key === key ? current.selections : [])
              next.set(cursor.sessionId, details.newSelection)
              return {key, selections: next}
            })
          },
        },
      ]
    })
  }, [key, dark])
  return decorations.flatMap((decoration) => {
    const sessionId = String(decoration.payload?.sessionId)
    if (!selections.has(sessionId)) return [decoration]
    const selection = selections.get(sessionId)
    return selection ? [{...decoration, selection}] : []
  })
}

/** Remote patches, and the value whenever it changes, for the editor. */
function SyncPlugin(props: {
  documentId: string
  field: Path
  value: PortableTextBlock[] | undefined
  readOnly: boolean
}) {
  const {documentId, field, value, readOnly} = props
  const editor = useEditor()
  const fieldKey = JSON.stringify(field)
  useEffect(() => {
    const path = JSON.parse(fieldKey) as Path
    return store.subscribePatches(documentId, (message) => {
      const patches = editorPatches(path, message.patches)
      if (patches.length === 0) return
      const snapshot = getAt(message.snapshot, path)
      editor.send({
        type: 'patches',
        patches,
        snapshot: Array.isArray(snapshot) ? (snapshot as PortableTextBlock[]) : undefined,
      })
    })
  }, [editor, documentId, fieldKey])
  useEffect(() => {
    editor.send({type: 'update value', value})
  }, [editor, value])
  useEffect(() => {
    editor.send({type: 'update readOnly', readOnly})
  }, [editor, readOnly])
  return null
}

function ToolbarButton(props: {
  icon: ComponentType
  title: string
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button
      mode="bleed"
      icon={props.icon}
      title={props.title}
      aria-label={props.title}
      padding={2}
      selected={props.selected}
      disabled={props.disabled}
      onClick={props.onClick}
    />
  )
}

function Divider() {
  return (
    <span
      style={{
        width: 1,
        alignSelf: 'stretch',
        margin: '0.25rem 0.125rem',
        background: 'var(--card-border-color)',
      }}
    />
  )
}

const DECORATOR_ICONS: Record<string, ComponentType> = {
  'strong': BoldIcon,
  'em': ItalicIcon,
  'underline': UnderlineIcon,
  'strike-through': StrikethroughIcon,
  'code': CodeIcon,
}

const DECORATOR_HOTKEYS: Record<string, string> = {
  strong: ' (Ctrl+B)',
  em: ' (Ctrl+I)',
  underline: ' (Ctrl+U)',
  code: " (Ctrl+')",
}

const LIST_ICONS: Record<string, ComponentType> = {number: OlistIcon, bullet: UlistIcon}

const HOTKEYS = {marks: {'mod+b': 'strong', 'mod+i': 'em', 'mod+u': 'underline', "mod+'": 'code'}}

function initialObject(typeName: string): JsonObject {
  return {...schema().initialDocument(typeName), _type: typeName, _key: randomKey(12)}
}

function DecoratorButton(props: {item: TitledValue; disabled: boolean}) {
  const editor = useEditor()
  const {value} = props.item
  const selected = useEditorSelector(editor, isActiveDecorator(value))
  return (
    <ToolbarButton
      icon={DECORATOR_ICONS[value] ?? TextIcon}
      title={`${titledValueTitle(props.item)}${DECORATOR_HOTKEYS[value] ?? ''}`}
      selected={selected}
      disabled={props.disabled}
      onClick={() => {
        editor.send({type: 'decorator.toggle', decorator: value})
        editor.send({type: 'focus'})
      }}
    />
  )
}

function ListButton(props: {item: TitledValue; disabled: boolean}) {
  const editor = useEditor()
  const {value} = props.item
  const selected = useEditorSelector(editor, isActiveListItem(value))
  return (
    <ToolbarButton
      icon={LIST_ICONS[value] ?? ThListIcon}
      title={titledValueTitle(props.item)}
      selected={selected}
      disabled={props.disabled}
      onClick={() => {
        editor.send({type: 'list item.toggle', listItem: value})
        editor.send({type: 'focus'})
      }}
    />
  )
}

function focusBlockKey(editor: Editor): string | undefined {
  return getFocusTextBlock(editor.getSnapshot())?.node._key
}

function AnnotationButton(props: {
  member: MemberType
  disabled: boolean
  onEdit: (editing: Editing) => void
}) {
  const editor = useEditor()
  const {typeName} = props.member
  const existing = useEditorSelector(
    editor,
    (snapshot) =>
      getActiveAnnotations(snapshot).find((annotation) => annotation._type === typeName)?._key,
  )
  const collapsed = useEditorSelector(
    editor,
    (snapshot) => getSelection(snapshot) === null || isSelectionCollapsed(snapshot),
  )
  return (
    <ToolbarButton
      icon={typeName === 'link' ? LinkIcon : EditIcon}
      title={props.member.title}
      selected={existing !== undefined}
      disabled={props.disabled || (existing === undefined && collapsed)}
      onClick={() => {
        const block = focusBlockKey(editor)
        if (existing !== undefined) {
          if (block) props.onEdit({kind: 'annotation', block, key: existing})
          return
        }
        const {_key: _ignoredKey, _type: _ignoredType, ...value} = initialObject(typeName)
        editor.send({type: 'annotation.add', annotation: {name: typeName, value}})
        const added = getActiveAnnotations(editor.getSnapshot()).find(
          (annotation) => annotation._type === typeName,
        )
        const addedBlock = focusBlockKey(editor)
        if (added && addedBlock)
          props.onEdit({kind: 'annotation', block: addedBlock, key: added._key})
      }}
    />
  )
}

function InsertMenu(props: {
  config: Config
  readOnly: boolean
  inText: boolean
  onEdit: (editing: Editing) => void
}) {
  const {config, readOnly, inText, onEdit} = props
  const editor = useEditor()
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  useDismiss(
    open,
    () => setOpen(false),
    () => [button.current, popover.current],
  )
  const insertable = [
    ...config.objects.map((member) => ({member, inline: false})),
    ...config.inline.map((member) => ({member, inline: true})),
  ]
  if (insertable.length === 0) return null
  const hasBlocks = config.objects.length > 0
  const insert = (typeName: string, inline: boolean) => {
    setOpen(false)
    const value = initialObject(typeName)
    const key = String(value._key)
    editor.send({type: 'focus'})
    if (inline) {
      editor.send({type: 'insert.child', child: value as never})
      const block = focusBlockKey(editor)
      if (block) onEdit({kind: 'inline', block, child: key})
    } else {
      editor.send({type: 'insert.block', block: value as never, placement: 'auto', select: 'end'})
      onEdit({kind: 'block', key})
    }
  }
  return (
    <Popover
      ref={popover}
      open={open}
      portal
      placement="bottom-end"
      content={
        <Menu>
          {insertable.map(({member, inline}, index) => (
            <div key={`${inline ? 'inline' : 'block'}-${member.typeName}`}>
              {hasBlocks && inline && index > 0 && !insertable[index - 1].inline ? (
                <MenuDivider />
              ) : null}
              <MenuItem
                text={member.title}
                icon={inline ? InlineElementIcon : BlockElementIcon}
                disabled={inline && !inText}
                onClick={() => insert(member.typeName, inline)}
              />
            </div>
          ))}
        </Menu>
      }
    >
      <Button
        ref={button}
        mode="bleed"
        icon={AddIcon}
        iconRight={ChevronDownIcon}
        text="Insert"
        fontSize={1}
        padding={2}
        disabled={readOnly}
        onClick={() => setOpen(!open)}
      />
    </Popover>
  )
}

function Toolbar(props: {config: Config; readOnly: boolean; onEdit: (editing: Editing) => void}) {
  const {config, readOnly, onEdit} = props
  const editor = useEditor()
  const style = useEditorSelector(editor, getActiveStyle) ?? 'normal'
  const inText = useEditorSelector(
    editor,
    (snapshot) => getSelection(snapshot) === null || getFocusTextBlock(snapshot) !== undefined,
  )
  const disabled = readOnly || !inText
  return (
    <Card
      borderBottom
      padding={1}
      radius={2}
      style={{borderBottomLeftRadius: 0, borderBottomRightRadius: 0}}
    >
      <Flex gap={1} align="center" wrap="wrap">
        {config.styles.length > 1 ? (
          <div style={{width: '9.5rem', flex: 'none'}}>
            <Select
              fontSize={1}
              padding={2}
              value={style}
              disabled={disabled}
              onChange={(event) => {
                editor.send({type: 'style.add', style: event.currentTarget.value})
                editor.send({type: 'focus'})
              }}
            >
              {config.styles.map((item) => (
                <option key={item.value} value={item.value}>
                  {titledValueTitle(item)}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <div
          style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1}}
          onMouseDown={(event) => event.preventDefault()}
        >
          {config.decorators.map((item) => (
            <DecoratorButton key={item.value} item={item} disabled={disabled} />
          ))}
          {config.lists.length > 0 ? <Divider /> : null}
          {config.lists.map((item) => (
            <ListButton key={item.value} item={item} disabled={disabled} />
          ))}
          {config.annotations.length > 0 ? <Divider /> : null}
          {config.annotations.map((member) => (
            <AnnotationButton
              key={member.typeName}
              member={member}
              disabled={disabled}
              onEdit={onEdit}
            />
          ))}
        </div>
        <Box flex={1} />
        <InsertMenu config={config} readOnly={readOnly} inText={inText} onEdit={onEdit} />
      </Flex>
    </Card>
  )
}

/** Removes an annotation: its definition and the mark on every span that carries it. */
function removeAnnotation(target: Target, block: string, key: string) {
  const blockTarget = child(target, {_key: block})
  const value = valueOf(blockTarget)
  if (!isObject(value)) return
  const ops: JsonObject[] = [op.unset([...blockTarget.path, 'markDefs', {_key: key}])]
  const children = Array.isArray(value.children) ? value.children : []
  for (const span of children) {
    if (!isObject(span) || typeof span._key !== 'string' || !Array.isArray(span.marks)) continue
    if (!span.marks.includes(key)) continue
    ops.push(
      op.set(
        [...blockTarget.path, 'children', {_key: span._key}, 'marks'],
        span.marks.filter((mark) => mark !== key),
      ),
    )
  }
  patch(target, ops)
}

function ObjectDialog(props: {
  target: Target
  config: Config
  editing: Editing
  level: number
  onClose: () => void
}) {
  const {target, config, editing, level, onClose} = props
  const editor = useEditor()
  const renderInput = useRenderInput()
  let item: Target
  let members: MemberType[]
  switch (editing.kind) {
    case 'block':
      item = child(target, {_key: editing.key})
      members = config.objects
      break
    case 'inline':
      item = child(child(child(target, {_key: editing.block}), 'children'), {_key: editing.child})
      members = config.inline
      break
    case 'annotation':
      item = child(child(child(target, {_key: editing.block}), 'markDefs'), {_key: editing.key})
      members = config.annotations
      break
    default: {
      const exhaustive: never = editing
      return exhaustive
    }
  }
  const value = valueOf(item)
  const typeName = isObject(value) && typeof value._type === 'string' ? value._type : ''
  const member = members.find((candidate) => candidate.typeName === typeName)
  const title = member?.title ?? schema().typeTitle(typeName)
  const close = () => {
    onClose()
    editor.send({type: 'focus'})
  }
  const remove = () => {
    close()
    switch (editing.kind) {
      case 'block':
        editor.send({type: 'delete.block', at: [{_key: editing.key}]})
        break
      case 'inline':
        editor.send({
          type: 'delete.child',
          at: [{_key: editing.block}, 'children', {_key: editing.child}],
        })
        break
      case 'annotation':
        removeAnnotation(target, editing.block, editing.key)
        break
      default: {
        const exhaustive: never = editing
        return exhaustive
      }
    }
  }
  return (
    <Dialog
      id="pte-object-dialog"
      header={target.readOnly ? title : `Edit ${title}`}
      width={1}
      onClose={close}
      footer={
        <Flex gap={2} justify="flex-end" padding={3}>
          {target.readOnly ? null : (
            <Button
              mode="ghost"
              tone="critical"
              icon={TrashIcon}
              text={editing.kind === 'annotation' ? `Remove ${title.toLowerCase()}` : 'Remove'}
              onClick={remove}
            />
          )}
          <Button tone="primary" text="Done" onClick={close} />
        </Flex>
      }
    >
      <Box padding={4}>
        {member && value !== undefined ? (
          renderInput({target: item, resolved: schema().resolve(member.def), level: level + 1})
        ) : (
          <Text size={1} muted>
            {value === undefined ? 'Loading…' : "The schema doesn't define this type."}
          </Text>
        )}
      </Box>
    </Dialog>
  )
}

function editingId(target: Target): string {
  const shownId = target.doc && typeof target.doc._id === 'string' ? target.doc._id : undefined
  return (
    shownId ??
    (target.release ? versionId(target.release, target.published) : draftId(target.published))
  )
}

export function PortableTextInput(props: {target: Target; resolved: Resolved; level: number}) {
  const {target, resolved, level} = props
  const config = useMemo(() => configOf(resolved), [resolved])
  const schemaDefinition = useMemo(() => schemaDefinitionOf(config), [config])
  const raw = valueOf(target)
  const value = Array.isArray(raw) ? (raw as PortableTextBlock[]) : undefined
  const fieldPath = target.path
  const fieldKey = JSON.stringify(fieldPath)
  const [initialValue] = useState(value)
  const [editing, setEditing] = useState<Editing | undefined>(undefined)
  const [focused, setFocused] = useState(false)
  const editorRef = useRef<Editor | null>(null)
  const setPaneFocus = usePaneFocus()
  const rangeDecorations = usePresenceCursors(target.published, fieldPath)

  const report = (editor: Editor) => {
    if (!setPaneFocus) return
    const snapshot = editor.getSnapshot()
    const location = presenceOf(fieldPath, snapshot.context.value, snapshot.context.selection)
    if (location) setPaneFocus(location)
  }

  const nodes = useMemo(
    () => [
      defineTextBlock({type: '*', render: (block) => <TextBlockView block={block} />}),
      defineBlockObject({
        type: '*',
        render: (block) => <BlockObjectView block={block} config={config} onEdit={setEditing} />,
      }),
      defineInlineObject({
        type: '*',
        render: (inline) => <InlineObjectView child={inline} config={config} onEdit={setEditing} />,
      }),
      defineDecorator({type: '*', render: renderDecorator}),
      defineAnnotation({type: '*', render: renderAnnotation}),
    ],
    [config],
  )

  const onEvent = (event: EditorEmittedEvent) => {
    const editor = editorRef.current
    switch (event.type) {
      case 'patch': {
        if (event.patch.origin !== 'local') return
        const operation = mutationOps(JSON.parse(fieldKey) as Path, event.patch)
        if (operation) patch(target, [operation])
        return
      }
      case 'focused':
        setFocused(true)
        if (editor) report(editor)
        return
      case 'blurred':
        setFocused(false)
        return
      case 'selection':
        if (editor && focused) report(editor)
        return
      default:
    }
  }

  return (
    <div
      data-ui="PortableTextInput"
      style={{
        borderRadius: 3,
        boxShadow: focused ? '0 0 0 1px var(--card-focus-ring-color)' : undefined,
      }}
    >
      <EditorProvider
        initialConfig={{
          initialValue,
          readOnly: target.readOnly,
          keyGenerator: () => randomKey(12),
          schemaDefinition,
        }}
      >
        <EditorRefPlugin ref={editorRef} />
        <EventListenerPlugin on={onEvent} />
        <NodePlugin nodes={nodes} />
        <SyncPlugin
          documentId={editingId(target)}
          field={fieldPath}
          value={value}
          readOnly={target.readOnly}
        />
        <Card border radius={2}>
          <Toolbar config={config} readOnly={target.readOnly} onEdit={setEditing} />
          <PortableTextEditable
            className="pte-editable"
            data-testid="pt-editable"
            hotkeys={HOTKEYS}
            rangeDecorations={rangeDecorations}
            renderPlaceholder={renderPlaceholder}
            spellCheck
          />
        </Card>
        {editing ? (
          <ObjectDialog
            target={target}
            config={config}
            editing={editing}
            level={level}
            onClose={() => setEditing(undefined)}
          />
        ) : null}
      </EditorProvider>
    </div>
  )
}
