import {type SchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {getValidationRule} from '../getValidationRule'

/**
 * Regression tests for https://github.com/sanity-io/sanity/issues/13559
 *
 * Two-argument validation functions like `(rule, context) => ...` are intentionally
 * left un-normalized by `inferFromSchemaType` (they need runtime context). When the
 * form layer later calls `getValidationRule` at render time, it must not throw — it
 * should just return `null` for the requested rule and let the input degrade to its
 * default rendering. Runtime validation still runs normally via the deferred path.
 */
describe('getValidationRule', () => {
  it('returns null when the schema type has no validation', () => {
    const type = {name: 'foo'} as unknown as SchemaType
    expect(getValidationRule(type, 'uri')).toBeNull()
  })

  it('returns null when the type is undefined', () => {
    expect(getValidationRule(undefined, 'uri')).toBeNull()
  })

  it('does not throw when validation is a raw function (context-aware, arity >= 2)', () => {
    // This mimics what `inferFromSchemaType` leaves on a schema type whose
    // `validation` is `(rule, context) => rule.required().uri({scheme: ['https']})`.
    // The function is intentionally not normalized; the form-input layer must
    // handle it without throwing.
    const type = {
      name: 'twoArgUrl',
      validation: (rule: unknown, _context: unknown) => rule,
    } as unknown as SchemaType

    expect(() => getValidationRule(type, 'uri')).not.toThrow()
    expect(getValidationRule(type, 'uri')).toBeNull()
  })

  it('does not throw when validation is a single-arg function that was somehow left un-normalized', () => {
    // Defensive: even a one-arg function should not throw. Callers who need to
    // inspect rule flags will just get `null`.
    const type = {
      name: 'oneArg',
      validation: (rule: unknown) => rule,
    } as unknown as SchemaType

    expect(() => getValidationRule(type, 'min')).not.toThrow()
    expect(getValidationRule(type, 'min')).toBeNull()
  })

  it('does not throw when validation is an array containing a raw function', () => {
    // hasValidationContext recurses through arrays, so an array with any 2-arg
    // function will also leave the whole array un-normalized on the type.
    const type = {
      name: 'arrayTwoArg',
      validation: [(rule: unknown, _context: unknown) => rule],
    } as unknown as SchemaType

    expect(() => getValidationRule(type, 'max')).not.toThrow()
    expect(getValidationRule(type, 'max')).toBeNull()
  })
})
