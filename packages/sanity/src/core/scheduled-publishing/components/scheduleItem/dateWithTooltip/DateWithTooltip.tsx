import {formatDistance} from 'date-fns/formatDistance'
import {Text} from 'ui5'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {useTimeZone} from '../../../../hooks/useTimeZone'
import {DATE_FORMAT} from '../../../../studio/timezones/constants'

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

  const {formatDateTz} = useTimeZone({type: 'scheduledPublishing'})

  // Get distance between both dates
  // oxlint-disable-next-line react/purity -- relative distance is measured from the current time
  const distance = formatDistance(date, new Date(), {
    addSuffix: true,
  })

  const dateTimeLarge = formatDateTz({date, format: DATE_FORMAT.LARGE})
  const dateTimeMedium = formatDateTz({date, format: DATE_FORMAT.MEDIUM})
  const dateTimeSmall = formatDateTz({date, format: DATE_FORMAT.SMALL})

  return (
    <Tooltip content={distance} portal>
      <Text size={1} truncate={1} as="div" trim={true}>
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
      </Text>
    </Tooltip>
  )
}

export default DateWithTooltip
