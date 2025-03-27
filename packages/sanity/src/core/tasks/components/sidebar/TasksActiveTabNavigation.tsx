import {ChevronLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {useCallback} from 'react'
import {styled} from 'styled-components'

import {Button, Tooltip, TooltipDelayGroupProvider} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useTasksNavigation} from '../../context'
import {tasksLocaleNamespace} from '../../i18n'
import {type TaskDocument} from '../../types'

interface TasksActiveTabNavigationProps {
  items: TaskDocument[]
}

const Divider = styled.div((props) => {
  return `
    height: 25px;
    width: 1px;
    background-color: ${vars.color.tinted.default.border[1]};
  `
})

/**
 * @internal
 * Navigation buttons for the active tab the user selected, will be shown when editing a task.
 */
export function TasksActiveTabNavigation(props: TasksActiveTabNavigationProps) {
  const {items: allItems} = props
  const {state, setViewMode} = useTasksNavigation()
  const {selectedTask} = state
  const items = allItems.filter((t) => t.status === 'open')
  const currentItemIndex = items.findIndex((item) => item._id === selectedTask)

  const goToPreviousTask = useCallback(() => {
    const prevTaskId =
      currentItemIndex > 0 ? items[currentItemIndex - 1]._id : items[items.length - 1]._id
    setViewMode({type: 'edit', id: prevTaskId})
  }, [currentItemIndex, items, setViewMode])

  const goToNextTask = useCallback(() => {
    const nextTaskId =
      currentItemIndex < items.length - 1 ? items[currentItemIndex + 1]._id : items[0]._id
    setViewMode({type: 'edit', id: nextTaskId})
  }, [currentItemIndex, items, setViewMode])

  const {t} = useTranslation(tasksLocaleNamespace)

  if (!items.length) return null
  return (
    <TooltipDelayGroupProvider>
      <Flex gap={1} align="center">
        <Button
          tooltipProps={{content: t('buttons.previous.tooltip')}}
          mode="bleed"
          icon={ChevronLeftIcon}
          onClick={goToPreviousTask}
        />
        <Tooltip content={t('panel.navigation.tooltip')}>
          <Box paddingY={2}>
            <Text size={1}>
              {currentItemIndex + 1} / {items.length}
            </Text>
          </Box>
        </Tooltip>
        <Button
          tooltipProps={{content: t('buttons.next.tooltip')}}
          mode="bleed"
          icon={ChevronRightIcon}
          onClick={goToNextTask}
        />
        <Divider />
      </Flex>
    </TooltipDelayGroupProvider>
  )
}
