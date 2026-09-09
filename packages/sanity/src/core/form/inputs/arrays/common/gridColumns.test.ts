import {describe, expect, it} from 'vitest'

import {DEFAULT_GRID_COLUMNS, resolveGridTemplateColumns} from './gridColumns'

describe('resolveGridTemplateColumns', () => {
  it('reproduces the historical default when columns is not set', () => {
    // `[2, 3, 4]` is what grid arrays rendered at before `columns` existed, so an
    // unset value must keep producing exactly that.
    expect(resolveGridTemplateColumns(undefined)).toEqual([2, 3, 4])
    expect(resolveGridTemplateColumns(DEFAULT_GRID_COLUMNS)).toEqual([2, 3, 4])
  })

  it('never exceeds the requested count at any breakpoint', () => {
    expect(resolveGridTemplateColumns(1)).toEqual([1, 1, 1])
    expect(resolveGridTemplateColumns(2)).toEqual([2, 2, 2])
    expect(resolveGridTemplateColumns(3)).toEqual([2, 3, 3])
  })

  it('steps up to the requested count on wider breakpoints', () => {
    expect(resolveGridTemplateColumns(6)).toEqual([2, 3, 6])
    expect(resolveGridTemplateColumns(12)).toEqual([2, 3, 12])
  })

  it('falls back to the default for values that cannot describe a grid', () => {
    // `columns` comes from userland schema config, so it is not necessarily sane.
    expect(resolveGridTemplateColumns(0)).toEqual([2, 3, 4])
    expect(resolveGridTemplateColumns(-3)).toEqual([2, 3, 4])
    expect(resolveGridTemplateColumns(Number.NaN)).toEqual([2, 3, 4])
    expect(resolveGridTemplateColumns(Number.POSITIVE_INFINITY)).toEqual([2, 3, 4])
  })

  it('truncates fractional counts rather than emitting a fractional track count', () => {
    expect(resolveGridTemplateColumns(3.7)).toEqual([2, 3, 3])
  })
})
