import {
  type ArrayOfType,
  type ArrayOptions,
  type ArrayRule,
  type AssetSource,
  type BlockListDefinition,
  type BlockMarksDefinition,
  type BlockOptions,
  type BlockRule,
  type BlockStyleDefinition,
  type BooleanOptions,
  type BooleanRule,
  type CurrentUser,
  type DateOptions,
  type DateRule,
  type DatetimeOptions,
  type DatetimeRule,
  type DeprecatedProperty,
  type DocumentOptions,
  type DocumentRule,
  type EmailOptions,
  type EmailRule,
  type FieldDefinition,
  type FieldGroupDefinition,
  type FieldsetDefinition,
  type FileOptions,
  type FileRule,
  type FileValue,
  type GeopointOptions,
  type GeopointRule,
  type GeopointValue,
  type ImageMetadataType,
  type ImageRule,
  type ImageValue,
  type InitialValueProperty,
  type NumberOptions,
  type NumberRule,
  type ObjectDefinition,
  type ObjectOptions,
  type ObjectRule,
  type PreviewConfig,
  type ReferenceOptions,
  type ReferenceRule,
  type ReferenceTo,
  type ReferenceValue,
  type SanityDocument,
  type SlugOptions,
  type SlugRule,
  type SlugValue,
  type SortOrdering,
  type StringOptions,
  type StringRule,
  type TextOptions,
  type TextRule,
  type UrlOptions,
  type UrlRule,
  type ValidationBuilder,
} from '@sanity/types'
import {type ComponentType, type ReactNode} from 'react'

interface BaseSchemaDefinition {
  name: string
  title?: string
  description?: string | React.JSX.Element
  hidden?:
    | boolean
    | ((context: {
        document: SanityDocument | undefined
        parent: any
        value: any
        currentUser: Omit<CurrentUser, 'role'> | null
      }) => boolean)
  readOnly?:
    | boolean
    | ((context: {
        document: SanityDocument | undefined
        parent: any
        value: any
        currentUser: Omit<CurrentUser, 'role'> | null
      }) => boolean)
  // Icon doesn't seem to do anything outside of the Document definition.
  icon?: ComponentType | ReactNode
  validation?: unknown
  initialValue?: unknown
  deprecated?: DeprecatedProperty
  /*
   * These are not the properties you are looking for.
   * To avoid cyclic dependencies on Prop-types, the components property is
   * added to each intrinsic definition in sanity/core/schema/definitionExtensions.ts
   */
  /*components?: {
      diff?: ComponentType<any>
      field?: ComponentType<any>
      input?: ComponentType<any>
      item?: ComponentType<any>
      preview?: ComponentType<any>
    }*/
}

