import {type FieldReference} from '../../../validation'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {
  type AutocompleteString,
  type InitialValueProperty,
  type SchemaValidationValue,
  type ModalOptions,
} from '../../types'
import {
  type IntrinsicDefinitions,
  type IntrinsicTypeName,
  type TypeAliasDefinition,
} from '../schemaDefinition'
import {
  type BaseSchemaDefinition,
  type BaseSchemaTypeOptions,
  type SearchConfiguration,
  type TitledListValue,
} from './common'

/**
 * Options for the "insert menu" shown when adding items to an array with multiple member types.
 *
 * This is the canonical definition of these options. They are rendered by two separate
 * implementations that integrate with one another: the Studio form input
 * (`packages/sanity/src/insert-menu` in this repo, used by arrays in `sanity/structure`),
 * and the app frontend via `@sanity/visual-editing` when previewing through
 * `sanity/presentation`. `@sanity/visual-editing-types`
 * (https://github.com/sanity-io/visual-editing/blob/main/packages/visual-editing-types/src/index.ts)
 * re-uses this interface to derive the serialized form sent to the app frontend.
 *
 * @alpha This API may change
 */
export interface InsertMenuOptions {
  /**
   * @defaultValue `'auto'`
   * `filter: 'auto'` automatically turns on filtering if there are more than 5
   * schema types added to the menu.
   */
  filter?: 'auto' | boolean | undefined
  groups?: Array<{name: string; title?: string; of?: Array<string>}> | undefined
  /** defaultValue `true` */
  showIcons?: boolean | undefined
  /** @defaultValue `[{name: 'list'}]` */
  views?:
    | Array<
        | {name: 'list'}
        | {name: 'grid'; previewImageUrl?: (schemaTypeName: string) => string | undefined}
      >
    | undefined
}

/**
 * Types of array actions that can be performed
 * @beta
 */
export type ArrayActionName =
  /**
   * Add any item to the array at any position
   */
  | 'add'
  /**
   * Add item after an existing item
   */
  | 'addBefore'

  /**
   * Add item after an existing item
   */
  | 'addAfter'
  /**
   * Remove any item
   */
  | 'remove'
  /**
   * Duplicate item
   */
  | 'duplicate'

  /**
   * Copy item
   */
  | 'copy'

/** @public */
export interface ArrayOptions<V = unknown> extends SearchConfiguration, BaseSchemaTypeOptions {
  list?: TitledListValue<V>[] | V[]
  // inferring the array.of value for ArrayDefinition cause too much code-noise and was removed.
  // Since we don't have the type-info needed here, we allow values
  layout?: 'list' | 'tags' | 'grid'
  /** @deprecated This option does not have any effect anymore */
  direction?: 'horizontal' | 'vertical'
  sortable?: boolean
  modal?: ModalOptions
  /** @alpha This API may change */
  insertMenu?: InsertMenuOptions
  /**
   * A boolean flag to enable or disable tree editing for the array.
   * If there are any nested arrays, they will inherit this value.
   * @deprecated tree editing beta feature has been disabled
   */
  treeEditing?: boolean

  /**
   * A list of array actions to disable
   * Possible options are defined by {@link ArrayActionName}
   * @beta
   */
  disableActions?: ArrayActionName[]
}

/** @public */
export interface ArrayRule<Value> extends RuleDef<ArrayRule<Value>, Value> {
  min: (length: number | FieldReference) => ArrayRule<Value>
  max: (length: number | FieldReference) => ArrayRule<Value>
  length: (length: number | FieldReference) => ArrayRule<Value>
  unique: () => ArrayRule<Value>
}

/** @public */
export type ArrayOfEntry<T> = Omit<T, 'name' | 'hidden'> & {name?: string}

/** @public */
export type IntrinsicArrayOfDefinition = {
  [K in keyof IntrinsicDefinitions]: Omit<
    ArrayOfEntry<IntrinsicDefinitions[K]>,
    'validation' | 'initialValue'
    /* concession: without this "widening" these are considered unknown in array.of when not using defineArrayMember */
  > & {validation?: SchemaValidationValue; initialValue?: InitialValueProperty<any, any>}
}

/** @public */
export type ArrayOfType<
  TType extends IntrinsicTypeName = IntrinsicTypeName,
  TAlias extends IntrinsicTypeName | undefined = undefined,
> =
  | IntrinsicArrayOfDefinition[TType]
  | ArrayOfEntry<TypeAliasDefinition<AutocompleteString, TAlias>>

/** @public */
export interface ArrayDefinition extends BaseSchemaDefinition {
  type: 'array'
  of: ArrayOfType[]
  initialValue?: InitialValueProperty<any, unknown[]>
  validation?: ValidationBuilder<ArrayRule<unknown[]>, unknown[]>
  options?: ArrayOptions
}
