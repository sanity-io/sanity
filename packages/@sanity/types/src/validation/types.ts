import type {SanityClient} from '@sanity/client'
import type {Path} from '../paths'
import type {SchemaType, SchemaValidationValue} from '../schema'
import type {SanityDocument} from '../documents'
import type {ValidationMarker} from '../markers'
import type {Block} from '../portableText'
import {Schema} from '../schema'

export type RuleTypeConstraint = 'Array' | 'Boolean' | 'Date' | 'Number' | 'Object' | 'String'
export type FieldRules = {[fieldKey: string]: SchemaValidationValue}

// Note: `RuleClass` and `Rule` are split to fit the current `@sanity/types`
// setup. Classes are a bit weird in the `@sanity/types` package because classes
// create an actual javascript class while simultaneously creating a type
// definition.
//
// This implicitly creates two types:
// 1. the instance type — `Rule` and
// 2. the static/class type - `RuleClass`
//
// The `RuleClass` type contains the static methods and the `Rule` instance
// contains the instance methods. Downstream in the validation package, the Rule
// implementation asserts the class declaration is of this type.
export interface RuleClass {
  FIELD_REF: symbol
  array: (def?: SchemaType) => Rule
  object: (def?: SchemaType) => Rule
  string: (def?: SchemaType) => Rule
  number: (def?: SchemaType) => Rule
  boolean: (def?: SchemaType) => Rule
  dateTime: (def?: SchemaType) => Rule

  valueOfField: Rule['valueOfField']

  new (typeDef?: SchemaType): Rule
}

/**
 * Holds a reference to a different field
 * Note: Only use this through {@link Rule.valueOfField}
 */
export interface FieldReference {
  type: symbol
  path: string | string[]
}

export interface Rule {
  // Note: these prop is not actually deprecated but there is better TS Doc
  // support for `@deprecated` than `@internal`
  /**
   * @internal
   * @deprecated internal use only
   */
  _type: RuleTypeConstraint | undefined
  /**
   * @internal
   * @deprecated internal use only
   */
  _level: 'error' | 'warning' | 'info' | undefined
  /**
   * @internal
   * @deprecated internal use only
   */
  _required: 'required' | 'optional' | undefined
  /**
   * @internal
   * @deprecated internal use only
   */
  _typeDef: SchemaType | undefined
  /**
   * @internal
   * @deprecated internal use only
   */
  _message: string | undefined
  /**
   * @internal
   * @deprecated internal use only
   */
  _rules: RuleSpec[]
  /**
   * @internal
   * @deprecated internal use only
   */
  _fieldRules: FieldRules | undefined

  /**
   * Takes in a path and returns an object with a symbol.
   *
   * When the validation lib sees this symbol, it will use the provided path to
   * get a value from the current field's parent and use that value as the input
   * to the Rule.
   *
   * The path that's given is forwarded to `lodash/get`
   *
   * ```js
   * fields: [
   * // ...
   *   {
   *     // ...
   *     name: 'highestTemperature',
   *     type: 'number',
   *     validation: (Rule) => Rule.positive().min(Rule.valueOfField('lowestTemperature')),
   *     // ...
   *   },
   * ]
   * ```
   */
  valueOfField: (path: string | string[]) => FieldReference
  error(message?: string): Rule
  warning(message?: string): Rule
  info(message?: string): Rule
  reset(): this
  isRequired(): boolean
  clone(): Rule
  cloneWithRules(rules: RuleSpec[]): Rule
  merge(rule: Rule): Rule
  type(targetType: RuleTypeConstraint | Lowercase<RuleTypeConstraint>): Rule
  all(children: Rule[]): Rule
  either(children: Rule[]): Rule
  optional(): Rule
  required(): Rule
  custom<T = unknown>(fn: CustomValidator<T>): Rule
  min(len: number | FieldReference): Rule
  max(len: number | FieldReference): Rule
  length(len: number): Rule
  valid(value: unknown | unknown[]): Rule
  integer(): Rule
  precision(limit: number): Rule
  positive(): Rule
  negative(): Rule
  greaterThan(num: number | FieldReference): Rule
  lessThan(num: number | FieldReference): Rule
  uppercase(): Rule
  lowercase(): Rule
  regex(pattern: RegExp, name: string, options: {name?: string; invert?: boolean}): Rule
  regex(pattern: RegExp, options: {name?: string; invert?: boolean}): Rule
  regex(pattern: RegExp, name: string): Rule
  regex(pattern: RegExp): Rule
  email(): Rule
  uri(options?: {
    scheme?: (string | RegExp) | Array<string | RegExp>
    allowRelative?: boolean
    relativeOnly?: boolean
    allowCredentials?: boolean
  }): Rule
  unique(): Rule
  reference(): Rule
  /**
   * @deprecated use `Rule.custom` instead
   */
  block(blockValidators: BlockValidator): Rule
  fields(rules: FieldRules): Rule
  assetRequired(): Rule
  validate(value: unknown, options: ValidationContext): Promise<ValidationMarker[]>
}

