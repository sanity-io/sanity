import {
  type ArraySchemaType,
  type FieldReference as SchemaFieldReference,
  type ObjectSchemaType,
  type ReferenceSchemaType,
  type Rule as SchemaRule,
  type RuleClass,
  type RuleSpec,
  type SchemaType,
  type SchemaValidationValue,
} from '@sanity/types'

import {OWN_PROPS_NAME} from '../legacy/types/constants'
import {
  type ArrayTypeDef,
  type CommonTypeDef,
  type CoreTypeDef,
  type FieldReference,
  type ObjectField,
  type ReferenceTypeDef,
  type Rule,
  type SubtypeDef,
  type TypeDef,
} from './types'

function convertCommonTypeDef(schemaType: SchemaType, opts: Options): CommonTypeDef {
  // Note that OWN_PROPS_NAME is only set on subtypes, not the core types.
  // We might consider setting OWN_PROPS_NAME on _all_ types to avoid this branch.
  const ownProps = schemaType.type ? (schemaType as any)[OWN_PROPS_NAME] : schemaType

  const rules = opts.validationExtractor(ownProps.validation)

  let fields: ObjectField[] | undefined
  if (Array.isArray(ownProps.fields)) {
    fields = (ownProps.fields as ObjectSchemaType['fields']).map(
      ({name, group, fieldset, type}) => ({
        name,
        typeDef: convertTypeDef(type, opts),
        groups: typeof group === 'string' ? [group] : group,
        fieldset,
      }),
    )
  }

  return {
    title: maybeString(ownProps.title),
    description: maybeString(ownProps.description),
    readOnly: maybeBool(ownProps.readOnly),
    hidden: maybeBool(ownProps.hidden),
    fields,
    validation:
      rules.length > 0
        ? rules.map((rule) => ({
            rules: convertSchemaRuleToRuleSet(rule, opts),
            message: rule._message,
            required: rule._required === 'required' || undefined,
            level: rule._level || 'error',
          }))
        : undefined,
  }
}

export type ValidationExtractor = (validation: SchemaValidationValue) => SchemaRule[]

export type Options = {
  /** A function which converts the `validation` property into a list of rules. */
  validationExtractor: ValidationExtractor

  /** The RuleClass which was used by the validation extractor. */
  ruleClass: RuleClass
}

export function convertTypeDef(schemaType: SchemaType, opts: Options): TypeDef {
  const common = convertCommonTypeDef(schemaType, opts)

  if (!schemaType.type) {
    return {
      extends: null,
      jsonType: schemaType.jsonType,
      ...common,
    } satisfies CoreTypeDef
  }

  // The types below are somewhat magical: It's only direct subtypes of array/reference which
  // are allowed to have of/to assigned to them. We handle them specifically here since this
  // gives us more control over the types.

  switch (schemaType.type.name) {
    case 'array': {
      return {
        extends: 'array',
        of: (schemaType as ArraySchemaType).of.map((ofType) => ({
          name: ofType.name,
          typeDef: convertTypeDef(ofType, opts),
        })),
        ...common,
      } satisfies ArrayTypeDef
    }
    case 'reference':
    case 'globalDocumentReference':
    case 'crossDatasetReference':
      return {
        extends: schemaType.type.name,
        to: (schemaType as ReferenceSchemaType).to
          .map((toType) => toType.name || toType.type?.name)
          .filter<string>((name) => typeof name === 'string'),
        ...common,
      } satisfies ReferenceTypeDef
    default:
      return {extends: schemaType.type.name, ...common} satisfies SubtypeDef
  }
}

function convertRuleSpec(schemaRule: SchemaRule, spec: RuleSpec, opts: Options): Rule | undefined {
  switch (spec.flag) {
    case 'all': {
      const rule: Rule = {type: 'allOf', children: []}
      for (const child of spec.constraint) {
        rule.children.push({
          rules: convertSchemaRuleToRuleSet(child, opts),
          message: child._message,
        })
      }
      return rule
    }
    case 'either': {
      const rule: Rule = {type: 'anyOf', children: []}
      for (const child of spec.constraint) {
        rule.children.push({
          rules: convertSchemaRuleToRuleSet(child, opts),
          message: child._message,
        })
      }
      return rule
    }
    case 'email':
      return {type: 'email'}
    case 'unique':
      return {type: 'uniqueItems'}
    case 'custom':
      return {type: 'custom', optional: schemaRule._required === 'optional' || undefined}
    case 'stringCasing':
      return {type: spec.constraint}
    case 'integer':
      return {type: 'integer'}
    case 'precision':
      return {type: 'precision', value: convertFieldRef(spec.constraint, opts.ruleClass)}
    case 'length':
      return {type: 'length', value: convertFieldRef(spec.constraint, opts.ruleClass)}
    case 'reference':
      return {type: 'reference'}
    case 'assetRequired':
      return {type: 'assetRequired'}
    case 'uri':
      // TODO: support options
      return {type: 'uri'}
    case 'valid':
      // TODO: encode the actual values
      return {type: 'enum', values: []}
    case 'greaterThan':
      return {type: 'exclusiveMinimum', value: convertFieldRef(spec.constraint, opts.ruleClass)}
    case 'lessThan':
      return {type: 'exclusiveMaximum', value: convertFieldRef(spec.constraint, opts.ruleClass)}
    case 'min':
      return {type: 'minimum', value: convertFieldRef(spec.constraint, opts.ruleClass)}
    case 'max':
      return {type: 'maximum', value: convertFieldRef(spec.constraint, opts.ruleClass)}
    case 'regex':
      // TODO: support flags
      return {
        type: 'regex',
        pattern: spec.constraint.pattern.source,
        invert: spec.constraint.invert || undefined,
      }
    case 'presence':
      // These are not encoded in the rule system.
      return undefined
    case 'type':
      if (spec.constraint === 'Date') return {type: 'datetime'}
      // The other types should be represented through JSON type.
      return undefined
    default:
      return undefined
  }
}

function convertFieldRef<T extends string | number>(
  val: T | SchemaFieldReference,
  ruleClass: RuleClass,
): string | FieldReference {
  if (val && typeof val === 'object' && 'type' in val && val.type === ruleClass.FIELD_REF) {
    return {
      type: 'fieldReference',
      path: typeof val.path === 'string' ? [val.path] : val.path,
    }
  }

  return val.toString()
}

function convertSchemaRuleToRuleSet(schemaRule: SchemaRule, opts: Options): Rule[] {
  const result: Rule[] = []
  for (const spec of schemaRule._rules) {
    const rule = convertRuleSpec(schemaRule, spec, opts)
    if (rule) result.push(rule)
  }
  return result
}

function maybeString(val: unknown): string | undefined {
  return typeof val === 'string' ? val : undefined
}

function maybeBool(val: unknown): boolean | undefined {
  return typeof val === 'boolean' ? val : undefined
}
