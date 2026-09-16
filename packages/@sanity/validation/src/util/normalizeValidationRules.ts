import {
  type Rule,
  type RuleSpec,
  type RuleTypeConstraint,
  type SchemaType,
  type SchemaValidationValue,
  type ValidationContext,
} from '@sanity/types'
import {dequal as isEqual} from 'dequal/lite'

import {markInternalValidator} from '../internalValidators'
import {Rule as RuleClass} from '../Rule'
import {slugStructureValidator, slugUniquenessValidator} from '../validators/slugValidator'
import {getTypeChain} from './getTypeChain'

export {getTypeChain} from './getTypeChain'

const ruleConstraintTypes: {[P in Lowercase<RuleTypeConstraint>]: true} = {
  array: true,
  boolean: true,
  date: true,
  number: true,
  object: true,
  string: true,
}

const isRuleConstraint = (typeString: string): typeString is Lowercase<RuleTypeConstraint> =>
  typeString in ruleConstraintTypes

const compiledValidations = new WeakMap<
  object,
  {type: SchemaType; definition: SchemaValidationValue | undefined; rules: Rule[]}
>()

export function compileValidationRules(type: SchemaType): Rule[] {
  const inherited = Array.isArray(type.validation)
    ? compiledValidations.get(type.validation)
    : undefined
  const definition = inherited ? inherited.definition : type.validation
  const rules = normalizeValidationRules(type)
  compiledValidations.set(rules, {type, definition, rules})
  return rules
}

function baseRuleReducer(baseRule: Rule, type: SchemaType) {
  if (type.name === 'datetime') return baseRule.type('Date')
  if (type.name === 'date') return baseRule.type('Date')
  if (type.name === 'url') return baseRule.uri()
  if (type.name === 'slug') {
    return baseRule
      .custom(markInternalValidator(slugStructureValidator), {bypassConcurrencyLimit: true})
      .custom(markInternalValidator(slugUniquenessValidator), {bypassConcurrencyLimit: true})
  }
  if (type.name === 'reference') return baseRule.reference()
  if (type.name === 'email') return baseRule.email()
  return baseRule
}

function hasValueField(typeDef: SchemaType | undefined): boolean {
  if (!typeDef) return false
  if (!('fields' in typeDef) && typeDef.type) return hasValueField(typeDef.type)
  if (!('fields' in typeDef)) return false
  if (!Array.isArray(typeDef.fields)) return false
  return typeDef.fields.some((field) => field.name === 'value')
}

function extractValueFromListOption(option: unknown, typeDef: SchemaType): unknown {
  // If you define a `list` option with object items, where the item has a `value` field,
  // we don't want to treat that as the value but rather the surrounding object
  // This differs from the case where you have a title/value pair setup for a string/number, for instance
  if (typeDef.jsonType === 'object' && hasValueField(typeDef)) return option

  return (option as Record<string, unknown>).value === undefined
    ? option
    : (option as Record<string, unknown>).value
}

const isUriSpec = (spec: RuleSpec): spec is Extract<RuleSpec, {flag: 'uri'}> => spec.flag === 'uri'

// A `url` type auto-injects the default `.uri()` onto every array element, so a
// custom scheme on one element cannot override the default on its siblings (GH #3298).
function omitLeakedDefaultUri(rules: Rule[], typeDef: SchemaType): Rule[] {
  const isUrlType = getTypeChain(typeDef).some((type) => type.name === 'url')
  if (!isUrlType) return rules

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const defaultUri = new RuleClass(typeDef).uri()._rules.find(isUriSpec)?.constraint
  const isDefaultUri = (spec: RuleSpec) => isUriSpec(spec) && isEqual(spec.constraint, defaultUri)
  const isCustomUri = (spec: RuleSpec) => isUriSpec(spec) && !isEqual(spec.constraint, defaultUri)

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const someElementSetsScheme = rules.some((rule) => rule._rules.some(isCustomUri))
  if (!someElementSetsScheme) return rules

  return rules.map((rule) => {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    if (!rule._rules.some(isDefaultUri)) return rule
    const cleaned = rule.clone()
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    cleaned._rules = rule._rules.filter((spec) => !isDefaultUri(spec))
    return cleaned
  })
}

export function normalizeValidationRules(
  typeDef: SchemaType | undefined,
  context?: ValidationContext,
): Rule[] {
  if (!typeDef) {
    return []
  }

  const compiled = Array.isArray(typeDef.validation)
    ? compiledValidations.get(typeDef.validation)
    : undefined
  if (compiled) {
    if (compiled.type === typeDef) return compiled.rules
    // Derived fields inherit compiled rules, but their options can differ. Rebuild
    // from the authored definition instead of reusing the ancestor's constraints.
    return normalizeValidationRules({...typeDef, validation: compiled.definition}, context)
  }

  const validation = typeDef.validation

  if (Array.isArray(validation)) {
    const rules = validation.flatMap((i) =>
      normalizeValidationRules(
        {
          ...typeDef,
          validation: i,
        },
        context,
      ),
    )
    return omitLeakedDefaultUri(rules, typeDef)
  }

  const initialRule = new RuleClass(typeDef)
  let baseRule =
    // using an object + Object.values to de-dupe the type chain by type name
    Object.values(
      getTypeChain(typeDef).reduce<Record<string, SchemaType>>((acc, type) => {
        acc[type.name] = type
        return acc
      }, {}),
    ).reduce(
      baseRuleReducer,
      isRuleConstraint(typeDef.jsonType) ? initialRule.type(typeDef.jsonType) : initialRule,
    )

  const options = typeDef.options
  const list =
    options && typeof options === 'object' && 'list' in options ? options.list : undefined
  if (Array.isArray(list)) {
    baseRule = baseRule.valid(list.map((option) => extractValueFromListOption(option, typeDef)))
  }

  if (validation && typeof validation === 'object') {
    return [validation]
  }

  if (!validation) {
    return [baseRule]
  }

  if (typeof validation === 'function') {
    return normalizeValidationRules(
      {
        ...typeDef,
        validation: validation(baseRule, context),
      },
      context,
    )
  }

  return [baseRule]
}
