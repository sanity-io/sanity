import {type ValidationSuggestedFix} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {getFallbackLocaleSource, Rule} from '../src/_internal'

const context: any = {client: {}, i18n: getFallbackLocaleSource(), path: ['redirect']}

const removeTrailingSlash: ValidationSuggestedFix = {
  type: 'set',
  title: 'Remove trailing slash',
  value: '/about',
}

describe('suggested fixes', () => {
  test('are carried from a custom validator result onto the marker', async () => {
    const result = await Rule.string()
      .custom(() => ({
        message: 'Destination must not end with a slash',
        suggestedFixes: [removeTrailingSlash],
      }))
      .validate('/about/', context)

    expect(result).toEqual([
      expect.objectContaining({
        message: 'Destination must not end with a slash',
        path: ['redirect'],
        suggestedFixes: [removeTrailingSlash],
      }),
    ])
  })

  test('target the relative path the validator reported', async () => {
    const result = await Rule.object()
      .custom(() => ({
        message: 'Destination must not end with a slash',
        path: ['destination'],
        suggestedFixes: [removeTrailingSlash, {type: 'unset', title: 'Clear destination'}],
      }))
      .validate({destination: '/about/'}, context)

    expect(result).toEqual([
      expect.objectContaining({
        path: ['redirect', 'destination'],
        suggestedFixes: [removeTrailingSlash, {type: 'unset', title: 'Clear destination'}],
      }),
    ])
  })

  test('keep only well-formed entries', async () => {
    const result = await Rule.string()
      .custom(() => ({
        message: 'Invalid',
        suggestedFixes: [
          removeTrailingSlash,
          // A set fix without a value, an unknown type and a missing title are dropped
          {type: 'set', title: 'No value'},
          {type: 'insert', title: 'Unknown', value: 'x'},
          {type: 'unset'},
        ] as ValidationSuggestedFix[],
      }))
      .validate('/about/', context)

    expect(result[0]?.suggestedFixes).toEqual([removeTrailingSlash])
  })

  test('are dropped for document-level markers, which a fix would replace entirely', async () => {
    const validator = () => ({message: 'Invalid', suggestedFixes: [removeTrailingSlash]})

    const [documentMarker] = await Rule.object()
      .custom(validator)
      .validate({}, {...context, path: []})
    const [fieldMarker] = await Rule.object()
      .custom(() => ({...validator(), path: ['destination']}))
      .validate({}, {...context, path: []})

    expect(documentMarker).not.toHaveProperty('suggestedFixes')
    expect(fieldMarker).toEqual(
      expect.objectContaining({path: ['destination'], suggestedFixes: [removeTrailingSlash]}),
    )
  })

  test('are omitted from markers when a validator suggests none', async () => {
    const [withoutFixes] = await Rule.string()
      .custom(() => 'Invalid')
      .validate('x', context)
    const [withEmptyFixes] = await Rule.string()
      .custom(() => ({message: 'Invalid', suggestedFixes: []}))
      .validate('x', context)

    expect(withoutFixes).not.toHaveProperty('suggestedFixes')
    expect(withEmptyFixes).not.toHaveProperty('suggestedFixes')
  })
})
