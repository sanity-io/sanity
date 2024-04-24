import {Text} from '@sanity/ui'
import {formatDistance} from 'date-fns'

import {Tooltip} from '../../../../../ui-components'
import {DATE_FORMAT} from '../../../constants'
import useTimeZone from '../../../hooks/useTimeZone'

interface Props {
  date: Date // local date in UTC
  useElementQueries?: boolean
}

/**
 * If `useElementQueries` is enabled, dates will be conditionally toggled at different element
 * breakpoints, provided this `<DateWithTooltip>` is wrapped in a `<DateElementQuery>` component.
 */
const DateWithTooltip = (props: Props) => {
  const {date, useElementQueries} = props

  const {formatDateTz} = useTimeZone()

  // Get distance between both dates
  const distance = formatDistance(date, new Date(), {
    addSuffix: true,
  })

  const dateTimeLarge = formatDateTz({date, format: DATE_FORMAT.LARGE})
  const dateTimeMedium = formatDateTz({date, format: DATE_FORMAT.MEDIUM})
  const dateTimeSmall = formatDateTz({date, format: DATE_FORMAT.SMALL})

  return (
    <Text size={1} textOverflow="ellipsis">
      <Tooltip content={distance} portal>
        <span>
          {useElementQueries ? (
            <>
              <span className="date-small">{dateTimeSmall}</span>
              <span className="date-medium">{dateTimeMedium}</span>
              <span className="date-large">{dateTimeLarge}</span>
            </>
          ) : (
            dateTimeLarge
          )}
        </span>
      </Tooltip>
    </Text>
  )
}

export default DateWithTooltip
