import type {NumberSchemaType, SchemaType, StringSchemaType} from '@sanity/types'
import {Rule as RuleClass} from '../Rule'
import {normalizeValidationRules} from './normalizeValidationRules'

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
