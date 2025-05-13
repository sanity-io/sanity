import {useToast} from '@sanity/ui'
import {formatInTimeZone, utcToZonedTime, zonedTimeToUtc} from 'date-fns-tz'
import {useCallback, useEffect, useMemo, useState} from 'react'

import ToastDescription from '../scheduledPublishing/components/toastDescription/ToastDescription'
import {DATE_FORMAT} from '../scheduledPublishing/constants'
import {type NormalizedTimeZone} from '../scheduledPublishing/types'
import {debugWithName} from '../scheduledPublishing/utils/debug'
import getErrorMessage from '../scheduledPublishing/utils/getErrorMessage'

enum TimeZoneEvents {
  update = 'timeZoneEventUpdate',
}

export type TimeZoneScopeType = 'scheduledPublishing' | 'contentReleases' | 'input'

type NoIdRequiredTypes = 'scheduledPublishing' | 'contentReleases'
type IdRequiredTypes = 'input'

type ReleasesOrScheduledPublishingScope = {
  type: NoIdRequiredTypes
  defaultTimeZone?: string
}

type InputScope = {
  type: IdRequiredTypes
  id: string
  defaultTimeZone?: string
  relativeDate?: Date // offsets can change over time, so we use a relative date to get the offset
}

export type TimeZoneScope = ReleasesOrScheduledPublishingScope | InputScope

const debug = debugWithName('useScheduleOperation')

export const timeZoneLocalStorageNamespace = 'timeZone.'

const timeZoneCache = new Map<string, NormalizedTimeZone[]>()
const offsetCache = new Map<
  string,
  {abbreviation: string; alternativeName: string; offset: string}
>()

const offsetToMinutes = (offset: string): number => {
  if (!offset) return 0
  const multiplier = offset.startsWith('-') ? -1 : 1
  if (!offset.includes(':')) return multiplier * Number(offset.replace(/[+-]/, '')) * 60

  const [hours, minutes] = offset.replace(/[+-]/, '').split(':').map(Number)
  return multiplier * (hours * 60 + minutes)
}

function getCachedTimeZoneInfo(
  locale: string,
  canonicalIdentifier: string,
  relativeDateForZones?: Date,
): {abbreviation: string; alternativeName: string; offset: string} {
  const dateKey = relativeDateForZones?.toISOString().slice(0, 10) || 'now'
  const cacheKey = `${locale}_${canonicalIdentifier}_${dateKey}`
  // relative date is not used for caching, but it's used to invalidate the cache when it changes
  if (offsetCache.has(cacheKey)) {
    return offsetCache.get(cacheKey)!
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: canonicalIdentifier,
    timeZoneName: 'long',
  })

  const shortFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: canonicalIdentifier,
    timeZoneName: 'short',
  })

  const dateToUse = relativeDateForZones ?? new Date()
  const parts = formatter.formatToParts(dateToUse)
  const shortParts = shortFormatter.formatToParts(dateToUse)
  const rawOffset = formatInTimeZone(dateToUse, canonicalIdentifier, 'xxx')
  // If the offset is +02:00 then we can just show +2, if it has +13:45 then we should show +13:45, remove the leading +0 and just leave a + if a number under 10, remove the :00 at the end
  const offset = rawOffset
    .replace(/([+-])0(\d)/, '$1$2')
    .replace(/([+-])0$/, '$1')
    .replace(/:00$/, '')
    .replace(/[+]0$/, '')

  const info = {
    abbreviation: shortParts.find(({type}) => type === 'timeZoneName')?.value || '',
    alternativeName: parts.find(({type}) => type === 'timeZoneName')?.value || '',
    offset,
  }

  offsetCache.set(cacheKey, info)
  return info
}

function isValidLocale(locale: string): boolean {
  try {
    const formatter = new Intl.DateTimeFormat(locale)
    return formatter !== null
  } catch {
    return false
  }
}

