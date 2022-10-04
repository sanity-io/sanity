import {ComponentType, ReactElement, ReactNode} from 'react'
import {ConditionalProperty} from '../../types'
import {ObjectOptions} from './object'

/** @public */
export type FieldsetDefinition = {
  name: string
  title?: string
  description?: string
  hidden?: ConditionalProperty
  readOnly?: ConditionalProperty
  options?: ObjectOptions
}

/** @public */
export type FieldGroupDefinition = {
  name: string
  title?: string
  icon?: ComponentType | ReactNode
  default?: boolean
}

/** @public */
export interface BaseSchemaDefinition {
  name: string
  title?: string
  description?: string | ReactElement
  hidden?: ConditionalProperty
  readOnly?: ConditionalProperty
  icon?: ComponentType | ReactNode
  components?: {
    /**
     * `diff` component is used when the schema type is rendered in the Studio history panel.
     *
     * Implementations should be assignable to `ComponentType<DiffProps>`.
     */
    diff?: ComponentType<any> // @todo: use `DiffProps` here

    /**
     * `field` component is used when the schema type is rendered as a field in an object.
     * Fields can be found in `document`, `object`, `image` and `file` schema-types.
     *
     * The `field` component is responsible for adding label, presence, validation, change indicator and other
     * standard object-field affordances. The `FormField` component can be useful when implementing `field`.
     *
     * `field` is also responsible for rendering the `input`. It is recommend to delegate this to `props.renderInput`,
     * so that other component-customizations can work as intended.
     *
     * **Consider using {@link input} instead of `field` if only the ìnput needs to be customized. This will
     * allow the Studio to handle everything around the input.
     *
     * The component will only be used for object member fields.
     * `form` will _not_ have any effect for object types when opened for editing in arrays, or as blocks in
     * the Portable Text editor.
     *
     * Implementations should be assignable to `ComponentType<FieldProps>`.
     * @see input
     * @see item
     */
    field?: ComponentType<any> // @todo: use `FieldProps` here

    /**
     * `input` component is used whenever the schema type input is rendered.
     * This is typically the HTML <input> or similar, where a Studio user can see and change the value of a field or object.
     *
     * `input` should not render any object-field affordances like field-label, presence or validation.
     * For that, use {@link field}
     *
     * Implementations should be assignable to `ComponentType<InputProps>`.
     *
     * @see field
     * @see item
     */
    input?: ComponentType<any> // @todo: use `InputProps` here

    /**
     * `item` component is used whenever the schema type is rendered in an array.
     * The default Studio implementations show a preview of the item value, which opens the item for editing when clicked.
     *
     * Implementations should be assignable to `ComponentType<ItemProps>`.
     *
     * @see field
     * @see input
     */
    item?: ComponentType<any> // @todo: use `ItemProps` here

    /**
     * `preview` component is used whenever the schema type is rendered in an array (as a standard array item),
     * or as a block in a Portable Text editor.
     *
     * The default Studio implementations show a preview of the value, using the schema preview configuration.
     *
     * The component `props.value` will contain the result of `preview.prepare` when defined, otherwise the result of
     * `preview.select` will be used.
     *
     * Implementations should be assignable to `ComponentType<PreviewProps>`.
     */
    preview?: ComponentType<any> // @todo: use `PreviewProps` here
  }
  validation?: unknown
  initialValue?: unknown
}

/** @public */
export interface TitledListValue<V = unknown> {
  _key?: string
  title: string
  value?: V
}

/** @public */
export interface EnumListProps<V = unknown> {
  list?: Array<TitledListValue<V> | V>
  layout?: 'radio' | 'dropdown'
  direction?: 'horizontal' | 'vertical'
}
