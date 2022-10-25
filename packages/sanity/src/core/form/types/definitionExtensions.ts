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

export interface ArrayOfObjectsComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ArrayFieldProps>
  input?: ComponentType<ArrayOfObjectsInputProps>
  item?: ComponentType<ObjectItemProps>
  preview?: ComponentType<PreviewProps>
}

export interface ArrayOfPrimitivesComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ArrayOfPrimitivesFieldProps>
  input?: ComponentType<ArrayOfPrimitivesInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

export interface BlockComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ArrayFieldProps>
  input?: ComponentType<ArrayOfObjectsInputProps>
  item?: ComponentType<ObjectItemProps>
  preview?: ComponentType<PreviewProps>
}

export interface BooleanComponents {
  diff?: ComponentType<any>
  field?: ComponentType<BooleanFieldProps>
  input?: ComponentType<BooleanInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

export interface DateComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

export interface DatetimeComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

export interface DocumentComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps>
  input?: ComponentType<ObjectInputProps>
  item?: ComponentType<ObjectItemProps>
  preview?: ComponentType<PreviewProps>
}

export interface FileComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<FileValue>>
  input?: ComponentType<ObjectInputProps<FileValue>>
  item?: ComponentType<ObjectItemProps<FileValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

export interface GeopointComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<Geopoint>>
  input?: ComponentType<ObjectInputProps<Geopoint>>
  item?: ComponentType<ObjectItemProps<Geopoint & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

export interface ImageComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<ImageValue>>
  input?: ComponentType<ObjectInputProps<ImageValue>>
  item?: ComponentType<ObjectItemProps<ImageValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

export interface NumberComponents {
  diff?: ComponentType<any>
  field?: ComponentType<NumberFieldProps>
  input?: ComponentType<NumberInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

export interface ObjectComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps>
  input?: ComponentType<ObjectInputProps>
  item?: ComponentType<ObjectItemProps>
  preview?: ComponentType<PreviewProps>
}

export interface ReferenceComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<ReferenceValue>>
  input?: ComponentType<ObjectInputProps<ReferenceValue>>
  item?: ComponentType<ObjectItemProps<ReferenceValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

export interface CrossDatasetReferenceComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<CrossDatasetReference>>
  input?: ComponentType<ObjectInputProps<CrossDatasetReference>>
  item?: ComponentType<ObjectItemProps<CrossDatasetReference & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

export interface SlugComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<SlugValue>>
  input?: ComponentType<ObjectInputProps<SlugValue>>
  item?: ComponentType<ObjectItemProps<SlugValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

export interface SpanComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps>
  input?: ComponentType<ObjectInputProps>
  item?: ComponentType<ObjectItemProps>
  preview?: ComponentType<PreviewProps>
}

export interface StringComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

export interface TextComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

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
    components?: ArrayOfObjectsComponents | ArrayOfPrimitivesComponents
  }

  export interface BlockDefinition {
    components?: BlockComponents
  }

  export interface BooleanDefinition {
    components?: BooleanComponents
  }

  export interface DateDefinition {
    components?: DateComponents
  }

  export interface DatetimeDefinition {
    components?: DatetimeComponents
  }

  export interface DocumentDefinition {
    components?: DocumentComponents
  }

  export interface FileDefinition {
    components?: FileComponents
  }

  export interface GeopointDefinition {
    components?: GeopointComponents
  }

  export interface ImageDefinition {
    components?: ImageComponents
  }

  export interface NumberDefinition {
    components?: NumberComponents
  }

  export interface ObjectDefinition {
    components?: ObjectComponents
  }

  export interface ReferenceDefinition {
    components?: ReferenceComponents
  }

  export interface CrossDatasetReferenceDefinition {
    components?: CrossDatasetReferenceComponents
  }

  export interface SlugDefinition {
    components?: SlugComponents
  }

  export interface SpanDefinition {
    components?: SpanComponents
  }

  export interface StringDefinition {
    components?: StringComponents
  }

  export interface TextDefinition {
    components?: TextComponents
  }

  export interface UrlDefinition {
    components?: UrlComponents
  }
}
