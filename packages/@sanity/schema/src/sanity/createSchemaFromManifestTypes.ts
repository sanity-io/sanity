import {
  type CustomValidator,
  type MediaValidator,
  type Rule as IRule,
  type RuleTypeConstraint,
  type UriValidationOptions,
} from '@sanity/types'
import {cloneDeep, isObject} from 'lodash'

import {Schema} from '../legacy/Schema'
import {builtinTypes} from './builtinTypes'
import {groupProblems} from './groupProblems'
import {type SchemaValidationResult} from './typedefs'
import {validateSchema} from './validateSchema'
import {ValidationError} from './validation/ValidationError'

const builtinSchema = Schema.compile({
  name: 'studio',
  types: builtinTypes,
})

export function createSchemaFromManifestTypes(schemaDef: {name: string; types: unknown[]}) {
  const validated = validateSchema(schemaDef.types).getTypes()
  const validation = groupProblems(validated)
  const problems = validation.filter((group) =>
    group.problems.some((problem: SchemaValidationResult) => problem.severity === 'error'),
  )

  if (problems.length > 0) {
    throw new ValidationError(problems)
  }

  return Schema.compile({
    name: schemaDef.name,
    types: schemaDef.types.map(coerceType).filter(Boolean),
    parent: builtinSchema,
  })
}

// coerceType attempts to coerce a json schema into a Sanity schema type. This mainly involves
// converting a json normalized rule into an actual '@sanity/schema' Rule.
function coerceType(obj: unknown) {
  if (!isObject(obj)) return undefined
  const typ = cloneDeep(obj)
  traverse(typ)
  return typ
}

function traverse(obj: unknown) {
  if (!isObject(obj)) {
    return
  }

  if (Array.isArray(obj)) {
    obj.forEach(traverse)
    return
  }

  for (const v of Object.values(obj)) {
    traverse(v)
  }

  coerceValidation(obj)
}

// Convert a json rule into a '@sanity/schema' Rule.
function coerceValidation(val: unknown) {
  if (!isObject(val) || !('validation' in val)) return

  // Convert ManifestValidationGroup[] to Rule functions
  const manifestValidation = Array.isArray(val.validation) ? val.validation : [val.validation]

  val.validation = manifestValidation
    .map((group) => {
      if (!isObject(group)) return undefined

      return (baseRule: IRule) => {
        let rule = baseRule
        const level = 'level' in group ? group.level : undefined
        const rules = 'rules' in group ? group.rules : undefined
        const message = 'message' in group ? group.message : undefined

        if (!rules || !Array.isArray(rules)) return undefined

        // Apply level if specified
        if (isValidLevel(level) && (message === undefined || typeof message === 'string')) {
          rule = rule[level](message)
        }

        // Apply each rule in the group
        for (const ruleSpec of rules) {
          rule = applyRuleSpec(rule, ruleSpec)
        }

        return rule
      }
    })
    .filter(Boolean)
}

function coerceConstraintRule(val: unknown): any {
  if (!isObject(val)) return undefined

  if (Array.isArray(val)) {
    return val.map(coerceConstraintRule).filter(Boolean)
  }

  return (baseRule: any) => {
    let rule = baseRule

    const rules = '_rules' in val ? val._rules : undefined
    const level = '_level' in val ? val._level : undefined
    const message = '_message' in val ? val._message : undefined

    if (!rules || !Array.isArray(rules)) return undefined

    // Apply level if specified
    if (typeof level === 'string') {
      rule = rule[level](message)
    }

    // Apply each rule in the group
    for (const ruleSpec of rules) {
      rule = applyRuleSpec(rule, ruleSpec)
    }

    return rule
  }
}

// eslint-disable-next-line complexity
function applyRuleSpec(rule: IRule, ruleSpec: unknown): IRule {
  if (!ruleSpec || typeof ruleSpec !== 'object') {
    return rule
  }

  const flag = 'flag' in ruleSpec ? ruleSpec.flag : undefined
  const constraint = 'constraint' in ruleSpec ? ruleSpec.constraint : undefined

  switch (flag) {
    case 'presence':
      if (constraint === 'required') {
        return rule.required()
      } else if (constraint === 'optional') {
        return rule.optional()
      }
      break

    case 'type':
      if (typeof constraint === 'string') {
        return rule.type(constraint as RuleTypeConstraint)
      }
      break

    case 'min':
      if (typeof constraint === 'number' || typeof constraint === 'string') {
        return rule.min(constraint)
      }
      break

    case 'max':
      if (typeof constraint === 'number' || typeof constraint === 'string') {
        return rule.max(constraint)
      }
      break

    case 'length':
      if (typeof constraint === 'number') {
        return rule.length(constraint)
      }
      break

    case 'integer':
      return rule.integer()

    case 'email':
      return rule.email()

    case 'unique':
      return rule.unique()

    case 'reference':
      return rule.reference()

    case 'precision':
      if (typeof constraint === 'number') {
        return rule.precision(constraint)
      }
      break

    case 'positive':
      return rule.positive()

    case 'negative':
      return rule.negative()

    case 'greaterThan':
      if (typeof constraint === 'number') {
        return rule.greaterThan(constraint)
      }
      break

    case 'lessThan':
      if (typeof constraint === 'number') {
        return rule.lessThan(constraint)
      }
      break

    case 'stringCasing':
      if (constraint === 'uppercase') {
        return rule.uppercase()
      } else if (constraint === 'lowercase') {
        return rule.lowercase()
      }
      break

    case 'valid':
      if (Array.isArray(constraint)) {
        return rule.valid(constraint)
      }
      break

    case 'regex':
      if (
        isObject(constraint) &&
        'pattern' in constraint &&
        (typeof constraint.pattern === 'string' || constraint.pattern instanceof RegExp)
      ) {
        const options: any = {}
        if ('name' in constraint && typeof constraint.name === 'string') {
          options.name = constraint.name
        }
        if ('invert' in constraint) {
          options.invert = constraint.invert
        }
        const pattern =
          typeof constraint.pattern === 'string'
            ? stringToRegExp(constraint.pattern)
            : constraint.pattern
        return rule.regex(pattern, options)
      }
      break

    case 'uri':
      if (isObject(constraint) && 'options' in constraint) {
        return rule.uri(constraint.options as UriValidationOptions)
      }
      break

    case 'assetRequired':
      return rule.assetRequired()

    case 'all':
      return rule.all(coerceConstraintRule(constraint))

    case 'either':
      return rule.either(coerceConstraintRule(constraint))

    case 'custom':
      // When the manifest schema types are serialized, the custom function will be stripped. We add it back here to keep track that
      // a rule did exist at one point.
      if (constraint === undefined) return rule.custom(() => true)
      if (typeof constraint === 'function') return rule.custom(constraint as CustomValidator)
      break

    case 'media':
      // When the manifest schema types are serialized, the custom function will be stripped. We add it back here to keep track that
      // a rule did exist at one point.
      if (constraint === undefined) return rule.media(() => true)
      if (typeof constraint === 'function') return rule.media(constraint as MediaValidator)
      break

    default:
      break
  }

  return rule
}

const isValidLevel = (level: unknown): level is 'error' | 'warning' | 'info' => {
  return !!level && typeof level === 'string' && ['error', 'warning', 'info'].includes(level)
}

function stringToRegExp(str: string): RegExp {
  // RegExp.toString() returns "/pattern/flags"
  const match = str.match(/^\/(.*)\/([gimuy]*)$/)
  if (match) {
    return new RegExp(match[1], match[2])
  }
  // Fallback if the format doesn't match
  return new RegExp(str)
}
