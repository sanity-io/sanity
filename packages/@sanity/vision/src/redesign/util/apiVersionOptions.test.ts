import {describe, expect, it} from 'vitest'

import {getApiVersionOptions} from './apiVersionOptions'

describe('getApiVersionOptions', () => {
  it('lists dated versions newest first, then vX, then v1 as legacy', () => {
    const options = getApiVersionOptions(['2020-01-01', 'not-a-version'])
    const values = options.map((option) => option.value)

    const dated = values.filter((value) => /^v\d{4}-\d{2}-\d{2}$/.test(value))
    expect(dated).toEqual([...dated].toSorted((a, b) => b.localeCompare(a)))
    expect(values.at(-2)).toBe('vX')
    expect(values.at(-1)).toBe('v1')
    expect(values).toContain('v2020-01-01')
    expect(values).not.toContain('not-a-version')

    expect(options[0].note).toBe('latest')
    expect(options.find((option) => option.value === 'vX')?.note).toBe('experimental')
    expect(options.find((option) => option.value === 'v1')?.note).toBe('legacy')
  })
})
