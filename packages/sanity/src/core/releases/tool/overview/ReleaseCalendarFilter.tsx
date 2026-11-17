import {CloseIcon} from '@sanity/icons/Close'
import {format} from 'date-fns/format'
import {AnimatePresence, motion} from 'motion/react'
import {useMemo, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {
  CalendarDay,
  type CalendarDayProps,
} from '../../../components/inputs/DateFilters/calendar/CalendarDay'
import {type CalendarProps} from '../../../components/inputs/DateFilters/calendar/CalendarFilter'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../../i18n'
import {useActiveReleases} from '../../store/useActiveReleases'
import {type ReleaseDateFilter} from '../../util/releaseDateFilter'
import {shouldShowReleaseInView} from '../../util/util'
import {type CardinalityView} from './queryParamUtils'
import {useTimezoneAdjustedDateTimeRange} from './useTimezoneAdjustedDateTimeRange'

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

function ReleasesCalendarFilterDay(props: CalendarDayProps) {
  return <ReleaseCalendarFilterDayWithCardinality {...props} cardinalityView="releases" />
}

function AllCalendarFilterDay(props: CalendarDayProps) {
  return <ReleaseCalendarFilterDayWithCardinality {...props} cardinalityView="all" />
}

function DraftsCalendarFilterDay(props: CalendarDayProps) {
  return <ReleaseCalendarFilterDayWithCardinality {...props} cardinalityView="drafts" />
}

/**
 * One module-scope day component per cardinality view. `CalendarMonth` mounts `renderCalendarDay`
 * as a component type, so creating it per render (or per `cardinalityView` through a factory)
 * would remount every day cell of the calendar whenever the overview re-rendered.
 */
export const RELEASE_CALENDAR_FILTER_DAY: Record<
  CardinalityView,
  NonNullable<CalendarProps['renderCalendarDay']>
> = {
  releases: ReleasesCalendarFilterDay,
  drafts: DraftsCalendarFilterDay,
  all: AllCalendarFilterDay,
}

const MotionButton = motion.create(Button)

/** The chip text for a date filter: the day, "Week of 16 Nov 2026", "November 2026", or
 * "Unscheduled". */
export function useReleaseDateFilterLabel(filter: ReleaseDateFilter): string {
  const {t} = useTranslation(releasesLocaleNamespace)
  if (filter.kind === 'unscheduled') return t('filter-chip.unscheduled')
  if (filter.unit === 'week')
    return t('filter-chip.week', {date: format(filter.start, 'd MMM yyyy')})
  if (filter.unit === 'month') return format(filter.start, 'MMMM yyyy')
  return format(filter.start, 'PPP')
}

/**
 * The clearable chip next to the calendar that shows the active date filter, whether it came from
 * the calendar (a day) or the timeline (a week, a month, or Unscheduled). There is one filter at a
 * time, so one chip.
 */
export const DateFilterButton = ({
  filter,
  onClear,
}: {
  filter: ReleaseDateFilter
  onClear: () => void
}) => {
  const [isExiting, setIsExiting] = useState(false)
  const text = useReleaseDateFilterLabel(filter)

  const handleOnExitComplete = useMemo(
    () => () => {
      setIsExiting(false)
      onClear()
    },
    [onClear],
  )

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
          text={text}
        />
      )}
    </AnimatePresence>
  )
}
