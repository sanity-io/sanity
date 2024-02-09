import {TasksNavbarButton, useTasksEnabled} from '../src'
import {NavbarProps} from 'sanity'

export function TasksStudioNavbar(props: NavbarProps) {
  const {enabled} = useTasksEnabled()

  if (!enabled) return props.renderDefault(props)
  return props.renderDefault({
    ...props,
    rightSectionNode: <TasksNavbarButton />,
  })
}
