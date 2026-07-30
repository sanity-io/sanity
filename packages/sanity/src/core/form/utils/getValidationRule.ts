import {type Rule, type RuleSpec, type SchemaType, type SchemaValidationValue} from '@sanity/types'

const normalizeRules = (validation: SchemaValidationValue | undefined): Rule[] => {
  // When `typeDef.validation` is a raw function (or an array containing one),
  // it means the schema type uses context-aware validation like
  // `(rule, context) => ...`. `inferFromSchemaType` intentionally defers
  // normalization for those cases because the function needs runtime context
  // (see `hasValidationContext`). The actual validation still runs later
  // through the deferred path.
  //
  // Here, at form-input render time, we can't invoke the function safely
  // (context-dependent branches may throw or return misleading rules), so we
  // treat function entries as "not inspectable" and return no rules for them.
  // Callers get `null` back from `getValidationRule` and degrade to their
  // default rendering (URL input renders without scheme hints, number input
  // renders without min/integer/precision hints, arrays render without a
  // max-items indicator). See sanity-io/sanity#13559.
  if (typeof validation === 'function') return []
  if (!validation) return []
  if (Array.isArray(validation)) {
    return validation.filter((entry): entry is Rule => typeof entry !== 'function')
  }
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
  ruleName: RuleFlag,
): Extract<RuleSpec, {flag: RuleFlag}> | null {
  for (const rule of normalizeRules(type?.validation)) {
    for (const ruleSpec of rule._rules) {
      if (ruleSpec.flag === ruleName) {
        return ruleSpec as Extract<RuleSpec, {flag: RuleFlag}>
      }
    }
  }

  return null
}
