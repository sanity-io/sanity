import {type ComponentType, type ReactNode} from 'react'

import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {
  type BlockAnnotationProps,
  type BlockDecoratorProps,
  type BlockListItemProps,
  type BlockProps,
  type BlockStyleProps,
} from '../props'
import {type ArrayOfType} from './array'
import {type BaseSchemaDefinition, type BaseSchemaTypeOptions} from './common'
import {type ObjectDefinition} from './object'

/**
 * Schema options for a Block schema definition
 * @public */
export interface BlockOptions extends BaseSchemaTypeOptions {
  /**
   * Turn on or off the builtin browser spellchecking. Default is on.
   */
  spellCheck?: boolean
  unstable_whitespaceOnPasteMode?: 'preserve' | 'normalize' | 'remove'

  /**
   * When enabled, the editor will restrict all line breaks and soft breaks,
   * forcing content to remain on a single line. This will also update
   * the styling of the editor to reflect the single-line constraint.
   *
   * Pasting content that is on multiple lines will be normalized to a single line, if possible.
   *
   * @defaultValue false
   */
  oneLine?: boolean
}

/** @public */
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
  i18nTitleKey?: string
  value: string
  icon?: ReactNode | ComponentType
  /**
   * Component for rendering a decorator.
   *
   * See also {@link BlockDecoratorProps | BlockDecoratorProps}
   *
   * @public
   * @remarks - Try not to hard code CSS properties that could be derived from `@sanity/ui`.
   * This will make sure your rendering looks good independent of the theme context it appears in.
   * - Don't render arbitrary text nodes as this will confuse the editor with
   * what is editable text and not. If you need arbitrary text, make sure to wrap them in in a
   * container with `contentEditable={false}`.
   * @example Example of rendering custom decorator that highlights text.
   * ```ts
   * const Highlight = (props: BlockDecoratorProps) => (
   *   <span style={{backgroundColor: '#ff0'}}>
   *     {props.children}
   *   </span>
   * )
   * ```
   */
  component?: ComponentType<BlockDecoratorProps>
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
  i18nTitleKey?: string
  icon?: ReactNode | ComponentType
  /**
   * Component for rendering a text style.
   *
   * See also {@link BlockStyleProps | BlockStyleProps}
   *
   * @public
   * @remarks - Try not to hard code CSS properties that could be derived from `@sanity/ui`.
   * This will make sure your rendering looks good independent of the theme context it appears in.
   * - Don't render arbitrary text nodes as this will confuse the editor with
   * what is editable text and not. If you need arbitrary text, make sure to wrap them in in a
   * container with `contentEditable={false}`.
   * @example Example of rendering a custom style for article leads which is bigger,
   * and bolder, but will adapt to what the current `@sanity/ui` theme has defined
   * as actual values for weight "bold" and `size={3}`.
   * ```ts
   * import {Text} from '@sanity/ui'
   *
   * const LeadStyle = (props: BlockStyleProps) => (
   *   <Text weight="bold" size={3}>
   *     {props.children}
   *   </Text>
   * )
   * ```
   */
  component?: ComponentType<BlockStyleProps>
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
  i18nTitleKey?: string
  value: string
  icon?: ReactNode | ComponentType
  /**
   * Component for rendering a block as a list item
   *
   * See also {@link BlockListItemProps | BlockListItemProps}
   *
   * @public
   * @remarks - Try not to hard code CSS properties that could be derived from `@sanity/ui`.
   * This will make sure your rendering looks good independent of the theme context it appears in.
   * - Don't render arbitrary text nodes as this will confuse the editor with
   * what is editable text and not. If you need arbitrary text, make sure to wrap them in in a
   * container with `contentEditable={false}`.
   */
  component?: ComponentType<BlockListItemProps>
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
  /**
   *
   * @hidden
   * @beta
   */
  components?: {
    annotation?: ComponentType<BlockAnnotationProps>
  }
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
  /**
   * Components for the block schema type
   *
   * @public
   * @remarks - This only applies to the block text type, and not block object types (like images).
   * - Don't render arbitrary text nodes inside regular text blocks, as this will confuse the editor with
   * what is editable text and not. Make sure to wrap all nodes which are NOT part of the edited text inside a
   * container with `contentEditable={false}` and with `style={{userSelection: 'none'}}` so that
   * the editor can distinguish between editable text and non-editable text.
   * @example Example of custom block component with delete button next to it that removes the block.
   * ```ts
   * {
   *   block: (blockProps) => {
   *     return (
   *       <Flex>
   *         <Box flex={1}>{blockProps.renderDefault(blockProps)}</Box>
   *         <Box contentEditable={false} style={{userSelect: 'none'}}>
   *           <Button
   *             icon={TrashIcon}
   *             onClick={(event) => {
   *               event.preventDefault()
   *               blockProps.onRemove()
   *              }}
   *             />
   *         </Box>
   *       </Flex>
   *     )
   *   },
   * },
   * ```
   */
  components?: {
    block?: ComponentType<BlockProps>
  }
}
