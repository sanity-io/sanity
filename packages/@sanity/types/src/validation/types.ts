import {type SanityClient} from '@sanity/client'
import {
  type Asset as MediaLibraryAsset,
  type AssetInstanceDocument,
} from '@sanity/media-library-types'

import {type SanityDocument} from '../documents'
import {type ValidationMarker} from '../markers'
import {type Path} from '../paths'
import {
  type Schema,
  type SchemaType,
  type SchemaValidationValue,
  type SlugSchemaType,
} from '../schema'
import {type SlugParent} from '../slug'

/** @public */
export type RuleTypeConstraint = 'Array' | 'Boolean' | 'Date' | 'Number' | 'Object' | 'String'

/** @public */
export type FieldRules = {[fieldKey: string]: SchemaValidationValue}

/**
 * Holds localized validation messages for a given field.
 *
 * @example Custom message for English (US) and Norwegian (Bokmål):
 * ```
 * {
 *   'en-US': 'Needs to start with a capital letter',
 *   'no-NB': 'Må starte med stor bokstav',
 * }
 * ```
 * @public
 */
export interface LocalizedValidationMessages {
  [locale: string]: string
}

/**
 * Note: `RuleClass` and `Rule` are split to fit the current `@sanity/types`
 * setup. Classes are a bit weird in the `@sanity/types` package because classes
 * create an actual javascript class while simultaneously creating a type
 * definition.
 *
 * This implicitly creates two types:
 * 1. the instance type — `Rule` and
 * 2. the static/class type - `RuleClass`
 *
 * The `RuleClass` type contains the static methods and the `Rule` instance
 * contains the instance methods. Downstream in the validation package, the Rule
 * implementation asserts the class declaration is of this type.
 *
 * @internal
 */
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
 * NOTE: Only use this through {@link Rule.valueOfField}
 *
 * @public
 */
export interface FieldReference {
  type: symbol
  path: string | string[]
}

/** @public */
export interface UriValidationOptions {
  scheme?: (string | RegExp) | Array<string | RegExp>
  allowRelative?: boolean
  relativeOnly?: boolean
  allowCredentials?: boolean
}

/** @public */
export interface Rule {
  // NOTE: these prop is not actually deprecated but there is better TS Doc
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
  _message: string | LocalizedValidationMessages | undefined
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
  error(message?: string | LocalizedValidationMessages): Rule
  warning(message?: string | LocalizedValidationMessages): Rule
  info(message?: string | LocalizedValidationMessages): Rule
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
  custom<T = unknown>(fn: CustomValidator<T>, options?: {bypassConcurrencyLimit?: boolean}): Rule
  media<T extends MediaAssetTypes = MediaAssetTypes>(fn: MediaValidator<T>): Rule
  min(len: number | string | FieldReference): Rule
  max(len: number | string | FieldReference): Rule
  length(len: number | FieldReference): Rule
  valid(value: unknown | unknown[]): Rule
  integer(): Rule
  precision(limit: number | FieldReference): Rule
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
  uri(options?: UriValidationOptions): Rule
  unique(): Rule
  reference(): Rule
  fields(rules: FieldRules): Rule
  assetRequired(): Rule
  validate(
    value: unknown,
    options: ValidationContext & {
      /**
       * @deprecated Internal use only
       * @internal
       */
      __internal?: {
        customValidationConcurrencyLimiter?: {
          ready: () => Promise<void>
          release: () => void
        }
      }
    },
  ): Promise<ValidationMarker[]>
}

/** @public */
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
  | {flag: 'min'; constraint: number | string | FieldReference}
  | {flag: 'max'; constraint: number | string | FieldReference}
  | {flag: 'length'; constraint: number | FieldReference}
  | {flag: 'valid'; constraint: unknown[]}
  | {flag: 'precision'; constraint: number | FieldReference}
  | {flag: 'lessThan'; constraint: number | FieldReference}
  | {flag: 'greaterThan'; constraint: number | FieldReference}
  | {flag: 'stringCasing'; constraint: 'uppercase' | 'lowercase'}
  | {flag: 'assetRequired'; constraint: {assetType: 'asset' | 'image' | 'file'}}
  | {flag: 'media'; constraint: MediaValidator<any>}
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

/**
 * this is used to get allow index access (e.g. `RuleSpec['constraint']`) to
 * constraint when a rule spec might not have a `constraint` prop
 *
 * @internal
 */
export type ConditionalIndexAccess<T, U> = U extends keyof T ? T[U] : undefined