export type RuleSpec =
  | {flag: 'integer'}
  | {flag: 'email'}
  | {flag: 'unique'}
  | {flag: 'reference'}
  | {flag: 'type'; constraint: RuleTypeConstraint}
  | {flag: 'all'; constraint: Rule[]}
  | {flag: 'either'; constraint: Rule[]}
  | {flag: 'presence'; constraint: 'optional' | 'required'}
  | {flag: 'custom'; constraint: CustomValidator}
  | {flag: 'min'; constraint: number}
  | {flag: 'max'; constraint: number}
  | {flag: 'length'; constraint: number}
  | {flag: 'valid'; constraint: unknown[]}
  | {flag: 'precision'; constraint: number}
  | {flag: 'lessThan'; constraint: number}
  | {flag: 'greaterThan'; constraint: number}
  | {flag: 'stringCasing'; constraint: 'uppercase' | 'lowercase'}
  | {flag: 'assetRequired'; constraint: {assetType: 'Asset' | 'Image' | 'File'}}
  | {
      flag: 'regex'
      constraint: {
        pattern: RegExp
        name?: string
        invert: boolean
      }
    }
  | {
      flag: 'uri'
      constraint: {
        options: {
          scheme: RegExp[]
          allowRelative: boolean
          relativeOnly: boolean
          allowCredentials: boolean
        }
      }
    }

// this is used to get allow index access (e.g. `RuleSpec['constraint']`) to
// constraint when a rule spec might not have a 'constraint` prop
export type ConditionalIndexAccess<T, U> = U extends keyof T ? T[U] : undefined

export type RuleSpecConstraint<T extends RuleSpec['flag']> = ConditionalIndexAccess<
  Extract<RuleSpec, {flag: T}>,
  'constraint'
>

/**
 * A context object passed around during validation. This includes the
 * `Rule.custom` context.
 *
 * e.g.
 *
 * ```js
 * Rule.custom((_, validationContext) => {
 *   // ...
 * })`
 * ```
 */
export type ValidationContext = {
  client: SanityClient
  schema: Schema
  parent?: unknown
  type?: SchemaType
  document?: SanityDocument
  path?: Path
  getDocumentExists?: (options: {id: string}) => Promise<boolean>
}

/**
 * @internal
 * The base type for all validators in the validation library. Takes in a
 * `RuleSpec`'s constraint, the value to check, an optional override message,
 * and the validation context.
 *
 * @see Rule.validate from `@sanity/validation/src/Rule`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Validator<T = any, Value = any> = (
  constraint: T,
  value: Value,
  message: string | undefined,
  context: ValidationContext
) =>
  | ValidationError[]
  | ValidationError
  | string
  | true
  | Promise<ValidationError[] | ValidationError | string | true>

/**
 * @internal
 * A type helper used to define a group of validators. The type of the
 * `RuleSpec` constraint is inferred via the key.
 *
 * E.g.
 *
 * ```ts
 * const booleanValidators: Validators = {
 *   ...genericValidator,
 *
 *   presence: (v, value, message) => {
 *     if (v === 'required' && typeof value !== 'boolean') return message || 'Required'
 *     return true
 *   },
 * }
 * ```
 */
export type Validators = Partial<{
  [P in RuleSpec['flag']]: Validator<
    ConditionalIndexAccess<Extract<RuleSpec, {flag: P}>, 'constraint'>
  >
}>

export interface ValidationErrorOptions {
  paths?: Path[]
  children?: ValidationMarker[]
  operation?: 'AND' | 'OR'
}

// This follows the same pattern as `RuleClass` and `Rule` above
// Note: this class does not actually extend `Error` since it's never thrown
// within the validation library
export interface ValidationErrorClass {
  new (message: string, options?: ValidationErrorOptions): ValidationError
}

export interface ValidationError {
  message: string
  children?: ValidationMarker[]
  operation?: 'AND' | 'OR'
  /**
   * If writing a custom validator, you can return validation messages to
   * specific paths inside of the current value (object or array) by populating
   * this `paths` prop.
   *
   * NOTE: These paths are relative to the current value and _not_ relative to
   * the document. Use `undefined` or an empty array to target the top-level
   * value.
   */
  paths?: Path[]
  cloneWithMessage?(message: string): ValidationError
}

export type CustomValidatorResult = true | string | ValidationError

export type CustomValidator<T = unknown> = (
  value: T,
  context: ValidationContext
) => CustomValidatorResult | Promise<CustomValidatorResult>

/**
 * @deprecated use `Rule.custom` instead
 * @see CustomValidator
 */
export type BlockValidator = (
  block: Block,
  options: ValidationContext
) =>
  | ValidationError[]
  | ValidationError
  | string
  | true
  | Promise<ValidationError[] | ValidationError | string | true>

export type SlugIsUniqueValidator = (
  slug: string,
  options: ValidationContext & {defaultIsUnique: SlugIsUniqueValidator}
) => boolean | Promise<boolean>

export interface NodeValidation {
  level: 'error' | 'warning' | 'info'
  message: string
  path: Path
}
