import {type Rule, type RuleSpec, type SchemaType} from '@sanity/types'

import {normalizeValidationRules} from '../../validation/util/normalizeValidationRules'

const isRuleInstance = (validation: unknown): validation is Rule =>
  typeof validation === 'object' && validation !== null && '_rules' in validation

const deferredRules = new WeakMap<SchemaType, Rule[]>()

/**
 * Resolves the rules of a type whose `validation` schema compilation left un-normalized.
 *
 * `inferFromSchemaType` only normalizes validation that doesn't declare a `context` parameter,
 * since context-aware validation has to be re-evaluated per value while validating a document.
 * The rules read here are static input hints, so they're resolved without a context — which is
 * what schema compilation did for every validation function before context support was added.
 */
function resolveDeferredRules(type: SchemaType): Rule[] {
  const cached = deferredRules.get(type)
  if (cached) return cached

  let rules: Rule[]
  try {
    rules = normalizeValidationRules(type)
  } catch {
    // Validation that dereferences `context` unconditionally can only be evaluated while
    // validating a document, so it cannot contribute any input hints.
    rules = []
  }

  deferredRules.set(type, rules)
  return rules
}

function getRules(type: SchemaType | undefined): Rule[] {
  const validation = type?.validation
  if (!type || !validation) return []
  if (Array.isArray(validation)) {
    return validation.every(isRuleInstance) ? validation : resolveDeferredRules(type)
  }
  return isRuleInstance(validation) ? [validation] : resolveDeferredRules(type)
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
  for (const rule of getRules(type)) {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    for (const ruleSpec of rule._rules) {
      if (ruleSpec.flag === ruleName) {
        return ruleSpec as Extract<RuleSpec, {flag: RuleFlag}>
      }
    }
  }

  return null
}
