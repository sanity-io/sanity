import {ComponentType, ReactNode} from 'react'
import {Path} from '../../../paths'
import {PortableTextBlock, PortableTextChild, PortableTextObject} from '../../../portableText'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty, ObjectSchemaType} from '../../types'
import {SchemaTypeDefinition, TypeReference} from '../schemaDefinition'
import {ArrayOfType} from './array'
import {BaseSchemaDefinition} from './common'
import {ObjectDefinition} from './object'

/** @public */
export interface BlockOptions {
  spellCheck?: boolean
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BlockRule extends RuleDef<BlockRule, any[]> {}

/** @public */
export interface BlockAnnotationRenderProps {
  renderDefault: (props: BlockAnnotationRenderProps) => JSX.Element
  editorElementRef: React.RefObject<HTMLElement>
  focused: boolean
  path: Path
  selected: boolean
  type: ObjectSchemaType
  value: PortableTextObject
}

/** @public */
export interface BlockDecoratorRenderProps {
  renderDefault: (props: BlockDecoratorRenderProps) => JSX.Element
  editorElementRef: React.RefObject<HTMLElement>
  focused: boolean
  path: Path
  selected: boolean
  type: BlockDecoratorDefinition
  value: string
}

/** @public */
export interface BlockDecoratorDefinition {
  title: string
  value: string
  icon?: ReactNode | ComponentType
  components?: {
    item?: ComponentType<BlockDecoratorRenderProps>
  }
}

/** @public */

export interface BlockStyleRenderProps {
  renderDefault: (props: BlockStyleRenderProps) => JSX.Element
  editorElementRef: React.RefObject<HTMLElement>
  focused: boolean
  path: Path
  selected: boolean
  type: BlockStyleDefinition
  value: string
}

/** @public */
export interface BlockStyleDefinition {
  title: string
  value: string
  components?: {
    item?: ComponentType<BlockStyleRenderProps>
  }
}

/** @public */
export interface BlockRenderProps {
  editorElementRef: React.RefObject<HTMLElement>
  focused: boolean
  level?: number
  listItem?: string
  path: Path
  renderDefault: (props: BlockRenderProps) => JSX.Element
  selected: boolean
  style?: string
  type: ObjectSchemaType
  value: PortableTextBlock
}

/** @public */
export interface BlockChildRenderProps {
  annotations: PortableTextObject[]
  editorElementRef: React.RefObject<HTMLElement>
  focused: boolean
  path: Path
  renderDefault: (props: BlockChildRenderProps) => JSX.Element
  selected: boolean
  type: ObjectSchemaType
  value: PortableTextChild
}

/** @public */
export interface BlockListDefinition {
  title: string
  value: string
  icon?: ReactNode | ComponentType
  components?: {
    item?: ComponentType<BlockRenderProps>
  }
}

/** @public */
export type BlockAnnotationDefinition = (SchemaTypeDefinition | TypeReference) & {
  components?: {item?: ComponentType<BlockAnnotationRenderProps>}
}

/** @public */
export interface BlockMarksDefinition {
  decorators?: BlockDecoratorDefinition[]
  annotations?: BlockAnnotationDefinition[]
}

/** @public */
export interface BlockDefinition extends BaseSchemaDefinition {
  type: 'block'
  styles?: BlockStyleDefinition[]
  lists?: BlockListDefinition[]
  marks?: BlockMarksDefinition
  of?: ArrayOfType[]
  initialValue?: InitialValueProperty<any, any[]>
  options?: BlockOptions
  validation?: ValidationBuilder<BlockRule, any[]>
}
