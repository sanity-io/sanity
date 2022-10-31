import {
  ArraySchemaType,
  BlockDecoratorDefinition,
  BlockListDefinition,
  BlockSchemaType,
  BlockStyleDefinition,
  ObjectSchemaType,
  Path,
  PortableTextBlock,
  PortableTextChild,
  PortableTextListBlock,
  PortableTextObject,
  PortableTextSpan,
  PortableTextTextBlock,
  SpanSchemaType,
} from '@sanity/types'
import {Subject, Observable} from 'rxjs'
import {Descendant, Node as SlateNode, Operation as SlateOperation} from 'slate'
import {ReactEditor} from '@sanity/slate-react'
import type {Patch} from '../types/patch'
import {PortableTextEditor} from '../editor/PortableTextEditor'

export interface EditableAPIDeleteOptions {
  mode?: 'blocks' | 'children' | 'selected'
}

export interface EditableAPI {
  activeAnnotations: () => PortableTextObject[]
  addAnnotation: (
    type: ObjectSchemaType,
    value?: {[prop: string]: unknown}
  ) => {spanPath: Path; markDefPath: Path} | undefined
  blur: () => void
  delete: (selection: EditorSelection, options?: EditableAPIDeleteOptions) => void
  findByPath: (path: Path) => [PortableTextBlock | PortableTextChild | undefined, Path | undefined]
  findDOMNode: (element: PortableTextBlock | PortableTextChild) => Node | undefined
  focus: () => void
  focusBlock: () => PortableTextBlock | undefined
  focusChild: () => PortableTextChild | undefined
  getSelection: () => EditorSelection
  getValue: () => PortableTextBlock[] | undefined
  hasBlockStyle: (style: string) => boolean
  hasListStyle: (listStyle: string) => boolean
  insertBlock: (type: BlockSchemaType | ObjectSchemaType, value?: {[prop: string]: unknown}) => Path
  insertChild: (type: SpanSchemaType | ObjectSchemaType, value?: {[prop: string]: unknown}) => Path
  isCollapsedSelection: () => boolean
  isExpandedSelection: () => boolean
  isMarkActive: (mark: string) => boolean
  isVoid: (element: PortableTextBlock | PortableTextChild) => boolean
  marks: () => string[]
  redo: () => void
  removeAnnotation: (type: ObjectSchemaType) => void
  select: (selection: EditorSelection) => void
  toggleBlockStyle: (blockStyle: string) => void
  toggleList: (listStyle: string) => void
  toggleMark: (mark: string) => void
  undo: () => void
}

export type EditorNode = SlateNode & {
  _key: string
  _type: string
}

export type HistoryItem = {
  operations: SlateOperation[]
  timestamp: Date
}

export interface History {
  redos: HistoryItem[]
  undos: HistoryItem[]
}

export type EditorSelectionPoint = {path: Path; offset: number}
export type EditorSelection = {anchor: EditorSelectionPoint; focus: EditorSelectionPoint} | null
export interface PortableTextSlateEditor extends ReactEditor {
  _key: 'editor'
  _type: 'editor'
  destroy: () => void
  createPlaceholderBlock: () => Descendant
  editable: EditableAPI
  history: History
  insertPortableTextData: (data: DataTransfer) => boolean
  insertTextOrHTMLData: (data: DataTransfer) => boolean
  isTextBlock: (value: unknown) => value is PortableTextTextBlock
  isTextSpan: (value: unknown) => value is PortableTextSpan
  isListBlock: (value: unknown) => value is PortableTextListBlock
  readOnly: boolean
  maxBlocks: number | undefined

  /**
   * Increments selected list items levels, or decrements them if `reverse` is true.
   *
   * @param reverse - if true, decrement instead of incrementing
   * @returns True if anything was incremented in the selection
   */
  pteIncrementBlockLevels: (reverse?: boolean) => boolean

  /**
   * Toggle selected blocks as listItem
   *
   * @param listStyle - Style of list item to toggle on/off
   */
  pteToggleListItem: (listStyle: string) => void

  /**
   * Set selected block as listItem
   *
   * @param listStyle - Style of list item to set
   */
  pteSetListItem: (listStyle: string) => void

  /**
   * Unset selected block as listItem
   *
   * @param listStyle - Style of list item to unset
   */
  pteUnsetListItem: (listStyle: string) => void

  /**
   * Ends a list
   *
   * @returns True if a list was ended in the selection
   */
  pteEndList: () => boolean

  /**
   * Toggle marks in the selection
   *
   * @param mark - Mark to toggle on/off
   */
  pteToggleMark: (mark: string) => void

  /**
   * Test if a mark is active in the current selection
   *
   * @param mark - Mark to check whether or not is active
   */
  pteIsMarkActive: (mark: string) => boolean

  /**
   * Toggle the selected block style
   *
   * @param style - The style name
   *
   */
  pteToggleBlockStyle: (style: string) => void

  /**
   * Test if the current selection has a certain block style
   *
   * @param style - The style name
   *
   */
  pteHasBlockStyle: (style: string) => boolean

  /**
   * Test if the current selection has a certain list style
   *
   * @param listStyle - Style name to check whether or not the selection has
   *
   */
  pteHasListStyle: (style: string) => boolean

