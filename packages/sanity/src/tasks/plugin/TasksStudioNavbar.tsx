import {type NavbarProps} from 'sanity'

import {TasksNavbarButton, useTasksEnabled} from '../src'

export function TasksStudioNavbar(props: NavbarProps) {
  const {enabled} = useTasksEnabled()

  if (!enabled) return props.renderDefault(props)
  return props.renderDefault({
    ...props,
    // eslint-disable-next-line camelcase
    __internal_rightSectionNode: <TasksNavbarButton />,
  })
}
