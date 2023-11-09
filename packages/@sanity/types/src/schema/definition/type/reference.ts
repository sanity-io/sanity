import type {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import type {InitialValueProperty} from '../../types'
import type {SchemaTypeDefinition, TypeReference} from '../schemaDefinition'
import type {Reference, ReferenceBaseOptions, ReferenceFilterOptions} from '../../../reference'
import type {BaseSchemaDefinition} from './common'

/** @public */
export type ReferenceValue = Reference

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReferenceRule extends RuleDef<ReferenceRule, ReferenceValue> {}

/** @public */
export type ReferenceTo =
  | SchemaTypeDefinition
  | TypeReference
  | Array<SchemaTypeDefinition | TypeReference>

/**
 * Types are closed for extension. To add properties via declaration merging to this type,
 * redeclare and add the properties to the interfaces that make up ReferenceOptions type.
 *
 * @see ReferenceFilterOptions
 * @see ReferenceFilterResolverOptions
 * @see ReferenceBaseOptions
 *
 * @public
 */
export type ReferenceOptions = ReferenceBaseOptions & ReferenceFilterOptions

/** @public */
export interface ReferenceDefinition extends BaseSchemaDefinition {
  type: 'reference'
  to: ReferenceTo
  weak?: boolean
  options?: ReferenceOptions
  validation?: ValidationBuilder<ReferenceRule, ReferenceValue>
  initialValue?: InitialValueProperty<any, Omit<ReferenceValue, '_type'>>
}
