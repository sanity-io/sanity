import {CloseIcon} from '@sanity/icons'
import {format} from 'date-fns'
import {AnimatePresence, motion} from 'framer-motion'
import {useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {CalendarDay} from '../../../components/inputs/DateFilters/calendar/CalendarDay'
import {type CalendarProps} from '../../../components/inputs/DateFilters/calendar/CalendarFilter'
import {useActiveReleases} from '../../store/useActiveReleases'
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
