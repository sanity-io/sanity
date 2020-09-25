import {SchemaType} from '@sanity/types'

interface Rule {
  _rules: RuleSpec[]
}

interface RuleSpec {
  flag: string
  constraint?: unknown
}

// Note: consider this "internals"
export function getValidationRule<T = SchemaType>(
  type: T & {validation?: Rule[]},
  ruleName: string
): RuleSpec | null {
  if (!type || !type.validation || !type.validation.length) {
    return null
  }

  for (let i = 0; i < type.validation.length; i++) {
    const validation = type.validation[i]
    if (!validation || !validation._rules) {
      continue
    }

    for (let r = 0; r < validation._rules.length; r++) {
      const rule = validation._rules[r]
      if (rule.flag === ruleName) {
        return rule
      }
    }
  }

  return null
}
