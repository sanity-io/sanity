import {CheckmarkIcon, CloseIcon, SelectIcon} from '@sanity/icons'
import {Box, Flex, Menu} from '@sanity/ui'
import {format} from 'date-fns'
import {useRouter} from 'sanity/router'

import {Button, MenuButton, MenuItem} from '../../../../ui-components'
import {SCHEDULE_FILTERS, SCHEDULE_STATE_DICTIONARY} from '../../constants'
import {useFilteredSchedules} from '../../hooks/useFilteredSchedules'
import {useSchedules} from '../contexts/schedules'
import ScheduleFilter from './ScheduleFilter'

export interface ScheduleFiltersProps {
  onClearDate: () => void
  selectedDate?: Date
}

export const ScheduleFilters = (props: ScheduleFiltersProps) => {
  const {onClearDate, selectedDate} = props
  const {navigate} = useRouter()
  const {schedules, scheduleState} = useSchedules()

  const handleMenuClick = (state: Record<string, unknown>) => {
    navigate(state)
  }

  const currentSchedules = useFilteredSchedules(schedules, scheduleState)

  return (
    <>
      {/* Small breakpoints: Menu button */}
      <Box display={['block', 'block', 'none']}>
        {selectedDate && (
          <Button
            iconRight={CloseIcon}
            onClick={onClearDate}
            text={format(selectedDate, 'd MMMM yyyy')}
            tone="primary"
          />
        )}

        {scheduleState && (
          <MenuButton
            button={
              <Button
                iconRight={SelectIcon}
                mode="ghost"
                text={`${SCHEDULE_STATE_DICTIONARY[scheduleState].title} (${
                  currentSchedules?.length || 0
                })`}
                tone="default"
              />
            }
            id="state"
            menu={
              <Menu style={{minWidth: '175px'}}>
                {SCHEDULE_FILTERS.map((filter) => (
                  <MenuItem
                    iconRight={filter === scheduleState ? CheckmarkIcon : undefined}
                    key={filter}
                    onClick={handleMenuClick.bind(undefined, {state: filter})}
                    text={SCHEDULE_STATE_DICTIONARY[filter].title}
                  />
                ))}
              </Menu>
            }
            placement="bottom"
          />
        )}
      </Box>

      {/* Larger breakpoints: Horizontal tabs */}
      <Box display={['none', 'none', 'block']}>
        {selectedDate && (
          <Button
            iconRight={CloseIcon}
            onClick={onClearDate}
            text={format(selectedDate, 'd MMMM yyyy')}
            tone="primary"
          />
        )}

        {scheduleState && (
          <Flex gap={2}>
            {SCHEDULE_FILTERS.map((filter) => (
              <ScheduleFilter
                key={filter}
                schedules={schedules}
                selected={scheduleState === filter}
                state={filter}
              />
            ))}
          </Flex>
        )}
      </Box>
    </>
  )
}