function computeAllTimeZones(locale: string, relativeDate?: Date): NormalizedTimeZone[] {
  const timeZones = Intl.supportedValuesOf('timeZone')
    .map((tzName): NormalizedTimeZone | null => {
      // Skip if timezone name doesn't contain a city (should have a '/')
      if (!tzName.includes('/')) return null

      const validLocale = isValidLocale(locale) ? locale : 'en-US'

      if (!isValidLocale(locale)) {
        throw new Error(`Not supported locale: ${locale}`)
      }

      const {alternativeName, abbreviation, offset} = getCachedTimeZoneInfo(
        validLocale,
        tzName,
        relativeDate,
      )
      const [, city] = tzName.split('/')
      return {
        abbreviation,
        alternativeName,
        city: city.replaceAll('_', ' '),
        name: tzName,
        namePretty: tzName.replaceAll('_', ' '),
        offset,
        value: `${offset} ${abbreviation} ${tzName} ${alternativeName}`,
      }
    })
    .filter((tz): tz is NormalizedTimeZone => tz !== null)
    .sort(
      (a: NormalizedTimeZone, b: NormalizedTimeZone) =>
        offsetToMinutes(a.offset) - offsetToMinutes(b.offset),
    )

  return timeZones
}

function getGloballyCachedTimeZones(locale: string, relativeDate?: Date): NormalizedTimeZone[] {
  const cacheKey = `${locale}_${relativeDate?.toISOString().slice(0, 10) || 'now'}`

  if (timeZoneCache.has(cacheKey)) {
    return timeZoneCache.get(cacheKey)!
  }

  const computedTimeZones = computeAllTimeZones(locale, relativeDate)
  timeZoneCache.set(cacheKey, computedTimeZones)
  return computedTimeZones
}

