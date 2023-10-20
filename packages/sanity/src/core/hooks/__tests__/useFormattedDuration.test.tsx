import React, {type ReactElement} from 'react'
import {ThemeProvider, studioTheme} from '@sanity/ui'
import {renderHook} from '@testing-library/react'
import {useFormattedDuration} from '../useFormattedDuration'
import {LocaleProviderBase, usEnglishLocale} from '../../i18n'
import {prepareI18n} from '../../i18n/i18nConfig'
import {studioDefaultLocaleResources} from '../../i18n/bundles/studio'

describe('useFormattedDuration', () => {
  const {i18next} = prepareI18n({
    projectId: 'test',
    dataset: 'test',
    name: 'test',
    i18n: {bundles: [studioDefaultLocaleResources]},
  })

  const wrapper = ({children}: {children: ReactElement}) => (
    <ThemeProvider theme={studioTheme}>
      <LocaleProviderBase
        locales={[usEnglishLocale]}
        i18next={i18next}
        projectId="test"
        sourceId="test"
      >
        {children}
      </LocaleProviderBase>
    </ThemeProvider>
  )

  beforeAll(() => i18next.init())

  describe('millisecond resolution', () => {
    const resolution = 'milliseconds'

    it('formats negative durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(-12345, {resolution}), {wrapper})
      expect(result.current).toMatchObject({formatted: '-12 sec, 345 ms', iso8601: '-PT12.345S'})
    })

    it('formats "empty" durations correctly (0ms)', () => {
      const {result} = renderHook(() => useFormattedDuration(0, {resolution}), {wrapper})
      expect(result.current).toMatchObject({formatted: '0 ms', iso8601: 'PT0S'})
    })

    it('formats millisecond durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(8, {resolution}), {wrapper})
      expect(result.current).toMatchObject({formatted: '8 ms', iso8601: 'PT0.008S'})
    })

    it('formats second durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(3000, {resolution}), {wrapper})
      expect(result.current).toMatchObject({formatted: '3 sec', iso8601: 'PT3S'})
    })

    it('formats fractional second durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(3456, {resolution}), {wrapper})
      expect(result.current).toMatchObject({formatted: '3 sec, 456 ms', iso8601: 'PT3.456S'})
    })

    it('formats minute durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(120000, {resolution}), {wrapper})
      expect(result.current).toMatchObject({formatted: '2 min', iso8601: 'PT2M'})
    })

    it('formats fractional minute durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(123000, {resolution}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '2 min, 3 sec',
        iso8601: 'PT2M3S',
      })
    })

    it('formats hour durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(7200000, {resolution}), {wrapper})
      expect(result.current).toMatchObject({formatted: '2 hr', iso8601: 'PT2H'})
    })

    it('formats fractional hour durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(7260000, {resolution}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '2 hr, 1 min',
        iso8601: 'PT2H1M',
      })
    })

    it('formats day durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(172800000, {resolution}), {wrapper})
      expect(result.current).toMatchObject({formatted: '2 days', iso8601: 'P2D'})
    })

    it('formats fractional day durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(172980000, {resolution}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '2 days, 3 min',
        iso8601: 'P2DT3M',
      })
    })

    it('formats full resolution timestamps correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(1234567890, {resolution}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '14 days, 6 hr, 56 min, 7 sec, 890 ms',
        iso8601: 'P14DT6H56M7.890S',
      })
    })
  })

  describe('second resolution', () => {
    it('formats negative durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(-12345), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '-12 sec',
        iso8601: '-PT12.345S',
      })
    })

    it('formats "empty" durations correctly (0ms)', () => {
      const {result} = renderHook(() => useFormattedDuration(0), {wrapper})
      expect(result.current).toMatchObject({formatted: '0 sec', iso8601: 'PT0S'})
    })

    it('formats millisecond durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(8), {wrapper})
      expect(result.current).toMatchObject({formatted: '0 sec', iso8601: 'PT0.008S'})
    })

    it('formats second durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(3000), {wrapper})
      expect(result.current).toMatchObject({formatted: '3 sec', iso8601: 'PT3S'})
    })

    it('formats fractional second durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(3456), {wrapper})
      expect(result.current).toMatchObject({formatted: '3 sec', iso8601: 'PT3.456S'})
    })

    it('formats minute durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(120000), {wrapper})
      expect(result.current).toMatchObject({formatted: '2 min', iso8601: 'PT2M'})
    })

    it('formats fractional minute durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(123000), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '2 min, 3 sec',
        iso8601: 'PT2M3S',
      })
    })

    it('formats hour durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(7200000), {wrapper})
      expect(result.current).toMatchObject({formatted: '2 hr', iso8601: 'PT2H'})
    })

    it('formats fractional hour durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(7260000), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '2 hr, 1 min',
        iso8601: 'PT2H1M',
      })
    })

    it('formats day durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(172800000), {wrapper})
      expect(result.current).toMatchObject({formatted: '2 days', iso8601: 'P2D'})
    })

    it('formats fractional day durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(172980000), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '2 days, 3 min',
        iso8601: 'P2DT3M',
      })
    })

    it('formats full resolution timestamps correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(1234567890), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '14 days, 6 hr, 56 min, 7 sec',
        iso8601: 'P14DT6H56M7.890S',
      })
    })
  })

  describe('long format', () => {
    const style = 'long'

    it('formats negative durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(-12345, {style}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '-12 seconds',
        iso8601: '-PT12.345S',
      })
    })

    it('formats "empty" durations correctly (0ms)', () => {
      const {result} = renderHook(() => useFormattedDuration(0, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '0 seconds', iso8601: 'PT0S'})
    })

    it('formats millisecond durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(8, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '0 seconds', iso8601: 'PT0.008S'})
    })

    it('formats second durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(3000, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '3 seconds', iso8601: 'PT3S'})
    })

    it('formats fractional second durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(3456, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '3 seconds', iso8601: 'PT3.456S'})
    })

    it('formats minute durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(120000, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '2 minutes', iso8601: 'PT2M'})
    })

    it('formats fractional minute durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(123000, {style}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '2 minutes, 3 seconds',
        iso8601: 'PT2M3S',
      })
    })

    it('formats hour durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(7200000, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '2 hours', iso8601: 'PT2H'})
    })

    it('formats fractional hour durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(7260000, {style}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '2 hours, 1 minute',
        iso8601: 'PT2H1M',
      })
    })

    it('formats day durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(172800000, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '2 days', iso8601: 'P2D'})
    })

    it('formats fractional day durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(172980000, {style}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '2 days, 3 minutes',
        iso8601: 'P2DT3M',
      })
    })

    it('formats full resolution timestamps correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(1234567890, {style}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '14 days, 6 hours, 56 minutes, 7 seconds',
        iso8601: 'P14DT6H56M7.890S',
      })
    })
  })

  describe('narrow format', () => {
    const style = 'narrow'

    it('formats negative durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(-12345, {style}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '-12s',
        iso8601: '-PT12.345S',
      })
    })

    it('formats "empty" durations correctly (0ms)', () => {
      const {result} = renderHook(() => useFormattedDuration(0, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '0s', iso8601: 'PT0S'})
    })

    it('formats millisecond durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(8, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '0s', iso8601: 'PT0.008S'})
    })

    it('formats second durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(3000, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '3s', iso8601: 'PT3S'})
    })

    it('formats fractional second durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(3456, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '3s', iso8601: 'PT3.456S'})
    })

    it('formats minute durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(120000, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '2m', iso8601: 'PT2M'})
    })

    it('formats fractional minute durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(123000, {style}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '2m 3s',
        iso8601: 'PT2M3S',
      })
    })

    it('formats hour durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(7200000, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '2h', iso8601: 'PT2H'})
    })

    it('formats fractional hour durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(7260000, {style}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '2h 1m',
        iso8601: 'PT2H1M',
      })
    })

    it('formats day durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(172800000, {style}), {wrapper})
      expect(result.current).toMatchObject({formatted: '2d', iso8601: 'P2D'})
    })

    it('formats fractional day durations correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(172980000, {style}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '2d 3m',
        iso8601: 'P2DT3M',
      })
    })

    it('formats full resolution timestamps correctly', () => {
      const {result} = renderHook(() => useFormattedDuration(1234567890, {style}), {wrapper})
      expect(result.current).toMatchObject({
        formatted: '14d 6h 56m 7s',
        iso8601: 'P14DT6H56M7.890S',
      })
    })
  })
})
