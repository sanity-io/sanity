import {CloseIcon} from '@sanity/icons'
import {format} from 'date-fns/format'
import {AnimatePresence, motion} from 'motion/react'
import {useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {
  CalendarDay,
  type CalendarDayProps,
} from '../../../components/inputs/DateFilters/calendar/CalendarDay'
import {type CalendarProps} from '../../../components/inputs/DateFilters/calendar/CalendarFilter'
import {useActiveReleases} from '../../store/useActiveReleases'
import {shouldShowReleaseInView} from '../../util/util'
import {type CardinalityView} from './queryParamUtils'
import {useTimezoneAdjustedDateTimeRange} from './useTimezoneAdjustedDateTimeRange'

export const ReleaseCalendarFilterDay: CalendarProps['renderCalendarDay'] = (props) => {
  const {data: releases} = useActiveReleases()
  const getTimezoneAdjustedDateTimeRange = useTimezoneAdjustedDateTimeRange()

  const {date} = props

  const [startOfDayForTimeZone, endOfDayForTimeZone] = getTimezoneAdjustedDateTimeRange(date)

  const dayHasReleases = releases?.some((release) => {
    const releasePublishAt = release.publishAt || release.metadata.intendedPublishAt
    if (!releasePublishAt) return false

    const publishDateUTC = new Date(releasePublishAt)

    return (
      release.metadata.releaseType === 'scheduled' &&
      publishDateUTC >= startOfDayForTimeZone &&
      publishDateUTC <= endOfDayForTimeZone
    )
  })

  return <CalendarDay {...props} dateStyles={dayHasReleases ? {fontWeight: 700} : {}} />
}

const ReleaseCalendarFilterDayWithCardinality = (
  props: CalendarDayProps & {
    cardinalityView: CardinalityView
  },
): React.ReactNode => {
  const {data: allReleases} = useActiveReleases()
  const getTimezoneAdjustedDateTimeRange = useTimezoneAdjustedDateTimeRange()

  const {date, cardinalityView, ...calendarDayProps} = props

  const [startOfDayForTimeZone, endOfDayForTimeZone] = getTimezoneAdjustedDateTimeRange(date)

  const releases = allReleases?.filter(shouldShowReleaseInView(cardinalityView))

  const dayHasReleases = releases?.some((release) => {
    const releasePublishAt = release.publishAt || release.metadata.intendedPublishAt
    if (!releasePublishAt) return false

    const publishDateUTC = new Date(releasePublishAt)

    return (
      release.metadata.releaseType === 'scheduled' &&
      publishDateUTC >= startOfDayForTimeZone &&
      publishDateUTC <= endOfDayForTimeZone
    )
  })

  return (
    <CalendarDay
      {...calendarDayProps}
      date={date}
      dateStyles={dayHasReleases ? {fontWeight: 700} : {}}
    />
  )
}

export const createReleaseCalendarFilterDay = (
  cardinalityView: CardinalityView,
): CalendarProps['renderCalendarDay'] => {
  const ReleaseCalendarFilterDayComponent = (props: CalendarDayProps) => (
    <ReleaseCalendarFilterDayWithCardinality {...props} cardinalityView={cardinalityView} />
  )
  ReleaseCalendarFilterDayComponent.displayName = 'ReleaseCalendarFilterDayComponent'
  return ReleaseCalendarFilterDayComponent
}

const MotionButton = motion.create(Button)

export const DateFilterButton = ({
  filterDate,
  onClear,
}: {
  filterDate: Date
  onClear: () => void
}) => {
  const [isExiting, setIsExiting] = useState(false)

  const handleOnExitComplete = useMemo(
    () => () => {
      setIsExiting(false)
      onClear()
    },
    [onClear],
  )

  if (!filterDate) return null

  return (
    <AnimatePresence onExitComplete={handleOnExitComplete}>
      {!isExiting && (
        <MotionButton
          data-testid="selected-date-filter"
          initial={{width: 0, opacity: 0}}
          animate={{width: 'auto', opacity: 1}}
          exit={{width: 0, opacity: 0}}
          transition={{duration: 0.35, ease: 'easeInOut'}}
          iconRight={CloseIcon}
          mode="bleed"
          onClick={() => setIsExiting(true)}
          selected
          text={format(filterDate, 'PPP')}
        />
      )}
    </AnimatePresence>
  )
}
