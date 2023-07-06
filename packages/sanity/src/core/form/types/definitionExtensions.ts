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
  input?: ComponentType<ArrayOfObjectsInputProps>
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
     *
     * @hidden
     * @beta
     */
    components?: {
      block?: ComponentType<BlockProps>
    }
  }

  export interface BlockDecoratorDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    component?: ComponentType<BlockDecoratorProps>
  }

  export interface BlockStyleDefinition {
    /**
     *
     * @hidden
     * @beta
     */
    component?: ComponentType<BlockStyleProps>
  }
  export interface BlockListDefinition {
    /**
     *
     * @hidden
     * @beta
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
