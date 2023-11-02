import React, {type ReactElement} from 'react'
import {ThemeProvider, studioTheme} from '@sanity/ui'
import {renderHook} from '@testing-library/react'
import {LocaleProviderBase, usEnglishLocale} from '../../i18n'
import {prepareI18n} from '../../i18n/i18nConfig'
import {studioDefaultLocaleResources} from '../../i18n/bundles/studio'
import {FormattableMeasurementUnit, useUnitFormatter} from '../useUnitFormatter'

describe('useUnitFormatter', () => {
  const {i18next} = prepareI18n({
    projectId: 'test',
    dataset: 'test',
    name: 'test',
    i18n: {bundles: [studioDefaultLocaleResources]},
  })

  const wrapper = ({children}: {children: ReactElement}) => (
    <ThemeProvider theme={studioTheme}>
      <LocaleProviderBase
        locales={[usEnglishLocale, {id: 'fr-FR', title: 'Français'}]}
        i18next={i18next}
        projectId="test"
        sourceId="test"
      >
        {children}
      </LocaleProviderBase>
    </ThemeProvider>
  )

  beforeAll(() => i18next.init())
  beforeEach(() => i18next.changeLanguage('en-US'))

  it('formats with long units as default', () => {
    const {result} = renderHook(() => useUnitFormatter()(1, 'meter'), {wrapper})
    expect(result.current).toBe('1 meter')
  })

  it('formats singular/plural correctly', () => {
    const {result} = renderHook(() => useUnitFormatter()(2, 'meter'), {wrapper})
    expect(result.current).toBe('2 meters')
  })

  it('can be configured to use short units', () => {
    const {result} = renderHook(() => useUnitFormatter({unitDisplay: 'short'})(13, 'foot'), {
      wrapper,
    })
    expect(result.current).toBe('13 ft')
  })

  it('can be configured to use narrow units', () => {
    const {result} = renderHook(() => useUnitFormatter({unitDisplay: 'narrow'})(13, 'foot'), {
      wrapper,
    })
    expect(result.current).toBe('13′')
  })

  it('respects active locale', async () => {
    await i18next.changeLanguage('fr-FR')
    const {result} = renderHook(() => useUnitFormatter()(2, 'meter'), {wrapper})
    expect(result.current).toBe('2 mètres')
  })

  it('can format all defined units', () => {
    const {
      result: {current: format},
    } = renderHook(() => useUnitFormatter({unitDisplay: 'short'}), {wrapper})

    const formatted: Partial<Record<FormattableMeasurementUnit, string>> = {}
    const units: FormattableMeasurementUnit[] = [
      'acre',
      'bit',
      'byte',
      'celsius',
      'centimeter',
      'day',
      'degree',
      'fahrenheit',
      'fluid-ounce',
      'foot',
      'gallon',
      'gigabit',
      'gigabyte',
      'gram',
      'hectare',
      'hour',
      'inch',
      'kilobit',
      'kilobyte',
      'kilogram',
      'kilometer',
      'liter',
      'megabit',
      'megabyte',
      'meter',
      'mile',
      'mile-scandinavian',
      'milliliter',
      'millimeter',
      'millisecond',
      'minute',
      'month',
      'ounce',
      'percent',
      'petabyte',
      'pound',
      'second',
      'stone',
      'terabit',
      'terabyte',
      'week',
      'yard',
      'year',
    ]

    units.forEach((unit, idx) => {
      formatted[unit] = format(idx, unit)
    })

    expect(formatted).toMatchObject({
      acre: '0 ac',
      bit: '1 bit',
      byte: '2 byte',
      celsius: '3°C',
      centimeter: '4 cm',
      day: '5 days',
      degree: '6 deg',
      fahrenheit: '7°F',
      'fluid-ounce': '8 fl oz',
      foot: '9 ft',
      gallon: '10 gal',
      gigabit: '11 Gb',
      gigabyte: '12 GB',
      gram: '13 g',
      hectare: '14 ha',
      hour: '15 hr',
      inch: '16 in',
      kilobit: '17 kb',
      kilobyte: '18 kB',
      kilogram: '19 kg',
      kilometer: '20 km',
      liter: '21 L',
      megabit: '22 Mb',
      megabyte: '23 MB',
      meter: '24 m',
      mile: '25 mi',
      'mile-scandinavian': '26 smi',
      milliliter: '27 mL',
      millimeter: '28 mm',
      millisecond: '29 ms',
      minute: '30 min',
      month: '31 mths',
      ounce: '32 oz',
      percent: '33%',
      petabyte: '34 PB',
      pound: '35 lb',
      second: '36 sec',
      stone: '37 st',
      terabit: '38 Tb',
      terabyte: '39 TB',
      week: '40 wks',
      yard: '41 yd',
      year: '42 yrs',
    })
  })
})
