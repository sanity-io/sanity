import React, {type ReactElement} from 'react'
import {ThemeProvider, studioTheme} from '@sanity/ui'
import {renderHook} from '@testing-library/react'
import {useRelativeTime} from '../useRelativeTime'
import {LocaleProviderBase, usEnglishLocale} from '../../i18n'
import {prepareI18n} from '../../i18n/i18nConfig'
import {studioDefaultLocaleResources} from '../../i18n/bundles/studio'

describe('useRelativeTime', () => {
  const timeZone = 'UTC'
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

  describe('minimal', () => {
    const minimal = true

    it('outputs eg "Jun 3" if within same year, but different month', () => {
      const date = new Date('2023-06-03T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo, minimal}), {
        wrapper,
      })
      expect(result.current).toBe('Jun 3')
    })

    it('outputs eg "Jun 3, 2022" if different year', () => {
      const date = new Date('2022-06-03T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo, minimal}), {
        wrapper,
      })
      expect(result.current).toBe('Jun 3, 2022')
    })

    it('outputs eg "3w" if less than a month apart', () => {
      const date = new Date('2023-07-03T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo, minimal}), {
        wrapper,
      })
      expect(result.current).toBe('3w')
    })

    it('outputs eg "5d" if less than a week apart', () => {
      const date = new Date('2023-07-20T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo, minimal}), {
        wrapper,
      })
      expect(result.current).toBe('5d')
    })

    it('outputs "yesterday" if one day apart, and in the past', () => {
      const date = new Date('2023-07-24T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo, minimal}), {
        wrapper,
      })
      expect(result.current).toBe('yesterday')
    })

    it('outputs "tomorrow" if one day apart, and in the future', () => {
      const relativeTo = new Date('2023-07-24T12:00:00Z')
      const date = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo, minimal}), {
        wrapper,
      })
      expect(result.current).toBe('tomorrow')
    })

    it('outputs eg "5h" if hours apart', () => {
      const date = new Date('2023-07-25T07:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo, minimal}), {
        wrapper,
      })
      expect(result.current).toBe('5h')
    })

    it('outputs eg "5m" if minutes apart', () => {
      const date = new Date('2023-07-25T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:05:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo, minimal}), {
        wrapper,
      })
      expect(result.current).toBe('5m')
    })

    it('outputs eg "20s" if seconds apart (and more than 10)', () => {
      const date = new Date('2023-07-25T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:20Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo, minimal}), {
        wrapper,
      })
      expect(result.current).toBe('20s')
    })

    it('outputs "just now" if less than 10 seconds ago', () => {
      const {result} = renderHook(() => useRelativeTime(new Date()), {wrapper})
      expect(result.current).toBe('just now')
    })
  })

  describe('minimal, with relative specifier', () => {
    const minimal = true

    it('outputs eg "Jun 3" if within same year, but different month', () => {
      const date = new Date('2023-06-03T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('Jun 3')
    })

    it('outputs eg "Jun 3, 2022" if different year', () => {
      const date = new Date('2022-06-03T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('Jun 3, 2022')
    })

    it('outputs eg "3w ago" if less than a month apart, and in the past', () => {
      const date = new Date('2023-07-03T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('3w ago')
    })

    it('outputs eg "in 3w" if less than a month apart, and in the future', () => {
      const relativeTo = new Date('2023-07-03T12:00:00Z')
      const date = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('in 3w')
    })

    it('outputs eg "5d ago" if less than a week apart, and in the past', () => {
      const date = new Date('2023-07-20T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('5d ago')
    })

    it('outputs eg "in 5d" if less than a week apart, and in the future', () => {
      const relativeTo = new Date('2023-07-20T12:00:00Z')
      const date = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('in 5d')
    })

    it('outputs "yesterday" if one day apart, and in the past', () => {
      const date = new Date('2023-07-24T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('yesterday')
    })

    it('outputs "tomorrow" if one day apart, and in the future', () => {
      const relativeTo = new Date('2023-07-24T12:00:00Z')
      const date = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('tomorrow')
    })

    it('outputs eg "5h ago" if hours apart, and in the past', () => {
      const date = new Date('2023-07-25T07:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('5h ago')
    })

    it('outputs eg "in 5h" if hours apart, and in the future', () => {
      const relativeTo = new Date('2023-07-25T07:00:00Z')
      const date = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('in 5h')
    })

    it('outputs eg "5m ago" if minutes apart, and in the past', () => {
      const date = new Date('2023-07-25T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:05:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('5m ago')
    })

    it('outputs eg "in 5m" if minutes apart, and in the future', () => {
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const date = new Date('2023-07-25T12:05:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('in 5m')
    })

    it('outputs eg "20s ago" if more than 10 seconds apart, and in the past', () => {
      const date = new Date('2023-07-25T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:20Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('20s ago')
    })

    it('outputs eg "in 20s" if more than 10 seconds apart, and in the future', () => {
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const date = new Date('2023-07-25T12:00:20Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('in 20s')
    })

    it('outputs "just now" if less than 10 seconds ago', () => {
      const date = new Date('2023-07-25T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:05Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('just now')
    })

    it('outputs "just now" if less than 10 seconds in the future', () => {
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const date = new Date('2023-07-25T12:00:05Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, minimal, useTemporalPhrase: true}),
        {wrapper},
      )
      expect(result.current).toBe('just now')
    })
  })

  describe('full', () => {
    it('outputs full date, eg "Jun 3, 2023, 2:00 PM" if within same year, but different month', () => {
      const date = new Date('2023-06-03T14:00:00Z')
      const relativeTo = new Date('2023-07-25T14:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo}), {wrapper})
      expect(result.current).toBe('Jun 3, 2023, 2:00 PM')
    })

    it('outputs full date eg "Jun 3, 2022, 2:00 PM" if different year', () => {
      const date = new Date('2022-06-03T14:00:00Z')
      const relativeTo = new Date('2023-07-25T14:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo}), {wrapper})
      expect(result.current).toBe('Jun 3, 2022, 2:00 PM')
    })

    it('outputs eg "3 weeks" if less than a month apart', () => {
      const date = new Date('2023-07-03T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo}), {wrapper})
      expect(result.current).toBe('3 weeks')
    })

    it('outputs eg "1 week" if less than a month apart', () => {
      const date = new Date('2023-07-17T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo}), {wrapper})
      expect(result.current).toBe('1 week')
    })

    it('outputs eg "5 days" if less than a week apart', () => {
      const date = new Date('2023-07-20T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo}), {wrapper})
      expect(result.current).toBe('5 days')
    })

    it('outputs "yesterday" if one day apart', () => {
      const date = new Date('2023-07-24T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo}), {wrapper})
      expect(result.current).toBe('yesterday')
    })

    it('outputs eg "5 hours" if hours apart', () => {
      const date = new Date('2023-07-25T07:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo}), {wrapper})
      expect(result.current).toBe('5 hours')
    })

    it('outputs "1 hour" if an hour apart', () => {
      const date = new Date('2023-07-25T11:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo}), {wrapper})
      expect(result.current).toBe('1 hour')
    })

    it('outputs eg "5 minutes" if minutes apart', () => {
      const date = new Date('2023-07-25T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:05:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo}), {wrapper})
      expect(result.current).toBe('5 minutes')
    })

    it('outputs "1 minute" if a minute apart', () => {
      const date = new Date('2023-07-25T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:01:00Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo}), {wrapper})
      expect(result.current).toBe('1 minute')
    })

    it('outputs eg "20 seconds" if seconds apart (and more than 10)', () => {
      const date = new Date('2023-07-25T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:20Z')
      const {result} = renderHook(() => useRelativeTime(date, {timeZone, relativeTo}), {wrapper})
      expect(result.current).toBe('20 seconds')
    })

    it('outputs "just now" if less than 10 seconds ago', () => {
      const {result} = renderHook(() => useRelativeTime(new Date()), {wrapper})
      expect(result.current).toBe('just now')
    })
  })

  describe('full, with relative specifier', () => {
    it('outputs full date, eg "Jun 3, 2023 12:00 PM" if within same year, but different month', () => {
      const date = new Date('2023-06-03T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('Jun 3, 2023, 12:00 PM')
    })

    it('outputs full date, eg "Jun 3, 2022 12:00 PM" if different year', () => {
      const date = new Date('2022-06-03T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('Jun 3, 2022, 12:00 PM')
    })

    it('outputs eg "3 weeks ago" if less than a month apart, and in the past', () => {
      const date = new Date('2023-07-03T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('3 weeks ago')
    })

    it('outputs eg "in 3 weeks" if less than a month apart, and in the future', () => {
      const relativeTo = new Date('2023-07-03T12:00:00Z')
      const date = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('in 3 weeks')
    })

    it('outputs eg "last week" if diff is a week, and in the past', () => {
      const date = new Date('2023-07-17T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('last week')
    })

    it('outputs eg "next week" if diff is a week, and in the future', () => {
      const relativeTo = new Date('2023-07-17T12:00:00Z')
      const date = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('next week')
    })

    it('outputs eg "5 days ago" if less than a week apart, and in the past', () => {
      const date = new Date('2023-07-20T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('5 days ago')
    })

    it('outputs eg "in 5 days" if less than a week apart, and in the future', () => {
      const relativeTo = new Date('2023-07-20T12:00:00Z')
      const date = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('in 5 days')
    })

    it('outputs "yesterday" if one day apart, and in the past', () => {
      const date = new Date('2023-07-24T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('yesterday')
    })

    it('outputs "tomorrow" if one day apart, and in the future', () => {
      const relativeTo = new Date('2023-07-24T12:00:00Z')
      const date = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('tomorrow')
    })

    it('outputs eg "5 hours ago" if hours apart, and in the past', () => {
      const date = new Date('2023-07-25T07:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('5 hours ago')
    })

    it('outputs eg "in 5 hours" if hours apart, and in the future', () => {
      const relativeTo = new Date('2023-07-25T07:00:00Z')
      const date = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('in 5 hours')
    })

    it('outputs eg "1 hours ago" if an hour apart, and in the past', () => {
      const date = new Date('2023-07-25T11:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('1 hour ago')
    })

    it('outputs eg "in 1 hour" if an hour apart, and in the future', () => {
      const relativeTo = new Date('2023-07-25T11:00:00Z')
      const date = new Date('2023-07-25T12:00:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('in 1 hour')
    })

    it('outputs eg "5 minutes ago" if minutes apart, and in the past', () => {
      const date = new Date('2023-07-25T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:05:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('5 minutes ago')
    })

    it('outputs eg "in 5 minutes" if minutes apart, and in the future', () => {
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const date = new Date('2023-07-25T12:05:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('in 5 minutes')
    })

    it('outputs eg "1 minute ago" if a minute apart, and in the past', () => {
      const date = new Date('2023-07-25T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:01:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('1 minute ago')
    })

    it('outputs eg "in 1 minute" if a minute apart, and in the future', () => {
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const date = new Date('2023-07-25T12:01:00Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('in 1 minute')
    })

    it('outputs eg "20 seconds ago" if more than 10 seconds apart, and in the past', () => {
      const date = new Date('2023-07-25T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:20Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('20 seconds ago')
    })

    it('outputs eg "in 20 seconds" if more than 10 seconds apart, and in the future', () => {
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const date = new Date('2023-07-25T12:00:20Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('in 20 seconds')
    })

    it('outputs "just now" if less than 10 seconds ago', () => {
      const date = new Date('2023-07-25T12:00:00Z')
      const relativeTo = new Date('2023-07-25T12:00:05Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('just now')
    })

    it('outputs "just now" if less than 10 seconds in the future', () => {
      const relativeTo = new Date('2023-07-25T12:00:00Z')
      const date = new Date('2023-07-25T12:00:05Z')
      const {result} = renderHook(
        () => useRelativeTime(date, {timeZone, relativeTo, useTemporalPhrase: true}),
        {
          wrapper,
        },
      )
      expect(result.current).toBe('just now')
    })
  })
})
