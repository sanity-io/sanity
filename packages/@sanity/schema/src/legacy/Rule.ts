import {
  type CustomValidator,
  type FieldReference,
  type FieldRules,
  type LocalizedValidationMessages,
  type MediaAssetTypes,
  type MediaValidator,
  type Rule as IRule,
  type RuleClass,
  type RuleSpec,
  type RuleSpecConstraint,
  type RuleTypeConstraint,
  type SchemaType,
  type ValidationContext,
  type ValidationMarker,
} from '@sanity/types'
import {cloneDeep} from 'lodash'

const FIELD_REF = Symbol('FIELD_REF')
const ruleConstraintTypes: RuleTypeConstraint[] = [
  'Array',
  'Boolean',
  'Date',
  'Number',
  'Object',
  'String',
]

/**
 * Core Rule implementation without validation logic.
 * This is the base Rule class that can be extended with validation logic.
 *
 * @internal
 */
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

  custom<T = unknown>(
    fn: CustomValidator<T>,
    options: {bypassConcurrencyLimit?: boolean} = {},
  ): Rule {
    if (options.bypassConcurrencyLimit) {
      Object.assign(fn, {bypassConcurrencyLimit: true})
    }
    return this.cloneWithRules([{flag: 'custom', constraint: fn as CustomValidator}])
  }

  min(len: number | string | FieldReference): Rule {
    return this.cloneWithRules([{flag: 'min', constraint: len}])
  }

  max(len: number | string | FieldReference): Rule {
    return this.cloneWithRules([{flag: 'max', constraint: len}])
  }

  length(len: number | FieldReference): Rule {
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

  precision(limit: number | FieldReference): Rule {
    return this.cloneWithRules([{flag: 'precision', constraint: limit}])
  }

  positive(): Rule {
    return this.cloneWithRules([{flag: 'min', constraint: 0}])
  }

  negative(): Rule {
    return this.cloneWithRules([{flag: 'lessThan', constraint: 0}])
  }

  greaterThan(num: number | FieldReference): Rule {
    return this.cloneWithRules([{flag: 'greaterThan', constraint: num}])
  }

  lessThan(num: number | FieldReference): Rule {
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
    b?: {name?: string; invert?: boolean},
  ): Rule {
    const name = typeof a === 'string' ? a : (a?.name ?? b?.name)
    const invert = typeof a === 'string' ? false : (a?.invert ?? b?.invert)

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

  media<T extends MediaAssetTypes = MediaAssetTypes>(fn: MediaValidator<T>): Rule {
    return this.cloneWithRules([{flag: 'media', constraint: fn}])
  }

  /**
   * The validate method is not implemented in the base Rule class.
   * It should be implemented by extending this class or injecting validation logic.
   */
  async validate(
    value: unknown,
    options: ValidationContext & {
      __internal?: {
        customValidationConcurrencyLimiter?: {
          ready: () => Promise<void>
          release: () => void
        }
      }
    },
  ): Promise<ValidationMarker[]> {
    throw new Error('validate() method must be implemented by extending Rule class')
  }
}

// Helper functions
function getBaseType(type: SchemaType | undefined): SchemaType | undefined {
  return type && type.type ? getBaseType(type.type) : type
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
