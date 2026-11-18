import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CloseIcon} from '@sanity/icons/Close'
import {SelectIcon} from '@sanity/icons/Select'
import {format} from 'date-fns/format'
import {useRouter} from 'sanity/router'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {Menu} from '../../../../ui-components/menu/Menu'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {SCHEDULE_FILTERS, SCHEDULE_STATE_TITLE_KEYS} from '../../constants'
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
  const {t} = useTranslation()

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
                text={`${t(SCHEDULE_STATE_TITLE_KEYS[scheduleState])} (${
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
                    key={filter}
                    iconRight={filter === scheduleState ? CheckmarkIcon : undefined}
                    onClick={handleMenuClick.bind(undefined, {state: filter})}
                    text={t(SCHEDULE_STATE_TITLE_KEYS[filter])}
                  />
                ))}
              </Menu>
            }
            popover={{placement: 'bottom'}}
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
