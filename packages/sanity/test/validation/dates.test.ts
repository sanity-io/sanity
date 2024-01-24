import {getFallbackLocaleSource} from '../../src/core/i18n/fallback'
import {Rule} from '../../src/core/validation'

describe('date', () => {
  const context: any = {client: {}, i18n: getFallbackLocaleSource(), type: {name: 'date'}}

  test('min length constraint', async () => {
    const rule = Rule.dateTime().min('2024-01-01')
    await expect(rule.validate('2023-12-31', context)).resolves.toMatchSnapshot(
      'Must be at or after',
    )
    await expect(rule.validate('2024-01-02', context)).resolves.toMatchSnapshot('min length: valid')
    await expect(rule.validate('2024-01-01', context)).resolves.toMatchSnapshot('min length: valid')
  })

  test('max length constraint', async () => {
    const rule = Rule.dateTime().max('2024-01-01')
    await expect(rule.validate('2024-01-02', context)).resolves.toMatchSnapshot(
      'Must be at or before',
    )
    await expect(rule.validate('2023-12-31', context)).resolves.toMatchSnapshot('max length: valid')
    await expect(rule.validate('2024-01-01', context)).resolves.toMatchSnapshot('max length: valid')
  })
})

describe('date with custom format', () => {
  const context: any = {
    client: {},
    i18n: getFallbackLocaleSource(),
    type: {name: 'date', options: {dateFormat: 'MM-DD-YYYY'}},
  }

  test('min length constraint', async () => {
    const rule = Rule.dateTime().min('2024-01-01')
    await expect(rule.validate('2023-12-31', context)).resolves.toMatchSnapshot(
      'Must be at or after',
    )
    await expect(rule.validate('2024-01-02', context)).resolves.toMatchSnapshot('min length: valid')
    await expect(rule.validate('2024-01-01', context)).resolves.toMatchSnapshot('min length: valid')
  })

  test('max length constraint', async () => {
    const rule = Rule.dateTime().max('2024-01-01')
    await expect(rule.validate('2024-01-02', context)).resolves.toMatchSnapshot(
      'Must be at or before',
    )
    await expect(rule.validate('2023-12-31', context)).resolves.toMatchSnapshot('max length: valid')
    await expect(rule.validate('2024-01-01', context)).resolves.toMatchSnapshot('max length: valid')
  })
})
