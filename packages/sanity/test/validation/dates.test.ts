import {describe, expect, test} from 'vitest'

import {getFallbackLocaleSource} from '../../src/core/i18n/fallback'
import {Rule} from '../../src/core/validation/Rule'

describe('date', () => {
  describe('with default format', () => {
    const context: any = {client: {}, i18n: getFallbackLocaleSource(), type: {name: 'date'}}

    test('min length constraint', async () => {
      const rule = Rule.dateTime().min('2024-01-01')
      await expect(rule.validate('2023-12-31', context)).resolves.toMatchSnapshot(
        'Must be at or after',
      )
      await expect(rule.validate('2024-01-02', context)).resolves.toHaveLength(0)
      await expect(rule.validate('2024-01-01', context)).resolves.toHaveLength(0)
    })

    test('max length constraint', async () => {
      const rule = Rule.dateTime().max('2024-01-01')
      await expect(rule.validate('2024-01-02', context)).resolves.toMatchSnapshot(
        'Must be at or before',
      )
      await expect(rule.validate('2023-12-31', context)).resolves.toHaveLength(0)
      await expect(rule.validate('2024-01-01', context)).resolves.toHaveLength(0)
    })
  })

  describe('with custom format', () => {
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
      await expect(rule.validate('2024-01-02', context)).resolves.toHaveLength(0)
      await expect(rule.validate('2024-01-01', context)).resolves.toHaveLength(0)
    })

    test('max length constraint', async () => {
      const rule = Rule.dateTime().max('2024-01-01')
      await expect(rule.validate('2024-01-02', context)).resolves.toMatchSnapshot(
        'Must be at or before',
      )
      await expect(rule.validate('2023-12-31', context)).resolves.toHaveLength(0)
      await expect(rule.validate('2024-01-01', context)).resolves.toHaveLength(0)
    })
  })
})

describe('datetime', () => {
  describe('with default format', () => {
    const context: any = {client: {}, i18n: getFallbackLocaleSource(), type: {name: 'datetime'}}

    test('min length constraint', async () => {
      const rule = Rule.dateTime().min('2024-01-01T17:31:00.000Z')
      await expect(rule.validate('2023-12-31T17:31:00.000Z', context)).resolves.toMatchSnapshot(
        'Must be at or after',
      )
      await expect(rule.validate('2024-01-02T17:31:00.000Z', context)).resolves.toHaveLength(0)
      await expect(rule.validate('2024-01-01T17:31:00.000Z', context)).resolves.toHaveLength(0)
    })

    test('max length constraint', async () => {
      const rule = Rule.dateTime().max('2024-01-01T17:31:00.000Z')
      await expect(rule.validate('2024-01-02T17:31:00.000Z', context)).resolves.toMatchSnapshot(
        'Must be at or before',
      )
      await expect(rule.validate('2023-12-23T17:31:00.000Z', context)).resolves.toHaveLength(0)
      await expect(rule.validate('2024-01-01T17:31:00.000Z', context)).resolves.toHaveLength(0)
    })
  })

  describe('with custom format', () => {
    const context: any = {
      client: {},
      i18n: getFallbackLocaleSource(),
      type: {name: 'datetime', options: {dateFormat: 'Do. MMMM YYYY'}},
    }

    test('min length constraint', async () => {
      const rule = Rule.dateTime().min('2024-01-01T17:31:00.000Z')
      await expect(rule.validate('2023-12-31T17:31:00.000Z', context)).resolves.toMatchSnapshot(
        'Must be at or after',
      )
      await expect(rule.validate('2024-01-02T17:31:00.000Z', context)).resolves.toHaveLength(0)
      await expect(rule.validate('2024-01-01T17:31:00.000Z', context)).resolves.toHaveLength(0)
    })

    test('max length constraint', async () => {
      const rule = Rule.dateTime().max('2024-01-01T17:31:00.000Z')
      await expect(rule.validate('2024-01-02T17:31:00.000Z', context)).resolves.toMatchSnapshot(
        'Must be at or before',
      )
      await expect(rule.validate('2023-12-31T17:31:00.000Z', context)).resolves.toHaveLength(0)
      await expect(rule.validate('2024-01-01T17:31:00.000Z', context)).resolves.toHaveLength(0)
    })
  })
})