/** @internal */
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
 *
 * @public
 */
export interface ValidationContext {
  getClient: (options: {apiVersion: string}) => SanityClient
  schema: Schema
  parent?: unknown
  type?: SchemaType
  document?: SanityDocument
  path?: Path
  getDocumentExists?: (options: {id: string}) => Promise<boolean>
  environment: 'cli' | 'studio'
}

/**
 * The base type for all validators in the validation library. Takes in a
 * `RuleSpec`'s constraint, the value to check, an optional override message,
 * and the validation context.
 *
 * @see Rule.validate from `sanity/src/core/validation/Rule`
 *
 * @internal
 */
export type Validator<T = any, Value = any> = (
  constraint: T,
  value: Value,
  message: string | undefined,
  context: ValidationContext,
) =>
  | ValidationError[]
  | ValidationError
  | string
  | true
  | Promise<ValidationError[] | ValidationError | string | true>

/**
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
 *
 * @internal
 */
export type Validators = Partial<{
  [P in RuleSpec['flag']]: Validator<
    Exclude<ConditionalIndexAccess<Extract<RuleSpec, {flag: P}>, 'constraint'>, FieldReference>
  >
}>

/** @internal */
export interface ValidationErrorOptions {
  paths?: Path[]
  children?: ValidationMarker[]
  operation?: 'AND' | 'OR'
}

/**
 * This follows the same pattern as `RuleClass` and `Rule` above
 * Note: this class does not actually extend `Error` since it's never thrown
 * within the validation library
 *
 * @deprecated It is preferred to a plain object that adheres to `ValidationError`
 * @internal
 */
export interface ValidationErrorClass {
  new (message: string, options?: ValidationErrorOptions): ValidationError
}

/**
 * The shape that can be returned from a custom validator to be converted into
 * a validation marker by the validation logic. Inside of a custom validator,
 * you can return an array of these in order to specify multiple paths within
 * an object or array.
 *
 * @public
 */
export interface ValidationError {
  /**
   * The message describing why the value is not valid. This message will be
   * included in the validation markers after validation has finished running.
   */
  message: string

  /**
   * If writing a custom validator, you can return validation messages to
   * specific path inside of the current value (object or array) by populating
   * this `path` prop.
   *
   * NOTE: This path is relative to the current value and _not_ relative to
   * the document.
   */
  path?: Path

  /**
   * Same as `path` but allows more than one value. If provided, the same
   * message will create two markers from each path with the same message
   * provided.
   *
   * @deprecated prefer `path`
   */
  paths?: Path[]

  /**
   * @deprecated Unused. Was used to store the results from `.either()` /`.all()`
   */
  children?: ValidationMarker[]

  /**
   * @deprecated Unused. Was used to signal if this error came from an `.either()`/`.all()`.
   */
  operation?: 'AND' | 'OR'

  /**
   * @deprecated Unused. Was relevant when validation error was used as a class.
   */
  cloneWithMessage?(message: string): ValidationError
}

/** @public */
export type CustomValidatorResult =
  | true
  | string
  | ValidationError
  | ValidationError[]
  | LocalizedValidationMessages

/** @public */
export interface CustomValidator<T = unknown> {
  (value: T, context: ValidationContext): CustomValidatorResult | Promise<CustomValidatorResult>
  bypassConcurrencyLimit?: boolean
}

/** @public */
export type MediaAssetTypes = AssetInstanceDocument['_type']

/** @public */
export interface MediaValidator<T extends MediaAssetTypes = MediaAssetTypes> {
  (
    value: MediaValidationValue<T>,
    context: ValidationContext,
  ): CustomValidatorResult | Promise<CustomValidatorResult>
}

/** @public */
export interface MediaValidationValue<T extends MediaAssetTypes = MediaAssetTypes> {
  /**
   * Media information
   */
  media: {
    /**
     * The Media Library Asset.
     */
    asset: MediaLibraryAsset & {currentVersion: Extract<AssetInstanceDocument, {_type: T}>}
  }
  /**
   * The field value which the media is used in.
   */
  value: unknown
}

/** @public */
export interface SlugValidationContext extends ValidationContext {
  parent: SlugParent
  type: SlugSchemaType
  defaultIsUnique: SlugIsUniqueValidator
}

/** @public */
export type SlugIsUniqueValidator = (
  slug: string,
  context: SlugValidationContext,
) => boolean | Promise<boolean>

/** @public */
export interface FormNodeValidation {
  level: 'error' | 'warning' | 'info'
  message: string
  path: Path
}