type SchemaDefinitions = {
  document: BaseSchemaDefinition & {
    // Extends from object
    fields: FieldDefinition[]
    groups?: FieldGroupDefinition[]
    fieldsets?: FieldsetDefinition[]
    preview?: PreviewConfig
    // -----

    type: 'document'
    liveEdit?: boolean
    /** @beta */
    orderings?: SortOrdering[]
    options?: DocumentOptions
    validation?: ValidationBuilder<DocumentRule, SanityDocument>
    initialValue?: InitialValueProperty<any, Record<string, unknown>>
    /** @deprecated Unused. Use the new field-level search config. */
    __experimental_search?: {path: string; weight: number; mapWith?: string}[]
    /** @alpha */
    __experimental_omnisearch_visibility?: boolean
    /**
     * Determines whether the large preview title is displayed in the document pane form
     * @alpha
     * */
    __experimental_formPreviewTitle?: boolean
  }

  array: BaseSchemaDefinition & {
    type: 'array'
    of: ArrayOfType[]
    initialValue?: InitialValueProperty<any, unknown[]>
    validation?: ValidationBuilder<ArrayRule<unknown[]>, unknown[]>
    options?: ArrayOptions
  }
  block: BaseSchemaDefinition & {
    type: 'block'
    styles?: BlockStyleDefinition[]
    lists?: BlockListDefinition[]
    marks?: BlockMarksDefinition
    of?: ArrayOfType<'object' | 'reference'>[]
    initialValue?: InitialValueProperty<any, any[]>
    validation?: ValidationBuilder<BlockRule, any[]>
    options?: BlockOptions
  }

  boolean: BaseSchemaDefinition & {
    type: 'boolean'
    options?: BooleanOptions
    initialValue?: InitialValueProperty<any, boolean>
    validation?: ValidationBuilder<BooleanRule, boolean>
  }

  date: BaseSchemaDefinition & {
    type: 'date'
    options?: DateOptions
    placeholder?: string
    validation?: ValidationBuilder<DateRule, string>
    initialValue?: InitialValueProperty<any, string>
  }
  datetime: BaseSchemaDefinition & {
    type: 'datetime'
    options?: DatetimeOptions
    placeholder?: string
    validation?: ValidationBuilder<DatetimeRule, string>
    initialValue?: InitialValueProperty<any, string>
  }

  file: BaseSchemaDefinition & {
    // Extends from object
    fieldsets?: FieldsetDefinition[]
    preview?: PreviewConfig
    // -----

    type: 'file'
    fields?: ObjectDefinition['fields']
    options?: FileOptions
    validation?: ValidationBuilder<FileRule, FileValue>
    initialValue?: InitialValueProperty<any, FileValue>
  }
  geopoint: BaseSchemaDefinition & {
    type: 'geopoint'
    options?: GeopointOptions
    validation?: ValidationBuilder<GeopointRule, GeopointValue>
    initialValue?: InitialValueProperty<any, Omit<GeopointValue, '_type'>>
  }

  image: BaseSchemaDefinition & {
    // Extends from object.
    fieldsets?: FieldsetDefinition[]
    preview?: PreviewConfig
    // -----

    type: 'image'
    fields?: FieldDefinition[]
    options?: {
      // Extends from object options
      collapsible?: boolean
      collapsed?: boolean
      columns?: number
      modal?: {
        type?: 'dialog' | 'popover'
        width?: number | number[] | 'auto'
      }

      // Extends from file options
      storeOriginalFilename?: boolean
      accept?: string
      sources?: AssetSource[]

      // Does this serves any purpose in the studio? Changing it doesn't seem to have any effect.
      // It updates what data is uploaded to the asset when creating a new image, it doesn't feel right,
      // given images could be referenced by multiple documents, and this setting might be different for each reference.
      metadata?: ImageMetadataType[]
      hotspot?: boolean
    }
    validation?: ValidationBuilder<ImageRule, ImageValue>
    initialValue?: InitialValueProperty<any, ImageValue>
  }
  number: BaseSchemaDefinition & {
    type: 'number'
    options?: NumberOptions
    placeholder?: string
    validation?: ValidationBuilder<NumberRule, number>
    initialValue?: InitialValueProperty<any, number>
  }

  object: BaseSchemaDefinition & {
    type: 'object'
    /**
     * Object must have at least one field. This is validated at Studio startup.
     */
    fields: FieldDefinition[]
    groups?: FieldGroupDefinition[]
    fieldsets?: FieldsetDefinition[]
    preview?: PreviewConfig

    options?: ObjectOptions
    validation?: ValidationBuilder<ObjectRule, Record<string, unknown>>
    initialValue?: InitialValueProperty<any, Record<string, unknown>>
  }
  reference: BaseSchemaDefinition & {
    type: 'reference'
    to: ReferenceTo
    weak?: boolean
    options?: ReferenceOptions
    validation?: ValidationBuilder<ReferenceRule, ReferenceValue>
    initialValue?: InitialValueProperty<any, Omit<ReferenceValue, '_type'>>
  }

  crossDatasetReference: BaseSchemaDefinition & {
    type: 'crossDatasetReference'
    weak?: boolean
    to: {
      type: string
      title?: string
      icon?: ComponentType
      preview?: PreviewConfig

      /**
       * @deprecated Unused. Configuring search is no longer supported.
       */
      __experimental_search?: {path: string | string[]; weight?: number; mapWith?: string}[]
    }[]

    dataset: string
    // This uses studioUrl while document.config uses productionUrl
    studioUrl?: (document: {id: string; type?: string}) => string | null
    tokenId?: string
    options?: ReferenceOptions

    /**
     * @deprecated Cross-project references are no longer supported, only cross-dataset
     */
    projectId?: string

    // No initial value
    // No validation
    // No options
  }

  globalDocumentReference: BaseSchemaDefinition & {
    type: 'globalDocumentReference'
    weak?: boolean
    to: {
      type: string
      title?: string
      icon?: ComponentType
      preview?: PreviewConfig
    }[]

    resourceType: 'media-library' | 'dataset' // Currently string, only these two are supported
    resourceId: string //"<projectId>.<datasetName>"
    options?: ReferenceOptions

    // This uses studioUrl while document.config uses productionUrl
    studioUrl?: (document: {id: string; type?: string}) => string | null

    // No initial value
    // No validation
  }

  slug: BaseSchemaDefinition & {
    type: 'slug'
    options?: SlugOptions
    validation?: ValidationBuilder<SlugRule, SlugValue>
    initialValue?: InitialValueProperty<any, Omit<SlugValue, '_type'>>
  }
  string: BaseSchemaDefinition & {
    type: 'string'
    options?: StringOptions
    placeholder?: string
    validation?: ValidationBuilder<StringRule, string>
    initialValue?: InitialValueProperty<any, string>
  }

  text: BaseSchemaDefinition & {
    type: 'text'
    rows?: number
    options?: TextOptions
    placeholder?: string
    validation?: ValidationBuilder<TextRule, string>
    initialValue?: InitialValueProperty<any, string>
  }

  url: BaseSchemaDefinition & {
    type: 'url'
    options?: UrlOptions
    placeholder?: string
    validation?: ValidationBuilder<UrlRule, string>
    initialValue?: InitialValueProperty<any, string>
  }

  email: BaseSchemaDefinition & {
    type: 'email'
    options?: EmailOptions
    placeholder?: string
    validation?: ValidationBuilder<EmailRule, string>
    initialValue?: InitialValueProperty<any, string>
  }
}
