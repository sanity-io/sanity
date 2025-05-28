import {
  type ArraySchemaType,
  type BooleanSchemaType,
  type CrossDatasetReferenceValue,
  type FileValue,
  type FormNodeValidation,
  type GeopointValue,
  type ImageValue,
  type NumberSchemaType,
  type ObjectSchemaType,
  type Path,
  type ReferenceValue,
  type SchemaType,
  type SlugValue,
  type StringSchemaType,
} from '@sanity/types'
import {type ReactNode} from 'react'

import {type DocumentFieldAction} from '../../config'
import {type FormNodePresence} from '../../presence'
import {
  type ArrayOfObjectsInputProps,
  type ArrayOfPrimitivesInputProps,
  type BooleanInputProps,
  type NumberInputProps,
  type ObjectInputProps,
  type StringInputProps,
} from './inputProps'

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
