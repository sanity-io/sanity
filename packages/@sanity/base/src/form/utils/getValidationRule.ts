import {SchemaType, RuleSpec, SchemaValidationValue, Rule} from '@sanity/types'

const normalizeRules = (
  validation: SchemaValidationValue | undefined,
  type?: SchemaType
): Rule[] => {
  if (typeof validation === 'function') {
    throw new Error(
      `Schema type "${
        type?.name || '<not-found>'
      }"'s \`validation\` was not run though \`inferFromSchema\``
    )
  }
  if (!validation) return []
  if (Array.isArray(validation)) return validation as Rule[]
  return [validation]
}

/**
 * Finds the first matching validation rule spec from a Rule class instance.
 *
 * @internal
 * Note: This accesses private fields of the rule.
 */
export function getValidationRule<RuleFlag extends RuleSpec['flag']>(
  type: SchemaType | undefined,
  ruleName: RuleFlag
): Extract<RuleSpec, {flag: RuleFlag}> | null {
  for (const rule of normalizeRules(type?.validation, type)) {
    for (const ruleSpec of rule._rules) {
      if (ruleSpec.flag === ruleName) {
        return ruleSpec as Extract<RuleSpec, {flag: RuleFlag}>
      }
    }
  }

  return null
}
