import {CloseIcon} from '@sanity/icons'
import {Badge, Box, Card, type CardTone, Flex, Inline, Label, Stack, Text} from '@sanity/ui'
import {format, isWeekend} from 'date-fns'
import {useCallback, useMemo} from 'react'

import {Tooltip} from '../../../../ui-components'
import {SCHEDULE_ACTION_DICTIONARY, SCHEDULE_STATE_DICTIONARY} from '../../constants'
import useTimeZone from '../../hooks/useTimeZone'
import {type Schedule, type ScheduleState} from '../../types'
import {getLastExecuteDate} from '../../utils/scheduleUtils'
import {useSchedules} from '../contexts/schedules'
import Pip from './Pip'

interface CalendarDayProps {
  date: Date // clock time
  focused?: boolean
  onSelect: (date?: Date) => void
  isCurrentMonth?: boolean
  isToday: boolean
  selected?: boolean
}

export function CalendarDay(props: CalendarDayProps) {
  const {date, focused, isCurrentMonth, isToday, onSelect, selected} = props

  const {schedulesByDate} = useSchedules()

  const schedules = schedulesByDate(date)

  const handleClick = useCallback(() => {
    if (selected) {
      onSelect(undefined)
    } else {
      onSelect(date)
    }
  }, [date, onSelect, selected])

  let tone: CardTone
  if (isToday || selected) {
    tone = 'primary'
  } else if (isWeekend(date)) {
    // tone = 'transparent'
    tone = 'default'
  } else {
    tone = 'default'
  }

  const hasSchedules = schedules.length > 0

  // Parition schedules by state
  const {completed, failed, upcoming} = useMemo(() => {
    return {
      completed: schedules.filter((s) => s.state === 'succeeded'),
      failed: schedules.filter((s) => s.state === 'cancelled'),
      upcoming: schedules.filter((s) => s.state === 'scheduled'),
    }
  }, [schedules])

  return (
    <div aria-selected={selected} data-ui="CalendarDay">
      <Tooltip
        content={<TooltipContent date={date} schedules={schedules} />}
        disabled={!hasSchedules}
        portal
      >
        <Card
          aria-label={date.toDateString()}
          aria-pressed={selected}
          as="button"
          __unstable_focusRing
          data-weekday
          data-focused={focused ? 'true' : ''}
          role="button"
          tabIndex={-1}
          onClick={handleClick}
          paddingX={3}
          paddingY={4}
          radius={2}
          selected={selected}
          style={{position: 'relative'}}
          tone={tone}
        >
          <Text
            size={1}
            style={{
              opacity: !selected && !isCurrentMonth ? 0.35 : 1,
              textAlign: 'center',
            }}
          >
            {selected ? <CloseIcon /> : date.getDate()}
          </Text>

          {/* Pips */}
          <Box
            style={{
              bottom: 2,
              left: 2,
              position: 'absolute',
              right: 2,
            }}
          >
            <Flex align="center" gap={1} justify="center">
              {completed.length > 0 && <Pip selected={selected} />}
              {upcoming.length > 0 && <Pip selected={selected} />}
              {failed.length > 0 && <Pip mode="failed" selected={selected} />}
            </Flex>
          </Box>
        </Card>
      </Tooltip>
    </div>
  )
}

interface TooltipContentProps {
  date: Date
  schedules?: Schedule[]
}

type SchedulesByState = Record<ScheduleState, Schedule[]>

function TooltipContent(props: TooltipContentProps) {
  const {date, schedules = []} = props
  const {formatDateTz} = useTimeZone()

  const schedulesByState = schedules.reduce<SchedulesByState>(
    (acc, val) => {
      acc[val.state].push(val)
      return acc
    },
    {
      cancelled: [],
      succeeded: [],
      scheduled: [],
    },
  )

  return (
    <Box padding={3}>
      <Box marginBottom={4}>
        <Text size={1} weight="medium">
          {format(date, 'd MMMM yyyy')}
        </Text>
      </Box>
      <Stack space={3}>
        {(Object.keys(schedulesByState) as Array<keyof typeof schedulesByState>).map((key) => {
          const stateSchedules = schedulesByState[key]
          if (stateSchedules.length === 0) {
            return null
          }
          return (
            <Stack key={key} space={2}>
              <Label muted size={0}>
                {SCHEDULE_STATE_DICTIONARY[key].title}
              </Label>
              <Stack space={1}>
                {stateSchedules
                  .filter((schedule) => schedule.executeAt)
                  .map((schedule) => {
                    const executeDate = getLastExecuteDate(schedule)
                    if (!executeDate) {
                      return null
                    }

                    return (
                      <Inline key={schedule.id} space={2}>
                        <Box style={{width: '60px'}}>
                          <Text size={1} weight="regular">
                            {formatDateTz({date: new Date(executeDate), format: 'p'})}
                          </Text>
                        </Box>
                        {/* HACK: Hide non unpublish schedules to maintain layout */}
                        <Flex
                          align="center"
                          style={{flexShrink: 0, opacity: schedule.action === 'unpublish' ? 1 : 0}}
                        >
                          <Badge
                            fontSize={0}
                            mode="outline"
                            tone={SCHEDULE_ACTION_DICTIONARY[schedule.action].badgeTone}
                          >
                            {schedule.action}
                          </Badge>
                        </Flex>
                      </Inline>
                    )
                  })}
              </Stack>
            </Stack>
          )
        })}
      </Stack>
    </Box>
  )
}
