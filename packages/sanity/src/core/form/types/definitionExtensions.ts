import {ComponentType} from 'react'
import {
  CrossDatasetReference,
  FileValue,
  Geopoint,
  ImageValue,
  ReferenceValue,
  SlugValue,
} from '@sanity/types'
import {PreviewProps} from '../../components'
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

/**
 * @beta
 */
export interface ArrayOfObjectsComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ArrayFieldProps>
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
export interface BlockComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ArrayFieldProps>
  input?: ComponentType<ArrayOfObjectsInputProps>
  item?: ComponentType<ObjectItemProps>
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
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<FileValue>>
  input?: ComponentType<ObjectInputProps<FileValue>>
  item?: ComponentType<ObjectItemProps<FileValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/**
 * @beta
 */
export interface GeopointComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<Geopoint>>
  input?: ComponentType<ObjectInputProps<Geopoint>>
  item?: ComponentType<ObjectItemProps<Geopoint & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/**
 * @beta
 */
export interface ImageComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<ImageValue>>
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
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps>
  input?: ComponentType<ObjectInputProps>
  item?: ComponentType<ObjectItemProps>
  preview?: ComponentType<PreviewProps>
}

/**
 * @beta
 */
export interface ReferenceComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<ReferenceValue>>
  input?: ComponentType<ObjectInputProps<ReferenceValue>>
  item?: ComponentType<ObjectItemProps<ReferenceValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/**
 * @beta
 */
export interface CrossDatasetReferenceComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<CrossDatasetReference>>
  input?: ComponentType<ObjectInputProps<CrossDatasetReference>>
  item?: ComponentType<ObjectItemProps<CrossDatasetReference & ObjectItem>>
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
    components?: BlockComponents
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
}
