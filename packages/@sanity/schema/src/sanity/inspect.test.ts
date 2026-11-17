import {describe, expect, test} from 'vitest'

import inspect from './inspect'
import {validateField} from './validation/types/object'
import {validateComponent} from './validation/utils/validateComponent'

describe('inspect', () => {
  test.each([
    [undefined, 'undefined'],
    [null, 'null'],
    [true, 'true'],
    [42, '42'],
    [NaN, 'NaN'],
    [Infinity, 'Infinity'],
    [-0, '-0'],
    [42n, '42n'],
    [Symbol('input'), 'Symbol(input)'],
    ['line\n"quoted"', '"line\\n\\"quoted\\""'],
    [[], '[]'],
    [{}, '{}'],
  ])('formats %s without losing its type', (value, expected) => {
    expect(inspect(value)).toBe(expected)
  })

  test('keeps component export names visible', () => {
    function Input() {}
    expect(inspect({Input})).toBe('{ Input: [Function: Input] }')
  })

  test('keeps non-JSON values in arrays and objects', () => {
    expect(inspect({values: [undefined, 42n, Symbol('input')]})).toBe(
      '{ values: [ undefined, 42n, Symbol(input) ] }',
    )
  })

  test('identifies built-in objects used in place of schema values', () => {
    expect(inspect(new Date('invalid'))).toBe('Invalid Date')
    expect(inspect(/input/i)).toBe('/input/i')
    expect(inspect(new Map([['input', 1]]))).toBe('[Map]')
    expect(inspect(new Set(['input']))).toBe('[Set]')
  })

  test('distinguishes cycles from repeated references', () => {
    const shared = {value: 1}
    const cyclic: Record<string, unknown> = {first: shared, second: shared}
    cyclic.self = cyclic
    expect(inspect(cyclic)).toBe('{ first: { value: 1 }, second: { value: 1 }, self: [Circular] }')
    const array: unknown[] = []
    array.push(array)
    expect(inspect(array)).toBe('[ [Circular] ]')
  })

  test('does not execute getters or custom serialization methods', () => {
    const value = {
      get input() {
        throw new Error('Getter should not run')
      },
      inspect() {
        throw new Error('Custom inspector should not run')
      },
      toJSON() {
        throw new Error('JSON serializer should not run')
      },
    }
    expect(inspect(value)).toBe(
      '{ input: [Getter], inspect: [Function: inspect], toJSON: [Function: toJSON] }',
    )
  })

  test('bounds deeply nested values', () => {
    let value: unknown = 'leaf'
    for (let i = 0; i < 100; i++) value = {nested: value}
    const result = inspect(value)
    expect(result).toContain('[Object]')
    expect(result.length).toBeLessThan(200)
  })

  test('bounds large arrays, objects and strings', () => {
    expect(inspect(Array.from({length: 1_000}, (_, i) => i)).length).toBeLessThan(200)
    expect(
      inspect(Object.fromEntries(Array.from({length: 1_000}, (_, i) => [`key${i}`, i]))).length,
    ).toBeLessThan(300)
    expect(inspect('a'.repeat(10_000)).length).toBeLessThan(500)
    expect(inspect('a'.repeat(10_000))).toContain('...')
  })
})

describe('schema diagnostics', () => {
  test.each(['input', 'field', 'item', 'preview'])(
    'shows exports for an invalid %s component',
    (component) => {
      function Input() {}
      const problems = validateComponent({components: {[component]: {Input}}})
      expect(problems).toEqual([
        expect.objectContaining({
          severity: 'warning',
          message: expect.stringContaining('{ Input: [Function: Input] }'),
        }),
      ])
    },
  )

  test('formats invalid field names and definitions', () => {
    expect(validateField({name: 42n}, {})).toEqual([
      expect.objectContaining({
        severity: 'error',
        helpId: 'schema-object-fields-invalid',
        message: expect.stringContaining('42n'),
      }),
    ])
    expect(validateField([undefined, Symbol('field')], {})).toEqual([
      expect.objectContaining({
        severity: 'error',
        helpId: 'schema-object-fields-invalid',
        message: expect.stringContaining('[ undefined, Symbol(field) ]'),
      }),
    ])
  })
})
