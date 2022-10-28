import {ComponentType, ReactNode} from 'react'
import {Path} from '../../../paths'
import {PortableTextBlock, PortableTextChild, PortableTextObject} from '../../../portableText'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty, ObjectSchemaType} from '../../types'
import {SchemaTypeDefinition, TypeReference} from '../schemaDefinition'
import {ArrayOfType} from './array'
import {BaseSchemaDefinition} from './common'

/** @public */
export interface BlockOptions {
  spellCheck?: boolean
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BlockRule extends RuleDef<BlockRule, any[]> {}

/** @public */

export interface BlockMemberRenderProps {
  value: string | PortableTextBlock | PortableTextChild
  type: BlockDecoratorDefinition | BlockStyleDefinition | ObjectSchemaType
  attributes: {
    annotations?: PortableTextObject[]
    focused: boolean
    level?: number
    listItem?: string
    path: Path
    selected: boolean
    style?: string
  }
  defaultRender: (props: BlockMemberRenderProps) => JSX.Element
  editorElementRef: React.RefObject<HTMLElement>
}

/** @public */
export interface BlockDecoratorDefinition {
  title: string
  value: string
  icon?: ReactNode | ComponentType
  components?: {
    item?: ComponentType<BlockMemberRenderProps>
  }
}

/** @public */

export interface BlockStyleDefinition {
  title: string
  value: string
  components?: {
    item?: ComponentType<BlockMemberRenderProps>
  }
}

/** @public */
export interface BlockListDefinition {
  title: string
  value: string
  icon?: ReactNode | ComponentType
  components?: {
    item?: ComponentType
  }
}

/** @public */
export interface BlockMarksDefinition {
  decorators?: BlockDecoratorDefinition[]
  annotations?: (SchemaTypeDefinition | TypeReference)[]
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