  /**
   * Try to expand the current selection to a word
   */
  pteExpandToWord: () => void

  /**
   * Use hotkeys
   */
  pteWithHotKeys: (event: React.KeyboardEvent<HTMLDivElement>) => void

  /**
   * Undo
   */
  undo: () => void

  /**
   * Redo
   */
  redo: () => void
}

export type MutationChange = {
  type: 'mutation'
  patches: Patch[]
}

export type PatchChange = {
  type: 'patch'
  patch: Patch
}

export type ValueChange = {
  type: 'value'
  value: PortableTextBlock[] | undefined
}

export type SelectionChange = {
  type: 'selection'
  selection: EditorSelection
}

export type FocusChange = {
  type: 'focus'
}

export type UnsetChange = {
  type: 'unset'
  previousValue: PortableTextBlock[]
}

export type BlurChange = {
  type: 'blur'
}

export type LoadingChange = {
  type: 'loading'
  isLoading: boolean
}

export type ReadyChange = {
  type: 'ready'
}

// Layman error reporting back to the user (recoverable errors and warnings)
export type ErrorChange = {
  type: 'error'
  name: string // short computer readable name
  level: 'warning' | 'error'
  description: string
  data?: unknown
}

export type InvalidValueResolution = {
  patches: Patch[]
  description: string
  action: string
  item: PortableTextBlock[] | PortableTextBlock | PortableTextChild | undefined
}

export type InvalidValue = {
  type: 'invalidValue'
  resolution: InvalidValueResolution | null
  value: PortableTextBlock[]
}

export type UndoChange = {
  type: 'undo'
  patches: Patch[]
  timestamp: Date
}

export type RedoChange = {
  type: 'redo'
  patches: Patch[]
  timestamp: Date
}

export type EditorChange =
  | BlurChange
  | ErrorChange
  | FocusChange
  | InvalidValue
  | LoadingChange
  | MutationChange
  | PatchChange
  | ReadyChange
  | RedoChange
  | SelectionChange
  | UndoChange
  | UnsetChange
  | ValueChange

export type EditorChanges = Subject<EditorChange>

export type OnPasteResult =
  | {
      insert?: PortableTextBlock[]
      path?: Path
    }
  | undefined
export type OnPasteResultOrPromise = OnPasteResult | Promise<OnPasteResult>

export type OnPasteFn = (arg0: {
  event: React.ClipboardEvent
  path: Path
  types: PortableTextMemberTypes
  value: PortableTextBlock[] | undefined
}) => OnPasteResultOrPromise

export type OnBeforeInputFn = (event: Event) => void

export type OnCopyFn = (
  event: React.ClipboardEvent<HTMLDivElement | HTMLSpanElement>
) => undefined | unknown

export type PatchObservable = Observable<{
  patches: Patch[]
  snapshot: PortableTextBlock[] | undefined
}>

export type RenderAttributes = {
  annotations?: PortableTextObject[]
  focused: boolean
  level?: number
  listItem?: string
  path: Path
  selected: boolean
  style?: string
}

export interface RenderPortableTextBlockProps {
  value: PortableTextBlock
  type: BlockSchemaType | ObjectSchemaType
  attributes: RenderAttributes
  defaultRender: (props: RenderPortableTextBlockProps) => JSX.Element
  editorElementRef: React.RefObject<HTMLDivElement>
}

export type RenderBlockFunction = (props: RenderPortableTextBlockProps) => JSX.Element

export interface RenderPortableTextChildProps {
  value: PortableTextChild
  type: ObjectSchemaType
  attributes: RenderAttributes
  defaultRender: (props: RenderPortableTextChildProps) => JSX.Element
  editorElementRef: React.RefObject<HTMLSpanElement>
}

export type RenderChildFunction = (props: RenderPortableTextChildProps) => JSX.Element

export interface RenderAnnotationProps {
  value: PortableTextObject
  type: ObjectSchemaType
  attributes: RenderAttributes
  defaultRender: (props: RenderAnnotationProps) => JSX.Element
  editorElementRef: React.RefObject<HTMLSpanElement>
}

export type RenderAnnotationFunction = (props: RenderAnnotationProps) => JSX.Element

export interface RenderDecoratorProps {
  value: string
  type: BlockDecoratorDefinition
  attributes: RenderAttributes
  defaultRender: (props: RenderDecoratorProps) => JSX.Element
  editorElementRef: React.RefObject<HTMLSpanElement>
}

export type RenderDecoratorFunction = (props: RenderDecoratorProps) => JSX.Element

export type ScrollSelectionIntoViewFunction = (
  editor: PortableTextEditor,
  domRange: globalThis.Range
) => void

export type PortableTextMemberTypes = {
  annotations: ObjectSchemaType[]
  block: ObjectSchemaType
  blockObjects: ObjectSchemaType[]
  decorators: BlockDecoratorDefinition[]
  inlineObjects: ObjectSchemaType[]
  portableText: ArraySchemaType<PortableTextBlock>
  span: ObjectSchemaType
  styles: BlockStyleDefinition[]
  lists: BlockListDefinition[]
}
