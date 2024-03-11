import {PanelRightIcon} from '@sanity/icons'
import {useMediaIndex} from '@sanity/ui'
import {useCallback} from 'react'

import {Button} from '../../../../../ui-components'
import {useTasksEnabled, useTasksNavigation} from '../../context'

const TasksNavbarButtonInner = () => {
  const {
    handleCloseTasks,
    handleOpenTasks,
    state: {isOpen},
  } = useTasksNavigation()

  return (
    <Button
      text="Tasks"
      mode="bleed"
      selected={isOpen}
      iconRight={PanelRightIcon}
      onClick={isOpen ? handleCloseTasks : handleOpenTasks}
    />
  )
}

const TasksNavDrawerButton = ({closeSidebar}: {closeSidebar: () => void}) => {
  const {
    handleOpenTasks,
    state: {isOpen},
  } = useTasksNavigation()

  const handleOnClick = useCallback(() => {
    if (closeSidebar) {
      closeSidebar()
    }
    handleOpenTasks()
  }, [closeSidebar, handleOpenTasks])

  return (
    <Button
      text="Tasks sidebar"
      mode="bleed"
      selected={isOpen}
      icon={PanelRightIcon}
      size="large"
      justify="flex-start"
      onClick={handleOnClick}
    />
  )
}

/**
 * @internal
 */
export function TasksNavbarButton({closeSidebar}: {closeSidebar?: () => void}) {
  const {enabled} = useTasksEnabled()
  const mediaIndex = useMediaIndex()

  if (!enabled) return null

  if (closeSidebar) {
    return <TasksNavDrawerButton closeSidebar={closeSidebar} />
  }

  if (mediaIndex > 3) {
    return <TasksNavbarButtonInner />
  }
}
