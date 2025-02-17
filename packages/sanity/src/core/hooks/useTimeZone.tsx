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

// Create a type helper to ensure we don't miss any cases
type NoIdRequiredTypes = 'scheduledPublishing' | 'contentReleases'
type IdRequiredTypes = 'input'

type ReleasesOrScheduledPublishingScope = {
  type: NoIdRequiredTypes
  defaultTimeZone?: string
}

type InputOrDocumentScope = {
  type: IdRequiredTypes
  id: string
  defaultTimeZone?: string
}

export type TimeZoneScope = ReleasesOrScheduledPublishingScope | InputOrDocumentScope

const debug = debugWithName('useScheduleOperation')

const timeZoneLocalStorageNamespace = 'timeZone.'

// Add cache outside component to persist between renders
const timeZoneCache = new Map<
  string,
  {
    abbreviation: string
    alternativeName: string
    offset: string
  }
>()

// Add helper to convert offset string to minutes for sorting
const offsetToMinutes = (offset: string): number => {
  if (!offset) return 0
  const multiplier = offset.startsWith('-') ? -1 : 1
  if (!offset.includes(':')) return multiplier * Number(offset.replace(/[+-]/, '')) * 60

  const [hours, minutes] = offset.replace(/[+-]/, '').split(':').map(Number)
  return multiplier * (hours * 60 + minutes)
}

const useTimeZone = (scope: TimeZoneScope) => {
  const toast = useToast()
  const currentLocale = navigator.language
  const {defaultTimeZone} = scope
  const localStorageId =
    'id' in scope
      ? `${timeZoneLocalStorageNamespace}${scope.type}.${scope.id}`
      : `${timeZoneLocalStorageNamespace}${scope.type}`

  // Batch process timezone info with a single formatter per timezone
  const getTimeZoneInfo = useCallback(
    (
      canonicalIdentifier: string,
    ): {abbreviation: string; alternativeName: string; offset: string} => {
      if (timeZoneCache.has(canonicalIdentifier)) {
        return timeZoneCache.get(canonicalIdentifier)!
      }

      const formatter = new Intl.DateTimeFormat(currentLocale, {
        timeZone: canonicalIdentifier,
        timeZoneName: 'long',
      })

      const shortFormatter = new Intl.DateTimeFormat(currentLocale, {
        timeZone: canonicalIdentifier,
        timeZoneName: 'short',
      })

      const parts = formatter.formatToParts(new Date())
      const shortParts = shortFormatter.formatToParts(new Date())
      const rawOffset = formatInTimeZone(new Date(), canonicalIdentifier, 'xxx')
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

      timeZoneCache.set(canonicalIdentifier, info)
      return info
    },
    [currentLocale],
  )

  const allTimeZones: NormalizedTimeZone[] = useMemo(
    () =>
      Intl.supportedValuesOf('timeZone')
        .map((tzName): NormalizedTimeZone | null => {
          // Skip if timezone name doesn't contain a city (should have a '/')
          if (!tzName.includes('/')) return null

          const {alternativeName, abbreviation, offset} = getTimeZoneInfo(tzName)
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
        ),
    [getTimeZoneInfo],
  )

  const getDefaultTimeZone = useCallback((): NormalizedTimeZone | undefined => {
    const normalizedDefaultTimezone = defaultTimeZone
      ? allTimeZones.find((tz: NormalizedTimeZone) => tz.name === defaultTimeZone)
      : undefined
    return normalizedDefaultTimezone
  }, [allTimeZones, defaultTimeZone])

  const getStoredTimeZone = useCallback((): NormalizedTimeZone | undefined => {
    // Try to get timezone from localStorage
    const storedTimeZone = localStorage.getItem(localStorageId)
    if (!storedTimeZone) return undefined

    try {
      const parsedTimeZone = JSON.parse(storedTimeZone)

      // Check if stored timezone still exists in our available timezones
      if (allTimeZones.some((tz: NormalizedTimeZone) => tz.name === parsedTimeZone.name)) {
        return parsedTimeZone
      }

      // If original timezone not found [malformed or timezones change], try to find one with same offset
      const fallbackTimeZone = allTimeZones.find((tz) => tz.offset === parsedTimeZone.offset)
      if (fallbackTimeZone) {
        localStorage.setItem(localStorageId, JSON.stringify(fallbackTimeZone))
        return fallbackTimeZone
      }
    } catch {
      // If parsing fails, return undefined
      return undefined
    }
    return undefined
  }, [allTimeZones, localStorageId])

  const getLocalTimeZone = useCallback(
    () =>
      allTimeZones.find((tz) => tz.name === Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      allTimeZones.find((timeZone) => timeZone.abbreviation === 'GMT') ||
      allTimeZones[0],

    [allTimeZones],
  )

  const getInitialTimeZone = useCallback(
    (): NormalizedTimeZone => getStoredTimeZone() || getDefaultTimeZone() || getLocalTimeZone(),
    [getStoredTimeZone, getDefaultTimeZone, getLocalTimeZone],
  )

  const [timeZone, setTimeZone] = useState<NormalizedTimeZone>(getInitialTimeZone())

  useEffect(() => {
    const handler = () => {
      setTimeZone(getInitialTimeZone())
    }

    window.addEventListener(TimeZoneEvents.update, handler)
    return () => {
      window.removeEventListener(TimeZoneEvents.update, handler)
    }
  }, [getInitialTimeZone, getStoredTimeZone, localStorageId])

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
      return formatInTimeZone(date, timeZone.name, dateFormat)
    },
    [timeZone.name],
  )

  const getCurrentZoneDate = useCallback(
    () => utcToZonedTime(new Date(), timeZone.name),
    [timeZone.name],
  )

  const getTimeZone = useCallback(
    (tzValue: string): NormalizedTimeZone | undefined =>
      allTimeZones.find((tz) => tzValue === tz.value),
    [allTimeZones],
  )

  const handleNewValue = useCallback(
    (tz: NormalizedTimeZone) => {
      debug('handleNewValue:', tz)

      setTimeZone((prevTz) => {
        try {
          if (prevTz.name !== tz.name) {
            localStorage.setItem(localStorageId, JSON.stringify(tz))
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
    (date: Date) => utcToZonedTime(date, timeZone.name),
    [timeZone.name],
  )

  const zoneDateToUtc = useCallback(
    (date: Date) => zonedTimeToUtc(date, timeZone.name),
    [timeZone.name],
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

export default useTimeZone
