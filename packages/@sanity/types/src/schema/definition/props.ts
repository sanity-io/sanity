import {
  type EditorChange,
  type EditorSelection,
  type HotkeyOptions,
  type OnCopyFn,
  type OnPasteFn,
  type PortableTextEditor,
  type RangeDecoration,
} from '@portabletext/editor'
import {type MarkdownPluginConfig} from '@portabletext/editor/plugins'
import {type SanityClient} from '@sanity/client'
import {
  type ComponentType,
  type CSSProperties,
  type FocusEvent,
  type FocusEventHandler,
  type FormEventHandler,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import {type Observable} from 'rxjs'

import {type AssetMetadataType, type AssetSourceSpec} from '../../assets/types'
import {type CrossDatasetReferenceValue} from '../../crossDatasetReference/types'
import {type KeyedSegment, type Path, type PathSegment} from '../../paths/types'
import {
  type PortableTextBlock,
  type PortableTextObject,
  type PortableTextTextBlock,
} from '../../portableText/types'
import {type Reference} from '../../reference/types'
import {type User} from '../../user/types'
import {type FormNodeValidation} from '../../validation/types'
import {type PreviewLayoutKey, type PreviewMediaDimensions} from '../preview'
import {
  type ArraySchemaType,
  type BooleanSchemaType,
  type I18nTextRecord,
  type NumberSchemaType,
  type ObjectSchemaType,
  type ReferenceSchemaType,
  type SchemaType,
  type StringSchemaType,
} from '../types'
import {
  type BlockDecoratorDefinition,
  type BlockListDefinition,
  type BlockStyleDefinition,
} from './type/block'
import {type FileValue} from './type/file'
import {type GeopointValue} from './type/geopoint'
import {type ImageValue} from './type/image'
import {type ReferenceValue} from './type/reference'
import {type SlugValue} from './type/slug'

/**
 * @hidden
 * @beta
 */
export interface PreviewProps<TLayoutKey = PreviewLayoutKey> {
  actions?: ReactNode | ComponentType<{layout: TLayoutKey}>
  children?: ReactNode
  description?: ReactNode | ComponentType<{layout: TLayoutKey}>
  error?: Error | null
  fallbackTitle?: ReactNode
  imageUrl?: string
  isPlaceholder?: boolean
  layout?: TLayoutKey
  media?: ReactNode | ComponentType<{dimensions: PreviewMediaDimensions; layout: TLayoutKey}>
  mediaDimensions?: PreviewMediaDimensions
  progress?: number
  status?: ReactNode | ComponentType<{layout: TLayoutKey}>
  subtitle?: ReactNode | ComponentType<{layout: TLayoutKey}>
  title?: ReactNode | ComponentType<{layout: TLayoutKey}>
  withBorder?: boolean
  withRadius?: boolean
  withShadow?: boolean
  schemaType?: SchemaType
  renderDefault: (props: PreviewProps) => React.JSX.Element
}

/** @public */
export type ObjectItem = {
  _type?: string
  _key: string
}

/**
 * @hidden
 * @beta */
export interface ArrayInputInsertEvent<Item> {
  items: Item[]
  position: 'before' | 'after'
  referenceItem: KeyedSegment | number
  skipInitialValue?: boolean
  open?: boolean
}

/**
 * @hidden
 * @beta */
export interface ArrayInputCopyEvent<Item> {
  items: Item[]
}

/**
 * @hidden
 * @beta */
export interface ArrayInputMoveItemEvent {
  fromIndex: number
  toIndex: number
}

/**
 * @hidden
 * @public */
export interface FormNodePresence {
  user: User
  path: Path
  sessionId: string
  lastActiveAt: string
  selection?: EditorSelection
}

/**
 * Props for the base item component.
 *
 * @public
 */
export interface BaseItemProps<T> {
  /** The schema type of the item. */
  schemaType: SchemaType
  /** The key of the item. */
  key: string
  /** The index of the item. */
  index: number
  /** The level of the item. */
  level: number
  /** The value of the item. */
  value: unknown
  /** The path of the item. */
  path: Path
  /** The title of the item. */
  title: string | undefined
  /** The description of the item. */
  description: string | undefined
  /** The ID of the input element. */
  inputId: string
  /** The function to call when the item receives focus. */
  onFocus: (event: FocusEvent) => void
  /** The function to call when the item loses focus. */
  onBlur: (event: FocusEvent) => void
  /** Whether the item is read-only. */
  readOnly?: boolean
  /** Whether the item is focused. */
  focused?: boolean
  /** The function to call when the item is removed. */
  onRemove: () => void

  // --- todo, potentially
  // onMoveTo: (event: {ref: number|string, position: 'before'|'after'}) => void
  // onDuplicate: () => void
  // ---
  /**
   * @hidden
   * @beta */
  onInsert: (event: Omit<ArrayInputInsertEvent<T>, 'referenceItem'>) => void

  /**
   * @hidden
   * @beta */
  onCopy: (event: Omit<ArrayInputCopyEvent<T>, 'referenceItem'>) => void

  /** The children of the item. */
  children: ReactNode

  /** The validation markers for the item. */
  validation: FormNodeValidation[]

  /**
   * @hidden
   * @beta */
  presence: FormNodePresence[]

  /** The function to call to render the default item. See {@link ItemProps} */
  renderDefault: (props: ItemProps) => React.JSX.Element
}

/**
 * @hidden
 * @public
 */
export interface BaseFormNode<T = unknown, S extends SchemaType = SchemaType> {
  // constants
  /** The unique identifier of the node. */
  id: string
  /** The schema type of the node. */
  schemaType: S
  /** The level of the node in the form hierarchy. */
  level: number
  /** The path of the node in the form hierarchy. */
  path: Path

  // state
  /**
   * @hidden
   * @beta */
  presence: FormNodePresence[]
  /** The validation markers of the node. */
  validation: FormNodeValidation[]
  /** The value of the node. */
  value: T | undefined
  /** Whether the node is read-only. */
  readOnly?: boolean
  /** Whether the node is focused. */
  focused?: boolean
  /** Whether the node has changes in a draft. */
  changed: boolean
}

/**
 * @hidden
 * @beta */
export interface ArrayItemError {
  kind: 'error'
  key: string
  index: number
  error: InvalidItemTypeError
}

/**
 * This error may happen for arrays (of both objects and primitive values) if we encounter items that are not valid according to the schema definition
 *
 *
 * @hidden
 * @beta
 */
export type InvalidItemTypeError = {
  type: 'INVALID_ITEM_TYPE'
  validTypes: SchemaType[]
  resolvedValueType: string
  value: unknown
}

/**
 * @hidden
 * @beta */
export interface FormFieldGroup {
  name: string
  selected?: boolean
  disabled?: boolean
  title?: string
  i18n?: I18nTextRecord<'title'>
  icon?: ComponentType
}

/**
 * @hidden
 * @beta */
export type ArrayOfObjectsMember = ArrayOfObjectsItemMember | ArrayItemError

/** @public */
export interface ObjectArrayFormNode<
  T extends ObjectItem = ObjectItem,
  S extends ObjectSchemaType = ObjectSchemaType,
> extends BaseFormNode<T, S> {
  /** The focus path of the form node. */
  focusPath: Path
  value: T

  /**
   * @hidden
   * @beta */
  groups: FormFieldGroup[]
  /**
   * @hidden
   * @beta */
  members: ObjectMember[]

  changesOpen?: boolean
}

/**
 * Represents a field member in a form.
 * @public
 */
export interface FieldMember<Node extends BaseFormNode = BaseFormNode> {
  /** The kind of the form node. */
  kind: 'field'
  /** The key of the field. */
  key: string
  /** The name of the field. */
  name: string
  /** The index of the field. */
  index: number
  /** Whether the field is collapsed. */
  collapsed: boolean | undefined
  /** Whether the field is collapsible. */
  collapsible: boolean | undefined
  /** Whether the field is open. */
  open: boolean

  /**
   * @internal
   * Whether this field is in the selected group.
   */
  inSelectedGroup: boolean

  /**
   * @internal
   * Names of the field groups this field is part of.
   */
  groups: string[]

  /**
   * @hidden
   * @beta
   * The form node that represents this field.
   */
  field: Node
}
/**
 * Represents a member of a field set.
 * @public
 */
export interface FieldSetMember {
  /** The kind of member. */
  kind: 'fieldSet'
  /** The key of the member. */
  key: string

  /**
   * Indicates whether the member is included in the currently selected group.
   * If it's hidden and in the currently selected group, it should still be excluded from its group.
   * @internal
   */
  _inSelectedGroup: boolean
  /** The names of the field groups the member belongs to. */
  groups: string[]

  /**
   * @hidden
   * @beta
   * The state of the field set.
   */
  fieldSet: FieldsetState
}

/**
 * @hidden
 * @beta */
export interface FieldsetState {
  path: Path
  name: string
  level: number
  title?: string
  description?: string
  hidden?: boolean
  collapsible?: boolean
  collapsed?: boolean
  columns?: number | number[]
  members: (FieldMember | FieldError)[]
}

/**
 * This error may happen if the member type is structurally incompatible with the defined schema type.
 * Some examples:
 *   - the schema type defines an array, but the actual value is an object (or vice versa)
 *   - the schema type defines a number, but the actual value is a string (or vice versa)
 *   - the schema type defines an object, but the actual value is a string (or vice versa)
 *
 * @public
 */
export type IncompatibleTypeError = {
  type: 'INCOMPATIBLE_TYPE'
  expectedSchemaType: SchemaType
  resolvedValueType: string
  value: unknown
}

/**
 * This error may happen if the _type of the value is different from the declared schema type
 * It represents a case where we encounter field value that is structurally compatible with the field's defined schema type
 * (e.g. they are both json objects), but the _type name is different from what the schema type expects
 *
 * Note on compatibility: The schema of a field may be defined as an object with fields (a, b, c), but the value is an object with (d, e, f)
 * These are still structurally compatible because (d, e, f) will be considered undeclared members
 *
 * @public
 */
export type TypeAnnotationMismatchError = {
  type: 'TYPE_ANNOTATION_MISMATCH'
  expectedSchemaType: SchemaType
  resolvedValueType: string
}

/**
 * This error may happen for arrays of objects where one or more of the members are missing a _key
 *
 * @public
 */
export type MissingKeysError = {
  type: 'MISSING_KEYS'
  schemaType: ArraySchemaType
  value: {_key?: string}[]
}

/**
 * This error may happen for arrays of objects where one or more of the members are having duplicate keys
 *
 * @public
 */
export type DuplicateKeysError = {
  type: 'DUPLICATE_KEYS'
  schemaType: ArraySchemaType
  duplicates: [index: number, key: string][]
}

/**
 * This error may happen for objects if we encounter fields that are not declared in the schema
 *
 * @public
 */
export type UndeclaredMembersError = {type: 'UNDECLARED_MEMBERS'; schemaType: ArraySchemaType}

/**
 * This error may happen for objects if we encounter fields that are not declared in the schema
 *
 * @public
 */
export type MixedArrayError = {type: 'MIXED_ARRAY'; schemaType: ArraySchemaType; value: unknown[]}

/**
 * Represents an error that occurred in a specific field of a data object.
 * @public
 *
 * @remarks
 * This interface is used to provide detailed information about the error,
 * including the field name, the error type, and the error message.
 */
export interface FieldError {
  /**
   * The type of error that occurred.
   */
  kind: 'error'
  /**
   * The unique identifier for the error.
   */
  key: string
  /**
   * The name of the field that the error occurred in.
   */
  fieldName: string
  /**
   * The specific error that occurred.
   *
   * ```md
   * Possible error types include:
   * - IncompatibleTypeError
   * - TypeAnnotationMismatchError
   * - MissingKeysError
   * - DuplicateKeysError
   * - UndeclaredMembersError
   * - MixedArrayError
   * ```
   *
   * See {@link IncompatibleTypeError},
   * {@link TypeAnnotationMismatchError},
   * {@link MissingKeysError},
   * {@link DuplicateKeysError},
   * {@link UndeclaredMembersError} and
   * {@link MixedArrayError} for more information.
   *
   */
  error:
    | IncompatibleTypeError
    | TypeAnnotationMismatchError
    | MissingKeysError
    | DuplicateKeysError
    | UndeclaredMembersError
    | MixedArrayError
}

/** @public */
export type ObjectMember = FieldMember | FieldSetMember | FieldError

/**
 * @hidden
 * @beta */
export interface ArrayOfObjectsItemMember<Node extends ObjectArrayFormNode = ObjectArrayFormNode> {
  kind: 'item'
  key: string
  index: number

  collapsed: boolean | undefined
  collapsible: boolean | undefined

  open: boolean

  parentSchemaType: ArraySchemaType

  /**
   * @hidden
   * @beta */
  item: Node
}

/** @public */
export interface ArrayOfObjectsFormNode<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType,
> extends BaseFormNode<T, S> {
  /** The focus path of the form node. */
  focusPath: Path
  /**
   * @hidden
   * @beta */
  members: ArrayOfObjectsMember[]
}

/**
 * @hidden
 * @beta */
export interface FormPatchBase {
  /**
   * A property used to identify this as a Sanity patch type, eg "set", "unset", "insert", etc.
   * This allows us to potentially introduce new patch types in the future without breaking
   * existing code. This is an internal property/implementation detail and should not be used by
   * consumers.
   *
   * @internal
   */
  patchType: symbol
}

/**
 *
 * @hidden
 * @beta
 */
export type FormPatchOrigin = 'remote' | 'local' | 'internal'

/**
 *
 * @hidden
 * @beta
 */
export type FormPatchJSONValue =
  | number
  | string
  | boolean
  | {[key: string]: FormPatchJSONValue}
  | FormPatchJSONValue[]

/**
 *
 * @hidden
 * @beta
 */
export interface FormSetPatch extends FormPatchBase {
  path: Path
  type: 'set'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 *
 * @hidden
 * @beta
 */
export interface FormSetIfMissingPatch extends FormPatchBase {
  path: Path
  origin?: FormPatchOrigin
  type: 'setIfMissing'
  value: FormPatchJSONValue
}

/**
 *
 * @hidden
 * @beta
 */
export interface FormUnsetPatch extends FormPatchBase {
  path: Path
  origin?: FormPatchOrigin
  type: 'unset'
}

/**
 *
 * @hidden
 * @beta
 */
export type FormInsertPatchPosition = 'before' | 'after'

/**
 *
 * @hidden
 * @beta
 */
export interface FormInsertPatch extends FormPatchBase {
  path: Path
  origin?: FormPatchOrigin
  type: 'insert'
  position: FormInsertPatchPosition
  items: FormPatchJSONValue[]
}

/**
 *
 * @hidden
 * @beta
 */
export interface FormDiffMatchPatch extends FormPatchBase {
  path: Path
  type: 'diffMatchPatch'
  origin?: FormPatchOrigin
  value: string
}

/**
 *
 * @hidden
 * @beta
 */
export type FormPatch =
  | FormSetPatch
  | FormSetIfMissingPatch
  | FormUnsetPatch
  | FormInsertPatch
  | FormDiffMatchPatch

/**
 *
 * @hidden
 * @beta
 */
export type PatchArg = FormPatch | FormPatch[]

/**
 *
 * @hidden
 * @beta
 */
export interface PatchEventInterface {
  patches: Array<FormPatch>

  prepend(...patches: PatchArg[]): PatchEventInterface

  append(...patches: PatchArg[]): PatchEventInterface

  prefixAll(segment: PathSegment): PatchEventInterface
}

/**
 * These are the props an implementation of the ArrayFunctions component will receive
 *
 *
 * @hidden
 * @beta
 */
export interface ArrayInputFunctionsProps<Item, TSchemaType extends ArraySchemaType> {
  children?: ReactNode
  onItemAppend: (itemValue: Item) => void
  onChange: (event: PatchEventInterface) => void
  onValueCreate: (type: TSchemaType) => Item
  onItemPrepend: (itemValue: Item) => void
  readOnly?: boolean
  schemaType: TSchemaType
  value?: Item[]
}

/**
 *
 * @hidden
 * @beta
 */
export type UploadOptions = {
  metadata?: AssetMetadataType[]
  storeOriginalFilename?: boolean
  label?: string
  title?: string
  description?: string
  creditLine?: string
  source?: AssetSourceSpec
}

/**
 *
 * @hidden
 * @beta
 */
export type UploadProgressEvent = {
  type: 'uploadProgress'
  patches: FormPatch[] | null
}

/**
 *
 * @hidden
 * @beta
 */
export type Uploader<S extends SchemaType = SchemaType> = {
  type: string
  accepts: string
  upload: (
    client: SanityClient,
    file: File,
    type: S,
    options?: UploadOptions,
  ) => Observable<UploadProgressEvent>
  priority: number
}

/**
 *
 * @hidden
 * @beta
 */
export interface FileLike {
  // mime type
  type: string
  // file name (e.g. somefile.jpg)
  name?: string
}

/**
 *
 * @hidden
 * @beta
 */
export type UploaderResolver<S extends SchemaType = SchemaType> = (
  type: S,
  file: FileLike,
) => Uploader<S> | null

/**
 * @hidden
 * @beta */
export interface UploadEvent {
  file: File
  schemaType: SchemaType
  uploader: Uploader
}

/**
 * @hidden
 * @beta */
export interface OnPathFocusPayload {
  selection?: EditorSelection
}

/**
 * @hidden
 * @beta */
export interface DocumentFieldAction {
  name: string
  useAction: DocumentFieldActionHook
}

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionProps {
  documentId: string
  documentType: string
  path: Path
  schemaType: SchemaType
}

/**
 * @hidden
 * @beta */
export type DocumentFieldActionStatus = 'info' | 'success' | 'warning' | 'error'

/**
 * @hidden
 * @beta */
export type DocumentFieldActionTone = 'primary' | 'positive' | 'caution' | 'critical'

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionItem {
  type: 'action'
  disabled?: boolean | {reason: ReactNode}
  hidden?: boolean
  icon?: ComponentType
  iconRight?: ComponentType
  onAction: () => void
  renderAsButton?: boolean
  selected?: boolean
  status?: DocumentFieldActionStatus
  title: string
  i18n?: I18nTextRecord<'title'>
  tone?: DocumentFieldActionTone
}

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionDivider {
  type: 'divider'
}

/**
 * @hidden
 * @beta */
export type DocumentFieldActionNode =
  | DocumentFieldActionItem
  | DocumentFieldActionGroup
  | DocumentFieldActionDivider

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionGroup {
  type: 'group'
  children: DocumentFieldActionNode[]
  disabled?: boolean | {reason: ReactNode}
  expanded?: boolean
  hidden?: boolean
  icon?: ComponentType
  renderAsButton?: boolean
  status?: DocumentFieldActionStatus
  title: string
  i18n?: I18nTextRecord<'title'>
  tone?: DocumentFieldActionTone
}

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionHook {
  (props: DocumentFieldActionProps): DocumentFieldActionItem | DocumentFieldActionGroup
}

/** @internal @deprecated DO NOT USE */
export interface FieldCommentsProps {
  hasComments: boolean
  button: ReactNode
  isAddingComment: boolean
}

/**
 * @hidden
 * @public */
export interface BaseFieldProps {
  /** @beta */
  actions?: DocumentFieldAction[]
  /** @internal @deprecated DO NOT USE */
  __internal_comments?: FieldCommentsProps
  /** @internal @deprecated ONLY USED BY AI ASSIST PLUGIN */
  __internal_slot?: ReactNode
  schemaType: SchemaType
  title: string | undefined
  description: string | undefined
  /**
   * @hidden
   * @beta */
  presence: FormNodePresence[]
  validation: FormNodeValidation[]
  level: number
  inputId: string
  value: unknown | undefined
  path: Path
  name: string
  index: number
  changed: boolean
  children: ReactNode
  version?: string
  renderDefault: (props: FieldProps) => React.JSX.Element
}

/**
 * @hidden
 * @public */
export interface ObjectFieldProps<T = Record<string, unknown>> extends BaseFieldProps {
  schemaType: ObjectSchemaType
  value: T | undefined
  collapsed?: boolean
  collapsible?: boolean
  onCollapse: () => void
  onExpand: () => void
  open: boolean
  onClose: () => void
  onOpen: () => void
  inputProps: ObjectInputProps<T>
}

/**
 * @hidden
 * @public */
export interface ArrayFieldProps extends BaseFieldProps {
  schemaType: ArraySchemaType
  value: unknown[] | undefined
  collapsed?: boolean
  collapsible?: boolean
  onCollapse: () => void
  onExpand: () => void
  inputProps: ArrayOfObjectsInputProps
}

/**
 * @hidden
 * @public */
export interface ArrayOfPrimitivesFieldProps extends BaseFieldProps {
  schemaType: ArraySchemaType
  value: unknown[] | undefined
  collapsed?: boolean
  collapsible?: boolean
  onCollapse: () => void
  onExpand: () => void
  inputProps: ArrayOfPrimitivesInputProps
}

/**
 * @hidden
 * @public */
export interface NumberFieldProps extends BaseFieldProps {
  schemaType: NumberSchemaType
  value: number | undefined
  inputProps: NumberInputProps
}

/**
 * @hidden
 * @public */
export interface BooleanFieldProps extends BaseFieldProps {
  schemaType: BooleanSchemaType
  value: boolean | undefined
  inputProps: BooleanInputProps
}

/**
 * @hidden
 * @public */
export interface StringFieldProps extends BaseFieldProps {
  schemaType: StringSchemaType
  value: string | undefined
  inputProps: StringInputProps
}

/** @internal */
export type PrimitiveFieldProps = NumberFieldProps | BooleanFieldProps | StringFieldProps

/**
 * @hidden
 * @public  */
export type RenderArrayOfObjectsItemCallback = (
  itemProps: Omit<ObjectItemProps, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @public */
export type FieldProps =
  | ObjectFieldProps
  | ObjectFieldProps<CrossDatasetReferenceValue>
  | ObjectFieldProps<FileValue>
  | ObjectFieldProps<GeopointValue>
  | ObjectFieldProps<ImageValue>
  | ObjectFieldProps<ReferenceValue>
  | ObjectFieldProps<SlugValue>
  | ArrayFieldProps
  | NumberFieldProps
  | BooleanFieldProps
  | StringFieldProps

/**
 * @hidden
 * @public */
export type RenderFieldCallback<T extends FieldProps = FieldProps> = (
  fieldProps: Omit<T, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @public */
export type RenderInputCallback<T extends InputProps = InputProps> = (
  inputProps: Omit<T, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @public */
export type RenderPreviewCallback = (props: RenderPreviewCallbackProps) => ReactNode

/**
 *
 * @hidden
 * @public
 */
export interface RenderPreviewCallbackProps<TLayoutKey = PreviewLayoutKey> {
  actions?: ReactNode | ComponentType<{layout: TLayoutKey}>
  children?: ReactNode
  error?: Error | null
  fallbackTitle?: ReactNode
  isPlaceholder?: boolean
  layout?: TLayoutKey
  mediaDimensions?: PreviewMediaDimensions
  progress?: number
  status?: ReactNode | ComponentType<{layout: TLayoutKey}>
  value: unknown
  withBorder?: boolean
  withRadius?: boolean
  withShadow?: boolean
  schemaType: SchemaType
  skipVisibilityCheck?: boolean
  style?: CSSProperties
}

/**
 * Props for rendering a Portable Text block
 *
 * @public
 */
export interface BlockProps {
  /**
   * Boundary element of the floating toolbar element.
   */
  __unstable_floatingBoundary: HTMLElement | null
  /**
   * Boundary element for the block.
   */
  __unstable_referenceBoundary: HTMLElement | null
  /**
   * DOM element for the block.
   */
  __unstable_referenceElement: HTMLElement | null
  /**
   * The default rendering of the block (the text).
   */
  children: ReactNode
  /**
   * If the block currently is focused by the user.
   */
  focused: boolean
  /**
   * Markers (meta data) connected to this annotation.
   * @deprecated - use `renderBlock` and `renderInlineBlock` interfaces instead
   */
  markers: PortableTextMarker[]
  /**
   * Closes the editing form connected to this block.
   * For regular text blocks this is not relevant.
   */
  onClose: () => void
  /**
   * Opens the editing form connected to this block.
   * For regular text blocks this is not relevant.
   */
  onOpen: () => void
  /**
   * Focus a form node in this block.
   * @param path - the relative path to the form node to put focus on.
   */
  onPathFocus: (path: Path) => void
  /**
   * Removes the block.
   */
  onRemove: () => void
  /**
   * If the block is currently opened for editing.
   */
  open: boolean
  /**
   * The parent schema type (array type).
   */
  parentSchemaType: ArraySchemaType | ObjectSchemaType
  /**
   * The full form path to this block from document root.
   */
  path: Path
  /**
   * Form presence for this block.
   */
  presence: FormNodePresence[]
  /**
   * Is the block object read only?
   */
  readOnly: boolean
  /**
   * Plugin chain render callback.
   */
  renderAnnotation?: RenderAnnotationCallback
  /**
   * Plugin chain render callback.
   */
  renderBlock?: RenderBlockCallback
  /**
   * Plugin chain render callback (default rendering function of the block).
   */
  renderDefault: (props: BlockProps) => React.JSX.Element
  /**
   * Plugin chain render callback.
   */
  renderField: RenderFieldCallback
  /**
   * Plugin chain render callback.
   */
  renderInlineBlock?: RenderBlockCallback
  /**
   * Plugin chain render callback.
   */
  renderInput: RenderInputCallback
  /**
   * Plugin chain render callback.
   */
  renderItem: RenderArrayOfObjectsItemCallback
  /**
   * Plugin chain render callback.
   */
  renderPreview: RenderPreviewCallback
  /**
   * The schema type for the block.
   */
  schemaType: ObjectSchemaType
  /**
   * If the block is in the user's selection.
   */
  selected: boolean
  /**
   * Form validation for the block object.
   */
  validation: FormNodeValidation[]
  /**
   * Value of the block.
   */
  value: PortableTextBlock
}

/**
 * Props for rendering Portable Text plugins
 *
 * @beta
 */
export interface PortableTextPluginsProps {
  renderDefault: (props: PortableTextPluginsProps) => React.JSX.Element
  plugins: {markdown: {config: MarkdownPluginConfig}}
}

/**
 * @hidden
 * @public */
export type RenderBlockCallback<T extends BlockProps = BlockProps> = (
  blockProps: Omit<T, 'renderDefault'>,
) => ReactNode

/**
 * A generic marker for attaching metadata to specific nodes of the Portable Text input.
 *
 * @public
 * @hidden
 * @deprecated use `renderBlock`, `renderInlineBlock`, `renderAnnotation` interfaces instead
 * @param type - a type name for this marker
 * @param data - some data connected to this marker
 * @param path - the path to the Portable Text content connected to this marker
 */
export interface PortableTextMarker {
  type: string
  data?: unknown
  path: Path
}

/**
 * Props for rendering a Portable Text annotation
 *
 * @public
 * @remarks If you want to render a mix of the annotated text and non-text content, you have to attribute
 * the non-text containers with `contentEditable={false}`. See the second example.
 * @example Simple example of customizing the annotation text to render yellow.
 * ```ts
 * (props: BlockAnnotationProps) =>
 *   props.renderDefault({
 *     ...props,
 *     textElement: <span style={{color: 'yellow'}}>{props.textElement}</span>,
 *   })
 * ```
 * @example Simple example of rendering the annotation with a custom modal for editing.
 * Note that the form content container is attributed as `contentEditable={false}`.
 * This is to signal to the text editor that this content isn't part of the editable text.
 * ```ts
 * (props: BlockAnnotationProps) => {
 *   return (
 *     <>
 *       // Render the annotated text
 *       <span onClick={props.onOpen}>
 *         {props.textElement}
 *       </span>
 *       // Render the editing form if the object is opened
 *       {props.open && (
 *         <Dialog
 *           contentEditable={false} // Attribute this as non-editable to the text editor
 *           header={`Edit ${props.schemaType.title}`}
 *           id={`dialog-${props.value._key}`}
 *           onClickOutside={props.onClose}
 *           onClose={props.onClose}
 *         >
 *           <Box margin={2} padding={2}>
 *             {props.children}
 *           </Box>
 *         </Dialog>
 *      )}
 *     </>
 *   )
 * }
 * ```
 * */
export interface BlockAnnotationProps {
  /**
   * Boundary element of the floating toolbar element.
   */
  __unstable_floatingBoundary: HTMLElement | null
  /**
   * Boundary element where the text for this annotation appears.
   */
  __unstable_referenceBoundary: HTMLElement | null
  /**
   * DOM element for the annotated text.
   */
  __unstable_referenceElement: HTMLElement | null
  /**
   * Wether the annotated text node has editor focus.
   * @remarks differs from `focused` which is wether the annotation object has form focus.
   */
  __unstable_textElementFocus?: boolean
  /**
   * The input form for the annotation object.
   * @remarks If you wrap this in something, you must make sure to put `contentEditable={false}` on the root container.
   * Otherwise the editor will think content is part of the editable text and will error.
   */
  children: ReactNode
  /**
   * If the editor form for this annotation object currently have form focus.
   */
  focused: boolean
  /**
   * Markers (meta data) connected to this annotation.
   * @deprecated - use `renderBlock` and `renderInlineBlock` interfaces instead
   */
  markers: PortableTextMarker[]
  /**
   * Closes the editing form connected to this annotation.
   */
  onClose: () => void
  /**
   * Opens the editing form connected to this annotation.
   */
  onOpen: () => void
  /**
   * Focus a form node in the object for this annotation.
   * @param path - the relative path to the form node to put focus on.
   */
  onPathFocus: (path: Path) => void
  /**
   * Removes the annotation object from the text.
   */
  onRemove: () => void
  /**
   * If the annotation is currently opened for editing.
   */
  open: boolean
  /**
   * The parent schema type. For annotations this this the block type.
   */
  parentSchemaType: SchemaType
  /**
   * The full form path to this annotation from document root.
   */
  path: Path
  /**
   * Form presence for this annotation.
   */
  presence: FormNodePresence[]
  /**
   * Is the annotation object read only?
   */
  readOnly: boolean
  /**
   * Plugin chain render callback.
   */
  renderAnnotation?: RenderAnnotationCallback
  /**
   * Plugin chain render callback.
   */
  renderBlock?: RenderBlockCallback
  /**
   * Plugin chain render callback.
   */
  renderDefault: (props: BlockAnnotationProps) => React.JSX.Element
  /**
   * Plugin chain render callback.
   */
  renderField: RenderFieldCallback
  /**
   * Plugin chain render callback.
   */
  renderInlineBlock?: RenderBlockCallback
  /**
   * Plugin chain render callback.
   */
  renderInput: RenderInputCallback
  /**
   * Plugin chain render callback.
   */
  renderItem: RenderArrayOfObjectsItemCallback
  /**
   * Plugin chain render callback.
   */
  renderPreview: RenderPreviewCallback
  /**
   * The schema type for the annotation object.
   */
  schemaType: ObjectSchemaType & {i18nTitleKey?: string}
  /**
   * If the annotated text currently is selected by the user.
   */
  selected: boolean
  /**
   * React element of the text that is being annotated.
   */
  textElement: React.JSX.Element
  /**
   * Form validation for the annotation object.
   */
  validation: FormNodeValidation[]
  /**
   * Value of the annotation object.
   */
  value: PortableTextObject
}

/**
 * @hidden
 * @public */
export type RenderAnnotationCallback<T extends BlockAnnotationProps = BlockAnnotationProps> = (
  annotationProps: Omit<T, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @beta */
export interface ComplexElementProps {
  'id': string
  'onFocus': FocusEventHandler
  'onBlur': FocusEventHandler
  'ref': MutableRefObject<any>
  'aria-describedby': string | undefined
}

/**
 * @hidden
 * @public */
export interface ArrayOfObjectsInputProps<
  T extends {_key: string} = {_key: string},
  S extends ArraySchemaType = ArraySchemaType,
> extends BaseInputProps,
    ArrayOfObjectsFormNode<T[], S> {
  /**
   * @hidden
   * @beta */
  arrayFunctions?: ComponentType<ArrayInputFunctionsProps<T, S>>

  /**
   * @hidden
   * @beta */
  // Data manipulation callbacks special for array inputs
  onChange: (patch: FormPatch | FormPatch[] | PatchEventInterface) => void

  /**
   * @hidden
   * @beta */
  onItemAppend: (item: T) => void

  /**
   * @hidden
   * @beta */
  onItemPrepend: (item: T) => void

  /**
   * @hidden
   * @beta */
  onItemRemove: (itemKey: string) => void

  /**
   * @hidden
   * @beta */
  onItemMove: (event: ArrayInputMoveItemEvent) => void

  /**
   * @hidden
   * @beta */
  onInsert: (event: ArrayInputInsertEvent<T>) => void

  /**
   * @hidden
   * @beta */
  resolveInitialValue: (type: SchemaType, params: Record<string, unknown>) => Promise<T>

  /**
   * @hidden
   * @beta */
  resolveUploader: UploaderResolver<ObjectSchemaType>

  /**
   * @hidden
   * @beta */
  onUpload: (event: UploadEvent) => void

  /**
   * @hidden
   * @beta */
  onPathFocus: (path: Path, payload?: OnPathFocusPayload) => void

  /**
   * for array inputs using expand/collapse semantics for items
   *
   * @hidden
   * @beta
   */
  onItemCollapse: (itemKey: string) => void

  /**
   * @hidden
   * @beta */
  onItemExpand: (itemKey: string) => void

  /**
   * for array inputs using modal open/close semantics for items
   *
   * @hidden
   * @beta
   */
  onItemOpen: (path: Path) => void

  /**
   * @hidden
   * @beta */
  onItemClose: () => void

  /**
   * @hidden
   * @beta */
  renderAnnotation?: RenderAnnotationCallback

  /**
   * @hidden
   * @beta */
  renderBlock?: RenderBlockCallback

  /**
   * @hidden
   * @beta */
  renderInlineBlock?: RenderBlockCallback

  /**
   * @hidden
   * @beta */
  renderField: RenderFieldCallback

  /**
   * @hidden
   * @beta */
  renderInput: RenderInputCallback

  /**
   * @hidden
   * @beta */
  renderItem: RenderArrayOfObjectsItemCallback

  /**
   * @hidden
   * @beta */
  renderPreview: RenderPreviewCallback

  /**
   * @hidden
   * @beta */
  elementProps: ComplexElementProps
}

/**
 * @hidden
 * @public */
export interface BaseInputProps {
  renderDefault: (props: InputProps) => React.JSX.Element
}

/** @public */
export interface ObjectFormNode<
  T = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType,
> extends BaseFormNode<T, S> {
  /** The focus path of the form node. */
  focusPath: Path
  /**
   * @hidden
   * @beta */
  groups: FormFieldGroup[]
  /**
   * @hidden
   * @beta */
  members: ObjectMember[]
}

/**
 * @hidden
 * @public */
export interface ObjectInputProps<
  T = Record<string, any>,
  S extends ObjectSchemaType = ObjectSchemaType,
> extends BaseInputProps,
    Omit<ObjectFormNode<T, S>, '_allMembers'> {
  /**
   * @hidden
   * @beta */
  groups: FormFieldGroup[]

  /**
   * @hidden
   * @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEventInterface) => void

  /**
   * @hidden
   * @beta */
  onFieldCollapse: (fieldName: string) => void

  /**
   * @hidden
   * @beta */
  onFieldExpand: (fieldName: string) => void

  /**
   * @hidden
   * @beta */
  onFieldSetCollapse: (fieldSetName: string) => void

  /**
   * @hidden
   * @beta */
  onFieldSetExpand: (fieldSetName: string) => void

  /**
   * @hidden
   * @beta */
  onFieldGroupSelect: (groupName: string) => void

  /**
   * @hidden
   * @beta */
  onPathFocus: (path: Path) => void

  /**
   * @hidden
   * @beta */
  onFieldOpen: (fieldName: string) => void

  /**
   * @hidden
   * @beta */
  onFieldClose: (fieldName: string) => void

  /**
   * @hidden
   * @beta */
  renderAnnotation?: RenderAnnotationCallback

  /**
   * @hidden
   * @beta */
  renderBlock?: RenderBlockCallback

  /**
   * @hidden
   * @beta */
  renderInput: RenderInputCallback

  /**
   * @hidden
   * @beta */
  renderField: RenderFieldCallback

  /**
   * @hidden
   * @beta */
  renderInlineBlock?: RenderBlockCallback

  /**
   * @hidden
   * @beta */
  renderItem: RenderArrayOfObjectsItemCallback

  /**
   * @hidden
   * @beta */
  renderPreview: RenderPreviewCallback

  /**
   * @hidden
   * @beta */
  elementProps: ComplexElementProps

  /**
   * @deprecated – DO NOT USE
   *
   * The node for the array editing modal.
   * This node renders the array editing modal as a child of the root input.
   * It is necessary for the array editing dialog to be a child of the root input
   * because the root input may be wrapped in a React context using the Components API,
   * which is utilized by inputs in the form.
   */
  __internal_arrayEditingModal?: ReactNode
}

/**
 * Props for the ObjectItem component.
 * @public
 */
export interface ObjectItemProps<Item extends ObjectItem = ObjectItem> extends BaseItemProps<Item> {
  /** Whether the item has changes in a draft. */
  changed: boolean
  /** The schema type of the object. */
  schemaType: ObjectSchemaType
  /** The schema type of the parent array. */
  parentSchemaType: ArraySchemaType
  /** Whether the item is collapsed. */
  collapsed: boolean | undefined
  /** Whether the item is collapsible. */
  collapsible: boolean | undefined
  /** Callback for when the item is collapsed. */
  onCollapse: () => void
  /** Callback for when the item is expanded. */
  onExpand: () => void
  /** Whether the item is open. */
  open: boolean
  /** Callback for when the item is closed. */
  onClose: () => void
  /** Callback for when the item is opened. */
  onOpen: () => void
  /** The value of the item. */
  value: Item
  /**
   * @hidden
   * @beta */
  inputProps: Omit<ObjectInputProps, 'renderDefault'>
}

/** @public */
export type ItemProps =
  | ObjectItemProps
  | ObjectItemProps<CrossDatasetReferenceValue & ObjectItem>
  | ObjectItemProps<FileValue & ObjectItem>
  | ObjectItemProps<GeopointValue & ObjectItem>
  | ObjectItemProps<ImageValue & ObjectItem>
  | ObjectItemProps<ReferenceValue & ObjectItem>
  | ObjectItemProps<SlugValue & ObjectItem>
  | PrimitiveItemProps

/** @public */
export interface PrimitiveItemProps extends BaseItemProps<string | number | boolean> {
  /**
   * The value of the primitive item.
   */
  value: string | number | boolean
  /**
   * The schema type of the primitive item.
   */
  schemaType: NumberSchemaType | BooleanSchemaType | StringSchemaType
  /**
   * The schema type of the parent array containing the item.
   */
  parentSchemaType: ArraySchemaType
}

/** @public */
export type BooleanFormNode<S extends BooleanSchemaType = BooleanSchemaType> = BaseFormNode<
  boolean,
  S
>

/** @public */
export type NumberFormNode<S extends NumberSchemaType = NumberSchemaType> = BaseFormNode<number, S>

/**
 * @hidden
 * @beta */
export type PrimitiveFormNode = BooleanFormNode | NumberFormNode | StringFormNode

/**
 * @hidden
 * @beta */
export type ArrayOfPrimitivesElementType<T extends any[]> = T extends (infer K)[] ? K : unknown

/**
 * @hidden
 * @beta */
export type RenderArrayOfPrimitivesItemCallback = (
  itemProps: Omit<PrimitiveItemProps, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @beta */
export interface ArrayOfPrimitivesItemMember<Node extends PrimitiveFormNode = PrimitiveFormNode> {
  kind: 'item'
  // note: there's no persistent handle on primitive items, so our only option is to use the index as key here
  key: string
  index: number
  // the state resolver should make sure this
  // gets collapsible: false and collapsed by default

  open: boolean

  parentSchemaType: ArraySchemaType

  /**
   * @hidden
   * @beta */
  item: Node
}

/**
 * @hidden
 * @beta */
export type ArrayOfPrimitivesMember = ArrayOfPrimitivesItemMember | ArrayItemError

/** @public */
export interface ArrayOfPrimitivesFormNode<
  T extends (string | number | boolean)[] = (string | number | boolean)[],
  S extends ArraySchemaType = ArraySchemaType,
> extends BaseFormNode<T, S> {
  /** The focus path of the form node. */
  focusPath: Path
  /**
   * @hidden
   * @beta */
  members: ArrayOfPrimitivesMember[]
}

/**
 * @hidden
 * @public */
export interface PrimitiveInputElementProps {
  'value'?: string
  'id': string
  'readOnly': boolean
  'placeholder'?: string
  'onChange': FormEventHandler
  'onFocus': FocusEventHandler
  'onBlur': FocusEventHandler
  'ref': MutableRefObject<any>
  'aria-describedby': string | undefined
}

/**
 * @hidden
 * @public */
export interface ArrayOfPrimitivesInputProps<
  T extends string | boolean | number = string | boolean | number,
  S extends ArraySchemaType = ArraySchemaType,
> extends BaseInputProps,
    ArrayOfPrimitivesFormNode<T[], S> {
  /**
   * @hidden
   * @beta */
  arrayFunctions?: ComponentType<ArrayInputFunctionsProps<T, S>>

  // note: not a priority to support collapsible arrays right now
  onSetCollapsed: (collapsed: boolean) => void

  /**
   * @hidden
   * @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEventInterface) => void

  /**
   * @hidden
   * @beta */
  onItemAppend: (item: ArrayOfPrimitivesElementType<T[]>) => void

  /**
   * @hidden
   * @beta */
  onItemPrepend: (item: ArrayOfPrimitivesElementType<T[]>) => void

  /**
   * @hidden
   * @beta */
  onItemRemove: (index: number) => void

  /**
   * @hidden
   * @beta */
  onMoveItem: (event: ArrayInputMoveItemEvent) => void

  /**
   * @hidden
   * @beta */
  onInsert: (event: {items: T[]; position: 'before' | 'after'; referenceIndex: number}) => void

  /**
   * @hidden
   * @beta */
  resolveUploader: UploaderResolver<NumberSchemaType | BooleanSchemaType | StringSchemaType>

  /**
   * @hidden
   * @beta */
  onUpload: (event: UploadEvent) => void

  /**
   * @hidden
   * @beta */
  onIndexFocus: (index: number) => void

  /**
   * @hidden
   * @beta */
  renderAnnotation?: RenderAnnotationCallback

  /**
   * @hidden
   * @beta */
  renderBlock?: RenderBlockCallback

  /**
   * @hidden
   * @beta */
  renderInlineBlock?: RenderBlockCallback

  /**
   * @hidden
   * @beta */
  renderInput: RenderInputCallback

  /**
   * @hidden
   * @beta */
  renderItem: RenderArrayOfPrimitivesItemCallback

  /**
   * @hidden
   * @beta */
  renderPreview: RenderPreviewCallback

  /**
   * @hidden
   * @beta */
  elementProps: ComplexElementProps
}

/**
 * @hidden
 * @public */
export interface BooleanInputProps<S extends BooleanSchemaType = BooleanSchemaType>
  extends BaseInputProps,
    BooleanFormNode<S> {
  /**
   * @hidden
   * @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEventInterface) => void

  /**
   * A shorthand aggregation of any validation errors the input currently have
   * Will be falsey if no error.
   * In the case of multiple errors it will be a newline delimited string of each error message
   * For advanced use cases use the ´validation´ prop which contains more levels and details
   */
  validationError?: string
  /**
   * @hidden
   * @beta */
  elementProps: PrimitiveInputElementProps
}

/**
 * @hidden
 * @public */
export interface NumberInputProps<S extends NumberSchemaType = NumberSchemaType>
  extends BaseInputProps,
    NumberFormNode<S> {
  /**
   * @hidden
   * @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEventInterface) => void
  validationError?: string
  /**
   * @hidden
   * @beta */
  elementProps: PrimitiveInputElementProps
}

/**
 * Props for rendering block actions
 *
 * @public
 * @hidden
 * @deprecated use `renderBlock`, `renderInlineBlock`, `renderAnnotation` interfaces instead
 */
export interface RenderBlockActionsProps {
  block: PortableTextBlock
  value: PortableTextBlock[] | undefined
  set: (block: PortableTextBlock) => void
  unset: () => void
  insert: (block: PortableTextBlock | PortableTextBlock[]) => void
}

/**
 * Function for rendering custom block markers
 *
 * @public
 * @hidden
 * @deprecated use `renderBlock`, `renderInlineBlock`, `renderAnnotation` interfaces instead
 */
export type RenderCustomMarkers = (markers: PortableTextMarker[]) => ReactNode

/**
 * Function for rendering custom block actions
 *
 * @public
 * @hidden
 * @deprecated use `renderBlock`, `renderInlineBlock`, `renderAnnotation` interfaces instead
 */
export type RenderBlockActionsCallback = (props: RenderBlockActionsProps) => ReactNode

/**
 *
 * @hidden
 * @beta
 */
export type ReferenceInputProps = ObjectInputProps<Reference, ReferenceSchemaType>

/**
 * Component props for the {@link PortableTextInput} React component.
 *
 * Extends {@link ArrayOfObjectsInputProps}.
 *
 * @public
 * */
export interface PortableTextInputProps
  extends ArrayOfObjectsInputProps<PortableTextBlock, ArraySchemaType<PortableTextBlock>> {
  /**
   * A React Ref that can reference the underlying editor instance
   */
  editorRef?: React.MutableRefObject<PortableTextEditor | null>
  /**
   * Option to hide the default toolbar
   */
  hideToolbar?: boolean
  /**
   * Assign hotkeys that can be attached to custom editing functions
   */
  hotkeys?: HotkeyOptions
  /**
   * Whether the input is activated and should receive events on mount.
   * By default, this value is set to `true`
   */
  initialActive?: boolean
  /**
   * Whether the input is _initially_ open in fullscreen mode
   */
  initialFullscreen?: boolean
  /**
   * Array of {@link PortableTextMarker} with meta data connected to the content.
   * @deprecated will be removed in the next major version of Sanity Studio.
   * Use the `renderBlock` interface instead.
   */
  markers?: PortableTextMarker[]
  /**
   * Returns changes from the underlying editor
   */
  onEditorChange?: (change: EditorChange, editor: PortableTextEditor) => void
  /**
   * Optional callback for when the editor goes into or out of full screen mode
   * @hidden
   * @beta
   */
  onFullScreenChange?: (isFullScreen: boolean) => void
  /**
   * Custom copy function
   */
  onCopy?: OnCopyFn
  /**
   * Custom paste function
   */
  onPaste?: OnPasteFn
  /**
   * Function to render custom block actions
   * @deprecated will be removed in the next major version of Sanity Studio.
   * Use the `renderBlock` interface instead.
   */
  renderBlockActions?: RenderBlockActionsCallback
  /**
   * Function to render custom markers
   * @deprecated will be removed in the next major version of Sanity Studio.
   * Use the `renderBlock` interface instead.
   */
  renderCustomMarkers?: RenderCustomMarkers
  /**
   * Array of {@link RangeDecoration} that can be used to decorate the content.
   */
  rangeDecorations?: RangeDecoration[]
}

/** @public */
export type StringFormNode<S extends StringSchemaType = StringSchemaType> = BaseFormNode<string, S>

/**
 * @hidden
 * @public */
export interface StringInputProps<S extends StringSchemaType = StringSchemaType>
  extends BaseInputProps,
    StringFormNode<S> {
  /**
   * @hidden
   * @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEventInterface) => void
  validationError?: string
  /**
   * @hidden
   * @beta */
  elementProps: PrimitiveInputElementProps
}

/**
 * @hidden
 * @public */
export type InputProps =
  | ArrayOfObjectsInputProps
  | ArrayOfPrimitivesInputProps
  | BooleanInputProps
  | NumberInputProps
  | ObjectInputProps
  | ObjectInputProps<CrossDatasetReferenceValue>
  | ObjectInputProps<FileValue>
  | ObjectInputProps<GeopointValue>
  | ObjectInputProps<ImageValue>
  | ObjectInputProps<ReferenceValue>
  | ObjectInputProps<SlugValue>
  | PortableTextInputProps
  | StringInputProps

/**
 * Props for rendering a Portable Text block as a list item.
 *
 * @public
 */
export interface BlockListItemProps {
  /**
   * The block that is rendered as a list item.
   */
  block: PortableTextTextBlock
  /**
   * The block rendered without the list style.
   */
  children: React.JSX.Element
  /**
   * If the block currently is focused by the user.
   */
  focused: boolean
  /**
   * The nesting level of this list item.
   */
  level: number
  /**
   * The default function for rendering this as a list item. Some list types are built in and
   * will have a default rendering.
   */
  renderDefault: (props: BlockListItemProps) => React.JSX.Element
  /**
   * The schema type for this list type. Icon can be found here.
   */
  schemaType: BlockListDefinition
  /**
   * If the user currently has a text selection in this block.
   */
  selected: boolean
  /**
   * The title of the list item type (e.g. 'Bullet list') for UI-representation.
   */
  title: string
  /**
   * The value of the list item type (e.g. 'bullet') as it appears in the block.listItem attribute.
   */
  value: string
}

/**
 * Props for rendering a text block style.
 *
 * @public
 */
export interface BlockStyleProps {
  /**
   * The value of the block that is rendered style for.
   */
  block: PortableTextTextBlock
  /**
   * The block as rendered without this style.
   */
  children: React.JSX.Element
  /**
   * If the block currently has focus in the text editor.
   */
  focused: boolean
  /**
   * The default rendering function for this style.
   */
  renderDefault: (props: BlockStyleProps) => React.JSX.Element
  /**
   * The schema type for this style.
   */
  schemaType: BlockStyleDefinition
  /**
   * If the block currently have a text selection.
   */
  selected: boolean
  /**
   * The title of the style (e.g. 'Large Heading') for UI-representation.
   */
  title: string
  /**
   * The value of the style (e.g. 'h1') as it appears in the block's `.style` property value.
   */
  value: string
}

/**
 * Props for rendering text decorations in Portable Text blocks.
 * It could be decorations like bold, italic, subscript etc.
 *
 * @public
 */
export interface BlockDecoratorProps {
  /**
   * The span node as rendered without the decorator.
   */
  children: React.JSX.Element
  /**
   * If the span node currently is focused by the user.
   */
  focused: boolean
  /**
   * The default render function for this decorator,
   * some decorators are proved by default and has a default rendering.
   */
  renderDefault: (props: BlockDecoratorProps) => React.JSX.Element
  /**
   * The decorator schema type. Icon can be found here.
   */
  schemaType: BlockDecoratorDefinition
  /**
   * If the span node text currently is selected by the user.
   */
  selected: boolean
  /**
   * The title of the decorator (e.g. 'Underlined text') for UI-representation.
   */
  title: string
  /**
   * The value of the decorator (e.g. 'underlined') as it
   * appears in the child.marks array of the text node.
   */
  value: string
}