export const useTimeZone = (scope: TimeZoneScope) => {
  const toast = useToast()
  const currentLocale = navigator.language
  const {defaultTimeZone} = scope
  const localStorageId =
    'id' in scope
      ? `${timeZoneLocalStorageNamespace}${scope.type}.${scope.id}`
      : `${timeZoneLocalStorageNamespace}${scope.type}`
  const relativeDate = 'relativeDate' in scope ? scope.relativeDate : undefined

  const allTimeZones: NormalizedTimeZone[] = useMemo(() => {
    return getGloballyCachedTimeZones(currentLocale, relativeDate)
  }, [currentLocale, relativeDate])

  const getDefaultTimeZone = useCallback((): NormalizedTimeZone | undefined => {
    const normalizedDefaultTimezone = defaultTimeZone
      ? allTimeZones.find((tz: NormalizedTimeZone) => tz.name === defaultTimeZone)
      : undefined
    return normalizedDefaultTimezone
  }, [allTimeZones, defaultTimeZone])

  const getStoredTimeZone = useCallback((): NormalizedTimeZone | undefined => {
    const storedTimeZone = localStorage.getItem(localStorageId)
    if (!storedTimeZone) return undefined

    try {
      const wholeTimeZone = allTimeZones.find((tz) => tz.name === storedTimeZone)

      if (
        wholeTimeZone &&
        allTimeZones.some((tz: NormalizedTimeZone) => tz.name === wholeTimeZone.name)
      ) {
        return wholeTimeZone
      }

      const fallbackTimeZone = allTimeZones.find((tz) => tz.offset === wholeTimeZone?.offset)
      if (fallbackTimeZone) {
        localStorage.setItem(localStorageId, fallbackTimeZone.name)
        return fallbackTimeZone
      }
    } catch {
      return undefined
    }
    return undefined
  }, [allTimeZones, localStorageId])

  const getLocalTimeZone = useCallback((): NormalizedTimeZone => {
    const localTzName = Intl.DateTimeFormat().resolvedOptions().timeZone
    const foundLocal = allTimeZones.find((tz) => tz.name === localTzName)
    if (foundLocal) return foundLocal

    // Fallback
    const gmt = allTimeZones.find((timeZone) => timeZone.abbreviation === 'GMT')
    if (gmt) return gmt

    return allTimeZones[0]
  }, [allTimeZones])

  const getInitialTimeZone = useCallback((): NormalizedTimeZone => {
    return getStoredTimeZone() || getDefaultTimeZone() || getLocalTimeZone()
  }, [getStoredTimeZone, getDefaultTimeZone, getLocalTimeZone])

  const [timeZone, setTimeZone] = useState<NormalizedTimeZone>(() => getInitialTimeZone())

  useEffect(() => {
    setTimeZone(getInitialTimeZone())
  }, [getInitialTimeZone])

  useEffect(() => {
    const handler = () => {
      setTimeZone(getInitialTimeZone())
    }

    window.addEventListener(TimeZoneEvents.update, handler)
    return () => {
      window.removeEventListener(TimeZoneEvents.update, handler)
    }
  }, [getInitialTimeZone, localStorageId])

  const formatDateTz = useCallback(
    ({
      date,
      format = DATE_FORMAT.LARGE,
      includeTimeZone,
      prefix,
    }: {
      date: Date
      format?: string
      includeTimeZone?: boolean
      prefix?: string
    }) => {
      let dateFormat = format
      if (prefix) {
        dateFormat = `'${prefix}'${format}`
      }
      if (includeTimeZone) {
        dateFormat = `${format} (zzzz)`
      }
      return formatInTimeZone(date, timeZone?.name || getLocalTimeZone()?.name || 'UTC', dateFormat)
    },
    [timeZone, getLocalTimeZone],
  )

  const getCurrentZoneDate = useCallback(() => {
    if (!timeZone) return new Date()
    return utcToZonedTime(new Date(), timeZone.name)
  }, [timeZone])

  const getTimeZone = useCallback(
    (tzValue: string): NormalizedTimeZone =>
      allTimeZones.find((tz) => tzValue === tz.value) || getInitialTimeZone(),
    [allTimeZones, getInitialTimeZone],
  )

  const handleNewValue = useCallback(
    (tz: NormalizedTimeZone) => {
      debug('handleNewValue:', tz)

      setTimeZone((prevTz) => {
        try {
          if (prevTz?.name !== tz.name) {
            localStorage.setItem(localStorageId, tz.name)
            window.dispatchEvent(new Event(TimeZoneEvents.update))
          }

          toast.push({
            closable: true,
            description: (
              <ToastDescription
                body={`${tz.alternativeName} (${tz.namePretty})`}
                title="Time zone updated"
              />
            ),
            duration: 15000,
            status: 'info',
          })
        } catch (err) {
          console.error(err)

          toast.push({
            closable: true,
            description: (
              <ToastDescription body={getErrorMessage(err)} title="Unable to update time zone" />
            ),
            status: 'error',
          })
        }

        return tz
      })
    },
    [localStorageId, toast],
  )

  const utcToCurrentZoneDate = useCallback(
    (date: Date) => {
      if (!timeZone) return date
      return utcToZonedTime(date, timeZone.name)
    },
    [timeZone],
  )

  const zoneDateToUtc = useCallback(
    (date: Date) => {
      if (!timeZone) return date
      return zonedTimeToUtc(date, timeZone.name)
    },
    [timeZone],
  )

  return useMemo(
    () => ({
      formatDateTz,
      getCurrentZoneDate,
      setTimeZone: handleNewValue,
      timeZone,
      allTimeZones,
      getLocalTimeZone,
      getTimeZone,
      utcToCurrentZoneDate,
      zoneDateToUtc,
    }),
    [
      formatDateTz,
      getCurrentZoneDate,
      handleNewValue,
      timeZone,
      allTimeZones,
      getLocalTimeZone,
      getTimeZone,
      utcToCurrentZoneDate,
      zoneDateToUtc,
    ],
  )
}
