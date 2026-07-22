import {
  type Rule,
  type RuleSpec,
  type RuleTypeConstraint,
  type SchemaType,
  type ValidationContext,
} from '@sanity/types'
import isEqual from 'lodash-es/isEqual.js'

import {Rule as RuleClass} from '../Rule'
import {slugValidator} from '../validators/slugValidator'

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

export function getTypeChain(
  type: SchemaType | undefined,
  visited: Set<SchemaType> = new Set(),
): SchemaType[] {
  if (!type) return []
  if (visited.has(type)) return []

  visited.add(type)

  const next = type.type ? getTypeChain(type.type, visited) : []
  return [...next, type]
}

function baseRuleReducer(inputRule: Rule, type: SchemaType) {
  let baseRule = inputRule

  if (isRuleConstraint(type.jsonType)) {
    baseRule = baseRule.type(type.jsonType)
  }

  const typeOptionsList =
    // if type.options is truthy
    type?.options &&
    // and type.options is an object (non-null from the previous)
    typeof type.options === 'object' &&
    // and if `list` is in options
    'list' in type.options &&
    // then finally access the list
    type.options.list

  if (Array.isArray(typeOptionsList)) {
    baseRule = baseRule.valid(
      typeOptionsList.map((option) => extractValueFromListOption(option, type)),
    )
  }

  if (type.name === 'datetime') return baseRule.type('Date')
  if (type.name === 'date') return baseRule.type('Date')
  if (type.name === 'url') return baseRule.uri()
  if (type.name === 'slug') return baseRule.custom(slugValidator, {bypassConcurrencyLimit: true})
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

  const defaultUri = new RuleClass(typeDef).uri()._rules.find(isUriSpec)?.constraint
  const isDefaultUri = (spec: RuleSpec) => isUriSpec(spec) && isEqual(spec.constraint, defaultUri)
  const isCustomUri = (spec: RuleSpec) => isUriSpec(spec) && !isEqual(spec.constraint, defaultUri)

  const someElementSetsScheme = rules.some((rule) => rule._rules.some(isCustomUri))
  if (!someElementSetsScheme) return rules

  return rules.map((rule) => {
    if (!rule._rules.some(isDefaultUri)) return rule
    const cleaned = rule.clone()
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

  const baseRule =
    // using an object + Object.values to de-dupe the type chain by type name
    Object.values(
      getTypeChain(typeDef).reduce<Record<string, SchemaType>>((acc, type) => {
        acc[type.name] = type
        return acc
      }, {}),
    ).reduce(baseRuleReducer, new RuleClass(typeDef))

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
