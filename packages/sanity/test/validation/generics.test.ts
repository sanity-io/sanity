import {getFallbackLocaleSource} from '../../src/core/i18n/fallback'
import {Rule} from '../../src/core/validation'

const context: any = {client: {}, i18n: getFallbackLocaleSource()}

describe('generics', () => {
  test('should be able to construct an empty rule', () => {
    expect(() => new Rule()).not.toThrow(Error)
    expect(new Rule()).toBeInstanceOf(Rule)
  })

  test('should be able to construct a new typed rule', () => {
    expect(Rule.string()).toBeInstanceOf(Rule)
  })

  test('clones rule when changing generics', () => {
    const baseRule = new Rule()
    const typed = baseRule.type('string')
    expect(baseRule).not.toBe(typed)
  })

  test('clones rule when changing type-specific rules', () => {
    const baseRule = Rule.string()
    const specific = baseRule.min(5)
    expect(baseRule).not.toBe(specific)
  })

  test('returns arrays of errors/warnings by default', async () => {
    await expect(Rule.string().validate(123, context)).resolves.toMatchSnapshot()
  })

  test('can demote errors to warnings', async () => {
    const result = await Rule.string().warning().validate(123, context)

    expect(result).toMatchSnapshot()
  })

  test('can customize error messages', async () => {
    const result = await Rule.string().error('Dude it needs to be a string').validate(123, context)

    expect(result).toMatchSnapshot()
  })

  test('can customize warning messages', async () => {
    const result = await Rule.string()
      .warning('Dude it should probably be a string')
      .validate(123, context)

    expect(result).toMatchSnapshot()
  })

  test('can customize info messages', async () => {
    const result = await Rule.string()
      .info('Dude it should probably be a string')
      .validate(123, context)

    expect(result).toMatchSnapshot()
  })

  test('can merge rules', async () => {
    const rule = new Rule().required()
    const stringRule = Rule.string().min(5)
    const newRule = rule.merge(stringRule)

    expect(rule).not.toBe(stringRule)
    expect(newRule).not.toBe(stringRule)
    expect(rule).not.toBe(newRule)

    const result = await newRule.validate('Hei', context)
    expect(result).toMatchSnapshot()
  })

  test('can merge rules', () => {
    expect(new Rule().required().isRequired()).toBe(true)
    expect(new Rule().isRequired()).toBe(false)
    expect(new Rule().optional().isRequired()).toBe(false)
  })
})
