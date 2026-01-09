import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest'

import formatter from './formatter'

// August 8th 2025 12:00:00.123 local time in UTC
const date = new Date('2025-08-08T13:09:08.123Z')
// Midnight of the same day
const midnight = new Date('2025-08-08T00:00:00.000Z')
const bc = new Date(-1, 0, 1, 0, 0, 0, 0) // Year -1

const TESTS = [
  // Year tokens
  {date: date, token: 'YYYY', value: '2025'},
  {date: date, token: 'YY', value: '25'},
  {date: date, token: 'Y', value: '2025'},
  {date: date, token: 'YYYYY', value: '02025'},
  // Week-year tokens
  {date: date, token: 'GGGG', value: '2025'},
  {date: date, token: 'GG', value: '25'},
  {date: date, token: 'gggg', value: '2025'},
  {date: date, token: 'gg', value: '25'},
  // Quarter tokens
  {date: date, token: 'Q', value: '3'},
  {date: date, token: 'Qo', value: '3rd'},
  // Month tokens
  {date: date, token: 'MMMM', value: 'August'},
  {date: date, token: 'MMM', value: 'Aug'},
  {date: date, token: 'MM', value: '08'},
  {date: date, token: 'M', value: '8'},
  {date: date, token: 'Mo', value: '8th'},
  // Day of month tokens
  {date: date, token: 'DD', value: '08'},
  {date: date, token: 'D', value: '8'},
  {date: date, token: 'Do', value: '8th'},
  // Day of week tokens
  {date: date, token: 'dddd', value: 'Friday'},
  {date: date, token: 'ddd', value: 'Fri'},
  {date: date, token: 'dd', value: 'Fr'},
  {date: date, token: 'd', value: '5'}, // Sunday=0..Saturday=},
  {date: date, token: 'do', value: '6th'}, // dayOfWeek+1 => 6t},
  // Day of year tokens
  {date: date, token: 'DDDD', value: '220'},
  {date: date, token: 'DDD', value: '220'},
  {date: date, token: 'DDDo', value: '220th'},
  // ISO day of week tokens
  {date: date, token: 'E', value: '5'}, // ISO Monday=1..Sunday=},
  // Week of the year tokens
  {date: date, token: 'w', value: '32'},
  {date: date, token: 'wo', value: '32nd'},
  {date: date, token: 'ww', value: '32'},
  // ISO Week
  {date: date, token: 'WW', value: '32'},
  {date: date, token: 'W', value: '32'},
  {date: date, token: 'Wo', value: '32nd'},
  // 24h hour tokens
  {date: date, token: 'HH', value: '15'},
  {date: midnight, token: 'HH', value: '02'},
  {date: date, token: 'H', value: '15'},
  {date: midnight, token: 'H', value: '2'},
  // 12h hour tokens
  {date: date, token: 'hh', value: '03'},
  {date: midnight, token: 'hh', value: '02'},
  {date: date, token: 'h', value: '3'},
  {date: midnight, token: 'h', value: '2'},
  // 1-24 hour tokens (k, kk)
  {date: date, token: 'kk', value: '15'},
  {date: midnight, token: 'kk', value: '02'},
  {date: date, token: 'k', value: '15'},
  {date: midnight, token: 'k', value: '2'},
  // Minutes and seconds
  {date: date, token: 'mm', value: '09'},
  {date: date, token: 'm', value: '9'},
  {date: date, token: 'ss', value: '08'},
  {date: date, token: 's', value: '8'},
  // AM/PM
  {date: date, token: 'A', value: 'PM'},
  {date: date, token: 'a', value: 'pm'},
  {date: midnight, token: 'A', value: 'AM'},
  {date: midnight, token: 'a', value: 'am'},
  // Epoch tokens
  {date: date, token: 'N', value: 'AD'},
  {date: bc, token: 'N', value: 'BC'},
  {date: bc, token: 'NN', value: 'BC'},
  {date: bc, token: 'NNN', value: 'BC'},
  {date: bc, token: 'NNNN', value: 'Before Christ'},
  {date: bc, token: 'NNNNN', value: 'BC'},
  {date: date, token: 'N', value: 'AD'},
  // Time zone offset tokens
  {date: date, token: 'z', value: 'GMT+2'},
  {date: date, token: 'zz', value: 'GMT+2'},
  {date: date, token: 'Z', value: '+02:00'},
  {date: date, token: 'ZZ', value: '+0200'},
  // Time-only localized tokens
  {date: date, token: 'LTS', value: '3:09:08 PM'},
  {date: date, token: 'LT', value: '3:09 PM'},

  // Date-only localized tokens
  {date: date, token: 'LLLL', value: 'Friday, August 8, 2025 at 3:09 PM'},
  {date: date, token: 'LLL', value: 'August 8, 2025 at 3:09 PM'},
  {date: date, token: 'LL', value: 'August 8, 2025'},
  {date: date, token: 'L', value: '08/08/2025'},
  {date: date, token: 'llll', value: 'Fri, Aug 8, 2025, 3:09 PM'},
  {date: date, token: 'lll', value: 'Aug 8, 2025, 3:09 PM'},
  {date: date, token: 'll', value: 'Aug 8, 2025'},
  {date: date, token: 'l', value: '8/8/2025'},

  // Localized tokens with time
  {date: date, token: 'LL LT', value: 'August 8, 2025 3:09 PM'},
  {date: date, token: 'L LT', value: '08/08/2025 3:09 PM'},
  {date: date, token: 'l LT', value: '8/8/2025 3:09 PM'},
  {date: date, token: 'll LTS', value: 'Aug 8, 2025 3:09:08 PM'},

  // Bracket escaping tokens
  {date: date, token: '[at] HH:mm', value: 'at 15:09'},
  {date: date, token: '[l] LT', value: 'l 3:09 PM'},

  // Fractional seconds
  {date: date, token: 'SSSS', value: '1230'},
  {date: date, token: 'SSS', value: '123'},
  {date: date, token: 'SS', value: '12'},
  {date: date, token: 'S', value: '1'},
]

describe('formatter - tokens tests', () => {
  beforeAll(() => {
    // Mock timezone to ensure consistent test results
    vi.stubEnv('TZ', 'Europe/Madrid')
  })
  afterAll(() => {
    vi.unstubAllEnvs()
  })
  test.each(TESTS)('$token should be $value', ({date: d, token, value}) => {
    expect(formatter(d, token)).toBe(value)
  })
})
