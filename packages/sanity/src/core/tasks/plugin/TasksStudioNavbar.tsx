import {PanelRightIcon, TaskIcon} from '@sanity/icons'
import {useCallback, useMemo} from 'react'

import {type NavbarProps} from '../../config'
import {useTranslation} from '../../i18n'
import {useTasksEnabled, useTasksNavigation} from '../context'
import {tasksLocaleNamespace} from '../i18n'

const EMPTY_ARRAY: [] = []

function TasksStudioNavbarInner(props: NavbarProps) {
  const {
    handleOpenTasks,
    handleCloseTasks,
    state: {isOpen},
  } = useTasksNavigation()

  const {t} = useTranslation(tasksLocaleNamespace)

  const handleClick = useCallback(() => {
    if (isOpen) {
      handleCloseTasks()
    } else {
      handleOpenTasks()
    }
  }, [isOpen, handleOpenTasks, handleCloseTasks])

  const actions = useMemo((): NavbarProps['__internal_actions'] => {
    return [
      ...(props?.__internal_actions || EMPTY_ARRAY),
      {
        icon: PanelRightIcon,
        location: 'topbar',
        name: 'tasks-topbar',
        onAction: handleClick,
        selected: isOpen,
        title: t('actions.open.text'),
      },
      {
        icon: TaskIcon,
        location: 'sidebar',
        name: 'tasks-sidebar',
        onAction: handleClick,
        selected: isOpen,
        title: t('actions.open.text'),
      },
    ]
  }, [handleClick, isOpen, props?.__internal_actions, t])

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
