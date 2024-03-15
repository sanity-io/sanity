import {PanelRightIcon, TaskIcon} from '@sanity/icons'
import {useCallback, useMemo} from 'react'
import {type NavbarProps, useTranslation} from 'sanity'

import {tasksLocaleNamespace} from '../i18n'
import {useTasksEnabled, useTasksNavigation} from '../src'

const EMPTY_ARRAY: [] = []

function TasksStudioNavbarInner(props: NavbarProps) {
  const {
    handleCloseTasks,
    handleOpenTasks,
    state: {isOpen},
  } = useTasksNavigation()

  const handleAction = useCallback(() => {
    if (isOpen) {
      handleCloseTasks()
    } else {
      handleOpenTasks()
    }
  }, [handleCloseTasks, handleOpenTasks, isOpen])

  const {t} = useTranslation(tasksLocaleNamespace)

  const actions = useMemo((): NavbarProps['__internal_actions'] => {
    return [
      ...(props?.__internal_actions || EMPTY_ARRAY),
      {
        icon: PanelRightIcon,
        location: 'topbar',
        name: 'tasks-topbar',
        onAction: handleAction,
        selected: isOpen,
        title: t('tasks.actions.open.text'),
      },
      {
        icon: TaskIcon,
        location: 'sidebar',
        name: 'tasks-sidebar',
        onAction: handleAction,
        selected: isOpen,
        title: t('tasks.actions.open.text'),
      },
    ]
  }, [handleAction, isOpen, props?.__internal_actions, t])

  return props.renderDefault({
    ...props,
    // eslint-disable-next-line camelcase
    __internal_actions: actions,
  })
}

export function TasksStudioNavbar(props: NavbarProps) {
  const {enabled} = useTasksEnabled()

  if (!enabled) {
    return props.renderDefault(props)
  }

  return <TasksStudioNavbarInner {...props} />
}
