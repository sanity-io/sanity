import type {
  CustomValidator,
  FieldRules,
  Rule as IRule,
  LocalizedValidationMessages,
  RuleClass,
  RuleSpec,
  RuleSpecConstraint,
  RuleTypeConstraint,
  SchemaType,
  ValidationMarker,
  Validator,
} from '@sanity/types'
import {cloneDeep, get} from 'lodash'
import {ValidationError as ValidationErrorClass} from './ValidationError'
import {escapeRegex} from './util/escapeRegex'
import {convertToValidationMarker} from './util/convertToValidationMarker'
import {isLocalizedMessages, localizeMessage} from './util/localizeMessage'
import {pathToString} from './util/pathToString'
import {genericValidators} from './validators/genericValidator'
import {booleanValidators} from './validators/booleanValidator'
import {numberValidators} from './validators/numberValidator'
import {stringValidators} from './validators/stringValidator'
import {arrayValidators} from './validators/arrayValidator'
import {objectValidators} from './validators/objectValidator'
import {dateValidators} from './validators/dateValidator'
import type {ValidationContext} from './types'

const typeValidators = {
  Boolean: booleanValidators,
  Number: numberValidators,
  String: stringValidators,
  Array: arrayValidators,
  Object: objectValidators,
  Date: dateValidators,
}

const getBaseType = (type: SchemaType | undefined): SchemaType | undefined => {
  return type && type.type ? getBaseType(type.type) : type
}

const isFieldRef = (constraint: unknown): constraint is {type: symbol; path: string | string[]} => {
  if (typeof constraint !== 'object' || !constraint) return false
  return (constraint as Record<string, unknown>).type === Rule.FIELD_REF
}

