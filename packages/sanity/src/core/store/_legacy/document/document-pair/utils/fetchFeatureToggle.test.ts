import {firstValueFrom, from} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type ActionsFeatureToggle, mapResponse} from './fetchFeatureToggle'

vi.mock('../../../../../version', () => ({
  SANITY_VERSION: '3.47.0',
}))

describe('mapResponse', () => {
  it('respects the `enabled` property', async () => {
    const source = from<ActionsFeatureToggle[]>([
      {
        enabled: false,
        compatibleStudioVersions: '>= 3',
      },
    ])

    expect(await firstValueFrom(source.pipe(mapResponse()))).toBe(false)
  })

  it.each([
    ['>= 2', true],
    ['>= 3', true],
    ['>= 4', false],

    ['2', false],
    ['3', true],
    ['3.0.0', false],
    ['4', false],

    ['>= 2.13.13', true],
    ['>= 3.13.13', true],
    ['>= 4.13.13', false],

    ['>= 3.46.9', true],
    ['>= 3.47.0', true],
    ['>= 3.47.1', false],

    ['< 2 || 3.47.0', true],
    ['< 2 || 3.45.0', false],
  ])(
    'respects the version range constraint specified in the `compatibleStudioVersions` property (%s)',
    async (compatibleStudioVersions, expected) => {
      const source = from<ActionsFeatureToggle[]>([
        {
          enabled: true,
          compatibleStudioVersions,
        },
      ])

      expect(await firstValueFrom(source.pipe(mapResponse()))).toBe(expected)
    },
  )
})
