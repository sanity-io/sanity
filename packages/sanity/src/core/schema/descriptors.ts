import {DescriptorConverter} from '@sanity/schema/_internal'
import {type Rule, type SchemaValidationValue} from '@sanity/types'

import {Rule as RuleClass} from '../validation/Rule'

export const DESCRIPTOR_CONVERTER = new DescriptorConverter({
  ruleClass: RuleClass,
  validationExtractor: normalizeValidationValue,
})

function normalizeValidationValue(validation: SchemaValidationValue): Rule[] {
  if (!validation) return []

  if (Array.isArray(validation)) {
    return validation.flatMap((inner) => normalizeValidationValue(inner))
  } else if (typeof validation === 'object') {
    return [validation]
  }
  return normalizeValidationValue(validation(new RuleClass()))
}
