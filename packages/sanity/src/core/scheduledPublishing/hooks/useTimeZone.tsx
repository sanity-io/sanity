import {useToast} from '@sanity/ui'
import {getTimeZones} from '@vvo/tzdb'
import {formatInTimeZone, utcToZonedTime, zonedTimeToUtc} from 'date-fns-tz'
import {useCallback, useEffect, useState} from 'react'

import ToastDescription from '../components/toastDescription/ToastDescription'
import {DATE_FORMAT, LOCAL_STORAGE_TZ_KEY} from '../constants'
import {type NormalizedTimeZone} from '../types'
import {debugWithName} from '../utils/debug'
import getErrorMessage from '../utils/getErrorMessage'

enum TimeZoneEvents {
  update = 'timeZoneEventUpdate',
}

const debug = debugWithName('useScheduleOperation')

// Map through only the values we care about
export const allTimeZones: NormalizedTimeZone[] = getTimeZones().map((tz) => {
  return {
    abbreviation: tz.abbreviation,
    alternativeName: tz.alternativeName,
    mainCities: tz.mainCities.join(', '),
    // Main time zone name 'Africa/Dar_es_Salaam'
    name: tz.name,
    // Time zone name with underscores removed
    namePretty: tz.name.replaceAll('_', ' '),
    offset: tz.currentTimeFormat.split(' ')[0],
    // all searchable text - this is transformed before being rendered in `<AutoComplete>`
    value: `${tz.currentTimeFormat} ${tz.abbreviation} ${tz.name}`,
  } as NormalizedTimeZone
})

export function getLocalTimeZone(): NormalizedTimeZone {
  return (
    allTimeZones.find((tz) => tz.name === Intl.DateTimeFormat().resolvedOptions().timeZone) ||
    // Default to GMT-0 if no user timeZone is found
    allTimeZones.find((timeZone) => timeZone.abbreviation === 'GMT') ||
    // Return the first time zone as a fallback
    allTimeZones[0]
  )
}

function getStoredTimeZone(): NormalizedTimeZone {
  const storedTimeZone = localStorage.getItem(LOCAL_STORAGE_TZ_KEY)
  try {
    if (storedTimeZone) {
      return JSON.parse(storedTimeZone)
    }
  } catch (error) {
    // invalid value (non-JSON) - fallback to local timeZone
  }

  return getLocalTimeZone()
}

const useTimeZone = () => {
  const [timeZone, setTimeZone] = useState<NormalizedTimeZone>(() => getStoredTimeZone())
  const toast = useToast()

  useEffect(() => {
    const handler = () => {
      // When updated in another hook instance, just fetch from localStorage
      setTimeZone(getStoredTimeZone())
    }

    window.addEventListener(TimeZoneEvents.update, handler)
    return () => {
      window.removeEventListener(TimeZoneEvents.update, handler)
    }
  }, [])

  /**
   * Return time-zone adjusted date in a date-fns supported format
   */
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

  const handleNewValue = useCallback(
    (tz: NormalizedTimeZone) => {
      debug('handleNewValue:', tz)

      setTimeZone((prevTz) => {
        try {
          // If different from current state, update localStorage & notify other instances
          if (prevTz.name !== tz.name) {
            localStorage.setItem(LOCAL_STORAGE_TZ_KEY, JSON.stringify(tz))
            window.dispatchEvent(new Event(TimeZoneEvents.update))
          }
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
    [toast],
  )

  const utcToCurrentZoneDate = useCallback(
    (date: Date) => utcToZonedTime(date, timeZone.name),
    [timeZone.name],
  )

  const zoneDateToUtc = useCallback(
    (date: Date) => zonedTimeToUtc(date, timeZone.name),
    [timeZone.name],
  )

  return {
    formatDateTz,
    getCurrentZoneDate,
    setTimeZone: handleNewValue,
    timeZone,
    utcToCurrentZoneDate,
    zoneDateToUtc,
  }
}

export default useTimeZone
