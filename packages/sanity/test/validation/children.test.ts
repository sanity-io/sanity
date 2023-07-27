import {getFallbackLocaleSource} from '../../src/core/i18n/fallback'
import {Rule} from '../../src/core/validation'

const context: any = {client: {}, i18n: getFallbackLocaleSource()}

describe('child rules', () => {
  // --- ALL ---
  test('all() rules - single failure', async () => {
    const rule = Rule.string().all([
      Rule.string()
        .regex(/^[A-Z]/)
        .error('Must start with an uppercase character'),
      Rule.string()
        .regex(/[a-z]+/)
        .error('Must follow with lowercase characters'),
    ])

    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot('all() rules - match')
    await expect(rule.validate('moop', context)).resolves.toMatchSnapshot(
      'all() rules - single failure, custom message',
    )
  })

  test('all() rules - multiple failures', async () => {
    const rule = Rule.string().all([
      Rule.string()
        .regex(/^[A-Z]/)
        .error('Must start with an uppercase character'),
      Rule.string().min(5).error('5 chars or more'),
      Rule.string()
        .regex(/[a-z]+/)
        .error('Must follow with lowercase characters'),
    ])

    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot('all() rules - match')
    await expect(rule.validate('moop', context)).resolves.toMatchSnapshot(
      'all() rules - multiple failures, custom messages',
    )
  })

  test('all() rules - single failure, custom, common error', async () => {
    const rule = Rule.string()
      .all([Rule.string().regex(/^[A-Z]/), Rule.string().regex(/[a-z]+/)])
      .error('Needs to start with a capital letter and then follow with lowercase characters')

    await expect(rule.validate('moop', context)).resolves.toMatchSnapshot(
      'all() rules - single failure, common error',
    )
  })

  test('all() rules - single failure, custom, common error', async () => {
    const rule = Rule.string()
      .all([Rule.string().regex(/^[A-Z]/), Rule.string().min(5), Rule.string().regex(/[a-z]+/)])
      .error('Needs to be a capital letter followed by at least 4 lowercase characters')

    await expect(rule.validate('moop', context)).resolves.toMatchSnapshot(
      'all() rules - multiple failures, common error',
    )
  })

  // --- EITHER ---
  test('either() rules - single failure', async () => {
    const rule = Rule.string().either([
      Rule.string()
        .regex(/^rgb(\d+,\s*\d+,\s*\d+)$/)
        .error('Must be rgb(num, num, num) format'),
      Rule.string()
        .regex(/^#([a-f0-9]{3}|[a-f0-9]{6})$/)
        .error('Must be hex color with #-prefix'),
    ])

    await expect(rule.validate('rgb(16, 22, 133)', context)).resolves.toMatchSnapshot(
      'either() rules - match',
    )
    await expect(rule.validate('#bf', context)).resolves.toMatchSnapshot(
      'either() rules - single failure, custom message',
    )
  })

  test('either() rules - all matches', async () => {
    const rule = Rule.string().either([
      Rule.string().regex(/^R/).error('Must start with a capital R'),
      Rule.string().regex(/ed$/).error('Must end with "ed"'),
    ])

    await expect(rule.validate('Red', context)).resolves.toMatchSnapshot(
      'either() rules - all match',
    )
    await expect(rule.validate('nope', context)).resolves.toMatchSnapshot(
      'either() rules - no matches',
    )
  })

  test('either() rules - all fail, custom, common error', async () => {
    const rule = Rule.string()
      .either([Rule.string().regex(/^[A-Z]/), Rule.string().regex(/^i[A-Z]/)])
      .error("Needs to start with a capital letter, unless it's an iProduct")

    await expect(rule.validate('mopatis!', context)).resolves.toMatchSnapshot(
      'either() rules - all fail, common error',
    )
  })
})
