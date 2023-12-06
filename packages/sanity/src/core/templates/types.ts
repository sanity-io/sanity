import type {InitialValueProperty, SchemaType} from '@sanity/types'
import type {ElementType, ReactElement} from 'react'

/**
 * An initial value template is a template that can be used to create a new documents.
 *
 * This allows a document type to have multiple different starting values while having the same
 * shared schema definition. Using parameters allows for dynamic template values.
 *
 * As the name implies, these are _initial_ values, not _default_ values. The distinction is that
 * the initial value is only set when the document is created - it is not "merged" into existing
 * documents that may lack values for fields.
 *
 * All document types will by default (automatically, behind the scenes) have an initial value
 * template generated for them, which will have the same ID as the schema type name. The value of
 * this template will be the value of the `initialValue` property on the schema type definition,
 * or an empty object if none is set.
 *
 * @public
 */
export interface Template<Params = any, Value = any> {
  /**
   * Template ID. Automatically generated templates will have the same ID as the schema type name.
   */
  id: string

  /**
   * Template title.
   */
  title: string

  i18n?: {key: string; ns: string}

  /**
   * Schema type name the template belongs to. For the automatically generated templates,
   * this will be equal to the `id` property.
   */
  schemaType: string

  /**
   * Template icon. Rendered in places such as the "new document" dialog. Optional.
   * Inferred from the schema type icon if not set.
   */
  icon?: SchemaType['icon']

  /**
   * Value to use as initial value. Can either be a static object value, or a function that
   * resolves _to_ an object value. If using a function, it can be given a set of parameters,
   * which can then determine the value that is returned.
   */
  value: InitialValueProperty<Params, Value>

  /**
   * Array of parameters the template accepts. Currently not used (any parameters are accepted),
   * but by defining parameters, the templates that require parameters can be identified and
   * excluded from UIs that do not provide them.
   */
  parameters?: TemplateParameter[]

  /**
   * Template description. Rendered in places such as the "new document" dialog. Optional.
   *
   * @deprecated No longer used
   */
  description?: string
}

/**
 * Parameter for a template. Closely resembles API used to define fields for object schema types.
 * See {@link TemplateFieldDefinition} and {@link TemplateArrayFieldDefinition}
 * @public
 */
export type TemplateParameter = TemplateFieldDefinition | TemplateArrayFieldDefinition

/**
 * @public
 */
export interface TypeTarget {
  type: string
}

/** @public */
export interface TemplateReferenceTarget {
  type: 'reference'
  /** Type to reference. See {@link TypeTarget} */
  to: TypeTarget | TypeTarget[]
}

/**
 * Field definition for a template parameter.
 * Closely resembles API used to define fields for object schema types.
 *
 * @public
 */
export interface TemplateFieldDefinition {
  /**
   * Parameter name. Must be unique within the template.
   */
  name: string

  /**
   * Parameter type, eg `string`, `number`, `boolean` etc.
   */
  type: string

  /**
   * Parameter type. Will be attempted to be automatically set if not given,
   * by title-casing the `name` property.
   */
  title?: string

  /**
   * Description for the parameter. Optional.
   * May be used in the future to explain the parameter in UIs.
   */
  description?: string

  /**
   * Optional bag of options for the parameter. Currently unused.
   */
  options?: {[key: string]: any}
}

/** @public */
export type TemplateArrayFieldDefinition = TemplateFieldDefinition & {
  type: 'array'
  /** Defines items that are definition of. See {@link TemplateReferenceTarget} and {@link TypeTarget} */
  of: (TemplateReferenceTarget | TypeTarget)[]
}

/**
 * Representation of an initial value template _item_
 * Used by the {@link desk.StructureBuilder} class to determine which initial value templates
 * should be available for a desk structure node, such as a list pane.
 *
 * @public
 */
export interface InitialValueTemplateItem extends TemplateItem {
  type: 'initialValueTemplateItem'

  /** ID for this template item */
  id: string

  /** Initial value template schema type */
  schemaType: string
}

/**
 * Represents the items that can appear in different parts of the Sanity studio when creating
 * new documents - examples being the "New document" button in the navigation bar,
 * the corresponding button in panes, as well as the "Create new" button on references.
 *
 * Differs from an actual _template_ in that a single template can be pointed at by multiple
 * different items. This is useful when the template can create different values based on
 * passed parameters.
 *
 * @public
 */
export interface TemplateItem {
  /**
   * ID for the template. Must be unique within the set of templates.
   */
  templateId: string

  /**
   * Title for the item.
   * Defaults to the title of the associated template.
   */
  title: string

  i18n?: {key: string; ns: string}

  /**
   * Parameters for the template - an object of any JSON-serializable values
   */
  parameters?: {[key: string]: any}

  /**
   * React icon for the item, if any.
   * Defaults to the icon for the associated template.
   */
  icon?: ElementType | ReactElement

  /**
   * Experimental: not fully supported yet
   * Hints at what the document ID for the new document should be.
   * Leave undefined to let the system decide.
   *
   * @experimental
   * @beta
   * @hidden
   */
  initialDocumentId?: string

  /**
   * @deprecated No longer used anywhere
   * @hidden
   */
  subtitle?: string

  /**
   * @deprecated No longer used anywhere
   * @hidden
   */
  description?: string
}
