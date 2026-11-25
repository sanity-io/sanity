import {type Rule, type Schema, type SchemaType} from 'sanity'

import {type NumberRules} from './paramInference'

function isRule(value: unknown): value is Rule {
  return typeof value === 'object' && value !== null && '_rules' in value
}

/** The type of the field at `path` of a document type, through object fields */
function fieldType(schema: Schema, documentType: string, path: string[]): SchemaType | undefined {
  let type = schema.get(documentType)
  for (const name of path) {
    const fields = type && 'fields' in type ? type.fields : undefined
    type = fields?.find((field) => field.name === name)?.type
  }
  return type
}

/**
 * The `min`, `max`, `integer` and `precision` rules of a number field, the ones Studio's number
 * input reads too. Validation that schema compilation left as a function (it reads `context`) is
 * evaluated per document, so it bounds nothing here; a bound that refers to another field neither.
 * A number field without rules has none (`{}`); a path that is no number field has `undefined`.
 */
export function getNumberRules(
  schema: Schema,
  documentType: string,
  path: string[],
): NumberRules | undefined {
  const type = fieldType(schema, documentType, path)
  if (type?.jsonType !== 'number') return undefined
  const rules: NumberRules = {}
  // The field's own rules come first, then those of the types it extends
  for (let current: SchemaType | undefined = type; current; current = current.type) {
    const {validation} = current
    const list: unknown[] = Array.isArray(validation) ? validation : [validation]
    for (const rule of list) {
      if (!isRule(rule)) continue
      // oxlint-disable-next-line typescript/no-deprecated -- the specs are only on this field, as for Studio's number input
      for (const spec of rule._rules) {
        // Validation runs every rule, so the strictest of several bounds is the one that holds
        if (spec.flag === 'integer') rules.integer = true
        else if (spec.flag === 'min' && typeof spec.constraint === 'number')
          rules.min = Math.max(rules.min ?? -Infinity, spec.constraint)
        else if (spec.flag === 'max' && typeof spec.constraint === 'number')
          rules.max = Math.min(rules.max ?? Infinity, spec.constraint)
        else if (spec.flag === 'precision' && typeof spec.constraint === 'number')
          rules.precision = Math.min(rules.precision ?? Infinity, spec.constraint)
      }
    }
  }
  return rules
}
