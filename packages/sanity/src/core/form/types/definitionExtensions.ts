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
     * @beta
     */
    components?: ArrayOfObjectsComponents | ArrayOfPrimitivesComponents
  }

  export interface BlockDefinition {
    /**
     * @beta
     */
    components?: {
      block?: ComponentType<BlockProps>
    }
  }

  export interface BlockDecoratorDefinition {
    /**
     * @beta
     */
    component?: ComponentType<BlockDecoratorProps>
  }

  export interface BlockStyleDefinition {
    /**
     * @beta
     */
    component?: ComponentType<BlockStyleProps>
  }
  export interface BlockListDefinition {
    /**
     * @beta
     */
    component?: ComponentType<BlockListItemProps>
  }

  export interface BlockAnnotationDefinition {
    /**
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
     * @beta
     */
    components?: DateComponents
  }

  export interface DatetimeDefinition {
    components?: DatetimeComponents
  }

  export interface DocumentDefinition {
    /**
     * @beta
     */
    components?: DocumentComponents
  }

  export interface FileDefinition {
    /**
     * @beta
     */
    components?: FileComponents
  }

  export interface GeopointDefinition {
    /**
     * @beta
     */
    components?: GeopointComponents
  }

  export interface ImageDefinition {
    /**
     * @beta
     */
    components?: ImageComponents
  }

  export interface NumberDefinition {
    /**
     * @beta
     */
    components?: NumberComponents
  }

  export interface ObjectDefinition {
    /**
     * @beta
     */
    components?: ObjectComponents
  }

  export interface ReferenceDefinition {
    /**
     * @beta
     */
    components?: ReferenceComponents
  }

  export interface CrossDatasetReferenceDefinition {
    /**
     * @beta
     */
    components?: CrossDatasetReferenceComponents
  }

  export interface SlugDefinition {
    /**
     * @beta
     */
    components?: SlugComponents
  }

  export interface SpanDefinition {
    components?: SpanComponents
  }

  export interface StringDefinition {
    /**
     * @beta
     */
    components?: StringComponents
  }

  export interface TextDefinition {
    /**
     * @beta
     */
    components?: TextComponents
  }

  export interface UrlDefinition {
    /**
     * @beta
     */
    components?: UrlComponents
  }

  export interface EmailDefinition {
    /**
     * @beta
     */
    components?: EmailComponents
  }
}
