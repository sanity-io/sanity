import {PanelRightIcon} from '@sanity/icons'

import {Button} from '../../../../../ui-components'
import {useTasksEnabled, useTasksNavigation} from '../../context'

/**
 * @internal
 */
export function TasksNavbarButton() {
  const {enabled} = useTasksEnabled()
  const {
    handleCloseTasks,
    handleOpenTasks,
    state: {isOpen},
  } = useTasksNavigation()

  if (!enabled) return null
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
