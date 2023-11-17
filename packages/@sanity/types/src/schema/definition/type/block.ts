import {ComponentType, ReactNode} from 'react'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {ArrayOfType} from './array'
import {BaseSchemaDefinition} from './common'
import {ObjectDefinition} from './object'

/**
 * Schema options for a Block schema definition
 * @public */
export interface BlockOptions {
  /**
   * Turn on or off the builtin browser spellchecking. Default is on.
   */
  spellCheck?: boolean
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BlockRule extends RuleDef<BlockRule, any[]> {}

/**
 * Schema definition for text block decorators.
 *
 * @public
 * @example The default set of decorators
 * ```ts
 * {
 *   name: 'blockContent',
 *   title: 'Content',
 *   type: 'array',
 *   of: [
 *     {
 *       type: 'block',
 *       marks: {
 *         decorators: [
 *           {title: 'Strong', value: 'strong'},
 *           {title: 'Emphasis', value: 'em'},
 *           {title: 'Underline', value: 'underline'},
 *           {title: 'Strike', value: 'strike'},
 *           {title: 'Code', value: 'code'},
 *         ]
 *       }
 *     }
 *   ]
 * }
 * ```
 */
export interface BlockDecoratorDefinition {
  title: string
  i18nTitle?: string
  value: string
  icon?: ReactNode | ComponentType
}

/**
 * Schema definition for a text block style.
 * A text block may have a block style like 'header', 'normal', 'lead'
 * attached to it, which is stored on the `.style` property for that block.
 *
 * @public
 * @remarks The first defined style will become the default style.´´
 * @example The default set of styles
 * ```ts
 * {
 *   name: 'blockContent',
 *   title: 'Content',
 *   type: 'array',
 *   of: [
 *     {
 *       type: 'block',
 *       styles: [
 *         {title: 'Normal', value: 'normal'},
 *         {title: 'H1', value: 'h1'},
 *         {title: 'H2', value: 'h2'},
 *         {title: 'H3', value: 'h3'},
 *         {title: 'H4', value: 'h4'},
 *         {title: 'H5', value: 'h5'},
 *         {title: 'H6', value: 'h6'},
 *         {title: 'Quote', value: 'blockquote'}
 *       ]
 *     }
 *   ]
 * }
 * ```
 * @example Example of defining a block type with custom styles and render components.
 * ```ts
 * defineArrayMember({
 *   type: 'block',
 *   styles: [
 *     {
 *       title: 'Paragraph',
 *       value: 'paragraph',
 *       component: ParagraphStyle,
 *     },
 *     {
 *       title: 'Lead',
 *       value: 'lead',
 *       component: LeadStyle,
 *     },
 *     {
 *       title: 'Heading',
 *       value: 'heading',
 *       component: HeadingStyle,
 *     },
 *   ],
 * })
 * ```
 */
export interface BlockStyleDefinition {
  title: string
  value: string
  i18nTitle?: string
}

/**
 * Schema definition for a text block list style.
 *
 * @public
 * @example The defaults lists
 * ```ts
 * {
 *   name: 'blockContent',
 *   title: 'Content',
 *   type: 'array',
 *   of: [
 *     {
 *       type: 'block',
 *       lists: [
 *         {title: 'Bullet', value: 'bullet'},
 *         {title: 'Number', value: 'number'},
 *       ]
 *     }
 *   ]
 * }
 * ```
 */
export interface BlockListDefinition {
  title: string
  i18nTitle?: string
  value: string
  icon?: ReactNode | ComponentType
}

/**
 * Schema definition for a text block annotation object.
 *
 * @public
 * @example The default link annotation
 * ```ts
 * {
 *   name: 'blockContent',
 *   title: 'Content',
 *   type: 'array',
 *   of: [
 *     {
 *       type: 'block',
 *       marks: {
 *         annotations: [
 *           {
 *             type: 'object',
 *             name: 'link',
 *             fields: [
 *               {
 *                 type: 'string',
 *                 name: 'href',
 *               },
 *             ],
 *           },
 *         ]
 *       },
 *     }
 *   ]
 * }
 * ```
 */
export interface BlockAnnotationDefinition extends ObjectDefinition {
  icon?: ReactNode | ComponentType
}

/**
 * Schema definition for text block marks (decorators and annotations).
 *
 * @public */
export interface BlockMarksDefinition {
  decorators?: BlockDecoratorDefinition[]
  annotations?: ArrayOfType<'object' | 'reference'>[]
}

/**
 * Schema definition for text blocks.
 *
 * @public
 * @example the default block definition
 * ```ts
 * {
 *   name: 'blockContent',
 *   title: 'Content',
 *   type: 'array',
 *   of: [
 *     {
 *       type: 'block',
 *       marks: {
 *         decorators: [
 *           {title: 'Strong', value: 'strong'},
 *           {title: 'Emphasis', value: 'em'},
 *           {title: 'Underline', value: 'underline'},
 *           {title: 'Strike', value: 'strike'},
 *           {title: 'Code', value: 'code'},
 *         ],
 *         annotations: [
 *           {
 *             type: 'object',
 *             name: 'link',
 *             fields: [
 *               {
 *                 type: 'string',
 *                 name: 'href',
 *               },
 *             ],
 *           },
 *         ]
 *       },
 *       styles: [
 *         {title: 'Normal', value: 'normal'},
 *         {title: 'H1', value: 'h1'},
 *         {title: 'H2', value: 'h2'},
 *         {title: 'H3', value: 'h3'},
 *         {title: 'H4', value: 'h4'},
 *         {title: 'H5', value: 'h5'},
 *         {title: 'H6', value: 'h6'},
 *         {title: 'Quote', value: 'blockquote'}
 *       ],
 *       lists: [
 *         {title: 'Bullet', value: 'bullet'},
 *         {title: 'Number', value: 'number'},
 *       ],
 *     },
 *   ]
 * }
 * ```
 */
export interface BlockDefinition extends BaseSchemaDefinition {
  type: 'block'
  styles?: BlockStyleDefinition[]
  lists?: BlockListDefinition[]
  marks?: BlockMarksDefinition
  of?: ArrayOfType<'object' | 'reference'>[]
  initialValue?: InitialValueProperty<any, any[]>
  options?: BlockOptions
  validation?: ValidationBuilder<BlockRule, any[]>
}
