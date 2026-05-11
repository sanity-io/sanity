import {type ValidationMarker} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {mergeParseErrors} from '../mergeParseErrors'

describe('mergeParseErrors', () => {
  it('returns the original array when there are no parse errors', () => {
    const validation: ValidationMarker[] = [
      {level: 'error', message: 'Required', path: ['publishedAt']},
    ]
    expect(mergeParseErrors(validation, {})).toBe(validation)
  })

  it('replaces error markers at parse-error paths with the parse error', () => {
    const validation: ValidationMarker[] = [
      {level: 'error', message: 'Required', path: ['publishedAt']},
      {level: 'error', message: 'Please use yyyy-mm-dd', path: ['publishedAt']},
    ]

    const merged = mergeParseErrors(validation, {
      publishedAt: {message: 'Invalid date'},
    })

    expect(merged).toEqual([{level: 'error', message: 'Invalid date', path: ['publishedAt']}])
  })

  it('preserves markers at paths without a parse error', () => {
    const validation: ValidationMarker[] = [
      {level: 'error', message: 'Required', path: ['title']},
      {level: 'error', message: 'Required', path: ['publishedAt']},
    ]

    const merged = mergeParseErrors(validation, {
      publishedAt: {message: 'Invalid date'},
    })

    expect(merged).toContainEqual({level: 'error', message: 'Required', path: ['title']})
    expect(merged).toContainEqual({level: 'error', message: 'Invalid date', path: ['publishedAt']})
    expect(merged).not.toContainEqual({level: 'error', message: 'Required', path: ['publishedAt']})
  })

  it('preserves non-error markers at parse-error paths', () => {
    const validation: ValidationMarker[] = [
      {level: 'warning', message: 'Heads up', path: ['publishedAt']},
      {level: 'info', message: 'FYI', path: ['publishedAt']},
      {level: 'error', message: 'Required', path: ['publishedAt']},
    ]

    const merged = mergeParseErrors(validation, {
      publishedAt: {message: 'Invalid date'},
    })

    expect(merged).toContainEqual({level: 'warning', message: 'Heads up', path: ['publishedAt']})
    expect(merged).toContainEqual({level: 'info', message: 'FYI', path: ['publishedAt']})
    expect(merged).toContainEqual({level: 'error', message: 'Invalid date', path: ['publishedAt']})
    expect(merged.filter((m) => m.level === 'error')).toHaveLength(1)
  })

  it('handles nested paths keyed by toString', () => {
    const validation: ValidationMarker[] = [
      {level: 'error', message: 'Required', path: ['nested', 'publishedAt']},
    ]

    const merged = mergeParseErrors(validation, {
      'nested.publishedAt': {message: 'Invalid date'},
    })

    expect(merged).toEqual([
      {level: 'error', message: 'Invalid date', path: ['nested', 'publishedAt']},
    ])
  })
})
