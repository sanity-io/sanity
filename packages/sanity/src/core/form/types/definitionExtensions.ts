import {ComponentType} from 'react'
import {
  CrossDatasetReferenceValue,
  FileValue,
  GeopointValue,
  ImageValue,
  ReferenceValue,
  SlugValue,
} from '@sanity/types'
import {PreviewProps} from '../../components'
import {CrossDatasetReferenceInputProps, ReferenceInputProps} from '../studio'
import {
  ArrayFieldProps,
  ArrayOfPrimitivesFieldProps,
  BooleanFieldProps,
  NumberFieldProps,
  ObjectFieldProps,
  StringFieldProps,
} from './fieldProps'
import {
  ArrayOfObjectsInputProps,
  ArrayOfPrimitivesInputProps,
  BooleanInputProps,
  NumberInputProps,
  ObjectInputProps,
  StringInputProps,
} from './inputProps'
import {ObjectItem, ObjectItemProps, PrimitiveItemProps} from './itemProps'
import {
  BlockAnnotationProps,
  BlockDecoratorProps,
  BlockListItemProps,
  BlockProps,
  BlockStyleProps,
} from './blockProps'

/**
 *
 * @hidden
 * @beta
 */
export interface ArrayOfObjectsComponents {
  annotation?: ComponentType<BlockAnnotationProps>
  block?: ComponentType<BlockProps>
  diff?: ComponentType<any>
  field?: ComponentType<ArrayFieldProps>
  inlineBlock?: ComponentType<BlockProps>
  input?: ComponentType<ArrayOfObjectsInputProps | PortableTextInputProps>
  item?: ComponentType<ObjectItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface ArrayOfPrimitivesComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ArrayOfPrimitivesFieldProps>
  input?: ComponentType<ArrayOfPrimitivesInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface BooleanComponents {
  diff?: ComponentType<any>
  field?: ComponentType<BooleanFieldProps>
  input?: ComponentType<BooleanInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface DateComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface DatetimeComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface DocumentComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps>
  input?: ComponentType<ObjectInputProps>
  item?: ComponentType<ObjectItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface FileComponents {
  annotation?: ComponentType<BlockAnnotationProps>
  block?: ComponentType<BlockProps>
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<FileValue>>
  inlineBlock?: ComponentType<BlockProps>
  input?: ComponentType<ObjectInputProps<FileValue>>
  item?: ComponentType<ObjectItemProps<FileValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface GeopointComponents {
  annotation?: ComponentType<BlockAnnotationProps>
  block?: ComponentType<BlockProps>
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<GeopointValue>>
  inlineBlock?: ComponentType<BlockProps>
  input?: ComponentType<ObjectInputProps<GeopointValue>>
  item?: ComponentType<ObjectItemProps<GeopointValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface ImageComponents {
  annotation?: ComponentType<BlockAnnotationProps>
  block?: ComponentType<BlockProps>
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<ImageValue>>
  inlineBlock?: ComponentType<BlockProps>
  input?: ComponentType<ObjectInputProps<ImageValue>>
  item?: ComponentType<ObjectItemProps<ImageValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface NumberComponents {
  diff?: ComponentType<any>
  field?: ComponentType<NumberFieldProps>
  input?: ComponentType<NumberInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface ObjectComponents {
  annotation?: ComponentType<BlockAnnotationProps>
  block?: ComponentType<BlockProps>
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps>
  inlineBlock?: ComponentType<BlockProps>
  input?: ComponentType<ObjectInputProps>
  item?: ComponentType<ObjectItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface ReferenceComponents {
  annotation?: ComponentType<BlockAnnotationProps>
  block?: ComponentType<BlockProps>
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<ReferenceValue>>
  inlineBlock?: ComponentType<BlockProps>
  input?: ComponentType<ReferenceInputProps>
  item?: ComponentType<ObjectItemProps<ReferenceValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface CrossDatasetReferenceComponents {
  annotation?: ComponentType<BlockAnnotationProps>
  block?: ComponentType<BlockProps>
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<CrossDatasetReferenceValue>>
  inlineBlock?: ComponentType<BlockProps>
  input?: ComponentType<CrossDatasetReferenceInputProps>
  item?: ComponentType<ObjectItemProps<CrossDatasetReferenceValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface SlugComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<SlugValue>>
  input?: ComponentType<ObjectInputProps<SlugValue>>
  item?: ComponentType<ObjectItemProps<SlugValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface SpanComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps>
  input?: ComponentType<ObjectInputProps>
  item?: ComponentType<ObjectItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface StringComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface TextComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface UrlComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 *
 * @hidden
 * @beta
 */
export interface EmailComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/* To avoid cyclic dependencies on Props, we extend all type definitions here, to add the correct component props */
declare module '@sanity/types' {
  export interface ArrayDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: ArrayOfObjectsComponents | ArrayOfPrimitivesComponents
  }

  export interface BlockDefinition {
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

  export interface BlockDecoratorDefinition {
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
  export interface BlockStyleDefinition {
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
  export interface BlockListDefinition {
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

  export interface BlockAnnotationDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: {
      annotation?: ComponentType<BlockAnnotationProps>
    }
  }

  export interface BooleanDefinition {
    components?: BooleanComponents
  }

  export interface DateDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: DateComponents
  }

  export interface DatetimeDefinition {
    components?: DatetimeComponents
  }

  export interface DocumentDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: DocumentComponents
  }

  export interface FileDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: FileComponents
  }

  export interface GeopointDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: GeopointComponents
  }

  export interface ImageDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: ImageComponents
  }

  export interface NumberDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: NumberComponents
  }

  export interface ObjectDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: ObjectComponents
  }

  export interface ReferenceDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: ReferenceComponents
  }

  export interface CrossDatasetReferenceDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: CrossDatasetReferenceComponents
  }

  export interface SlugDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: SlugComponents
  }

  export interface SpanDefinition {
    components?: SpanComponents
  }

  export interface StringDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: StringComponents
  }

  export interface TextDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: TextComponents
  }

  export interface UrlDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: UrlComponents
  }

  export interface EmailDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    components?: EmailComponents
  }
}
