import {afterEach, describe, expect, it, vi} from 'vitest'

import {normalizeVariantConditions} from '../normalizeVariantConditions'

describe('normalizeVariantConditions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes string values and object values', () => {
    expect(
      normalizeVariantConditions([
        {
          name: 'audience',
          title: 'Audience',
          description: 'Who this content is for.',
          values: [
            {value: 'loyal', title: 'Loyal customers', description: 'Repeat purchasers.'},
            'new',
          ],
        },
        {name: 'locale', values: ['en-US']},
      ]),
    ).toEqual([
      {
        name: 'audience',
        title: 'Audience',
        description: 'Who this content is for.',
        values: [
          {value: 'loyal', title: 'Loyal customers', description: 'Repeat purchasers.'},
          {value: 'new', title: 'new'},
        ],
      },
      {
        name: 'locale',
        title: 'locale',
        values: [{value: 'en-US', title: 'en-US'}],
      },
    ])
  })

  it('drops invalid keys, values, and duplicates', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(
      normalizeVariantConditions([
        {name: '_system', values: ['ok']},
        {name: 'Audience', values: ['ok']},
        {name: 'audience', values: ['loyal,customers', '', 'loyal', 'loyal']},
        {name: 'audience', values: ['other']},
        {name: 'empty', values: []},
        {name: 'bad-values'},
        'nope',
      ]),
    ).toEqual([
      {
        name: 'audience',
        title: 'audience',
        values: [{value: 'loyal', title: 'loyal'}],
      },
    ])

    expect(warn).toHaveBeenCalled()
  })

  it('throws when the resolved value is not an array', () => {
    expect(() => normalizeVariantConditions({name: 'audience'})).toThrow(
      'Expected conditions to resolve to an array',
    )
  })
})
