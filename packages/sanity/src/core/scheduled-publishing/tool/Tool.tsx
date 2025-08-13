import {Box, Container, Flex, Text, useTheme} from '@sanity/ui'
import {parse} from 'date-fns'
import {useEffect, useMemo, useRef} from 'react'
import {type RouterContextValue, useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
import {TimeZoneButton} from '../../components/timeZone/timeZoneButton/TimeZoneButton'
import {useTimeZone} from '../../hooks/useTimeZone'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useReleasesToolAvailable} from '../../releases/hooks/useReleasesToolAvailable'
import {useScheduledPublishingEnabled} from '../../scheduledPublishing/contexts/ScheduledPublishingEnabledProvider'
import {useWorkspace} from '../../studio/workspace'
import TimeZoneButtonElementQuery from '../components/dialogs/TimeZoneButtonElementQuery'
import ErrorCallout from '../components/errorCallout/ErrorCallout'
import InfoCallout from '../components/infoCallout/InfoCallout'
import {WarningBanner} from '../components/warningBanner/WarningBanner'
import {
  SCHEDULE_FILTERS,
  SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE,
  TOOL_HEADER_HEIGHT,
} from '../constants'
import usePollSchedules from '../hooks/usePollSchedules'
import {type Schedule, type ScheduleState} from '../types'
import {SchedulesProvider} from './contexts/schedules'
import {ScheduleFilters} from './scheduleFilters/ScheduleFilters'
import {Schedules} from './schedules/Schedules'
import SchedulesContextMenu from './schedulesContextMenu/SchedulesContextMenu'
import {ToolCalendar} from './toolCalendar/ToolCalendar'

const Column = styled(Box)`
  flex-direction: column;
  &:not(:last-child) {
    border-right: 1px solid var(--card-border-color);
  }
`

const NO_SCHEDULE: Schedule[] = []
const DATE_SLUG_FORMAT = 'yyyy-MM-dd' // date-fns format

export default function Tool() {
  const router = useRouter()
  const {scheduledPublishing, releases} = useWorkspace()
  const releasesToolAvailable = useReleasesToolAvailable()

  const {sanity: theme} = useTheme()
  const {error, isInitialLoading, schedules = NO_SCHEDULE} = usePollSchedules()
  const {t} = useTranslation()
  const {enabled, hasUsedScheduledPublishing} = useScheduledPublishingEnabled()

  const lastScheduleState = useRef<ScheduleState | undefined>(undefined)

  const scheduleState: ScheduleState = router.state.state as ScheduleState
  const selectedDate = router.state.date
    ? parse(router.state.date as string, DATE_SLUG_FORMAT, new Date())
    : undefined

  //Store last active schedule state
  useEffect(() => {
    if (router.state.state) {
      lastScheduleState.current = router.state.state as ScheduleState
    }
  }, [router.state.state])

  // Default to first filter type ('upcoming') if no existing schedule state or
  // selected date can be inferred from current route.
  useFallbackNavigation(router, scheduleState, selectedDate)
  const timeZoneScope = SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE
  const {formatDateTz, timeZone} = useTimeZone(timeZoneScope)

  const schedulesContext = useMemo(
    () => ({
      schedules,
      scheduleState,
      selectedDate,
    }),
    [schedules, scheduleState, selectedDate],
  )

  const handleClearDate = () => {
    router.navigate({state: lastScheduleState?.current || SCHEDULE_FILTERS[0]})
  }

  const handleSelectDate = (date?: Date) => {
    if (date) {
      router.navigate({date: formatDateTz({date, format: DATE_SLUG_FORMAT})})
    } else {
      router.navigate({state: lastScheduleState?.current || SCHEDULE_FILTERS[0]})
    }
  }

  if (!enabled) {
    if (scheduledPublishing.__internal__workspaceEnabled) {
      return (
        <Container width={1} paddingTop={4}>
          <Box paddingTop={4} paddingX={4}>
            <ErrorCallout
              description="Something went wrong loading permissions, please try again."
              title="Permissions check failed"
            />
          </Box>
        </Container>
      )
    }
    // This is for the case users lands in the tool rout without having the feature enabled.
    return (
      <Container width={1} paddingTop={4}>
        <Box paddingTop={4} paddingX={4}>
          {hasUsedScheduledPublishing.loading ? <LoadingBlock /> : <InfoCallout />}
        </Box>
      </Container>
    )
  }

  return (
    <SchedulesProvider value={schedulesContext}>
      {releasesToolAvailable && scheduledPublishing.showReleasesBanner && <WarningBanner />}
      <Flex direction="column" height="fill" flex={1} overflow="hidden">
        <Flex flex={1} height="fill">
          {/* LHS Column */}
          <Column
            display={['none', null, null, 'flex'] as any}
            style={{
              position: 'sticky',
              top: 0,
              width: '350px',
            }}
          >
            <ToolCalendar
              onSelect={handleSelectDate}
              timeZoneScope={timeZoneScope}
              selectedDate={selectedDate}
            />
          </Column>
          {/* RHS Column */}
          <Column display="flex" flex={1} overflow="hidden">
            <TimeZoneButtonElementQuery
              style={{
                background: theme.color.card.enabled.bg,
                position: 'sticky',
                top: 0,
                zIndex: 1,
              }}
            >
              {/* Header */}
              <Flex
                align="center"
                paddingLeft={4}
                paddingRight={3}
                style={{
                  borderBottom: '1px solid var(--card-border-color)',
                  minHeight: `${TOOL_HEADER_HEIGHT}px`,
                }}
              >
                <Flex align="center" flex={1} justify="space-between">
                  {/* Filters */}
                  <ScheduleFilters onClearDate={handleClearDate} selectedDate={selectedDate} />

                  {/* Time zone select + context menu */}
                  <Flex align="center" gap={1}>
                    <TimeZoneButton
                      tooltipContent={t('time-zone.time-zone-tooltip-content-releases', {
                        alternativeName: timeZone.alternativeName,
                        offset: timeZone.offset,
                      })}
                      timeZoneScope={timeZoneScope}
                      useElementQueries
                    />
                    <SchedulesContextMenu />
                  </Flex>
                </Flex>
              </Flex>
            </TimeZoneButtonElementQuery>
            <Flex direction="column" flex={1}>
              {/* Error */}
              {error && (
                <Box paddingTop={4} paddingX={4}>
                  <ErrorCallout
                    description="More information in the developer console."
                    title="Something went wrong, unable to retrieve schedules."
                  />
                </Box>
              )}

              <Box flex={1} overflow="auto">
                {isInitialLoading ? (
                  <Box padding={4}>
                    <Text muted>Loading...</Text>
                  </Box>
                ) : (
                  // Loaded schedules
                  <Schedules />
                )}
              </Box>
            </Flex>
          </Column>
        </Flex>
      </Flex>
    </SchedulesProvider>
  )
}

function useFallbackNavigation(
  router: RouterContextValue,
  filter?: ScheduleState,
  selectedDate?: Date,
) {
  useEffect(() => {
    if (!filter && !selectedDate) {
      router.navigate({state: SCHEDULE_FILTERS[0]}, {replace: true})
    }
  }, [selectedDate, router, filter])
}
