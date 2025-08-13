import {type ClientError} from '@sanity/client'
import {useToast} from '@sanity/ui'
import {sanitizeLocale} from '@sanity/util/legacyDateFormat'
import {formatInTimeZone, utcToZonedTime, zonedTimeToUtc} from 'date-fns-tz'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {startWith} from 'rxjs/operators'

import {useKeyValueStore} from '../store/_legacy/datastores'
import {DATE_FORMAT} from '../studio/timezones/constants'
import ToastDescription from '../studio/timezones/toastDescription/ToastDescription'
import {type NormalizedTimeZone} from '../studio/timezones/types'
import {debugWithName} from '../studio/timezones/utils/debug'

const TimeZoneEvents = {
  update: 'timeZoneEventUpdate' as const,
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

export const timeZoneLocalStorageNamespace = 'studio.timezone.'

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

  const formatter = new Intl.DateTimeFormat(sanitizeLocale(locale), {
    timeZone: canonicalIdentifier,
    timeZoneName: 'long',
  })

  const shortFormatter = new Intl.DateTimeFormat(sanitizeLocale(locale), {
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

function computeAllTimeZones(locale: string, relativeDate?: Date): NormalizedTimeZone[] {
  const timeZones = Intl.supportedValuesOf('timeZone')
    .map((tzName): NormalizedTimeZone | null => {
      // Skip if timezone name doesn't contain a city (should have a '/')
      if (!tzName.includes('/')) return null

      const {alternativeName, abbreviation, offset} = getCachedTimeZoneInfo(
        locale,
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

export const TIME_ZONE_SCOPE_TYPE = {
  scheduledPublishing: 'scheduled-publishing',
  contentReleases: 'content-releases',
  input: 'input',
}

export const useTimeZone = (scope: TimeZoneScope) => {
  const toast = useToast()
  const keyValueStore = useKeyValueStore()
  const currentLocale = navigator.language
  const {defaultTimeZone} = scope

  // used for the key to match formatting in cellar
  const type = TIME_ZONE_SCOPE_TYPE[scope.type]
  const keyStoreId =
    'id' in scope
      ? `${timeZoneLocalStorageNamespace}${type}.${scope.id}`
      : `${timeZoneLocalStorageNamespace}${type}`
  const relativeDate = 'relativeDate' in scope ? scope.relativeDate : undefined

  // Check for legacy localStorage key and migrate if needed
  // fall back for old way of handling timezones
  useEffect(() => {
    if (scope.type === 'scheduledPublishing') {
      const legacyKey = 'scheduled-publishing::time-zone'
      // the original value was kept as an object with the name
      const legacyValue = localStorage.getItem(legacyKey)

      if (legacyValue) {
        // Migrate the value to key-value store
        const scheduledPublishingValue = JSON.parse(legacyValue)
        keyValueStore.setKey(keyStoreId, scheduledPublishingValue.name)
        // Remove the legacy key
        localStorage.removeItem(legacyKey)
      }
    }
  }, [scope.type, keyValueStore, keyStoreId, currentLocale, relativeDate])

  const allTimeZones: NormalizedTimeZone[] = useMemo(() => {
    return getGloballyCachedTimeZones(currentLocale, relativeDate)
  }, [currentLocale, relativeDate])

  const getDefaultTimeZone = useCallback((): NormalizedTimeZone | undefined => {
    const normalizedDefaultTimezone = defaultTimeZone
      ? allTimeZones.find((tz: NormalizedTimeZone) => tz.name === defaultTimeZone)
      : undefined
    return normalizedDefaultTimezone
  }, [allTimeZones, defaultTimeZone])

  const keyValueTimeZone$ = useMemo(
    () => keyValueStore.getKey(keyStoreId).pipe(startWith(null)),
    [keyValueStore, keyStoreId],
  )

  const storedTimeZone = useObservable(keyValueTimeZone$, null)

  const getStoredTimeZone = useCallback((): NormalizedTimeZone | undefined => {
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
        keyValueStore.setKey(keyStoreId, fallbackTimeZone.name)
        return fallbackTimeZone
      }
    } catch {
      return undefined
    }
    return undefined
  }, [allTimeZones, keyStoreId, keyValueStore, storedTimeZone])

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
  }, [getInitialTimeZone])

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
            keyValueStore.setKey(keyStoreId, tz.name)
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
    [keyStoreId, toast, keyValueStore],
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

// this is used in place of `instanceof` so the matching can be more robust and
// won't have any issues with dual packages etc
// https://nodejs.org/api/packages.html#dual-package-hazard
function isClientError(e: unknown): e is ClientError {
  if (typeof e !== 'object') return false
  if (!e) return false
  return 'statusCode' in e && 'response' in e
}

function getErrorMessage(err: unknown): string {
  let message

  if (isClientError(err)) {
    // The request was made and the server responded with a status code
    if (err.response.statusCode === 403) {
      message = 'Forbidden. Please check that your project has access to the feature.'
    } else {
      message = err.message
    }
  } else {
    if (err instanceof Error) {
      message = err.message
    }
    message = String(err)
  }

  return message
}
