import {PanelRightIcon} from '@sanity/icons'

import {Button} from '../../../../../ui-components'
import {useTasks, useTasksEnabled} from '../../context'

const TasksNavbarButtonInner = () => {
  const {toggleOpen, isOpen} = useTasks()

  return (
    <Button
      text="Tasks"
      mode={'bleed'}
      selected={isOpen}
      iconRight={PanelRightIcon}
      onClick={toggleOpen}
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
