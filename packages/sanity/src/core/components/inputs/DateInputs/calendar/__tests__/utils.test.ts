import {describe, expect, it} from 'vitest'

import {getWeekDayNames} from '../utils'

describe('getWeekDayNames', () => {
  it.each([
    [1, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']],
    [6, ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']],
    [7, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']],
  ] as const)('orders weekday names for first day %s', (firstDay, expected) => {
    expect(getWeekDayNames(firstDay)).toEqual(expected)
  })
})
