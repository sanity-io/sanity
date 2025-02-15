import {useToast} from '@sanity/ui'
import {formatInTimeZone, utcToZonedTime, zonedTimeToUtc} from 'date-fns-tz'
import {useCallback, useEffect, useMemo, useState} from 'react'

import ToastDescription from '../components/toastDescription/ToastDescription'
import {DATE_FORMAT, LOCAL_STORAGE_TZ_KEY} from '../constants'
import {type NormalizedTimeZone} from '../types'
import {debugWithName} from '../utils/debug'
import getErrorMessage from '../utils/getErrorMessage'

enum TimeZoneEvents {
  update = 'timeZoneEventUpdate',
}

const debug = debugWithName('useScheduleOperation')

// Add cache outside component to persist between renders
const timeZoneCache = new Map<
  string,
  {
    abbreviation: string
    longName: string
    cities: string[]
  }
>()

// Add helper to convert offset string to minutes for sorting
const offsetToMinutes = (offset: string): number => {
  const [hours, minutes] = offset.replace(/[+-]/, '').split(':').map(Number)
  const multiplier = offset.startsWith('-') ? -1 : 1
  return multiplier * (hours * 60 + minutes)
}

const useTimeZone = (defaultTimezone?: string, inputId?: string) => {
  const toast = useToast()
  const currentLocale = navigator.language
  const localStorageId = inputId ? `${LOCAL_STORAGE_TZ_KEY}-${inputId}` : LOCAL_STORAGE_TZ_KEY

  // Batch process timezone info with a single formatter per timezone
  const getTimeZoneInfo = useCallback(
    (canonicalIdentifier: string) => {
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

      const info = {
        abbreviation: shortParts.find(({type}) => type === 'timeZoneName')?.value || '',
        longName: parts.find(({type}) => type === 'timeZoneName')?.value || '',
      }

      timeZoneCache.set(canonicalIdentifier, info)
      return info
    },
    [currentLocale],
  )

  const allTimeZones = useMemo((): NormalizedTimeZone[] => {
    const zones = Intl.supportedValuesOf('timeZone')
    const currentDate = new Date()
    const progressiveCities: Record<string, string[]> = {}

    const rawZones = zones
      .map((tz) => {
        const info = getTimeZoneInfo(tz)
        const offset = formatInTimeZone(currentDate, tz, 'xxx')
        const cityName = tz.split('/')[1].replaceAll('_', ' ')
        progressiveCities[info.longName] = [...(progressiveCities[info.longName] || []), cityName]
        return Object.values(progressiveCities[info.longName]).length === 1
          ? {
              abbreviation: info.abbreviation,
              alternativeName: info.longName,
              mainCities: '',
              name: tz,
              namePretty: tz.replaceAll('_', ' '),
              offset,
              value: `${offset} ${info.abbreviation} ${tz}`,
            }
          : undefined
      })
      .filter(Boolean)
      .sort((a, b) => {
        const offsetA = offsetToMinutes(a.offset)
        const offsetB = offsetToMinutes(b.offset)
        return offsetA - offsetB
      }) as NormalizedTimeZone[]

    const completedZones = rawZones.map((zone) => {
      const cities = progressiveCities[zone.alternativeName]
      zone.mainCities = cities?.join(', ') || ''
      return zone
    })

    return completedZones
  }, [getTimeZoneInfo])

  const getLocalTimeZone = useCallback(() => {
    return (
      allTimeZones.find((tz) => tz.name === Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      allTimeZones.find((timeZone) => timeZone.abbreviation === 'GMT') ||
      allTimeZones[0]
    )
  }, [allTimeZones])

  const getStoredTimeZone = useCallback((): NormalizedTimeZone => {
    const storedTimeZone = localStorage.getItem(localStorageId)
    if (storedTimeZone) {
      const parsedTimeZone = JSON.parse(storedTimeZone)
      if (allTimeZones.some((tz) => tz.name === parsedTimeZone.name)) {
        return parsedTimeZone
      }
    }
    return getLocalTimeZone()
  }, [allTimeZones, getLocalTimeZone, localStorageId])

  const [timeZone, setTimeZone] = useState<NormalizedTimeZone>(() => {
    const defaultTz =
      allTimeZones.find((tz) => tz.name === Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      allTimeZones[0]
    return defaultTz
  })

  useEffect(() => {
    const normalizedDefaultTimezone = allTimeZones.find((tz) => tz.name === defaultTimezone)
    setTimeZone(getStoredTimeZone() || normalizedDefaultTimezone || getLocalTimeZone())
  }, [allTimeZones, defaultTimezone, getLocalTimeZone, getStoredTimeZone, localStorageId])

  useEffect(() => {
    const handler = () => {
      setTimeZone(getStoredTimeZone())
    }

    window.addEventListener(TimeZoneEvents.update, handler)
    return () => {
      window.removeEventListener(TimeZoneEvents.update, handler)
    }
  }, [getStoredTimeZone, localStorageId])

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
