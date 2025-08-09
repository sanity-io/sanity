import {describe, expect, test} from 'vitest'

import formatter from './formatter'

// August 8th 2025 12:00:00.123 local time
const date = new Date(2025, 7, 8, 12, 0, 0, 123)
const midnight = new Date(2025, 7, 8, 0, 5, 7, 890)

describe('formatMomentLike - basic tokens', () => {
  test('year tokens', () => {
    expect(formatter(date, 'Y')).toBe('2025')
    expect(formatter(date, 'YY')).toBe('25')
    expect(formatter(date, 'YYYY')).toBe('2025')
    expect(formatter(date, 'YYYYY')).toBe('02025')
  })

  test('week-year tokens', () => {
    expect(formatter(date, 'GG')).toBe('25')
    expect(formatter(date, 'GGGG')).toBe('2025')
    expect(formatter(date, 'gg')).toBe('25')
    expect(formatter(date, 'gggg')).toBe('2025')
  })

  test('quarter tokens', () => {
    expect(formatter(date, 'Q')).toBe('3')
    expect(formatter(date, 'Qo')).toBe('3rd')
  })

  test('month tokens', () => {
    expect(formatter(date, 'M')).toBe('8')
    expect(formatter(date, 'MM')).toBe('08')
    expect(formatter(date, 'Mo')).toBe('8th')
    expect(formatter(date, 'MMM')).toBe('Aug')
    expect(formatter(date, 'MMMM')).toBe('August')
  })

  test('day of month tokens', () => {
    expect(formatter(date, 'D')).toBe('8')
    expect(formatter(date, 'DD')).toBe('08')
    expect(formatter(date, 'Do')).toBe('8th')
  })

  test('day of week tokens', () => {
    // Friday
    expect(formatter(date, 'ddd')).toBe('Fri')
    expect(formatter(date, 'dddd')).toBe('Friday')
    expect(formatter(date, 'dd')).toBe('Fr')
    expect(formatter(date, 'd')).toBe('5') // Sunday=0..Saturday=6
    expect(formatter(date, 'do')).toBe('6th') // dayOfWeek+1 => 6th
  })

  test('day of year tokens', () => {
    // 2025-08-08 is the 220th day of the year
    expect(formatter(date, 'DDD')).toBe('220')
    expect(formatter(date, 'DDDD')).toBe('220')
    expect(formatter(date, 'DDDo')).toBe('220th')
  })

  test('Iso day of week', () => {
    expect(formatter(date, 'E')).toBe('5') // ISO Monday=1..Sunday=7
  })

  test('Week of the year tokens', () => {
    // 2025-08-08 falls on ISO week 32
    expect(formatter(date, 'w')).toBe('32')
    expect(formatter(date, 'wo')).toBe('32nd')
    expect(formatter(date, 'ww')).toBe('32')
  })

  test('ISO Week of the year tokens', () => {
    expect(formatter(date, 'W')).toBe('32')
    expect(formatter(date, 'WW')).toBe('32')
    expect(formatter(date, 'Wo')).toBe('32nd')
  })

  test('24h hour tokens', () => {
    expect(formatter(date, 'HH')).toBe('12')
    expect(formatter(date, 'H')).toBe('12')
    expect(formatter(midnight, 'H')).toBe('0')
    expect(formatter(midnight, 'HH')).toBe('00')
  })

  test('12h hour tokens', () => {
    expect(formatter(date, 'hh')).toBe('12')
    expect(formatter(date, 'h')).toBe('12')
    expect(formatter(midnight, 'hh')).toBe('12')
    expect(formatter(midnight, 'h')).toBe('12')
  })

  test('1-24 hour tokens (k, kk)', () => {
    expect(formatter(date, 'k')).toBe('12')
    expect(formatter(date, 'kk')).toBe('12')
    expect(formatter(midnight, 'k')).toBe('24')
    expect(formatter(midnight, 'kk')).toBe('24')
  })

  test('minutes and seconds', () => {
    expect(formatter(date, 'mm')).toBe('00')
    expect(formatter(date, 'm')).toBe('0')
    expect(formatter(date, 'ss')).toBe('00')
    expect(formatter(date, 's')).toBe('0')
  })

  test('AM/PM', () => {
    expect(formatter(date, 'A')).toBe('PM')
    expect(formatter(date, 'a')).toBe('pm')
    expect(formatter(midnight, 'A')).toBe('AM')
    expect(formatter(midnight, 'a')).toBe('am')
  })
  test('fractional seconds', () => {
    expect(formatter(date, 'S')).toBe('1')
    expect(formatter(date, 'SS')).toBe('12')
    expect(formatter(date, 'SSS')).toBe('123')
    expect(formatter(date, 'SSSS')).toBe('1230')
  })

  test('eras (BC/AD)', () => {
    const bc = new Date(-1, 0, 1, 0, 0, 0, 0) // Year -1
    expect(formatter(bc, 'N')).toBe('BC')
    expect(formatter(bc, 'NN')).toBe('BC')
    expect(formatter(bc, 'NNN')).toBe('BC')
    expect(formatter(bc, 'NNNN')).toBe('Before Christ')
    expect(formatter(bc, 'NNNNN')).toBe('BC')
    expect(formatter(date, 'N')).toBe('AD')
  })
  test('time zone offset tokens shape', () => {
    // These are environment dependent; ensure shape only
    expect(formatter(date, 'Z')).toBe('+02:00')
    expect(formatter(date, 'ZZ')).toBe('+0200')
  })
})
