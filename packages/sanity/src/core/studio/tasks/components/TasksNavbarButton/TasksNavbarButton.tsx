import {PanelRightIcon} from '@sanity/icons'
import {Button} from '../../../../../ui-components'
import {useTasksEnabled, useTasks} from '../../context'

export function TasksNavbarButton() {
  const {enabled} = useTasksEnabled()
  const {handleToggleSidebar, isSidebarOpen} = useTasks()

  if (!enabled) return null
  return (
    <Button
      text="Tasks"
      mode={'bleed'}
      selected={isSidebarOpen}
      iconRight={PanelRightIcon}
      onClick={handleToggleSidebar}
    />
  )
}
