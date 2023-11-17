import {
  ArraySchemaType,
  BlockDecoratorDefinition,
  BlockListDefinition,
  BlockStyleDefinition,
  FormNodeValidation,
  ObjectSchemaType,
  Path,
  PortableTextBlock,
  PortableTextObject,
  PortableTextTextBlock,
  SchemaType,
} from '@sanity/types'
import {ReactElement, ReactNode} from 'react'
import {FormNodePresence} from '../../presence'
import {PortableTextMarker} from '../..'
import {
  RenderAnnotationCallback,
  RenderArrayOfObjectsItemCallback,
  RenderBlockCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from './renderCallback'

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
  children: React.ReactElement
  /**
   * If the span node currently is focused by the user.
   */
  focused: boolean
  /**
   * The default render function for this decorator,
   * some decorators are proved by default and has a default rendering.
   */
  renderDefault: (props: BlockDecoratorProps) => React.ReactElement
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
  children: React.ReactElement
  /**
   * If the block currently has focus in the text editor.
   */
  focused: boolean
  /**
   * The default rendering function for this style.
   */
  renderDefault: (props: BlockStyleProps) => React.ReactElement
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
  children: React.ReactElement
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
  renderDefault: (props: BlockListItemProps) => React.ReactElement
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
  renderDefault: (props: BlockAnnotationProps) => ReactElement
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
  textElement: ReactElement
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
  renderDefault: (props: BlockProps) => ReactElement
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
