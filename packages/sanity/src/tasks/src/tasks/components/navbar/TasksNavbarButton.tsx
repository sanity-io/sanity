import {PanelRightIcon} from '@sanity/icons'

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
      mode={'bleed'}
      selected={isOpen}
      iconRight={PanelRightIcon}
      onClick={isOpen ? handleCloseTasks : handleOpenTasks}
    />
  )
}
/**
 * @internal
 */
export function TasksNavbarButton() {
  const {enabled} = useTasksEnabled()

  if (!enabled) return null
  return <TasksNavbarButtonInner />
}