const EMPTY_ARRAY: unknown[] = []
const FIELD_REF = Symbol('FIELD_REF')
const ruleConstraintTypes: RuleTypeConstraint[] = [
  'Array',
  'Boolean',
  'Date',
  'Number',
  'Object',
  'String',
]

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
// contains the instance methods.
//
// This package exports the RuleClass as a value without implicitly exporting
// an instance definition. This should help reminder downstream users to import
// from the `@sanity/types` package.
export const Rule: RuleClass = class Rule implements IRule {
  static readonly FIELD_REF = FIELD_REF
  static array = (def?: SchemaType): Rule => new Rule(def).type('Array')
  static object = (def?: SchemaType): Rule => new Rule(def).type('Object')
  static string = (def?: SchemaType): Rule => new Rule(def).type('String')
  static number = (def?: SchemaType): Rule => new Rule(def).type('Number')
  static boolean = (def?: SchemaType): Rule => new Rule(def).type('Boolean')
  static dateTime = (def?: SchemaType): Rule => new Rule(def).type('Date')
  static valueOfField = (path: string | string[]): {type: symbol; path: string | string[]} => ({
    type: FIELD_REF,
    path,
  })

  _type: RuleTypeConstraint | undefined = undefined
  _level: 'error' | 'warning' | 'info' | undefined = undefined
  _required: 'required' | 'optional' | undefined = undefined
  _typeDef: SchemaType | undefined = undefined
  _message: string | LocalizedValidationMessages | undefined = undefined
  _rules: RuleSpec[] = []
  _fieldRules: FieldRules | undefined = undefined

  constructor(typeDef?: SchemaType) {
    this._typeDef = typeDef
    this.reset()
  }

  private _mergeRequired(next: Rule) {
    if (this._required === 'required' || next._required === 'required') return 'required'
    if (this._required === 'optional' || next._required === 'optional') return 'optional'
    return undefined
  }

  // Alias to static method, since we often have access to an _instance_ of a rule but not the actual Rule class
  valueOfField = Rule.valueOfField.bind(Rule)

  error(message?: string | LocalizedValidationMessages): Rule {
    const rule = this.clone()
    rule._level = 'error'
    rule._message = message || undefined
    return rule
  }

  warning(message?: string | LocalizedValidationMessages): Rule {
    const rule = this.clone()
    rule._level = 'warning'
    rule._message = message || undefined
    return rule
  }

  info(message?: string | LocalizedValidationMessages): Rule {
    const rule = this.clone()
    rule._level = 'info'
    rule._message = message || undefined
    return rule
  }

  reset(): this {
    this._type = this._type || undefined
    this._rules = (this._rules || []).filter((rule) => rule.flag === 'type')
    this._message = undefined
    this._required = undefined
    this._level = 'error'
    this._fieldRules = undefined
    return this
  }

  isRequired(): boolean {
    return this._required === 'required'
  }

  clone(): Rule {
    const rule = new Rule()
    rule._type = this._type
    rule._message = this._message
    rule._required = this._required
    rule._rules = cloneDeep(this._rules)
    rule._level = this._level
    rule._fieldRules = this._fieldRules
    rule._typeDef = this._typeDef
    return rule
  }

  cloneWithRules(rules: RuleSpec[]): Rule {
    const rule = this.clone()
    const newRules = new Set()
    rules.forEach((curr) => {
      if (curr.flag === 'type') {
        rule._type = curr.constraint
      }

      newRules.add(curr.flag)
    })

    rule._rules = rule._rules
      .filter((curr) => {
        const disallowDuplicate = ['type', 'uri', 'email'].includes(curr.flag)
        const isDuplicate = newRules.has(curr.flag)
        return !(disallowDuplicate && isDuplicate)
      })
      .concat(rules)

    return rule
  }

  merge(rule: Rule): Rule {
    if (this._type && rule._type && this._type !== rule._type) {
      throw new Error('merge() failed: conflicting types')
    }

    const newRule = this.cloneWithRules(rule._rules)
    newRule._type = this._type || rule._type
    newRule._message = this._message || rule._message
    newRule._required = this._mergeRequired(rule)
    newRule._level = this._level === 'error' ? rule._level : this._level
    return newRule
  }

  // Validation flag setters
  type(targetType: RuleTypeConstraint | Lowercase<RuleTypeConstraint>): Rule {
    const type = `${targetType.slice(0, 1).toUpperCase()}${targetType.slice(1)}` as Capitalize<
      typeof targetType
    >

    if (!ruleConstraintTypes.includes(type)) {
      throw new Error(`Unknown type "${targetType}"`)
    }

    const rule = this.cloneWithRules([{flag: 'type', constraint: type}])
    rule._type = type
    return rule
  }

  all(children: Rule[]): Rule {
    return this.cloneWithRules([{flag: 'all', constraint: children}])
  }

  either(children: Rule[]): Rule {
    return this.cloneWithRules([{flag: 'either', constraint: children}])
  }

  // Shared rules
  optional(): Rule {
    const rule = this.cloneWithRules([{flag: 'presence', constraint: 'optional'}])
    rule._required = 'optional'
    return rule
  }

  required(): Rule {
    const rule = this.cloneWithRules([{flag: 'presence', constraint: 'required'}])
    rule._required = 'required'
    return rule
  }

  custom<T = unknown>(fn: CustomValidator<T>): Rule {
    return this.cloneWithRules([{flag: 'custom', constraint: fn as CustomValidator}])
  }

  min(len: number): Rule {
    return this.cloneWithRules([{flag: 'min', constraint: len}])
  }

  max(len: number): Rule {
    return this.cloneWithRules([{flag: 'max', constraint: len}])
  }

  length(len: number): Rule {
    return this.cloneWithRules([{flag: 'length', constraint: len}])
  }

  valid(value: unknown | unknown[]): Rule {
    const values = Array.isArray(value) ? value : [value]
    return this.cloneWithRules([{flag: 'valid', constraint: values}])
  }

  // Numbers only
  integer(): Rule {
    return this.cloneWithRules([{flag: 'integer'}])
  }

  precision(limit: number): Rule {
    return this.cloneWithRules([{flag: 'precision', constraint: limit}])
  }

  positive(): Rule {
    return this.cloneWithRules([{flag: 'min', constraint: 0}])
  }

  negative(): Rule {
    return this.cloneWithRules([{flag: 'lessThan', constraint: 0}])
  }

  greaterThan(num: number): Rule {
    return this.cloneWithRules([{flag: 'greaterThan', constraint: num}])
  }

  lessThan(num: number): Rule {
    return this.cloneWithRules([{flag: 'lessThan', constraint: num}])
  }

  // String only
  uppercase(): Rule {
    return this.cloneWithRules([{flag: 'stringCasing', constraint: 'uppercase'}])
  }

  lowercase(): Rule {
    return this.cloneWithRules([{flag: 'stringCasing', constraint: 'lowercase'}])
  }

  regex(pattern: RegExp, name: string, options: {name?: string; invert?: boolean}): Rule
  regex(pattern: RegExp, options: {name?: string; invert?: boolean}): Rule
  regex(pattern: RegExp, name: string): Rule
  regex(pattern: RegExp): Rule
  regex(
    pattern: RegExp,
    a?: string | {name?: string; invert?: boolean},
    b?: {name?: string; invert?: boolean}
  ): Rule {
    const name = typeof a === 'string' ? a : a?.name ?? b?.name
    const invert = typeof a === 'string' ? false : a?.invert ?? b?.invert

    const constraint: RuleSpecConstraint<'regex'> = {
      pattern,
      name,
      invert: invert || false,
    }

    return this.cloneWithRules([{flag: 'regex', constraint}])
  }

  email(): Rule {
    return this.cloneWithRules([{flag: 'email'}])
  }

  uri(opts?: {
    scheme?: (string | RegExp) | Array<string | RegExp>
    allowRelative?: boolean
    relativeOnly?: boolean
    allowCredentials?: boolean
  }): Rule {
    const optsScheme = opts?.scheme || ['http', 'https']
    const schemes = Array.isArray(optsScheme) ? optsScheme : [optsScheme]

    if (!schemes.length) {
      throw new Error('scheme must have at least 1 scheme specified')
    }

    const constraint: RuleSpecConstraint<'uri'> = {
      options: {
        scheme: schemes.map((scheme) => {
          if (!(scheme instanceof RegExp) && typeof scheme !== 'string') {
            throw new Error('scheme must be a RegExp or a String')
          }

          return typeof scheme === 'string' ? new RegExp(`^${escapeRegex(scheme)}$`) : scheme
        }),
        allowRelative: opts?.allowRelative || false,
        relativeOnly: opts?.relativeOnly || false,
        allowCredentials: opts?.allowCredentials || false,
      },
    }

    return this.cloneWithRules([{flag: 'uri', constraint}])
  }

  // Array only
  unique(): Rule {
    return this.cloneWithRules([{flag: 'unique'}])
  }

  // Objects only
  reference(): Rule {
    return this.cloneWithRules([{flag: 'reference'}])
  }

  fields(rules: FieldRules): Rule {
    if (this._type !== 'Object') {
      throw new Error('fields() can only be called on an object type')
    }

    const rule = this.cloneWithRules([])
    rule._fieldRules = rules
    return rule
  }

  assetRequired(): Rule {
    const base = getBaseType(this._typeDef)
    let assetType: 'asset' | 'image' | 'file'
    if (base && ['image', 'file'].includes(base.name)) {
      assetType = base.name === 'image' ? 'image' : 'file'
    } else {
      assetType = 'asset'
    }

    return this.cloneWithRules([{flag: 'assetRequired', constraint: {assetType}}])
  }

  async validate(value: unknown, context: ValidationContext): Promise<ValidationMarker[]> {
    if (!context) {
      throw new Error('missing context')
    }

    const valueIsEmpty = value === null || value === undefined

    // Short-circuit on optional, empty fields
    if (valueIsEmpty && this._required === 'optional') {
      return EMPTY_ARRAY as ValidationMarker[]
    }

    const rules =
      // Run only the _custom_ functions if the rule is not set to required or optional
      this._required === undefined && valueIsEmpty
        ? this._rules.filter((curr) => curr.flag === 'custom')
        : this._rules

    const validators = (this._type && typeValidators[this._type]) || genericValidators

    const results = await Promise.all(
      rules.map(async (curr) => {
        if (curr.flag === undefined) {
          throw new Error('Invalid rule, did not contain "flag"-property')
        }

        const validator: Validator | undefined = validators[curr.flag]
        if (!validator) {
          const forType = this._type ? `type "${this._type}"` : 'rule without declared type'
          throw new Error(`Validator for flag "${curr.flag}" not found for ${forType}`)
        }

        let specConstraint = 'constraint' in curr ? curr.constraint : null
        if (isFieldRef(specConstraint)) {
          specConstraint = get(context.parent, specConstraint.path)
        }

        const message = isLocalizedMessages(this._message)
          ? localizeMessage(this._message, context.i18n)
          : this._message

        let result
        try {
          result = await validator(specConstraint, value, message, context)
        } catch (err) {
          const errorFromException = new ValidationErrorClass(
            `${pathToString(context.path)}: Exception occurred while validating value: ${
              err.message
            }`
          )
          return convertToValidationMarker(errorFromException, 'error', context)
        }

        return convertToValidationMarker(result, this._level, context)
      })
    )

    return results.flat()
  }
}
