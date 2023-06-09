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
  TypedObject,
} from '@sanity/types'
import {Subject, Observable} from 'rxjs'
import {Descendant, Node as SlateNode, Operation as SlateOperation} from 'slate'
import {ReactEditor} from '@sanity/slate-react'
import {FocusEvent} from 'react'
import type {Patch} from '../types/patch'
import {PortableTextEditor} from '../editor/PortableTextEditor'

/** @beta */
export interface EditableAPIDeleteOptions {
  mode?: 'blocks' | 'children' | 'selected'
}

/** @beta */
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
  insertBreak: () => void
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

/** @internal */
export type EditorNode = SlateNode & {
  _key: string
  _type: string
}
/** @internal */
export type HistoryItem = {
  operations: SlateOperation[]
  timestamp: Date
}
/** @internal */
export interface History {
  redos: HistoryItem[]
  undos: HistoryItem[]
}

/** @beta */
export type EditorSelectionPoint = {path: Path; offset: number}
/** @beta */
export type EditorSelection = {anchor: EditorSelectionPoint; focus: EditorSelectionPoint} | null
/** @internal */
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
  subscriptions: (() => () => void)[]

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

/** @beta */
export type MutationChange = {
  type: 'mutation'
  patches: Patch[]
  snapshot: PortableTextBlock[] | undefined
}

/** @beta */
export type PatchChange = {
  type: 'patch'
  patch: Patch
}

/** @beta */
export type ValueChange = {
  type: 'value'
  value: PortableTextBlock[] | undefined
}

/** @beta */
export type SelectionChange = {
  type: 'selection'
  selection: EditorSelection
}

/** @beta */
export type FocusChange = {
  type: 'focus'
  event: FocusEvent<HTMLDivElement, Element>
}

/** @beta */
export type UnsetChange = {
  type: 'unset'
  previousValue: PortableTextBlock[]
}

/** @beta */
export type BlurChange = {
  type: 'blur'
  event: FocusEvent<HTMLDivElement, Element>
}

/** @beta */
export type LoadingChange = {
  type: 'loading'
  isLoading: boolean
}

/** @beta */
export type ReadyChange = {
  type: 'ready'
}

/** @beta */
export type ErrorChange = {
  type: 'error'
  name: string // short computer readable name
  level: 'warning' | 'error'
  description: string
  data?: unknown
}

/** @beta */
export type InvalidValueResolution = {
  patches: Patch[]
  description: string
  action: string
  item: PortableTextBlock[] | PortableTextBlock | PortableTextChild | undefined
}

/** @beta */
export type InvalidValue = {
  type: 'invalidValue'
  resolution: InvalidValueResolution | null
  value: PortableTextBlock[]
}

/** @beta */
export type UndoChange = {
  type: 'undo'
  patches: Patch[]
  timestamp: Date
}

/** @beta */
export type RedoChange = {
  type: 'redo'
  patches: Patch[]
  timestamp: Date
}

/** @beta */
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

/** @beta */
export type OnPasteResult =
  | {
      insert?: TypedObject[]
      path?: Path
    }
  | undefined
export type OnPasteResultOrPromise = OnPasteResult | Promise<OnPasteResult>

/** @beta */
export interface PasteData {
  event: React.ClipboardEvent
  path: Path
  schemaTypes: PortableTextMemberSchemaTypes
  value: PortableTextBlock[] | undefined
}

/** @beta */
export type OnPasteFn = (data: PasteData) => OnPasteResultOrPromise

/** @beta */
export type OnBeforeInputFn = (event: Event) => void

/** @beta */
export type OnCopyFn = (
  event: React.ClipboardEvent<HTMLDivElement | HTMLSpanElement>
) => undefined | unknown

/** @beta */
export type PatchObservable = Observable<{
  patches: Patch[]
  snapshot: PortableTextBlock[] | undefined
}>

/** @beta */
export interface BlockRenderProps {
  children: React.ReactElement
  editorElementRef: React.RefObject<HTMLElement>
  focused: boolean
  level?: number
  listItem?: string
  path: Path
  selected: boolean
  style?: string
  schemaType: ObjectSchemaType
  /** @deprecated Use `schemaType` instead */
  type: ObjectSchemaType
  value: PortableTextBlock
}

/** @beta */
export interface BlockChildRenderProps {
  annotations: PortableTextObject[]
  children: React.ReactElement
  editorElementRef: React.RefObject<HTMLElement>
  focused: boolean
  path: Path
  selected: boolean
  schemaType: ObjectSchemaType
  /** @deprecated Use `schemaType` instead */
  type: ObjectSchemaType
  value: PortableTextChild
}

/** @beta */
export interface BlockAnnotationRenderProps {
  block: PortableTextBlock
  children: React.ReactElement
  editorElementRef: React.RefObject<HTMLElement>
  focused: boolean
  path: Path
  schemaType: ObjectSchemaType
  selected: boolean
  /** @deprecated Use `schemaType` instead */
  type: ObjectSchemaType
  value: PortableTextObject
}
/** @beta */
export interface BlockDecoratorRenderProps {
  children: React.ReactElement
  editorElementRef: React.RefObject<HTMLElement>
  focused: boolean
  path: Path
  schemaType: BlockDecoratorDefinition
  selected: boolean
  /** @deprecated Use `schemaType` instead */
  type: BlockDecoratorDefinition
  value: string
}
/** @beta */

export interface BlockListItemRenderProps {
  block: PortableTextTextBlock
  children: React.ReactElement
  editorElementRef: React.RefObject<HTMLElement>
  focused: boolean
  level: number
  path: Path
  schemaType: BlockListDefinition
  selected: boolean
  value: string
}

/** @beta */
export type RenderBlockFunction = (props: BlockRenderProps) => JSX.Element

/** @beta */
export type RenderChildFunction = (props: BlockChildRenderProps) => JSX.Element

/** @beta */
export type RenderAnnotationFunction = (props: BlockAnnotationRenderProps) => JSX.Element

/** @beta */
export type RenderStyleFunction = (props: BlockStyleRenderProps) => JSX.Element

/** @beta */

export interface BlockStyleRenderProps {
  block: PortableTextTextBlock
  children: React.ReactElement
  editorElementRef: React.RefObject<HTMLElement>
  focused: boolean
  path: Path
  selected: boolean
  schemaType: BlockStyleDefinition
  value: string
}

/** @beta */
export type RenderListItemFunction = (props: BlockListItemRenderProps) => JSX.Element

/** @beta */
export type RenderDecoratorFunction = (props: BlockDecoratorRenderProps) => JSX.Element

/** @beta */
export type ScrollSelectionIntoViewFunction = (
  editor: PortableTextEditor,
  domRange: globalThis.Range
) => void

/** @internal */
export type PortableTextMemberSchemaTypes = {
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
