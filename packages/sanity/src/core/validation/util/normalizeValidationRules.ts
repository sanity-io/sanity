import type {SchemaType, Rule, RuleTypeConstraint} from '@sanity/types'
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

function getTypeChain(type: SchemaType | undefined, visited: Set<SchemaType>): SchemaType[] {
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
  if (type.name === 'slug') return baseRule.custom(slugValidator)
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

/**
 * Takes in `SchemaValidationValue` and returns an array of `Rule` instances.
 */
export function normalizeValidationRules(typeDef: SchemaType | undefined): Rule[] {
  if (!typeDef) {
    return []
  }

  const validation = typeDef.validation

  if (Array.isArray(validation)) {
    return validation.flatMap((i) =>
      normalizeValidationRules({
        ...typeDef,
        validation: i,
      }),
    )
  }

  if (validation instanceof RuleClass) {
    return [validation]
  }

  const baseRule =
    // using an object + Object.values to de-dupe the type chain by type name
    Object.values(
      getTypeChain(typeDef, new Set()).reduce<Record<string, SchemaType>>((acc, type) => {
        acc[type.name] = type
        return acc
      }, {}),
    ).reduce(baseRuleReducer, new RuleClass(typeDef))

  if (!validation) {
    return [baseRule]
  }

  return normalizeValidationRules({
    ...typeDef,
    validation: validation(baseRule),
  })
}
