import {
  type EditorChange,
  type EditorSelection,
  type HotkeyOptions,
  type OnCopyFn,
  type OnPasteFn,
  type PortableTextEditor,
  type RangeDecoration,
} from '@portabletext/editor'
import {
  type ArraySchemaType,
  type BooleanSchemaType,
  type CrossDatasetReferenceValue,
  type FileValue,
  type GeopointValue,
  type ImageValue,
  type NumberSchemaType,
  type ObjectSchemaType,
  type Path,
  type PortableTextBlock,
  type ReferenceValue,
  type SchemaType,
  type SlugValue,
  type StringSchemaType,
} from '@sanity/types'
import {
  type ComponentType,
  type FocusEventHandler,
  type FormEventHandler,
  type MutableRefObject,
  type ReactNode,
} from 'react'

import {type FormPatch, type PatchEvent} from '../patch'
import {type FormFieldGroup} from '../store'
import {
  type ArrayOfObjectsFormNode,
  type ArrayOfPrimitivesFormNode,
  type BooleanFormNode,
  type NumberFormNode,
  type ObjectFormNode,
  type StringFormNode,
} from '../store/types/nodes'
import {type UploaderResolver} from '../studio'
import {type RenderBlockActionsCallback} from '../types'
import {
  type ArrayInputFunctionsProps,
  type PortableTextMarker,
  type RenderCustomMarkers,
} from './_transitional'
import {type ArrayInputInsertEvent, type ArrayInputMoveItemEvent, type UploadEvent} from './event'
import {
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderArrayOfPrimitivesItemCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from './renderCallback'

/**
 * @hidden
 * @beta */
export interface OnPathFocusPayload {
  selection?: EditorSelection
}

/**
 * @hidden
 * @public */
export interface BaseInputProps {
  renderDefault: (props: InputProps) => React.JSX.Element
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
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

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
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

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
 * @beta */
export type ArrayOfPrimitivesElementType<T extends any[]> = T extends (infer K)[] ? K : unknown

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
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

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
export interface StringInputProps<S extends StringSchemaType = StringSchemaType>
  extends BaseInputProps,
    StringFormNode<S> {
  /**
   * @hidden
   * @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
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
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  validationError?: string
  /**
   * @hidden
   * @beta */
  elementProps: PrimitiveInputElementProps
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
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

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
 * @beta */
export type PrimitiveInputProps = StringInputProps | BooleanInputProps | NumberInputProps

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
