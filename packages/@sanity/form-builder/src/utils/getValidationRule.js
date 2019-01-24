import type {Type} from '../typedefs'

export function getValidationRule(type: Type, ruleName: string) {
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
