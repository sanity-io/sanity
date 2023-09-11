import {
  ArraySchemaType,
  BooleanSchemaType,
  CrossDatasetReferenceValue,
  FileValue,
  FormNodeValidation,
  GeopointValue,
  ImageValue,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  ReferenceValue,
  SchemaType,
  SlugValue,
  StringSchemaType,
} from '@sanity/types'
import {ReactElement, ReactNode} from 'react'
import {FormNodePresence} from '../../presence'
import {DocumentFieldAction} from '../../config'
import {
  ArrayOfObjectsInputProps,
  ArrayOfPrimitivesInputProps,
  BooleanInputProps,
  NumberInputProps,
  ObjectInputProps,
  StringInputProps,
} from './inputProps'

/** @internal @deprecated DO NOT USE */
export interface FieldCommentsProps {
  hasComments: boolean
  button: React.ReactNode
  isAddingComment: boolean
}

/**
 * @hidden
 * @beta */
export interface BaseFieldProps {
  /** @beta */
  actions?: DocumentFieldAction[]
  /** @internal @deprecated DO NOT USE */
  __internal_comments?: FieldCommentsProps
  /** @internal @deprecated ONLY USED BY AI ASSIST PLUGIN */
  __internal_slot?: React.ReactNode
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
  renderDefault: (props: FieldProps) => ReactElement
}

/**
 * @hidden
 * @beta */
export interface ObjectFieldProps<T = Record<string, any>> extends BaseFieldProps {
  schemaType: ObjectSchemaType
  value: {[field in string]: unknown} | undefined
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
 * @beta */
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
 * @beta */
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
 * @beta */
export interface NumberFieldProps extends BaseFieldProps {
  schemaType: NumberSchemaType
  value: number | undefined
  inputProps: NumberInputProps
}

/**
 * @hidden
 * @beta */
export interface BooleanFieldProps extends BaseFieldProps {
  schemaType: BooleanSchemaType
  value: boolean | undefined
  inputProps: BooleanInputProps
}

/**
 * @hidden
 * @beta */
export interface StringFieldProps extends BaseFieldProps {
  schemaType: StringSchemaType
  value: string | undefined
  inputProps: StringInputProps
}

/** @internal */
export type PrimitiveFieldProps = NumberFieldProps | BooleanFieldProps | StringFieldProps

/**
 * @hidden
 * @beta */
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
