import {PanelRightIcon} from '@sanity/icons'
import {Button} from '../../../../../ui-components'
import {useTasksEnabled, useTasks} from '../../context'

/**
 * @internal
 */
export function TasksNavbarButton() {
  const {enabled} = useTasksEnabled()
  const {toggleOpen, isOpen} = useTasks()

  if (!enabled) return null
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
