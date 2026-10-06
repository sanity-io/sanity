import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {useMemo} from 'react'

import {Button} from '../../../ui-components/button/Button'
import {type NavbarProps} from '../../config/studio/types'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useTasksNavigation} from '../context/navigation/useTasksNavigation'
import {tasksLocaleNamespace} from '../i18n'

const EMPTY_ARRAY: [] = []

function TasksStudioNavbarToolbar() {
  const {
    handleOpenTasks,
    handleCloseTasks,
    state: {isOpen},
  } = useTasksNavigation()

  const {t} = useTranslation(tasksLocaleNamespace)

  return (
    <Button
      tooltipProps={{
        content: t('toolbar.tooltip'),
      }}
      icon={CheckmarkCircleIcon}
      mode="bleed"
      onClick={isOpen ? handleCloseTasks : handleOpenTasks}
      selected={isOpen}
      data-testid="tasks-toolbar"
    />
  )
}

export default function TasksStudioNavbar(props: NavbarProps) {
  const {
    handleOpenTasks,
    handleCloseTasks,
    state: {isOpen},
  } = useTasksNavigation()
  const {t} = useTranslation(tasksLocaleNamespace)

  const topbarAction = useMemo(
    () => ({
      location: 'topbar' as const,
      name: 'tasks-topbar',
      render: TasksStudioNavbarToolbar,
    }),
    [],
  )
  // @TODO the sidebar action cannot use `render` like the topbar one: NavDrawer closes itself
  // after `onAction` runs, but exposes no `onClose` to a `render` component. Once that API
  // exists, this can become a stable `render` too.
  const sidebarAction = useMemo(
    () => ({
      icon: CheckmarkCircleIcon,
      location: 'sidebar' as const,
      name: 'tasks-sidebar',
      onAction: isOpen ? handleCloseTasks : handleOpenTasks,
      selected: isOpen,
      title: t('actions.open.text'),
    }),
    [handleCloseTasks, handleOpenTasks, isOpen, t],
  )
  const prevActions = Array.isArray(props?.__internal_actions)
    ? props.__internal_actions
    : EMPTY_ARRAY
  const actions = useMemo(
    () => [...prevActions, topbarAction, sidebarAction],
    [prevActions, topbarAction, sidebarAction],
  )

  return props.renderDefault({
    ...props,
    __internal_actions: actions,
  })
}
