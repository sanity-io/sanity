import {type NumberSchemaType, type SchemaType, type StringSchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {Rule as RuleClass} from '../../../src/core/validation'
import {normalizeValidationRules} from '../../../src/core/validation/util/normalizeValidationRules'

describe('normalizeValidationRules', () => {
  // see `infer.test.ts` for more related tests.
  // note the Schema.compile runs this function indirectly via `inferFromSchema`
  it('utilizes schema types to infer base rules', () => {
    const coolNumberType: NumberSchemaType = {
      jsonType: 'number',
      name: 'coolNumber',
    }

    const rules = normalizeValidationRules(coolNumberType)
    expect(rules).toHaveLength(1)
    const [rule] = rules

    expect(rule).toBeInstanceOf(RuleClass)
    expect(rule._rules).toMatchObject([
      {
        constraint: 'Number',
        flag: 'type',
      },
    ])
  })

  it('follows the type chain to determine the base rule', () => {
    const sickDatetime = {
      type: {
        type: {
          jsonType: 'string',
        },
        name: 'datetime',
      },
      name: 'sickDatetime',
    }

    const rules = normalizeValidationRules(sickDatetime as SchemaType)
    expect(rules).toHaveLength(1)
    const [rule] = rules

    // type chain is applied from inner to outer so the resulting type should be
    // date instead of string
    expect(rule._rules).toMatchObject([
      {
        constraint: 'Date',
        flag: 'type',
      },
    ])
  })

  it('converts a validation function to a rule instance', () => {
    const coolStringType: StringSchemaType = {
      jsonType: 'string',
      name: 'coolString',
      validation: (rule) => rule.uppercase(),
    }

    const rules = normalizeValidationRules(coolStringType)
    expect(rules).toHaveLength(1)
    const [rule] = rules

    expect(rule).toBeInstanceOf(RuleClass)
    expect(rule._rules).toMatchObject([
      {
        constraint: 'String',
        flag: 'type',
      },
      {
        constraint: 'uppercase',
        flag: 'stringCasing',
      },
    ])
  })

  it('converts falsy values to an empty array', () => {
    expect(normalizeValidationRules(undefined)).toEqual([])
  })

  it('converts schema list options with titles to `rule.valid` constraints', () => {
    const stringTypeWithOptions: StringSchemaType = {
      jsonType: 'string',
      name: 'stringTypeWithOptions',
      options: {
        list: [
          {title: 'Blue', value: 'blue'},
          {title: 'Red', value: 'red'},
        ],
      },
    }

    const rules = normalizeValidationRules(stringTypeWithOptions)
    expect(rules).toHaveLength(1)
    const [rule] = rules

    expect(rule).toBeInstanceOf(RuleClass)
    expect(rule._rules).toMatchObject([
      {
        constraint: 'String',
        flag: 'type',
      },
      {
        constraint: ['blue', 'red'],
        flag: 'valid',
      },
    ])
  })

  it('converts schema list options with strings only to `rule.valid` constraints', () => {
    const stringTypeWithOptions: StringSchemaType = {
      jsonType: 'string',
      name: 'stringTypeWithOptions',
      options: {
        list: ['blue', 'red'],
      },
    }

    const rules = normalizeValidationRules(stringTypeWithOptions)
    expect(rules).toHaveLength(1)
    const [rule] = rules

    expect(rule).toBeInstanceOf(RuleClass)
    expect(rule._rules).toMatchObject([
      {
        constraint: 'String',
        flag: 'type',
      },
      {
        constraint: ['blue', 'red'],
        flag: 'valid',
      },
    ])
  })

  it('converts arrays of validation', () => {
    const coolNumberType: NumberSchemaType = {
      jsonType: 'number',
      name: 'coolNumber',
      validation: [(rule) => rule.greaterThan(3), RuleClass.number().lessThan(5)],
    }

    const rules = normalizeValidationRules(coolNumberType)
    expect(rules).toHaveLength(2)
    const [first, second] = rules

    expect(first).toBeInstanceOf(RuleClass)
    expect(first._rules).toMatchObject([
      {
        constraint: 'Number',
        flag: 'type',
      },
      {
        constraint: 3,
        flag: 'greaterThan',
      },
    ])

    expect(second).toBeInstanceOf(RuleClass)
    expect(second._rules).toMatchObject([
      {
        constraint: 'Number',
        flag: 'type',
      },
      {
        constraint: 5,
        flag: 'lessThan',
      },
    ])
  })
})

describe('Rule.skip()', () => {
  it('clears all validation rules', () => {
    const rule = RuleClass.string().required().min(5).max(100)

    expect(rule._rules.length).toBeGreaterThan(1)
    expect(rule._required).toBe('required')

    const skipped = rule.skip()

    expect(skipped._rules).toEqual([])
    expect(skipped._required).toBe('optional')
    expect(skipped._message).toBeUndefined()
    expect(skipped._level).toBe('error')
    expect(skipped._fieldRules).toBeUndefined()
  })

  it('returns a new Rule instance (does not mutate original)', () => {
    const original = RuleClass.number().required().greaterThan(0)
    const originalRulesLength = original._rules.length

    const skipped = original.skip()

    // Original should be unchanged
    expect(original._rules.length).toBe(originalRulesLength)
    expect(original._required).toBe('required')

    // Skipped should be cleared
    expect(skipped._rules).toEqual([])
    expect(skipped._required).toBe('optional')
    expect(skipped).not.toBe(original)
  })

  it('can be used conditionally in validation functions', () => {
    const schema: StringSchemaType = {
      jsonType: 'string',
      name: 'conditionalString',
      validation: (rule) => {
        const shouldSkip = true
        return shouldSkip ? rule.skip() : rule.required().min(5)
      },
    }

    const rules = normalizeValidationRules(schema)
    expect(rules).toHaveLength(1)
    const [rule] = rules

    expect(rule._rules).toEqual([])
    expect(rule._required).toBe('optional')
  })
})

describe('union validation rules', () => {
  const unionType = {
    name: 'promotion',
    jsonType: 'object',
    unionKind: 'object',
    // eslint-disable-next-line camelcase
    __experimental_union: true,
    of: [],
  } as unknown as SchemaType

  it('does not infer an Object type rule for unions', () => {
    const rules = normalizeValidationRules(unionType)

    expect(rules).toHaveLength(1)
    expect(rules[0]._rules).toEqual([])
  })

  it('allows required, optional, skip, and custom on unions', () => {
    const rules = normalizeValidationRules({
      ...unionType,
      validation: (rule: any) => [
        rule.required(),
        rule.optional(),
        rule.skip(),
        rule.custom(() => true),
      ],
    })

    expect(rules.map((rule) => rule._rules)).toEqual([
      [{flag: 'presence', constraint: 'required'}],
      [{flag: 'presence', constraint: 'optional'}],
      [],
      [{flag: 'custom', constraint: expect.any(Function)}],
    ])
  })

  it('throws when union validation uses object field rules', () => {
    expect(() =>
      normalizeValidationRules({
        ...unionType,
        validation: (rule: any) => rule.fields({title: (fieldRule: any) => fieldRule.required()}),
      }),
    ).toThrow('fields() can only be called on an object type')
  })

  it('throws when union validation uses unsupported rule flags', () => {
    expect(() =>
      normalizeValidationRules({
        ...unionType,
        validation: (rule: any) => rule.min(1),
      }),
    ).toThrow(
      'Union schema type "promotion" only supports required(), optional(), skip(), and custom() validation rules',
    )
  })

  it('throws when union validation is a direct rule with unsupported flags', () => {
    expect(() =>
      normalizeValidationRules({
        ...unionType,
        validation: RuleClass.number().min(1),
      }),
    ).toThrow(
      'Union schema type "promotion" only supports required(), optional(), skip(), and custom() validation rules',
    )
  })

  it('throws when union validation is a direct object rule with fields', () => {
    expect(() =>
      normalizeValidationRules({
        ...unionType,
        validation: RuleClass.object().fields({
          title: (fieldRule: any) => fieldRule.required(),
        }),
      }),
    ).toThrow(
      'Union schema type "promotion" only supports required(), optional(), skip(), and custom() validation rules',
    )
  })
})
