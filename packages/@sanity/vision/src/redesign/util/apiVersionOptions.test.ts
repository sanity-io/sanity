import {describe, expect, it} from 'vitest'

import {VARIANTS_API_VERSION} from '../../apiVersions'
import {getApiVersionOptions} from './apiVersionOptions'

describe('getApiVersionOptions', () => {
  it('lists today, then the other dated versions newest first, then vX, then v1', () => {
    const now = new Date('2030-06-15T12:00:00Z')
    const options = getApiVersionOptions(['2020-01-01', 'not-a-version', '2030-06-15'], now)
    const values = options.map((option) => option.value)

    expect(options[0]).toEqual({value: 'v2030-06-15', group: 'today'})
    expect(values.filter((value) => value === 'v2030-06-15')).toHaveLength(1)

    const dated = options.filter((option) => option.group === 'dated').map(({value}) => value)
    expect(dated).toEqual([...dated].toSorted((a, b) => b.localeCompare(a)))
    expect(dated).toContain('v2020-01-01')
    expect(values).not.toContain('not-a-version')
    expect(values.at(-2)).toBe('vX')
    expect(values.at(-1)).toBe('v1')

    expect(options.find((option) => option.value === VARIANTS_API_VERSION)?.note).toBe('variants')
    expect(options.find((option) => option.value === 'vX')?.note).toBe('experimental')
    expect(options.find((option) => option.value === 'v1')?.note).toBe('legacy')
  })
})
