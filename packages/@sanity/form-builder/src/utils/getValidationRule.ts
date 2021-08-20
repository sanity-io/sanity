import {SchemaType, RuleSpec} from '@sanity/types'

/**
 * Finds the first matching validation rule spec from a Rule class instance.
 *
 * @internal
 * Note: This accesses private fields of the rule.
 */
export function getValidationRule<RuleFlag extends RuleSpec['flag']>(
  type: SchemaType | null | undefined,
  ruleName: RuleFlag
): Extract<RuleSpec, {flag: RuleFlag}> | null {
  const validation = type?.validation

  if (typeof validation === 'function') {
    throw new Error(
      `Schema type "${type.name}"'s \`validation\` was not run though \`inferFromSchema\``
    )
  }
  if (!validation) return null

  for (const rule of validation) {
    for (const ruleSpec of rule._rules) {
      if (ruleSpec.flag === ruleName) {
        return ruleSpec as Extract<RuleSpec, {flag: RuleFlag}>
      }
    }
  }

  return null
}
