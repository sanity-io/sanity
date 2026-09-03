import {ChevronLeftIcon} from '@sanity/icons/ChevronLeft'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useCallback} from 'react'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {TooltipDelayGroupProvider} from '../../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useTasksNavigation} from '../../context/navigation/useTasksNavigation'
import {tasksLocaleNamespace} from '../../i18n'
import {type TaskDocument} from '../../types'
import {divider, inputBorderColorVar} from './TasksActiveTabNavigation.css'

interface TasksActiveTabNavigationProps {
  items: TaskDocument[]
}

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
  const {color} = useThemeV2()

  if (!items.length) return null
  return (
    <TooltipDelayGroupProvider>
      <Flex gap={1} alignItems="center">
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
        <div
          className={divider}
          style={assignInlineVars({[inputBorderColorVar]: color.input.default.enabled.border})}
        />
      </Flex>
    </TooltipDelayGroupProvider>
  )
}
