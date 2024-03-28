import {PanelRightIcon, TaskIcon} from '@sanity/icons'
import {useMemo} from 'react'

import {type NavbarProps} from '../../config/studio/types'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useTasksEnabled, useTasksNavigation} from '../context'
import {tasksLocaleNamespace} from '../i18n'

const EMPTY_ARRAY: [] = []

function TasksStudioNavbarInner(props: NavbarProps) {
  const {
    handleOpenTasks,
    state: {isOpen},
  } = useTasksNavigation()

  const {t} = useTranslation(tasksLocaleNamespace)

  const actions = useMemo((): NavbarProps['__internal_actions'] => {
    return [
      ...(props?.__internal_actions || EMPTY_ARRAY),
      {
        icon: PanelRightIcon,
        location: 'topbar',
        name: 'tasks-topbar',
        onAction: handleOpenTasks,
        selected: isOpen,
        title: t('actions.open.text'),
      },
      {
        icon: TaskIcon,
        location: 'sidebar',
        name: 'tasks-sidebar',
        onAction: handleOpenTasks,
        selected: isOpen,
        title: t('actions.open.text'),
      },
    ]
  }, [handleOpenTasks, isOpen, props?.__internal_actions, t])

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
