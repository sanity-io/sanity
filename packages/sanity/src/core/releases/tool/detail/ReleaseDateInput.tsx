import {format} from 'date-fns/format'
import {isBefore} from 'date-fns/isBefore'
import {isValid} from 'date-fns/isValid'
import {parse} from 'date-fns/parse'
import {startOfMinute} from 'date-fns/startOfMinute'
import {useCallback} from 'react'

import {LazyTextInput} from '../../../components/inputs/DateInputs/LazyTextInput'
import {useTimeZone} from '../../../hooks/useTimeZone'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'

export const dateInputFormat = 'PP HH:mm'

export function ReleaseDateInput(props: {
  setIsIntendedScheduleDateInPast: (isIntendedScheduleDateInPast: boolean) => void
  setIntendedPublishAt: (intendedPublishAt: Date) => void
  intendedPublishAt: Date | undefined
}): React.JSX.Element {
  const {setIsIntendedScheduleDateInPast, intendedPublishAt, setIntendedPublishAt} = props

  const {utcToCurrentZoneDate, zoneDateToUtc} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)

  const intendedPublishAtTimezoneAdjusted = intendedPublishAt
    ? utcToCurrentZoneDate(intendedPublishAt)
    : intendedPublishAt

  const handlePublishAtInputChange = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const parsedDate = zoneDateToUtc(
        parse(event.currentTarget.value, dateInputFormat, new Date()),
      )

      if (isValid(parsedDate)) {
        setIsIntendedScheduleDateInPast(isBefore(parsedDate, new Date()))

        setIntendedPublishAt(startOfMinute(parsedDate))
      }
    },
    [zoneDateToUtc, setIsIntendedScheduleDateInPast, setIntendedPublishAt],
  )

  return (
    <LazyTextInput
      data-testid="date-input"
      value={
        intendedPublishAtTimezoneAdjusted
          ? format(intendedPublishAtTimezoneAdjusted, dateInputFormat)
          : undefined
      }
      onChange={handlePublishAtInputChange}
    />
  )
}
